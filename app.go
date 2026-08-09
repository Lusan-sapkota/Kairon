package main

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

// App struct
type App struct {
	ctx context.Context
	db  *sql.DB
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	db, err := openDB()
	if err != nil {
		panic(err)
	}
	a.db = db
}

// shutdown is called when the app terminates, giving us a chance to close the db.
func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		a.db.Close()
	}
}

func now() string {
	return time.Now().Format(time.RFC3339)
}

// ---------- Projects ----------

func (a *App) ListProjects() ([]Project, error) {
	rows, err := a.db.Query(`SELECT id, name, color, created_at FROM projects ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := []Project{}
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Color, &p.CreatedAt); err != nil {
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
		`INSERT INTO projects (name, color, created_at) VALUES (?, ?, ?)`,
		input.Name, color, createdAt,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return &Project{ID: id, Name: input.Name, Color: color, CreatedAt: createdAt}, nil
}

func (a *App) UpdateProject(input ProjectInput) (*Project, error) {
	if input.Name == "" {
		return nil, fmt.Errorf("project name is required")
	}
	_, err := a.db.Exec(
		`UPDATE projects SET name = ?, color = ? WHERE id = ?`,
		input.Name, input.Color, input.ID,
	)
	if err != nil {
		return nil, err
	}

	var p Project
	err = a.db.QueryRow(`SELECT id, name, color, created_at FROM projects WHERE id = ?`, input.ID).
		Scan(&p.ID, &p.Name, &p.Color, &p.CreatedAt)
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
		SELECT id, project_id, title, notes, done, priority, due_date, created_at, updated_at
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
		if err := rows.Scan(&t.ID, &t.ProjectID, &t.Title, &t.Notes, &done, &t.Priority, &t.DueDate, &t.CreatedAt, &t.UpdatedAt); err != nil {
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
	ts := now()

	res, err := a.db.Exec(
		`INSERT INTO tasks (project_id, title, notes, done, priority, due_date, created_at, updated_at)
		 VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
		input.ProjectID, input.Title, input.Notes, input.Priority, input.DueDate, ts, ts,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return &Task{
		ID: id, ProjectID: input.ProjectID, Title: input.Title, Notes: input.Notes,
		Done: false, Priority: input.Priority, DueDate: input.DueDate, CreatedAt: ts, UpdatedAt: ts,
	}, nil
}

func (a *App) UpdateTask(input TaskInput) (*Task, error) {
	if input.Title == "" {
		return nil, fmt.Errorf("task title is required")
	}
	ts := now()

	_, err := a.db.Exec(
		`UPDATE tasks SET project_id = ?, title = ?, notes = ?, priority = ?, due_date = ?, updated_at = ?
		 WHERE id = ?`,
		input.ProjectID, input.Title, input.Notes, input.Priority, input.DueDate, ts, input.ID,
	)
	if err != nil {
		return nil, err
	}
	return a.getTask(input.ID)
}

func (a *App) ToggleTaskDone(id int64) (*Task, error) {
	_, err := a.db.Exec(
		`UPDATE tasks SET done = 1 - done, updated_at = ? WHERE id = ?`,
		now(), id,
	)
	if err != nil {
		return nil, err
	}
	return a.getTask(id)
}

func (a *App) DeleteTask(id int64) error {
	_, err := a.db.Exec(`DELETE FROM tasks WHERE id = ?`, id)
	return err
}

func (a *App) getTask(id int64) (*Task, error) {
	var t Task
	var done int
	err := a.db.QueryRow(`
		SELECT id, project_id, title, notes, done, priority, due_date, created_at, updated_at
		FROM tasks WHERE id = ?
	`, id).Scan(&t.ID, &t.ProjectID, &t.Title, &t.Notes, &done, &t.Priority, &t.DueDate, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	t.Done = done != 0
	return &t, nil
}

// ---------- Notes ----------

func (a *App) ListNotes() ([]Note, error) {
	rows, err := a.db.Query(`
		SELECT id, project_id, title, content, created_at, updated_at
		FROM notes ORDER BY updated_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notes := []Note{}
	for rows.Next() {
		var n Note
		if err := rows.Scan(&n.ID, &n.ProjectID, &n.Title, &n.Content, &n.CreatedAt, &n.UpdatedAt); err != nil {
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
	err = a.db.QueryRow(`SELECT id, project_id, title, content, created_at, updated_at FROM notes WHERE id = ?`, input.ID).
		Scan(&n.ID, &n.ProjectID, &n.Title, &n.Content, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (a *App) DeleteNote(id int64) error {
	_, err := a.db.Exec(`DELETE FROM notes WHERE id = ?`, id)
	return err
}
