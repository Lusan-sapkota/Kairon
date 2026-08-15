package main

import (
	"context"
	"database/sql"
	"encoding/csv"
	"fmt"
	"os"
	"sync/atomic"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx    context.Context
	db     *sql.DB
	dbPath string

	refitGen atomic.Uint64
	pendingW atomic.Int64
	pendingH atomic.Int64

	updater *Updater
	mailer  *Mailer
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{updater: NewUpdater(), mailer: NewMailer()}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	runtime.WindowMaximise(ctx)

	db, err := openDB()
	if err != nil {
		panic(err)
	}
	a.db = db
	a.dbPath, _ = plannerDBPath()
	_ = runtime.InitializeNotifications(ctx)
	runtime.OnNotificationResponse(ctx, func(result runtime.NotificationResult) {
		runtime.WindowUnminimise(ctx)
		runtime.WindowShow(ctx)
		runtime.WindowSetAlwaysOnTop(ctx, true)
		runtime.WindowSetAlwaysOnTop(ctx, false)
	})
	a.updater.Start(ctx, db)
	a.mailer.Start(ctx, db, a.ListTasks, a.ListProjects)
}

// shutdown is called when the app terminates, giving us a chance to close the db.
func (a *App) shutdown(ctx context.Context) {
	a.mailer.Stop()
	a.updater.Stop(true)
	runtime.CleanupNotifications(ctx)
	if a.db != nil {
		a.db.Close()
	}
}

func (a *App) GetVersion() string {
	return Version
}

func (a *App) GetUpdateInfo() UpdateInfo {
	return a.updater.GetUpdateInfo()
}

func (a *App) CheckForUpdates() {
	a.updater.CheckNow()
}

func (a *App) DismissUpdate() {
	a.updater.DismissUpdate()
}

func (a *App) OpenUpdatePackage() error {
	return a.updater.OpenUpdatePackage()
}

func (a *App) ApplyUpdateAndRestart() error {
	return a.updater.ApplyUpdateAndRestart()
}

func now() string {
	return time.Now().Format(time.RFC3339)
}

func (a *App) RefitWindow(width, height int) {
	if runtime.WindowIsFullscreen(a.ctx) || width <= 0 || height <= 0 {
		return
	}

	a.pendingW.Store(int64(width))
	a.pendingH.Store(int64(height))
	gen := a.refitGen.Add(1)

	go func(gen uint64) {
		time.Sleep(450 * time.Millisecond)
		if gen != a.refitGen.Load() {
			return
		}
		a.applyRefit(int(a.pendingW.Load()), int(a.pendingH.Load()))
	}(gen)
}

func (a *App) applyRefit(hintW, hintH int) {
	if runtime.WindowIsFullscreen(a.ctx) {
		return
	}

	curW, curH := hintW, hintH
	bigW, bigH := hintW, hintH

	if screens, err := runtime.ScreenGetAll(a.ctx); err == nil {
		for _, s := range screens {
			w, h := s.Size.Width, s.Size.Height
			if w <= 0 || h <= 0 {
				w, h = s.Width, s.Height
			}
			if w > bigW {
				bigW = w
			}
			if h > bigH {
				bigH = h
			}
			if s.IsCurrent && w > 0 && h > 0 {
				curW, curH = w, h
			}
		}
	}

	if hintW*hintH > curW*curH {
		curW, curH = hintW, hintH
	}
	if curW <= 0 || curH <= 0 {
		return
	}

	runtime.WindowSetMaxSize(a.ctx, bigW, bigH)

	gw, gh := runtime.WindowGetSize(a.ctx)

	if gw >= curW-80 && gh >= curH-80 {
		if !runtime.WindowIsMaximised(a.ctx) {
			runtime.WindowMaximise(a.ctx)
		}
		return
	}

	if runtime.WindowIsMaximised(a.ctx) {
		runtime.WindowUnmaximise(a.ctx)
		time.Sleep(150 * time.Millisecond)
	}

	runtime.WindowSetSize(a.ctx, curW, curH)
	runtime.WindowMaximise(a.ctx)
}

// ---------- Projects ----------

func (a *App) ListProjects() ([]Project, error) {
	rows, err := a.db.Query(`SELECT id, name, color, tags, created_at FROM projects ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := []Project{}
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Color, &p.Tags, &p.CreatedAt); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, rows.Err()
}

func (a *App) CreateProject(input ProjectInput) (*Project, error) {
	if input.Name == "" {
		return nil, fmt.Errorf("project name is required")
	}
	color := input.Color
	if color == "" {
		color = "#6366f1"
	}
	createdAt := now()

	res, err := a.db.Exec(
		`INSERT INTO projects (name, color, tags, created_at) VALUES (?, ?, ?, ?)`,
		input.Name, color, input.Tags, createdAt,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return &Project{ID: id, Name: input.Name, Color: color, Tags: input.Tags, CreatedAt: createdAt}, nil
}

func (a *App) UpdateProject(input ProjectInput) (*Project, error) {
	if input.Name == "" {
		return nil, fmt.Errorf("project name is required")
	}
	_, err := a.db.Exec(
		`UPDATE projects SET name = ?, color = ?, tags = ? WHERE id = ?`,
		input.Name, input.Color, input.Tags, input.ID,
	)
	if err != nil {
		return nil, err
	}

	var p Project
	err = a.db.QueryRow(`SELECT id, name, color, tags, created_at FROM projects WHERE id = ?`, input.ID).
		Scan(&p.ID, &p.Name, &p.Color, &p.Tags, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (a *App) DeleteProject(id int64) error {
	_, err := a.db.Exec(`DELETE FROM projects WHERE id = ?`, id)
	return err
}

// ---------- Tasks ----------

func (a *App) ListTasks() ([]Task, error) {
	rows, err := a.db.Query(`
		SELECT id, project_id, title, notes, done, priority, due_date, sort_order, repeat, created_at, updated_at
		FROM tasks ORDER BY done ASC, due_date IS NULL, due_date ASC, priority DESC, created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tasks := []Task{}
	for rows.Next() {
		var t Task
		var done int
		if err := rows.Scan(&t.ID, &t.ProjectID, &t.Title, &t.Notes, &done, &t.Priority, &t.DueDate, &t.SortOrder, &t.Repeat, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		t.Done = done != 0
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

func (a *App) CreateTask(input TaskInput) (*Task, error) {
	if input.Title == "" {
		return nil, fmt.Errorf("task title is required")
	}
	repeat := normalizeRepeat(input.Repeat)
	ts := now()
	sortOrder := float64(time.Now().UnixNano())

	res, err := a.db.Exec(
		`INSERT INTO tasks (project_id, title, notes, done, priority, due_date, sort_order, repeat, created_at, updated_at)
		 VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
		input.ProjectID, input.Title, input.Notes, input.Priority, input.DueDate, sortOrder, repeat, ts, ts,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	if err := a.syncTaskNote(id, input.ProjectID, input.Title, input.Notes); err != nil {
		return nil, err
	}
	return &Task{
		ID: id, ProjectID: input.ProjectID, Title: input.Title, Notes: input.Notes,
		Done: false, Priority: input.Priority, DueDate: input.DueDate, SortOrder: sortOrder, Repeat: repeat, CreatedAt: ts, UpdatedAt: ts,
	}, nil
}

func (a *App) UpdateTask(input TaskInput) (*Task, error) {
	if input.Title == "" {
		return nil, fmt.Errorf("task title is required")
	}
	repeat := normalizeRepeat(input.Repeat)
	ts := now()

	_, err := a.db.Exec(
		`UPDATE tasks SET project_id = ?, title = ?, notes = ?, priority = ?, due_date = ?, repeat = ?, updated_at = ?
		 WHERE id = ?`,
		input.ProjectID, input.Title, input.Notes, input.Priority, input.DueDate, repeat, ts, input.ID,
	)
	if err != nil {
		return nil, err
	}
	if err := a.syncTaskNote(input.ID, input.ProjectID, input.Title, input.Notes); err != nil {
		return nil, err
	}
	return a.getTask(input.ID)
}

func (a *App) ToggleTaskDone(id int64) (*Task, error) {
	before, err := a.getTask(id)
	if err != nil {
		return nil, err
	}
	_, err = a.db.Exec(
		`UPDATE tasks SET done = 1 - done, updated_at = ? WHERE id = ?`,
		now(), id,
	)
	if err != nil {
		return nil, err
	}
	t, err := a.getTask(id)
	if err != nil {
		return nil, err
	}
	if !before.Done && t.Done {
		a.spawnNextRepeat(*t)
	}
	return t, nil
}

// SetTaskDueDate moves a task to a new due date and board position, leaving its project untouched.
// Used when a card is dragged between day columns (or reordered within one) on the board.
func (a *App) SetTaskDueDate(id int64, dueDate *string, sortOrder float64) (*Task, error) {
	_, err := a.db.Exec(
		`UPDATE tasks SET due_date = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
		dueDate, sortOrder, now(), id,
	)
	if err != nil {
		return nil, err
	}
	return a.getTask(id)
}

func (a *App) SetTaskProject(id int64, projectId *int64, sortOrder float64) (*Task, error) {
	_, err := a.db.Exec(
		`UPDATE tasks SET project_id = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
		projectId, sortOrder, now(), id,
	)
	if err != nil {
		return nil, err
	}
	return a.getTask(id)
}

func (a *App) DeleteTask(id int64) error {
	if _, err := a.db.Exec(`DELETE FROM notes WHERE task_id = ?`, id); err != nil {
		return err
	}
	_, err := a.db.Exec(`DELETE FROM tasks WHERE id = ?`, id)
	return err
}

func (a *App) getTask(id int64) (*Task, error) {
	var t Task
	var done int
	err := a.db.QueryRow(`
		SELECT id, project_id, title, notes, done, priority, due_date, sort_order, repeat, created_at, updated_at
		FROM tasks WHERE id = ?
	`, id).Scan(&t.ID, &t.ProjectID, &t.Title, &t.Notes, &done, &t.Priority, &t.DueDate, &t.SortOrder, &t.Repeat, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	t.Done = done != 0
	return &t, nil
}

func (a *App) ExportTasksCSV() (string, error) {
	rows, err := a.db.Query(`
		SELECT t.title, t.notes, t.done, t.priority, t.due_date, t.repeat, p.name, t.created_at, t.updated_at
		FROM tasks t
		LEFT JOIN projects p ON p.id = t.project_id
		ORDER BY t.created_at ASC
	`)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	type taskRecord struct {
		title, notes, repeat string
		done                 int
		priority             int
		dueDate, project     sql.NullString
		createdAt, updatedAt string
	}
	var records []taskRecord
	for rows.Next() {
		var r taskRecord
		if err := rows.Scan(&r.title, &r.notes, &r.done, &r.priority, &r.dueDate, &r.repeat, &r.project, &r.createdAt, &r.updatedAt); err != nil {
			return "", err
		}
		records = append(records, r)
	}
	if err := rows.Err(); err != nil {
		return "", err
	}

	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export tasks as CSV",
		DefaultFilename: fmt.Sprintf("kairon-tasks-%s.csv", time.Now().Format("2006-01-02")),
		Filters: []runtime.FileFilter{
			{DisplayName: "CSV Files (*.csv)", Pattern: "*.csv"},
		},
	})
	if err != nil || path == "" {
		return "", err
	}

	f, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	w := csv.NewWriter(f)
	if err := w.Write([]string{"Title", "Notes", "Done", "Priority", "Due Date", "Repeat", "Project", "Created At", "Updated At"}); err != nil {
		return "", err
	}

	priorityLabels := map[int]string{0: "None", 1: "Low", 2: "Medium", 3: "High"}
	for _, r := range records {
		done := "No"
		if r.done != 0 {
			done = "Yes"
		}
		if err := w.Write([]string{
			r.title, r.notes, done, priorityLabels[r.priority], r.dueDate.String, r.repeat, r.project.String, r.createdAt, r.updatedAt,
		}); err != nil {
			return "", err
		}
	}
	w.Flush()
	if err := w.Error(); err != nil {
		return "", err
	}

	return path, nil
}

// ---------- Notes ----------

func (a *App) ListNotes() ([]Note, error) {
	rows, err := a.db.Query(`
		SELECT id, project_id, task_id, title, content, created_at, updated_at
		FROM notes ORDER BY updated_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notes := []Note{}
	for rows.Next() {
		var n Note
		if err := rows.Scan(&n.ID, &n.ProjectID, &n.TaskID, &n.Title, &n.Content, &n.CreatedAt, &n.UpdatedAt); err != nil {
			return nil, err
		}
		notes = append(notes, n)
	}
	return notes, rows.Err()
}

func (a *App) CreateNote(input NoteInput) (*Note, error) {
	if input.Title == "" {
		input.Title = "Untitled note"
	}
	ts := now()

	res, err := a.db.Exec(
		`INSERT INTO notes (project_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
		input.ProjectID, input.Title, input.Content, ts, ts,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return &Note{ID: id, ProjectID: input.ProjectID, Title: input.Title, Content: input.Content, CreatedAt: ts, UpdatedAt: ts}, nil
}

func (a *App) UpdateNote(input NoteInput) (*Note, error) {
	if input.Title == "" {
		input.Title = "Untitled note"
	}
	ts := now()

	_, err := a.db.Exec(
		`UPDATE notes SET project_id = ?, title = ?, content = ?, updated_at = ? WHERE id = ?`,
		input.ProjectID, input.Title, input.Content, ts, input.ID,
	)
	if err != nil {
		return nil, err
	}

	var n Note
	err = a.db.QueryRow(`SELECT id, project_id, task_id, title, content, created_at, updated_at FROM notes WHERE id = ?`, input.ID).
		Scan(&n.ID, &n.ProjectID, &n.TaskID, &n.Title, &n.Content, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Notes created from a task's notes field stay linked via TaskID; mirror edits back onto
	// the task so the two stay in sync regardless of which side was edited.
	if n.TaskID != nil {
		if _, err := a.db.Exec(
			`UPDATE tasks SET title = ?, notes = ?, project_id = ?, updated_at = ? WHERE id = ?`,
			n.Title, n.Content, n.ProjectID, ts, *n.TaskID,
		); err != nil {
			return nil, err
		}
	}

	return &n, nil
}

func (a *App) DeleteNote(id int64) error {
	_, err := a.db.Exec(`DELETE FROM notes WHERE id = ?`, id)
	return err
}

// syncTaskNote mirrors a task's notes field into a linked note (identified by task_id) so it
// also shows up on the Notes page. An empty notes value removes the linked note entirely.
func (a *App) syncTaskNote(taskID int64, projectID *int64, title, notes string) error {
	if notes == "" {
		_, err := a.db.Exec(`DELETE FROM notes WHERE task_id = ?`, taskID)
		return err
	}

	ts := now()
	var existingID int64
	err := a.db.QueryRow(`SELECT id FROM notes WHERE task_id = ?`, taskID).Scan(&existingID)
	if err == sql.ErrNoRows {
		_, err := a.db.Exec(
			`INSERT INTO notes (project_id, task_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
			projectID, taskID, title, notes, ts, ts,
		)
		return err
	}
	if err != nil {
		return err
	}
	_, err = a.db.Exec(
		`UPDATE notes SET project_id = ?, title = ?, content = ?, updated_at = ? WHERE id = ?`,
		projectID, title, notes, ts, existingID,
	)
	return err
}
