package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) GetDataPath() string {
	return a.GetDataLocations().Database
}

func (a *App) GetDataLocations() DataLocations {
	dbPath := a.dbPath
	if dbPath == "" {
		dbPath, _ = plannerDBPath()
	}
	configDir, err := plannerAppDir()
	if err != nil {
		configDir = filepath.Dir(dbPath)
	}
	return DataLocations{ConfigDir: configDir, Database: dbPath}
}

func (a *App) OpenLocalPath(target string) error {
	target = strings.TrimSpace(target)
	if target == "" {
		return fmt.Errorf("empty path")
	}
	abs, err := filepath.Abs(target)
	if err != nil {
		return err
	}
	root, err := plannerAppDir()
	if err != nil {
		return err
	}
	rootAbs, err := filepath.Abs(root)
	if err != nil {
		return err
	}
	sep := string(os.PathSeparator)
	if abs != rootAbs && !strings.HasPrefix(abs, rootAbs+sep) {
		return fmt.Errorf("path is outside Kairon config")
	}
	info, err := os.Stat(abs)
	if err != nil {
		return err
	}
	if !info.IsDir() {
		abs = filepath.Dir(abs)
	}
	return openPath(abs)
}

func (a *App) BackupDatabase() (string, error) {
	if a.db == nil {
		return "", fmt.Errorf("database is not open")
	}
	dest, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Backup Kairon data",
		DefaultFilename: fmt.Sprintf("kairon-%s.db", time.Now().Format("2006-01-02")),
		Filters: []runtime.FileFilter{
			{DisplayName: "Kairon backup (*.db)", Pattern: "*.db"},
		},
	})
	if err != nil || dest == "" {
		return "", err
	}
	if !strings.HasSuffix(strings.ToLower(dest), ".db") {
		dest += ".db"
	}
	if _, err := os.Stat(dest); err == nil {
		if err := os.Remove(dest); err != nil {
			return "", fmt.Errorf("could not overwrite backup file: %w", err)
		}
	}
	if _, err := a.db.Exec(`VACUUM INTO ?`, dest); err != nil {
		return "", fmt.Errorf("could not write backup: %w", err)
	}
	return dest, nil
}

func (a *App) RestoreDatabase() (string, error) {
	src, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Restore Kairon data",
		Filters: []runtime.FileFilter{
			{DisplayName: "Kairon backup (*.db)", Pattern: "*.db"},
		},
	})
	if err != nil || src == "" {
		return "", err
	}
	if err := verifySQLiteFile(src); err != nil {
		return "", err
	}
	choice, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:          runtime.QuestionDialog,
		Title:         "Restore Kairon data",
		Message:       "This replaces all tasks, notes, settings, and mail on this machine with the backup. Continue?",
		Buttons:       []string{"Restore", "Cancel"},
		DefaultButton: "Cancel",
		CancelButton:  "Cancel",
	})
	if err != nil {
		return "", err
	}
	if choice != "Restore" && choice != "Yes" && choice != "Ok" {
		return "", nil
	}
	if err := a.replaceDBFrom(src); err != nil {
		return "", err
	}
	a.emitDataReload("restored")
	return src, nil
}

func (a *App) WipeLocalData(scope string) (bool, error) {
	scope = strings.ToLower(strings.TrimSpace(scope))
	title, message, proceed, err := wipeDialogCopy(scope)
	if err != nil {
		return false, err
	}
	choice, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:          runtime.QuestionDialog,
		Title:         title,
		Message:       message,
		Buttons:       []string{proceed, "Cancel"},
		DefaultButton: "Cancel",
		CancelButton:  "Cancel",
	})
	if err != nil {
		return false, err
	}
	if choice != proceed && choice != "Yes" && choice != "Ok" {
		return false, nil
	}

	dir, err := plannerAppDir()
	if err != nil {
		return false, err
	}
	a.stopDBUsers()
	if err := wipeScope(dir, scope); err != nil {
		_ = a.reopenDB()
		return false, err
	}
	return true, nil
}

func wipeDialogCopy(scope string) (title, message, proceed string, err error) {
	switch scope {
	case "db":
		return "Wipe database",
			"This deletes planner.db on this machine (tasks, notes, projects, settings, and mail). Downloaded updates in the config folder stay. Kairon must restart afterwards. Continue?",
			"Wipe", nil
	case "config":
		return "Wipe config folder",
			"This deletes downloaded updates and other files in the config folder, but keeps planner.db (your tasks and notes). Kairon must restart afterwards. Continue?",
			"Wipe", nil
	case "both":
		return "Wipe config and database",
			"This deletes Kairon's config folder and database on this machine (tasks, notes, settings, mail, and downloaded updates). Kairon must restart afterwards. It cannot be undone. Continue?",
			"Wipe", nil
	default:
		return "", "", "", fmt.Errorf("unknown wipe target")
	}
}

func wipeScope(dir, scope string) error {
	switch scope {
	case "db":
		return removeDBFiles(dir)
	case "config":
		return removeConfigExceptDB(dir)
	case "both":
		if err := os.RemoveAll(dir); err != nil {
			return fmt.Errorf("could not wipe config folder: %w", err)
		}
		return nil
	default:
		return fmt.Errorf("unknown wipe target")
	}
}

func removeDBFiles(dir string) error {
	for _, name := range []string{"planner.db", "planner.db-wal", "planner.db-shm"} {
		path := filepath.Join(dir, name)
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("could not remove %s: %w", name, err)
		}
	}
	return nil
}

func removeConfigExceptDB(dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("could not read config folder: %w", err)
	}
	for _, entry := range entries {
		name := entry.Name()
		if name == "planner.db" || name == "planner.db-wal" || name == "planner.db-shm" {
			continue
		}
		if err := os.RemoveAll(filepath.Join(dir, name)); err != nil {
			return fmt.Errorf("could not remove %s: %w", name, err)
		}
	}
	return nil
}

func (a *App) RestartApp() error {
	exe, err := os.Executable()
	if err == nil && exe != "" {
		_ = relaunchExecutable(exe)
	}
	if a.ctx != nil {
		runtime.Quit(a.ctx)
	}
	return nil
}

func (a *App) WipeDatabase() (bool, error) {
	return a.WipeLocalData("both")
}

func (a *App) emitDataReload(kind string) {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "data_reload", kind)
	}
}

func (a *App) stopDBUsers() {
	if a.mailer != nil {
		a.mailer.Stop()
	}
	if a.updater != nil {
		a.updater.Stop(false)
	}
	if a.db != nil {
		_ = a.db.Close()
		a.db = nil
	}
}

func verifySQLiteFile(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	buf := make([]byte, 16)
	n, err := f.Read(buf)
	if err != nil && err != io.EOF {
		return err
	}
	if n < 16 || string(buf[:15]) != "SQLite format 3" {
		return fmt.Errorf("that file is not a SQLite backup")
	}
	return nil
}

func (a *App) replaceDBFrom(src string) error {
	dest, err := plannerDBPath()
	if err != nil {
		return err
	}
	absSrc, _ := filepath.Abs(src)
	absDest, _ := filepath.Abs(dest)
	if absSrc == absDest {
		return fmt.Errorf("pick a backup file, not the live database")
	}

	a.stopDBUsers()

	tmp := dest + ".restore"
	if err := copyFile(src, tmp); err != nil {
		_ = a.reopenDB()
		return err
	}
	_ = os.Remove(dest + "-wal")
	_ = os.Remove(dest + "-shm")
	if err := os.Rename(tmp, dest); err != nil {
		_ = os.Remove(tmp)
		_ = a.reopenDB()
		return err
	}
	return a.reopenDB()
}

func (a *App) reopenDB() error {
	db, err := openDB()
	if err != nil {
		return err
	}
	a.db = db
	a.dbPath, _ = plannerDBPath()
	if a.ctx != nil {
		a.updater.Start(a.ctx, db)
		a.mailer.Start(a.ctx, db, a.ListTasks, a.ListProjects)
	}
	return nil
}
