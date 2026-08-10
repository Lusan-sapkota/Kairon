package main

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func applyPortableBinary(targetExe, stagedPath string) error {
	if targetExe == "" || stagedPath == "" {
		return fmt.Errorf("missing paths for update")
	}

	oldPath := targetExe + ".old"
	_ = os.Remove(oldPath)

	if err := os.Rename(targetExe, oldPath); err != nil {
		return fmt.Errorf("rename running binary: %w", err)
	}

	if err := copyFile(stagedPath, targetExe); err != nil {
		_ = os.Rename(oldPath, targetExe)
		return err
	}

	if runtime.GOOS != "windows" {
		_ = os.Chmod(targetExe, 0o755)
	}
	_ = os.Remove(oldPath)
	return nil
}

func applyMacAppBundle(targetApp, stagedAppPath string) error {
	if targetApp == "" || stagedAppPath == "" {
		return fmt.Errorf("missing app bundle paths")
	}

	oldPath := targetApp + ".old"
	_ = os.RemoveAll(oldPath)

	if err := os.Rename(targetApp, oldPath); err != nil {
		return fmt.Errorf("rename app bundle: %w", err)
	}

	if err := movePath(stagedAppPath, targetApp); err != nil {
		_ = os.Rename(oldPath, targetApp)
		return err
	}
	_ = os.RemoveAll(oldPath)
	return nil
}

func extractMacAppFromZip(zipPath, destDir string) (string, error) {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return "", err
	}
	defer r.Close()

	var appRoot string
	for _, f := range r.File {
		if !strings.HasSuffix(f.Name, ".app/") && !strings.Contains(f.Name, ".app/") {
			continue
		}
		parts := strings.Split(f.Name, ".app/")
		if appRoot == "" {
			appRoot = parts[0] + ".app"
		}
	}

	if appRoot == "" {
		return "", fmt.Errorf("no .app found in zip")
	}

	outApp := filepath.Join(destDir, filepath.Base(appRoot))
	if err := os.RemoveAll(outApp); err != nil && !os.IsNotExist(err) {
		return "", err
	}

	for _, f := range r.File {
		if !strings.HasPrefix(f.Name, appRoot) {
			continue
		}
		rel := strings.TrimPrefix(f.Name, appRoot)
		rel = strings.TrimPrefix(rel, "/")
		target := filepath.Join(outApp, rel)
		if f.FileInfo().IsDir() || strings.HasSuffix(f.Name, "/") {
			if err := os.MkdirAll(target, 0o755); err != nil {
				return "", err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return "", err
		}
		if err := extractZipFile(f, target); err != nil {
			return "", err
		}
	}
	return outApp, nil
}

func extractZipFile(f *zip.File, target string) error {
	rc, err := f.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	out, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, f.Mode())
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, rc)
	return err
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func movePath(src, dst string) error {
	if err := os.Rename(src, dst); err == nil {
		return nil
	}
	if err := copyTree(src, dst); err != nil {
		return err
	}
	return os.RemoveAll(src)
}

func copyTree(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if info.IsDir() {
			return os.MkdirAll(target, info.Mode())
		}
		return copyFile(path, target)
	})
}

func relaunchExecutable(path string) error {
	cmd := exec.Command(path)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Start()
}

func openPath(path string) error {
	switch runtime.GOOS {
	case "linux":
		return exec.Command("xdg-open", path).Start()
	case "darwin":
		return exec.Command("open", path).Start()
	case "windows":
		return exec.Command("cmd", "/c", "start", "", path).Start()
	default:
		return fmt.Errorf("unsupported platform")
	}
}
