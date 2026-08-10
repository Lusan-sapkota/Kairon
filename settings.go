package main

import (
	"database/sql"
	"fmt"
	"time"
)

const (
	settingUpdatePoll     = "update_poll_interval"
	defaultUpdatePoll     = "7d"
)

var updatePollOptions = map[string]time.Duration{
	"24h": 24 * time.Hour,
	"48h": 48 * time.Hour,
	"7d":  7 * 24 * time.Hour,
	"15d": 15 * 24 * time.Hour,
	"30d": 30 * 24 * time.Hour,
}

type UpdateSettings struct {
	PollInterval string `json:"pollInterval"`
}

func validPollInterval(key string) (time.Duration, bool) {
	d, ok := updatePollOptions[key]
	return d, ok
}

func getSetting(db *sql.DB, key string) (string, error) {
	var value string
	err := db.QueryRow(`SELECT value FROM settings WHERE key = ?`, key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return value, err
}

func setSetting(db *sql.DB, key, value string) error {
	_, err := db.Exec(`
		INSERT INTO settings (key, value) VALUES (?, ?)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value
	`, key, value)
	return err
}

func getUpdatePollInterval(db *sql.DB) (string, time.Duration) {
	key, err := getSetting(db, settingUpdatePoll)
	if err != nil || key == "" {
		return defaultUpdatePoll, updatePollOptions[defaultUpdatePoll]
	}
	if d, ok := validPollInterval(key); ok {
		return key, d
	}
	return defaultUpdatePoll, updatePollOptions[defaultUpdatePoll]
}

func (a *App) GetUpdateSettings() UpdateSettings {
	key, _ := getUpdatePollInterval(a.db)
	return UpdateSettings{PollInterval: key}
}

func (a *App) SetUpdatePollInterval(interval string) error {
	if _, ok := validPollInterval(interval); !ok {
		return fmt.Errorf("invalid update poll interval: %s", interval)
	}
	if err := setSetting(a.db, settingUpdatePoll, interval); err != nil {
		return err
	}
	a.updater.ResetPollSchedule()
	return nil
}
