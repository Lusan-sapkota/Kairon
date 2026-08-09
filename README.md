<p align="center">
  <img src="frontend/src/assets/images/kairon-transparent.png" alt="Kairon logo" width="120" />
</p>

<h1 align="center">Kairon</h1>

A simple, self-contained planner app — tasks, projects, a calendar, and notes in one lightweight desktop app. Built with [Wails](https://wails.io) (Go) and React + TypeScript, with a local SQLite database for storage. No network access, no accounts — everything stays on your machine.

## Features

- **Today board** — a kanban-style view of today's tasks with drag-and-drop to reschedule or reassign to a project
- **Upcoming** — a month calendar view showing tasks by due date, with a per-day task list and drag-and-drop rescheduling
- **All tasks** — a flat, filterable list of every task, with one-click CSV export
- **Projects** — group tasks and notes under color-coded projects, with comma-separated tags for quick filtering in the sidebar
- **Notes** — freeform notes, optionally attached to a project, with:
  - Live Markdown rendering (headings, lists, tables, code blocks, blockquotes — via `react-markdown` + `remark-gfm`) toggled with an edit/preview button
  - Inline image rendering, from standard `![alt](url)` Markdown syntax or pasted `<Image src="…" alt="…" caption="…" />` tags (auto-converted to Markdown with the caption shown underneath)
  - Notes are automatically created/kept in sync when you add notes to a task, and stay linked back to that task
- **Quick add** — a floating quick-add button for capturing a task (with due date, priority, project) from anywhere without breaking your flow
- **Priorities & due dates** — none/low/medium/high priority levels, optional due dates, overdue/due-today highlighting
- **Themes** — light, dark, or system, remembered across launches

All data is stored locally in a SQLite file under your user config directory (see [Data storage](#data-storage)).

## Tech stack

- **Backend**: Go + [Wails v2](https://wails.io), [`modernc.org/sqlite`](https://pkg.go.dev/modernc.org/sqlite) (pure Go SQLite driver, no CGO required)
- **Frontend**: React 19 + TypeScript, bundled with Vite
- **Notes rendering**: `react-markdown` + `remark-gfm`
- **Icons**: `lucide-react`

## Data storage

Kairon stores everything in a single SQLite file at `planner.db` inside your OS user config directory, e.g.:

- Linux: `~/.config/planner/planner.db`
- macOS: `~/Library/Application Support/planner/planner.db`
- Windows: `%AppData%\planner\planner.db`

Schema migrations run automatically on startup, so upgrading Kairon won't require any manual database changes.

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config
