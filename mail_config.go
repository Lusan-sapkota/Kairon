package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

const (
	settingSMTP       = "mail.smtp"
	settingMailPrefs  = "mail.prefs"
	settingLastDaily  = "mail.last_daily"
	settingLastWeekly = "mail.last_weekly"
	settingLastDue    = "mail.last_due_digest"
)

type SMTPConfig struct {
	Host        string `json:"host"`
	Port        int    `json:"port"`
	Username    string `json:"username"`
	Password    string `json:"password,omitempty"`
	PasswordSet bool   `json:"passwordSet"`
	FromName    string `json:"fromName"`
	FromEmail   string `json:"fromEmail"`
	ToEmail     string `json:"toEmail"`
	Security    string `json:"security"` // starttls | tls | none
}

type MailPrefs struct {
	Enabled          bool   `json:"enabled"`
	DailyEnabled     bool   `json:"dailyEnabled"`
	DailyTime        string `json:"dailyTime"`
	WeeklyEnabled    bool   `json:"weeklyEnabled"`
	WeeklyDay        int    `json:"weeklyDay"` // 0=Sunday … 6=Saturday
	WeeklyTime       string `json:"weeklyTime"`
	DueToday         bool   `json:"dueToday"`
	DueSoon1         bool   `json:"dueSoon1"`
	DueSoon2         bool   `json:"dueSoon2"`
	DueSoon3         bool   `json:"dueSoon3"`
	Overdue          bool   `json:"overdue"`
	IncludeNoDue     bool   `json:"includeNoDue"`
	IncludeCompleted bool   `json:"includeCompleted"`
	QueueTTL         string `json:"queueTTL"` // 12h, 24h, 48h, 7d
}

type MailSettings struct {
	SMTP  SMTPConfig `json:"smtp"`
	Prefs MailPrefs  `json:"prefs"`
}

func defaultSMTP() SMTPConfig {
	return SMTPConfig{
		Port:     587,
		FromName: "Kairon",
		Security: "starttls",
	}
}

func defaultMailPrefs() MailPrefs {
	return MailPrefs{
		Enabled:       false,
		DailyEnabled:  true,
		DailyTime:     "08:00",
		WeeklyEnabled: true,
		WeeklyDay:     1,
		WeeklyTime:    "09:00",
		DueToday:      true,
		DueSoon1:      true,
		DueSoon2:      false,
		DueSoon3:      true,
		Overdue:       true,
		QueueTTL:      "48h",
	}
}

func queueTTLDuration(key string) time.Duration {
	switch key {
	case "12h":
		return 12 * time.Hour
	case "24h":
		return 24 * time.Hour
	case "7d":
		return 7 * 24 * time.Hour
	default:
		return 48 * time.Hour
	}
}

func loadSMTP(db *sql.DB) SMTPConfig {
	cfg := defaultSMTP()
	raw, err := getSetting(db, settingSMTP)
	if err != nil || raw == "" {
		return cfg
	}
	_ = json.Unmarshal([]byte(raw), &cfg)
	if cfg.Port == 0 {
		cfg.Port = 587
	}
	if cfg.Security == "" {
		cfg.Security = "starttls"
	}
	if cfg.FromName == "" {
		cfg.FromName = "Kairon"
	}
	cfg.PasswordSet = cfg.Password != ""
	return cfg
}

func loadMailPrefs(db *sql.DB) MailPrefs {
	prefs := defaultMailPrefs()
	raw, err := getSetting(db, settingMailPrefs)
	if err != nil || raw == "" {
		return prefs
	}
	_ = json.Unmarshal([]byte(raw), &prefs)
	if prefs.DailyTime == "" {
		prefs.DailyTime = "08:00"
	}
	if prefs.WeeklyTime == "" {
		prefs.WeeklyTime = "09:00"
	}
	if prefs.QueueTTL == "" {
		prefs.QueueTTL = "48h"
	}
	return prefs
}

func publicSMTP(cfg SMTPConfig) SMTPConfig {
	out := cfg
	out.Password = ""
	out.PasswordSet = cfg.Password != ""
	return out
}

func (a *App) GetMailSettings() MailSettings {
	return MailSettings{
		SMTP:  publicSMTP(loadSMTP(a.db)),
		Prefs: loadMailPrefs(a.db),
	}
}

func (a *App) SaveSMTPConfig(input SMTPConfig) error {
	if input.Host != "" && (input.Port < 1 || input.Port > 65535) {
		return fmt.Errorf("SMTP port must be between 1 and 65535")
	}
	sec := strings.ToLower(strings.TrimSpace(input.Security))
	switch sec {
	case "", "starttls", "tls", "none":
		if sec == "" {
			sec = "starttls"
		}
	default:
		return fmt.Errorf("security must be starttls, tls, or none")
	}
	cur := loadSMTP(a.db)
	cur.Host = strings.TrimSpace(input.Host)
	cur.Port = input.Port
	if cur.Port == 0 {
		cur.Port = 587
	}
	cur.Username = strings.TrimSpace(input.Username)
	cur.FromName = strings.TrimSpace(input.FromName)
	if cur.FromName == "" {
		cur.FromName = "Kairon"
	}
	cur.FromEmail = strings.TrimSpace(input.FromEmail)
	cur.ToEmail = strings.TrimSpace(input.ToEmail)
	cur.Security = sec
	if strings.TrimSpace(input.Password) != "" {
		cur.Password = input.Password
	}
	data, err := json.Marshal(cur)
	if err != nil {
		return err
	}
	return setSetting(a.db, settingSMTP, string(data))
}

func (a *App) SaveMailPrefs(input MailPrefs) error {
	cur := loadMailPrefs(a.db)
	cur.Enabled = input.Enabled
	cur.DailyEnabled = input.DailyEnabled
	cur.DailyTime = normalizeClock(input.DailyTime, "08:00")
	cur.WeeklyEnabled = input.WeeklyEnabled
	if input.WeeklyDay < 0 || input.WeeklyDay > 6 {
		return fmt.Errorf("weekly day must be 0 (Sunday) through 6 (Saturday)")
	}
	cur.WeeklyDay = input.WeeklyDay
	cur.WeeklyTime = normalizeClock(input.WeeklyTime, "09:00")
	cur.DueToday = input.DueToday
	cur.DueSoon1 = input.DueSoon1
	cur.DueSoon2 = input.DueSoon2
	cur.DueSoon3 = input.DueSoon3
	cur.Overdue = input.Overdue
	cur.IncludeNoDue = input.IncludeNoDue
	cur.IncludeCompleted = input.IncludeCompleted
	switch input.QueueTTL {
	case "12h", "24h", "48h", "7d":
		cur.QueueTTL = input.QueueTTL
	case "":
		// keep existing
	default:
		return fmt.Errorf("queue TTL must be 12h, 24h, 48h, or 7d")
	}
	data, err := json.Marshal(cur)
	if err != nil {
		return err
	}
	if err := setSetting(a.db, settingMailPrefs, string(data)); err != nil {
		return err
	}
	if a.mailer != nil {
		a.mailer.Kick()
	}
	return nil
}

func normalizeClock(value, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	t, err := time.Parse("15:04", value)
	if err != nil {
		return fallback
	}
	return t.Format("15:04")
}

func smtpReady(cfg SMTPConfig) error {
	if strings.TrimSpace(cfg.Host) == "" {
		return fmt.Errorf("SMTP host is required")
	}
	if cfg.Port < 1 {
		return fmt.Errorf("SMTP port is required")
	}
	if recipientFor(cfg) == "" {
		return fmt.Errorf("set a To address (or From / username)")
	}
	return nil
}

func recipientFor(cfg SMTPConfig) string {
	if s := strings.TrimSpace(cfg.ToEmail); s != "" {
		return s
	}
	if s := strings.TrimSpace(cfg.FromEmail); s != "" {
		return s
	}
	return strings.TrimSpace(cfg.Username)
}

func fromAddress(cfg SMTPConfig) string {
	if s := strings.TrimSpace(cfg.FromEmail); s != "" {
		return s
	}
	return strings.TrimSpace(cfg.Username)
}
