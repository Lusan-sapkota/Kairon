package main

import (
	"database/sql"
	"fmt"
	"time"
)

const mailMaxAttempts = 8

type MailQueueItem struct {
	ID            int64   `json:"id"`
	Kind          string  `json:"kind"`
	DedupeKey     string  `json:"dedupeKey"`
	Recipient     string  `json:"recipient"`
	Subject       string  `json:"subject"`
	Status        string  `json:"status"`
	Attempts      int     `json:"attempts"`
	MaxAttempts   int     `json:"maxAttempts"`
	NextAttemptAt string  `json:"nextAttemptAt"`
	ExpiresAt     string  `json:"expiresAt"`
	LastError     string  `json:"lastError"`
	CreatedAt     string  `json:"createdAt"`
	SentAt        *string `json:"sentAt"`
}

type MailQueueStats struct {
	Pending int `json:"pending"`
	Failed  int `json:"failed"`
	Expired int `json:"expired"`
	Sent    int `json:"sent"`
}

func enqueueMail(db *sql.DB, kind, dedupeKey, recipient, subject, textBody, htmlBody string, ttl time.Duration) (bool, error) {
	if recipient == "" {
		return false, fmt.Errorf("no recipient")
	}
	if dedupeKey == "" {
		dedupeKey = fmt.Sprintf("%s:%d", kind, time.Now().UnixNano())
	}

	var existing string
	err := db.QueryRow(`
		SELECT status FROM mail_queue
		WHERE dedupe_key = ? AND status IN ('pending', 'sent')
		ORDER BY id DESC LIMIT 1
	`, dedupeKey).Scan(&existing)
	if err == nil {
		return false, nil
	}
	if err != sql.ErrNoRows {
		return false, err
	}

	now := time.Now()
	_, err = db.Exec(`
		INSERT INTO mail_queue (
			kind, dedupe_key, recipient, subject, body_text, body_html,
			status, attempts, max_attempts, next_attempt_at, expires_at, last_error, created_at
		) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?, '', ?)
	`, kind, dedupeKey, recipient, subject, textBody, htmlBody, mailMaxAttempts,
		now.Format(time.RFC3339), now.Add(ttl).Format(time.RFC3339), now.Format(time.RFC3339))
	if err != nil {
		return false, err
	}
	return true, nil
}

func expireMail(db *sql.DB) error {
	now := time.Now().Format(time.RFC3339)
	_, err := db.Exec(`
		UPDATE mail_queue SET status = 'expired'
		WHERE status = 'pending' AND expires_at < ?
	`, now)
	return err
}

func drainMailQueue(db *sql.DB, cfg SMTPConfig) error {
	if err := expireMail(db); err != nil {
		return err
	}
	now := time.Now()
	rows, err := db.Query(`
		SELECT id, recipient, subject, body_text, body_html, attempts, max_attempts, expires_at
		FROM mail_queue
		WHERE status = 'pending' AND next_attempt_at <= ?
		ORDER BY created_at ASC
		LIMIT 8
	`, now.Format(time.RFC3339))
	if err != nil {
		return err
	}
	defer rows.Close()

	type row struct {
		id, attempts, maxAttempts int
		to, subject, text, html   string
		expiresAt                 string
	}
	var batch []row
	for rows.Next() {
		var r row
		if err := rows.Scan(&r.id, &r.to, &r.subject, &r.text, &r.html, &r.attempts, &r.maxAttempts, &r.expiresAt); err != nil {
			return err
		}
		batch = append(batch, r)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	for _, item := range batch {
		exp, _ := time.Parse(time.RFC3339, item.expiresAt)
		if !exp.IsZero() && now.After(exp) {
			_, _ = db.Exec(`UPDATE mail_queue SET status = 'expired' WHERE id = ?`, item.id)
			continue
		}
		sendErr := sendSMTP(cfg, item.to, item.subject, item.text, item.html)
		if sendErr == nil {
			ts := now.Format(time.RFC3339)
			_, _ = db.Exec(`UPDATE mail_queue SET status = 'sent', sent_at = ?, last_error = '', attempts = attempts + 1 WHERE id = ?`, ts, item.id)
			continue
		}
		attempts := item.attempts + 1
		if !isRetryableMailError(sendErr) || attempts >= item.maxAttempts {
			_, _ = db.Exec(`UPDATE mail_queue SET status = 'failed', attempts = ?, last_error = ? WHERE id = ?`, attempts, sendErr.Error(), item.id)
			continue
		}
		next := now.Add(backoffFor(attempts))
		if !exp.IsZero() && next.After(exp) {
			next = exp
		}
		_, _ = db.Exec(`UPDATE mail_queue SET attempts = ?, last_error = ?, next_attempt_at = ? WHERE id = ?`,
			attempts, sendErr.Error(), next.Format(time.RFC3339), item.id)
	}
	return nil
}

func backoffFor(attempt int) time.Duration {
	switch {
	case attempt <= 1:
		return 2 * time.Minute
	case attempt == 2:
		return 5 * time.Minute
	case attempt == 3:
		return 15 * time.Minute
	case attempt == 4:
		return 30 * time.Minute
	case attempt == 5:
		return time.Hour
	case attempt == 6:
		return 3 * time.Hour
	default:
		return 6 * time.Hour
	}
}

func listMailQueue(db *sql.DB) ([]MailQueueItem, error) {
	rows, err := db.Query(`
		SELECT id, kind, dedupe_key, recipient, subject, status, attempts, max_attempts,
		       next_attempt_at, expires_at, last_error, created_at, sent_at
		FROM mail_queue
		ORDER BY created_at DESC
		LIMIT 80
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []MailQueueItem{}
	for rows.Next() {
		var it MailQueueItem
		if err := rows.Scan(&it.ID, &it.Kind, &it.DedupeKey, &it.Recipient, &it.Subject, &it.Status,
			&it.Attempts, &it.MaxAttempts, &it.NextAttemptAt, &it.ExpiresAt, &it.LastError, &it.CreatedAt, &it.SentAt); err != nil {
			return nil, err
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

func mailQueueStats(db *sql.DB) MailQueueStats {
	var s MailQueueStats
	_ = db.QueryRow(`SELECT COUNT(*) FROM mail_queue WHERE status = 'pending'`).Scan(&s.Pending)
	_ = db.QueryRow(`SELECT COUNT(*) FROM mail_queue WHERE status = 'failed'`).Scan(&s.Failed)
	_ = db.QueryRow(`SELECT COUNT(*) FROM mail_queue WHERE status = 'expired'`).Scan(&s.Expired)
	_ = db.QueryRow(`SELECT COUNT(*) FROM mail_queue WHERE status = 'sent'`).Scan(&s.Sent)
	return s
}

func (a *App) ListMailQueue() ([]MailQueueItem, error) {
	return listMailQueue(a.db)
}

func (a *App) GetMailQueueStats() MailQueueStats {
	return mailQueueStats(a.db)
}

func (a *App) RetryMailItem(id int64) error {
	now := time.Now().Format(time.RFC3339)
	res, err := a.db.Exec(`
		UPDATE mail_queue
		SET status = 'pending', next_attempt_at = ?, last_error = ''
		WHERE id = ? AND status IN ('failed', 'expired', 'pending')
	`, now, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("queue item not found")
	}
	if a.mailer != nil {
		a.mailer.Kick()
	}
	return nil
}

func (a *App) RetryAllMail() error {
	now := time.Now().Format(time.RFC3339)
	_, err := a.db.Exec(`
		UPDATE mail_queue
		SET status = 'pending', next_attempt_at = ?
		WHERE status IN ('failed', 'expired')
	`, now)
	if err != nil {
		return err
	}
	if a.mailer != nil {
		a.mailer.Kick()
	}
	return nil
}

func (a *App) PurgeMailQueue() error {
	_, err := a.db.Exec(`DELETE FROM mail_queue WHERE status IN ('sent', 'expired', 'failed')`)
	return err
}
