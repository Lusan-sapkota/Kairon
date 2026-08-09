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
	tags       TEXT NOT NULL DEFAULT '',
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
	sort_order REAL NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
	id         INTEGER PRIMARY KEY AUTOINCREMENT,
	project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
	task_id    INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
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

	if err := migrate(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("could not migrate schema: %w", err)
	}

	return db, nil
}

// hasColumn reports whether table has the given column, for databases created before it existed.
func hasColumn(db *sql.DB, table, column string) (bool, error) {
	rows, err := db.Query(fmt.Sprintf(`PRAGMA table_info(%s)`, table))
	if err != nil {
		return false, err
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name, colType string
		var notNull, pk int
		var dfltValue sql.NullString
		if err := rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk); err != nil {
			return false, err
		}
		if name == column {
			return true, nil
		}
	}
	return false, rows.Err()
}

// migrate applies incremental schema changes to databases created before a column existed.
func migrate(db *sql.DB) error {
	hasSortOrder, err := hasColumn(db, "tasks", "sort_order")
	if err != nil {
		return err
	}
	if !hasSortOrder {
		if _, err := db.Exec(`ALTER TABLE tasks ADD COLUMN sort_order REAL NOT NULL DEFAULT 0`); err != nil {
			return err
		}
		if _, err := db.Exec(`UPDATE tasks SET sort_order = id WHERE sort_order = 0`); err != nil {
			return err
		}
	}

	hasTaskID, err := hasColumn(db, "notes", "task_id")
	if err != nil {
		return err
	}
	if !hasTaskID {
		if _, err := db.Exec(`ALTER TABLE notes ADD COLUMN task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE`); err != nil {
			return err
		}
	}

	hasTags, err := hasColumn(db, "projects", "tags")
	if err != nil {
		return err
	}
	if !hasTags {
		if _, err := db.Exec(`ALTER TABLE projects ADD COLUMN tags TEXT NOT NULL DEFAULT ''`); err != nil {
			return err
		}
	}

	return nil
}
