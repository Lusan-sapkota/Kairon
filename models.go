package main

// Project groups tasks and notes together (e.g. "Work", "Personal").
type Project struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Color     string `json:"color"`
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
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}

// Note is a freeform note, optionally attached to a project.
type Note struct {
	ID        int64  `json:"id"`
	ProjectID *int64 `json:"projectId"`
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
}

// TaskInput is used to create or update a task.
type TaskInput struct {
	ID        int64   `json:"id"`
	ProjectID *int64  `json:"projectId"`
	Title     string  `json:"title"`
	Notes     string  `json:"notes"`
	Priority  int     `json:"priority"`
	DueDate   *string `json:"dueDate"`
}

// NoteInput is used to create or update a note.
type NoteInput struct {
	ID        int64  `json:"id"`
	ProjectID *int64 `json:"projectId"`
	Title     string `json:"title"`
	Content   string `json:"content"`
}
