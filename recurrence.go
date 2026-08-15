package main

import (
	"time"
)

func normalizeRepeat(value string) string {
	switch value {
	case "daily", "weekly", "monthly":
		return value
	default:
		return ""
	}
}

func nextRepeatDue(repeat, due string) string {
	today := time.Now().In(time.Local)
	today = time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, time.Local)
	base := today
	if due != "" {
		if d, err := time.ParseInLocation("2006-01-02", due, time.Local); err == nil {
			base = d
		}
	}
	n := addRepeat(base, repeat)
	for !n.After(today) {
		next := addRepeat(n, repeat)
		if !next.After(n) {
			break
		}
		n = next
	}
	return n.Format("2006-01-02")
}

func addRepeat(from time.Time, repeat string) time.Time {
	switch repeat {
	case "daily":
		return from.AddDate(0, 0, 1)
	case "weekly":
		return from.AddDate(0, 0, 7)
	case "monthly":
		return from.AddDate(0, 1, 0)
	default:
		return from
	}
}

func (a *App) spawnNextRepeat(done Task) {
	repeat := normalizeRepeat(done.Repeat)
	if repeat == "" {
		return
	}
	due := ""
	if done.DueDate != nil {
		due = *done.DueDate
	}
	next := nextRepeatDue(repeat, due)
	var existing int
	_ = a.db.QueryRow(`
		SELECT COUNT(*) FROM tasks
		WHERE done = 0 AND title = ? AND IFNULL(project_id, 0) = IFNULL(?, 0) AND repeat = ? AND due_date = ?
	`, done.Title, done.ProjectID, repeat, next).Scan(&existing)
	if existing > 0 {
		return
	}
	_, _ = a.CreateTask(TaskInput{
		ProjectID: done.ProjectID,
		Title:     done.Title,
		Notes:     done.Notes,
		Priority:  done.Priority,
		DueDate:   &next,
		Repeat:    repeat,
	})
}
