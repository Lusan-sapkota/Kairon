package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS projects (
	id         INTEGER PRIMARY KEY AUTOINCREMENT,
	name       TEXT NOT NULL,
	color      TEXT NOT NULL DEFAULT '#6366f1',
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
	id         INTEGER PRIMARY KEY AUTOINCREMENT,
	project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
	title      TEXT NOT NULL,
	notes      TEXT NOT NULL DEFAULT '',
	done       INTEGER NOT NULL DEFAULT 0,
	priority   INTEGER NOT NULL DEFAULT 0,
	due_date   TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
	id         INTEGER PRIMARY KEY AUTOINCREMENT,
	project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
	title      TEXT NOT NULL,
	content    TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);
`

func openDB() (*sql.DB, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return nil, fmt.Errorf("could not resolve config dir: %w", err)
	}

	appDir := filepath.Join(configDir, "planner")
	if err := os.MkdirAll(appDir, 0o755); err != nil {
		return nil, fmt.Errorf("could not create app dir: %w", err)
	}

	dbPath := filepath.Join(appDir, "planner.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("could not open database: %w", err)
	}

	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("could not initialize schema: %w", err)
	}

	return db, nil
}
