package main

// Project groups tasks and notes together (e.g. "Work", "Personal").
// Tags is a comma-separated list (e.g. "work,urgent") used to filter the project list.
type Project struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Color     string `json:"color"`
	Tags      string `json:"tags"`
	CreatedAt string `json:"createdAt"`
}

// Task is a single to-do item, optionally attached to a project.
type Task struct {
	ID        int64   `json:"id"`
	ProjectID *int64  `json:"projectId"`
	Title     string  `json:"title"`
	Notes     string  `json:"notes"`
	Done      bool    `json:"done"`
	Priority  int     `json:"priority"` // 0 none, 1 low, 2 medium, 3 high
	DueDate   *string `json:"dueDate"`  // "YYYY-MM-DD"
	SortOrder float64 `json:"sortOrder"`
	Repeat    string  `json:"repeat"` // "", "daily", "weekly", "monthly"
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}

// Note is a freeform note, optionally attached to a project. A note created automatically
// from a task's notes field carries TaskID, linking it back to that task.
type Note struct {
	ID        int64  `json:"id"`
	ProjectID *int64 `json:"projectId"`
	TaskID    *int64 `json:"taskId"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// ProjectInput is used to create or update a project.
type ProjectInput struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
	Tags  string `json:"tags"`
}

// TaskInput is used to create or update a task.
type TaskInput struct {
	ID        int64   `json:"id"`
	ProjectID *int64  `json:"projectId"`
	Title     string  `json:"title"`
	Notes     string  `json:"notes"`
	Priority  int     `json:"priority"`
	DueDate   *string `json:"dueDate"`
	Repeat    string  `json:"repeat"`
}

// NoteInput is used to create or update a note.
type NoteInput struct {
	ID        int64  `json:"id"`
	ProjectID *int64 `json:"projectId"`
	Title     string `json:"title"`
	Content   string `json:"content"`
}

// DataLocations is the on-disk config folder and SQLite file Kairon uses on this machine.
type DataLocations struct {
	ConfigDir string `json:"configDir"`
	Database  string `json:"database"`
}
