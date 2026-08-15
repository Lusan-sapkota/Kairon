package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	settingNotifyPrefs     = "notify.prefs"
	settingLastNotifyDaily = "notify.last_daily"
	settingLastNotifyWeek  = "notify.last_weekly"
	settingLastNotifyDue   = "notify.last_due"
	notifyEvent            = "app_notification"
)

type NotifyPrefs struct {
	Enabled       bool   `json:"enabled"`
	Desktop       bool   `json:"desktop"`
	InApp         bool   `json:"inApp"`
	DailyEnabled  bool   `json:"dailyEnabled"`
	DailyTime     string `json:"dailyTime"`
	WeeklyEnabled bool   `json:"weeklyEnabled"`
	WeeklyDay     int    `json:"weeklyDay"`
	WeeklyTime    string `json:"weeklyTime"`
	DueToday      bool   `json:"dueToday"`
	DueSoon1      bool   `json:"dueSoon1"`
	DueSoon2      bool   `json:"dueSoon2"`
	DueSoon3      bool   `json:"dueSoon3"`
	Overdue       bool   `json:"overdue"`
}

type AppNotification struct {
	ID        int64  `json:"id"`
	Kind      string `json:"kind"`
	Title     string `json:"title"`
	Body      string `json:"body"`
	DedupeKey string `json:"dedupeKey"`
	Read      bool   `json:"read"`
	CreatedAt string `json:"createdAt"`
}

func defaultNotifyPrefs() NotifyPrefs {
	return NotifyPrefs{
		Enabled:       false,
		Desktop:       true,
		InApp:         true,
		DailyEnabled:  true,
		DailyTime:     "08:00",
		WeeklyEnabled: false,
		WeeklyDay:     1,
		WeeklyTime:    "09:00",
		DueToday:      true,
		DueSoon1:      true,
		DueSoon2:      false,
		DueSoon3:      false,
		Overdue:       true,
	}
}

func loadNotifyPrefs(db *sql.DB) NotifyPrefs {
	prefs := defaultNotifyPrefs()
	raw, err := getSetting(db, settingNotifyPrefs)
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
	return prefs
}

func (a *App) GetNotifyPrefs() NotifyPrefs {
	return loadNotifyPrefs(a.db)
}

func (a *App) SaveNotifyPrefs(input NotifyPrefs) error {
	if input.WeeklyDay < 0 || input.WeeklyDay > 6 {
		return fmt.Errorf("weekly day must be 0–6")
	}
	input.DailyTime = normalizeClock(input.DailyTime, "08:00")
	input.WeeklyTime = normalizeClock(input.WeeklyTime, "09:00")
	if !input.InApp && !input.Desktop {
		input.InApp = true
	}
	data, err := json.Marshal(input)
	if err != nil {
		return err
	}
	if err := setSetting(a.db, settingNotifyPrefs, string(data)); err != nil {
		return err
	}
	if input.Enabled && input.Desktop && a.ctx != nil {
		if runtime.IsNotificationAvailable(a.ctx) {
			_, _ = runtime.RequestNotificationAuthorization(a.ctx)
		}
	}
	if a.mailer != nil {
		a.mailer.Kick()
	}
	return nil
}

func (a *App) ListNotifications() ([]AppNotification, error) {
	return listNotifications(a.db)
}

func (a *App) UnreadNotificationCount() int {
	var n int
	_ = a.db.QueryRow(`SELECT COUNT(*) FROM notifications WHERE read = 0`).Scan(&n)
	return n
}

func (a *App) MarkNotificationRead(id int64) error {
	_, err := a.db.Exec(`UPDATE notifications SET read = 1 WHERE id = ?`, id)
	return err
}

func (a *App) MarkAllNotificationsRead() error {
	_, err := a.db.Exec(`UPDATE notifications SET read = 1 WHERE read = 0`)
	return err
}

func (a *App) ClearNotifications() error {
	_, err := a.db.Exec(`DELETE FROM notifications`)
	return err
}

func (a *App) DeleteNotification(id int64) error {
	_, err := a.db.Exec(`DELETE FROM notifications WHERE id = ?`, id)
	return err
}

func (a *App) DesktopNotificationsAvailable() bool {
	if a.ctx == nil {
		return false
	}
	return runtime.IsNotificationAvailable(a.ctx)
}

func (a *App) TestNotification() error {
	prefs := loadNotifyPrefs(a.db)
	if !prefs.Enabled {
		return fmt.Errorf("enable application notifications first")
	}
	return deliverNotification(a.ctx, a.db, prefs, "test", "test:"+fmt.Sprintf("%d", time.Now().Unix()),
		"Kairon is notifying you", "Desktop and in-app alerts are working.")
}

func (a *App) SendNotificationNow(kind string) error {
	prefs := loadNotifyPrefs(a.db)
	if !prefs.Enabled {
		return fmt.Errorf("enable application notifications first")
	}
	tasks, err := a.ListTasks()
	if err != nil {
		return err
	}
	projects, err := a.ListProjects()
	if err != nil {
		return err
	}
	mailish := notifyAsMail(prefs)
	today := localToday()
	switch kind {
	case "daily":
		subject, text, _ := buildDailyReport(tasks, projects, mailish)
		return deliverNotification(a.ctx, a.db, prefs, "daily", "daily:"+today+":manual:"+fmt.Sprintf("%d", time.Now().Unix()), subject, notifyBodyFromText(text))
	case "weekly":
		subject, text, _ := buildWeeklyReport(tasks, projects, mailish)
		return deliverNotification(a.ctx, a.db, prefs, "weekly", "weekly:"+localWeekKey()+":manual:"+fmt.Sprintf("%d", time.Now().Unix()), subject, notifyBodyFromText(text))
	case "due":
		subject, text, _, ok := buildDueDigest(tasks, projects, mailish)
		if !ok {
			return fmt.Errorf("nothing due right now")
		}
		return deliverNotification(a.ctx, a.db, prefs, "due", "due:"+today+":manual:"+fmt.Sprintf("%d", time.Now().Unix()), subject, notifyBodyFromText(text))
	default:
		return fmt.Errorf("unknown notification kind")
	}
}

func notifyAsMail(prefs NotifyPrefs) MailPrefs {
	return MailPrefs{
		Enabled:          prefs.Enabled,
		DailyEnabled:     prefs.DailyEnabled,
		DailyTime:        prefs.DailyTime,
		WeeklyEnabled:    prefs.WeeklyEnabled,
		WeeklyDay:        prefs.WeeklyDay,
		WeeklyTime:       prefs.WeeklyTime,
		DueToday:         prefs.DueToday,
		DueSoon1:         prefs.DueSoon1,
		DueSoon2:         prefs.DueSoon2,
		DueSoon3:         prefs.DueSoon3,
		Overdue:          prefs.Overdue,
		IncludeNoDue:     false,
		IncludeCompleted: false,
	}
}

func listNotifications(db *sql.DB) ([]AppNotification, error) {
	rows, err := db.Query(`
		SELECT id, kind, title, body, dedupe_key, read, created_at
		FROM notifications ORDER BY created_at DESC LIMIT 400
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []AppNotification{}
	for rows.Next() {
		var n AppNotification
		var read int
		if err := rows.Scan(&n.ID, &n.Kind, &n.Title, &n.Body, &n.DedupeKey, &read, &n.CreatedAt); err != nil {
			return nil, err
		}
		n.Read = read != 0
		items = append(items, n)
	}
	return items, rows.Err()
}

func deliverNotification(ctx context.Context, db *sql.DB, prefs NotifyPrefs, kind, dedupe, title, body string) error {
	if !prefs.Enabled {
		return nil
	}
	if dedupe != "" {
		var existing int
		err := db.QueryRow(`SELECT COUNT(*) FROM notifications WHERE dedupe_key = ?`, dedupe).Scan(&existing)
		if err != nil {
			return err
		}
		if existing > 0 {
			return nil
		}
	}

	item := AppNotification{
		Kind:      kind,
		Title:     title,
		Body:      body,
		DedupeKey: dedupe,
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	if prefs.InApp {
		res, err := db.Exec(`
			INSERT INTO notifications (kind, title, body, dedupe_key, read, created_at)
			VALUES (?, ?, ?, ?, 0, ?)
		`, kind, title, body, dedupe, item.CreatedAt)
		if err != nil {
			return err
		}
		item.ID, _ = res.LastInsertId()
		_, _ = db.Exec(`DELETE FROM notifications WHERE id NOT IN (
			SELECT id FROM (SELECT id FROM notifications ORDER BY created_at DESC, id DESC LIMIT 400)
		)`)
		if ctx != nil {
			runtime.EventsEmit(ctx, notifyEvent, item)
		}
	}

	if prefs.Desktop && ctx != nil && runtime.IsNotificationAvailable(ctx) {
		ok, err := runtime.CheckNotificationAuthorization(ctx)
		if err == nil && !ok {
			ok, _ = runtime.RequestNotificationAuthorization(ctx)
		}
		if ok {
			snippet := body
			if len(snippet) > 180 {
				snippet = snippet[:177] + "…"
			}
			snippet = strings.ReplaceAll(snippet, "\n", " ")
			_ = runtime.SendNotification(ctx, runtime.NotificationOptions{
				ID:    fmt.Sprintf("kairon-%s-%d", kind, time.Now().UnixNano()),
				Title: title,
				Body:  snippet,
			})
		}
	}
	return nil
}

func notifyBodyFromText(text string) string {
	text = strings.TrimSpace(text)
	if len(text) > 280 {
		return text[:277] + "…"
	}
	return text
}
