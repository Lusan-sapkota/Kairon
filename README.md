# Kairon

A simple, self-contained planner app — tasks, projects, a calendar, and notes in one lightweight desktop app. Built with [Wails](https://wails.io) (Go) and React + TypeScript, with a local SQLite database for storage.

## Features

- **Tasks** — quick add, due dates, priority levels, done/undone toggling
- **Projects** — group tasks and notes under color-coded projects
- **Calendar** — a month view showing tasks by due date, with a per-day task list
- **Notes** — freeform notes, optionally attached to a project

All data is stored locally in a SQLite file under your user config directory (no network access, no accounts).

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config
