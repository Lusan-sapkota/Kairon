package main

import (
	"fmt"
	"html"
	"strings"
	"time"
)

type reportBucket struct {
	Title string
	Tasks []Task
}

func projectName(projects []Project, id *int64) string {
	if id == nil {
		return "No project"
	}
	for _, p := range projects {
		if p.ID == *id {
			return p.Name
		}
	}
	return "No project"
}

func priorityWord(p int) string {
	switch p {
	case 1:
		return "Low"
	case 2:
		return "Medium"
	case 3:
		return "High"
	default:
		return ""
	}
}

func localToday() string {
	return time.Now().Format("2006-01-02")
}

func localWeekKey() string {
	y, w := time.Now().ISOWeek()
	return fmt.Sprintf("%d-W%02d", y, w)
}

func daysUntilDue(due string) int {
	d, err := time.ParseInLocation("2006-01-02", due, time.Local)
	if err != nil {
		return 999
	}
	today := time.Now().In(time.Local)
	today = time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, time.Local)
	return int(d.Sub(today).Hours() / 24)
}

func splitTasks(tasks []Task, prefs MailPrefs) (overdue, today, soon1, soon2, soon3, open []Task) {
	td := localToday()
	for _, t := range tasks {
		if t.Done && !prefs.IncludeCompleted {
			continue
		}
		if t.DueDate == nil || *t.DueDate == "" {
			if !t.Done {
				open = append(open, t)
			}
			continue
		}
		due := *t.DueDate
		if due < td && !t.Done {
			overdue = append(overdue, t)
			continue
		}
		if due == td && !t.Done {
			today = append(today, t)
			continue
		}
		n := daysUntilDue(due)
		switch n {
		case 1:
			soon1 = append(soon1, t)
		case 2:
			soon2 = append(soon2, t)
		case 3:
			soon3 = append(soon3, t)
		default:
			if !t.Done {
				open = append(open, t)
			}
		}
	}
	return
}

func taskLine(t Task, projects []Project) string {
	line := t.Title
	if t.DueDate != nil && *t.DueDate != "" {
		line += " — due " + *t.DueDate
	}
	if pw := priorityWord(t.Priority); pw != "" {
		line += " · " + pw
	}
	line += " · " + projectName(projects, t.ProjectID)
	if t.Done {
		line += " (done)"
	}
	return line
}

func htmlTaskList(tasks []Task, projects []Project) string {
	if len(tasks) == 0 {
		return `<p style="color:#6c7183;margin:8px 0;">None</p>`
	}
	var b strings.Builder
	b.WriteString(`<ul style="padding-left:18px;margin:8px 0;">`)
	for _, t := range tasks {
		b.WriteString("<li>")
		b.WriteString(html.EscapeString(taskLine(t, projects)))
		b.WriteString("</li>")
	}
	b.WriteString("</ul>")
	return b.String()
}

func textTaskList(tasks []Task, projects []Project) string {
	if len(tasks) == 0 {
		return "  None\n"
	}
	var b strings.Builder
	for _, t := range tasks {
		b.WriteString("  - ")
		b.WriteString(taskLine(t, projects))
		b.WriteString("\n")
	}
	return b.String()
}

func wrapHTML(title, inner string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:system-ui,Segoe UI,sans-serif;background:#f4f5f8;padding:24px;color:#1b1d24;">
<table width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:28px;border:1px solid #e6e8ee;">
<tr><td>
<h1 style="margin:0 0 8px;font-size:22px;color:#ea6a3a;">Kairon</h1>
<p style="margin:0 0 18px;color:#5b5f6e;font-size:14px;">%s</p>
%s
<p style="margin:24px 0 0;font-size:12px;color:#8b8f9c;">Sent locally by Kairon. Your data never leaves this machine except through the SMTP server you configured.</p>
</td></tr></table></td></tr></table>
</body></html>`, html.EscapeString(title), inner)
}

func buildDailyReport(tasks []Task, projects []Project, prefs MailPrefs) (subject, text, htmlBody string) {
	overdue, today, soon1, _, _, open := splitTasks(tasks, prefs)
	doneN := 0
	openN := 0
	for _, t := range tasks {
		if t.Done {
			doneN++
		} else {
			openN++
		}
	}
	date := time.Now().Format("Mon, Jan 2")
	subject = fmt.Sprintf("Kairon daily report — %s", date)

	var tb strings.Builder
	fmt.Fprintf(&tb, "Kairon daily report — %s\n\n", date)
	fmt.Fprintf(&tb, "Open: %d  ·  Done: %d  ·  Overdue: %d  ·  Due today: %d\n\n", openN, doneN, len(overdue), len(today))
	tb.WriteString("OVERDUE\n")
	tb.WriteString(textTaskList(overdue, projects))
	tb.WriteString("\nDUE TODAY\n")
	tb.WriteString(textTaskList(today, projects))
	tb.WriteString("\nDUE TOMORROW\n")
	tb.WriteString(textTaskList(soon1, projects))
	if prefs.IncludeNoDue {
		tb.WriteString("\nNO DUE DATE\n")
		var none []Task
		for _, t := range open {
			if t.DueDate == nil || *t.DueDate == "" {
				none = append(none, t)
			}
		}
		tb.WriteString(textTaskList(none, projects))
	}

	inner := fmt.Sprintf(
		`<p><strong>%d</strong> open · <strong>%d</strong> done · <strong>%d</strong> overdue · <strong>%d</strong> due today</p>
<h3>Overdue</h3>%s<h3>Due today</h3>%s<h3>Due tomorrow</h3>%s`,
		openN, doneN, len(overdue), len(today),
		htmlTaskList(overdue, projects), htmlTaskList(today, projects), htmlTaskList(soon1, projects),
	)
	return subject, tb.String(), wrapHTML("Daily report — "+date, inner)
}

func buildWeeklyReport(tasks []Task, projects []Project, prefs MailPrefs) (subject, text, htmlBody string) {
	now := time.Now()
	weekday := int(now.Weekday())
	start := now.AddDate(0, 0, -weekday)
	if weekday == 0 {
		start = now.AddDate(0, 0, -6)
	}
	start = time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, time.Local)
	end := start.AddDate(0, 0, 7)
	startS := start.Format("2006-01-02")
	endS := end.Format("2006-01-02")

	var completed, remaining []Task
	for _, t := range tasks {
		if t.Done && t.UpdatedAt >= startS {
			completed = append(completed, t)
			continue
		}
		if t.Done && !prefs.IncludeCompleted {
			continue
		}
		if t.DueDate != nil && *t.DueDate != "" && *t.DueDate >= startS && *t.DueDate < endS {
			remaining = append(remaining, t)
			continue
		}
		if !t.Done {
			remaining = append(remaining, t)
		}
	}

	y, w := now.ISOWeek()
	subject = fmt.Sprintf("Kairon weekly report — week %d", w)
	var tb strings.Builder
	fmt.Fprintf(&tb, "Kairon weekly report — %d-W%02d\n", y, w)
	fmt.Fprintf(&tb, "Completed this week: %d\nStill open: %d\n\n", len(completed), countOpen(tasks))
	tb.WriteString("COMPLETED\n")
	tb.WriteString(textTaskList(completed, projects))
	tb.WriteString("\nSTILL OPEN\n")
	tb.WriteString(textTaskList(remaining, projects))

	inner := fmt.Sprintf(
		`<p>Completed this week: <strong>%d</strong> · Still open: <strong>%d</strong></p>
<h3>Completed</h3>%s<h3>Still open</h3>%s`,
		len(completed), countOpen(tasks), htmlTaskList(completed, projects), htmlTaskList(remaining, projects),
	)
	return subject, tb.String(), wrapHTML(fmt.Sprintf("Weekly report — week %d", w), inner)
}

func countOpen(tasks []Task) int {
	n := 0
	for _, t := range tasks {
		if !t.Done {
			n++
		}
	}
	return n
}

func buildDueDigest(tasks []Task, projects []Project, prefs MailPrefs) (subject, text, htmlBody string, ok bool) {
	overdue, today, soon1, soon2, soon3, _ := splitTasks(tasks, prefs)
	var buckets []reportBucket
	if prefs.Overdue && len(overdue) > 0 {
		buckets = append(buckets, reportBucket{Title: "Overdue", Tasks: overdue})
	}
	if prefs.DueToday && len(today) > 0 {
		buckets = append(buckets, reportBucket{Title: "Due today", Tasks: today})
	}
	if prefs.DueSoon1 && len(soon1) > 0 {
		buckets = append(buckets, reportBucket{Title: "Due tomorrow", Tasks: soon1})
	}
	if prefs.DueSoon2 && len(soon2) > 0 {
		buckets = append(buckets, reportBucket{Title: "Due in 2 days", Tasks: soon2})
	}
	if prefs.DueSoon3 && len(soon3) > 0 {
		buckets = append(buckets, reportBucket{Title: "Due in 3 days", Tasks: soon3})
	}
	if len(buckets) == 0 {
		return "", "", "", false
	}

	total := 0
	for _, b := range buckets {
		total += len(b.Tasks)
	}
	subject = fmt.Sprintf("Kairon reminder — %d task%s need attention", total, plural(total))

	var tb strings.Builder
	tb.WriteString("Time is running out. Here's what needs finishing:\n\n")
	var inner strings.Builder
	inner.WriteString("<p>Time is running out. Here's what needs finishing.</p>")
	for _, b := range buckets {
		fmt.Fprintf(&tb, "%s\n%s\n", strings.ToUpper(b.Title), textTaskList(b.Tasks, projects))
		fmt.Fprintf(&inner, "<h3>%s</h3>%s", html.EscapeString(b.Title), htmlTaskList(b.Tasks, projects))
	}
	return subject, tb.String(), wrapHTML(subject, inner.String()), true
}

func plural(n int) string {
	if n == 1 {
		return ""
	}
	return "s"
}
