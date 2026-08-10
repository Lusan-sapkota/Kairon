package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/mod/semver"
)

const (
	startupDelay = 45 * time.Second
	githubAPI    = "https://api.github.com/repos/Lusan-sapkota/Kairon/releases/latest"
	updateEvent  = "update_ready"
)

type InstallMode string

const (
	InstallPortable InstallMode = "portable"
	InstallDeb      InstallMode = "deb"
	InstallMacApp   InstallMode = "mac_app"
)

type UpdateInfo struct {
	State          string `json:"state"`
	CurrentVersion string `json:"currentVersion"`
	Version        string `json:"version"`
	InstallMode    string `json:"installMode"`
	CanAutoApply   bool   `json:"canAutoApply"`
	Message        string `json:"message"`
}

type pendingManifest struct {
	Version     string      `json:"version"`
	AssetPath   string      `json:"assetPath"`
	InstallMode InstallMode `json:"installMode"`
	TargetExe   string      `json:"targetExe"`
	TargetApp   string      `json:"targetApp"`
	AssetKind   string      `json:"assetKind"`
}

type Updater struct {
	ctx    context.Context
	cancel context.CancelFunc
	db     *sql.DB

	mu        sync.Mutex
	info      UpdateInfo
	manifest  *pendingManifest
	download  bool
	pollReset chan struct{}
}

type ghRelease struct {
	TagName string `json:"tag_name"`
	Assets  []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
	} `json:"assets"`
}

func NewUpdater() *Updater {
	return &Updater{
		info: UpdateInfo{
			State:          "idle",
			CurrentVersion: Version,
		},
		pollReset: make(chan struct{}, 1),
	}
}

func (u *Updater) Start(ctx context.Context, db *sql.DB) {
	u.ctx, u.cancel = context.WithCancel(ctx)
	u.db = db
	u.info.CurrentVersion = Version

	if m, err := u.loadManifest(); err == nil && m != nil {
		u.mu.Lock()
		u.manifest = m
		u.info = u.infoFromManifest(m)
		u.mu.Unlock()
		u.emitReady()
	}

	go u.pollLoop()
}

func (u *Updater) Stop(applyOnExit bool) {
	if u.cancel != nil {
		u.cancel()
	}
	if !applyOnExit {
		return
	}
	u.mu.Lock()
	m := u.manifest
	u.mu.Unlock()
	if m == nil || m.InstallMode == InstallDeb {
		return
	}
	_ = u.ApplyPending()
}

func (u *Updater) ResetPollSchedule() {
	select {
	case u.pollReset <- struct{}{}:
	default:
	}
}

func (u *Updater) pollInterval() time.Duration {
	if u.db == nil {
		return updatePollOptions[defaultUpdatePoll]
	}
	_, d := getUpdatePollInterval(u.db)
	return d
}

func (u *Updater) pollLoop() {
	first := true
	for {
		if u.ctx.Err() != nil {
			return
		}

		wait := u.pollInterval()
		if first {
			wait = startupDelay
			first = false
		}

		timer := time.NewTimer(wait)
		select {
		case <-u.ctx.Done():
			timer.Stop()
			return
		case <-u.pollReset:
			timer.Stop()
			first = false
			continue
		case <-timer.C:
			u.checkAndDownload()
		}
	}
}

func (u *Updater) GetUpdateInfo() UpdateInfo {
	u.mu.Lock()
	defer u.mu.Unlock()
	return u.info
}

func (u *Updater) CheckNow() {
	go u.checkAndDownload()
}

func (u *Updater) DismissUpdate() {
	u.mu.Lock()
	defer u.mu.Unlock()
	u.clearPendingLocked()
	u.info = UpdateInfo{State: "idle", CurrentVersion: Version}
}

func (u *Updater) OpenUpdatePackage() error {
	u.mu.Lock()
	m := u.manifest
	u.mu.Unlock()
	if m == nil || m.AssetPath == "" {
		return fmt.Errorf("no update package downloaded")
	}
	return openPath(m.AssetPath)
}

func (u *Updater) ApplyUpdateAndRestart() error {
	u.mu.Lock()
	target := ""
	if u.manifest != nil {
		target = u.manifest.TargetExe
	}
	u.mu.Unlock()

	if err := u.ApplyPending(); err != nil {
		return err
	}
	if target != "" {
		_ = relaunchExecutable(target)
	}
	wailsruntime.Quit(u.ctx)
	return nil
}

func (u *Updater) ApplyPending() error {
	u.mu.Lock()
	m := u.manifest
	u.mu.Unlock()
	if m == nil {
		return nil
	}
	if m.InstallMode == InstallDeb {
		return fmt.Errorf("system install: open the downloaded package to install")
	}

	var err error
	switch m.InstallMode {
	case InstallPortable:
		err = applyPortableBinary(m.TargetExe, m.AssetPath)
	case InstallMacApp:
		err = applyMacAppBundle(m.TargetApp, m.AssetPath)
	default:
		err = fmt.Errorf("unsupported install mode: %s", m.InstallMode)
	}
	if err != nil {
		return err
	}

	u.mu.Lock()
	u.clearPendingLocked()
	u.info = UpdateInfo{State: "idle", CurrentVersion: m.Version}
	u.mu.Unlock()
	return nil
}

func (u *Updater) checkAndDownload() {
	u.mu.Lock()
	if u.download || u.manifest != nil {
		u.mu.Unlock()
		return
	}
	u.download = true
	u.mu.Unlock()

	defer func() {
		u.mu.Lock()
		u.download = false
		u.mu.Unlock()
	}()

	latest, assetName, assetURL, err := u.fetchLatestAsset()
	if err != nil {
		return
	}
	if !isNewerVersion(latest, Version) {
		return
	}

	mode, targetExe, targetApp, kind, err := u.resolveInstall()
	if err != nil {
		return
	}

	destDir, err := updateDir()
	if err != nil {
		return
	}
	destPath := filepath.Join(destDir, assetName)

	if err := downloadFile(u.ctx, assetURL, destPath); err != nil {
		return
	}

	if mode == InstallMacApp {
		appPath, err := extractMacAppFromZip(destPath, destDir)
		if err != nil {
			os.Remove(destPath)
			return
		}
		destPath = appPath
	}

	m := &pendingManifest{
		Version:     latest,
		AssetPath:   destPath,
		InstallMode: mode,
		TargetExe:   targetExe,
		TargetApp:   targetApp,
		AssetKind:   kind,
	}
	if err := u.saveManifest(m); err != nil {
		return
	}

	u.mu.Lock()
	u.manifest = m
	u.info = u.infoFromManifest(m)
	u.mu.Unlock()

	u.emitReady()
}

func (u *Updater) fetchLatestAsset() (version, assetName, assetURL string, err error) {
	req, err := http.NewRequestWithContext(u.ctx, http.MethodGet, githubAPI, nil)
	if err != nil {
		return "", "", "", err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "Kairon-Updater/"+Version)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", "", "", fmt.Errorf("github api: %s", resp.Status)
	}

	var release ghRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", "", "", err
	}

	version = strings.TrimPrefix(release.TagName, "v")
	for _, asset := range release.Assets {
		if u.assetMatches(asset.Name) {
			return version, asset.Name, asset.BrowserDownloadURL, nil
		}
	}
	return "", "", "", fmt.Errorf("no release asset for this platform")
}

func (u *Updater) assetMatches(name string) bool {
	switch runtime.GOOS {
	case "linux":
		exe, err := os.Executable()
		if err != nil {
			return false
		}
		exe, _ = filepath.EvalSymlinks(exe)
		if strings.HasPrefix(exe, "/usr/") || strings.HasPrefix(exe, "/opt/") || !isWritable(filepath.Dir(exe)) {
			return strings.HasPrefix(name, "kairon_") && strings.HasSuffix(name, "_amd64.deb")
		}
		return name == "kairon-linux-amd64"
	case "windows":
		return name == "kairon-windows-amd64.exe"
	case "darwin":
		return name == "kairon-darwin-universal.zip"
	default:
		return false
	}
}

func (u *Updater) resolveInstall() (InstallMode, string, string, string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", "", "", "", err
	}
	exe, _ = filepath.EvalSymlinks(exe)

	switch runtime.GOOS {
	case "linux":
		if strings.HasPrefix(exe, "/usr/") || strings.HasPrefix(exe, "/opt/") || !isWritable(filepath.Dir(exe)) {
			return InstallDeb, exe, "", "deb", nil
		}
		return InstallPortable, exe, "", "binary", nil

	case "windows":
		if !isWritable(filepath.Dir(exe)) {
			return InstallPortable, exe, "", "binary", fmt.Errorf("install folder is not writable")
		}
		return InstallPortable, exe, "", "binary", nil

	case "darwin":
		if strings.Contains(exe, ".app/Contents/MacOS/") {
			appBundle := filepath.Dir(filepath.Dir(filepath.Dir(exe)))
			return InstallMacApp, exe, appBundle, "zip", nil
		}
		return InstallPortable, exe, "", "binary", nil

	default:
		return "", "", "", "", fmt.Errorf("unsupported platform")
	}
}

func (u *Updater) infoFromManifest(m *pendingManifest) UpdateInfo {
	canAuto := m.InstallMode == InstallPortable || m.InstallMode == InstallMacApp
	msg := "An update has been downloaded. Restart the app to apply."
	if m.InstallMode == InstallDeb {
		msg = "An update has been downloaded. Open the package to install, then restart Kairon."
		canAuto = false
	}
	return UpdateInfo{
		State:          "ready",
		CurrentVersion: Version,
		Version:        m.Version,
		InstallMode:    string(m.InstallMode),
		CanAutoApply:   canAuto,
		Message:        msg,
	}
}

func (u *Updater) emitReady() {
	u.mu.Lock()
	info := u.info
	u.mu.Unlock()
	if info.State == "ready" {
		wailsruntime.EventsEmit(u.ctx, updateEvent, info)
	}
}

func (u *Updater) clearPendingLocked() {
	u.manifest = nil
	_ = os.Remove(manifestPath())
	dir, err := updateDir()
	if err == nil {
		_ = os.RemoveAll(dir)
	}
}

func updateDir() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(configDir, "planner", "updates")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

func manifestPath() string {
	dir, err := updateDir()
	if err != nil {
		return ""
	}
	return filepath.Join(dir, "pending.json")
}

func (u *Updater) saveManifest(m *pendingManifest) error {
	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(manifestPath(), data, 0o644)
}

func (u *Updater) loadManifest() (*pendingManifest, error) {
	data, err := os.ReadFile(manifestPath())
	if err != nil {
		return nil, err
	}
	var m pendingManifest
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, err
	}
	if _, err := os.Stat(m.AssetPath); err != nil {
		_ = os.Remove(manifestPath())
		return nil, err
	}
	return &m, nil
}

func isNewerVersion(latest, current string) bool {
	lv := latest
	cv := current
	if !strings.HasPrefix(lv, "v") {
		lv = "v" + lv
	}
	if !strings.HasPrefix(cv, "v") {
		cv = "v" + cv
	}
	return semver.Compare(lv, cv) > 0
}

func downloadFile(ctx context.Context, url, dest string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Kairon-Updater/"+Version)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download: %s", resp.Status)
	}

	tmp := dest + ".part"
	f, err := os.OpenFile(tmp, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	_, err = io.Copy(f, resp.Body)
	closeErr := f.Close()
	if err != nil {
		os.Remove(tmp)
		return err
	}
	if closeErr != nil {
		os.Remove(tmp)
		return closeErr
	}
	return os.Rename(tmp, dest)
}

func isWritable(dir string) bool {
	test := filepath.Join(dir, ".kairon-write-test")
	if err := os.WriteFile(test, []byte("1"), 0o644); err != nil {
		return false
	}
	_ = os.Remove(test)
	return true
}
