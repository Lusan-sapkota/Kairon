package main

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"
)

type Mailer struct {
	ctx    context.Context
	db     *sql.DB
	listT  func() ([]Task, error)
	listP  func() ([]Project, error)
	cancel context.CancelFunc
	kick   chan struct{}
	mu     sync.Mutex
}

func NewMailer() *Mailer {
	return &Mailer{kick: make(chan struct{}, 1)}
}

func (m *Mailer) Start(ctx context.Context, db *sql.DB, listT func() ([]Task, error), listP func() ([]Project, error)) {
	m.ctx = ctx
	m.db = db
	m.listT = listT
	m.listP = listP
	runCtx, cancel := context.WithCancel(ctx)
	m.cancel = cancel
	go m.loop(runCtx)
}

func (m *Mailer) Stop() {
	if m.cancel != nil {
		m.cancel()
	}
}

func (m *Mailer) Kick() {
	select {
	case m.kick <- struct{}{}:
	default:
	}
}

func (m *Mailer) loop(ctx context.Context) {
	timer := time.NewTimer(25 * time.Second)
	defer timer.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-m.kick:
			if !timer.Stop() {
				select {
				case <-timer.C:
				default:
				}
			}
			m.tick()
			timer.Reset(60 * time.Second)
		case <-timer.C:
			m.tick()
			timer.Reset(60 * time.Second)
		}
	}
}

func (m *Mailer) tick() {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.db == nil {
		return
	}
	_ = expireMail(m.db)
	_ = m.scheduleAlerts()
	cfg := loadSMTP(m.db)
	if smtpReady(cfg) == nil {
		_ = drainMailQueue(m.db, cfg)
	}
}

func (m *Mailer) scheduleAlerts() error {
	mailPrefs := loadMailPrefs(m.db)
	notifyPrefs := loadNotifyPrefs(m.db)
	cfg := loadSMTP(m.db)
	mailOn := mailPrefs.Enabled && smtpReady(cfg) == nil
	notifyOn := notifyPrefs.Enabled && (notifyPrefs.InApp || notifyPrefs.Desktop)
	if !mailOn && !notifyOn {
		return nil
	}
	tasks, err := m.listT()
	if err != nil {
		return err
	}
	projects, err := m.listP()
	if err != nil {
		return err
	}

	now := time.Now()
	today := localToday()
	if mailOn {
		to := recipientFor(cfg)
		ttl := queueTTLDuration(mailPrefs.QueueTTL)
		if mailPrefs.DailyEnabled && clockReached(now, mailPrefs.DailyTime) {
			last, _ := getSetting(m.db, settingLastDaily)
			if last != today {
				subject, text, htmlBody := buildDailyReport(tasks, projects, mailPrefs)
				ok, err := enqueueMail(m.db, "daily", "daily:"+today, to, subject, text, htmlBody, ttl)
				if err == nil && ok {
					_ = setSetting(m.db, settingLastDaily, today)
				}
			}
		}
		if mailPrefs.WeeklyEnabled && int(now.Weekday()) == mailPrefs.WeeklyDay && clockReached(now, mailPrefs.WeeklyTime) {
			last, _ := getSetting(m.db, settingLastWeekly)
			week := localWeekKey()
			if last != week {
				subject, text, htmlBody := buildWeeklyReport(tasks, projects, mailPrefs)
				ok, err := enqueueMail(m.db, "weekly", "weekly:"+week, to, subject, text, htmlBody, ttl)
				if err == nil && ok {
					_ = setSetting(m.db, settingLastWeekly, week)
				}
			}
		}
		if mailPrefs.DueToday || mailPrefs.DueSoon1 || mailPrefs.DueSoon2 || mailPrefs.DueSoon3 || mailPrefs.Overdue {
			last, _ := getSetting(m.db, settingLastDue)
			if last != today {
				subject, text, htmlBody, okDigest := buildDueDigest(tasks, projects, mailPrefs)
				if okDigest {
					ok, err := enqueueMail(m.db, "due", "due:"+today, to, subject, text, htmlBody, ttl)
					if err == nil && ok {
						_ = setSetting(m.db, settingLastDue, today)
					}
				}
			}
		}
	}

	if notifyOn {
		mailish := notifyAsMail(notifyPrefs)
		if notifyPrefs.DailyEnabled && clockReached(now, notifyPrefs.DailyTime) {
			last, _ := getSetting(m.db, settingLastNotifyDaily)
			if last != today {
				subject, text, _ := buildDailyReport(tasks, projects, mailish)
				if err := deliverNotification(m.ctx, m.db, notifyPrefs, "daily", "daily:"+today, subject, notifyBodyFromText(text)); err == nil {
					_ = setSetting(m.db, settingLastNotifyDaily, today)
				}
			}
		}
		if notifyPrefs.WeeklyEnabled && int(now.Weekday()) == notifyPrefs.WeeklyDay && clockReached(now, notifyPrefs.WeeklyTime) {
			last, _ := getSetting(m.db, settingLastNotifyWeek)
			week := localWeekKey()
			if last != week {
				subject, text, _ := buildWeeklyReport(tasks, projects, mailish)
				if err := deliverNotification(m.ctx, m.db, notifyPrefs, "weekly", "weekly:"+week, subject, notifyBodyFromText(text)); err == nil {
					_ = setSetting(m.db, settingLastNotifyWeek, week)
				}
			}
		}
		if notifyPrefs.DueToday || notifyPrefs.DueSoon1 || notifyPrefs.DueSoon2 || notifyPrefs.DueSoon3 || notifyPrefs.Overdue {
			last, _ := getSetting(m.db, settingLastNotifyDue)
			if last != today {
				subject, text, _, okDigest := buildDueDigest(tasks, projects, mailish)
				if okDigest {
					if err := deliverNotification(m.ctx, m.db, notifyPrefs, "due", "due:"+today, subject, notifyBodyFromText(text)); err == nil {
						_ = setSetting(m.db, settingLastNotifyDue, today)
					}
				}
			}
		}
	}
	return nil
}

func clockReached(now time.Time, hhmm string) bool {
	t, err := time.Parse("15:04", hhmm)
	if err != nil {
		return false
	}
	target := time.Date(now.Year(), now.Month(), now.Day(), t.Hour(), t.Minute(), 0, 0, now.Location())
	return !now.Before(target)
}

func (a *App) TestSMTP() error {
	cfg := loadSMTP(a.db)
	if err := smtpReady(cfg); err != nil {
		return err
	}
	if cfg.Password == "" {
		return fmt.Errorf("SMTP password is required to send")
	}
	to := recipientFor(cfg)
	subject := "Kairon test email"
	text := "This is a test from Kairon. If you can read this, SMTP is working."
	htmlBody := wrapHTML("Test email", "<p>This is a test from Kairon. If you can read this, SMTP is working.</p>")
	ttl := queueTTLDuration(loadMailPrefs(a.db).QueueTTL)
	key := fmt.Sprintf("test:%d", time.Now().Unix())
	_, err := enqueueMail(a.db, "test", key, to, subject, text, htmlBody, ttl)
	if err != nil {
		return err
	}
	if sendErr := sendSMTP(cfg, to, subject, text, htmlBody); sendErr != nil {
		if isRetryableMailError(sendErr) {
			return fmt.Errorf("queued — no connection right now (%v). It will retry until the queue expires", sendErr)
		}
		return sendErr
	}
	_, _ = a.db.Exec(`UPDATE mail_queue SET status = 'sent', sent_at = ?, last_error = '' WHERE dedupe_key = ?`, time.Now().Format(time.RFC3339), key)
	return nil
}

func (a *App) SendMailNow(kind string) error {
	prefs := loadMailPrefs(a.db)
	cfg := loadSMTP(a.db)
	if err := smtpReady(cfg); err != nil {
		return err
	}
	tasks, err := a.ListTasks()
	if err != nil {
		return err
	}
	projects, err := a.ListProjects()
	if err != nil {
		return err
	}
	to := recipientFor(cfg)
	ttl := queueTTLDuration(prefs.QueueTTL)
	var subject, text, htmlBody, dedupe, qKind string
	switch kind {
	case "daily":
		subject, text, htmlBody = buildDailyReport(tasks, projects, prefs)
		qKind, dedupe = "daily", "daily:"+localToday()+":manual"
	case "weekly":
		subject, text, htmlBody = buildWeeklyReport(tasks, projects, prefs)
		qKind, dedupe = "weekly", "weekly:"+localWeekKey()+":manual"
	case "due":
		var ok bool
		subject, text, htmlBody, ok = buildDueDigest(tasks, projects, prefs)
		if !ok {
			return fmt.Errorf("nothing due right now")
		}
		qKind, dedupe = "due", "due:"+localToday()+":manual"
	default:
		return fmt.Errorf("unknown report kind")
	}
	_, err = enqueueMail(a.db, qKind, dedupe, to, subject, text, htmlBody, ttl)
	if err != nil {
		return err
	}
	if a.mailer != nil {
		a.mailer.Kick()
	}
	return nil
}
