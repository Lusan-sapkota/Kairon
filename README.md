<p align="center">
  <img src="frontend/src/assets/images/kairon-transparent.png" alt="Kairon logo" width="120" />
</p>

<h1 align="center">Kairon</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="GUIDE.md"><img src="https://img.shields.io/badge/docs-user%20guide-orange.svg" alt="User Guide" /></a>
</p>

<p align="center">
  A calm, self-contained planner — tasks, projects, a calendar, and notes in one lightweight desktop app.<br />
  Built with <a href="https://wails.io">Wails</a> (Go) and React + TypeScript. Local SQLite. No accounts. No network.
</p>

## Screenshots

<table>
  <tr>
    <td colspan="2" align="center">
      <img src="screenshots/board.png" alt="Board view" width="100%" /><br />
      <em>Board — week schedule + project columns</em>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="screenshots/calendar.png" alt="Calendar view" width="100%" /><br />
      <em>Calendar — month grid + day agenda</em>
    </td>
    <td align="center" width="50%">
      <img src="screenshots/projects.png" alt="Project view" width="100%" /><br />
      <em>Project — full-width tasks + progress</em>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="screenshots/all-tasks.png" alt="All Tasks view" width="100%" /><br />
      <em>All Tasks — search, filters, stats</em>
    </td>
    <td align="center" width="50%">
      <img src="screenshots/notes.png" alt="Notes view" width="100%" /><br />
      <em>Notes — search, Markdown edit &amp; preview</em>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="screenshots/add-task.png" alt="Add task modal" width="100%" /><br />
      <em>New task modal</em>
    </td>
    <td align="center" width="50%">
      <img src="screenshots/add-project.png" alt="Add project modal" width="100%" /><br />
      <em>New / edit project modal</em>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="screenshots/view-details.png" alt="Task detail" width="100%" /><br />
      <em>Task detail — fields, Markdown notes, save</em>
    </td>
  </tr>
</table>

For clicks, drags, shortcuts, and view-by-view behavior, see **[GUIDE.md](GUIDE.md)**.

## Features

- **Board** — Monday–Sunday schedule that fills the viewport; drag tasks between days or projects; left/right shifts one day at a time
- **Calendar** — Full-bleed month grid with task pills in each cell and a day agenda with quick add
- **All tasks** — Searchable, filterable list with grouping, sort, side stats, and CSV export
- **Projects** — Color-coded projects with tags, edit name/color/tags, progress meters, and filters
- **Notes** — Freeform Markdown notes (edit/preview), optional project link; notes stay in sync when you write task notes
- **Quick add** — Floating button (calendar) and composers everywhere for fast capture
- **Priorities & due dates** — None / low / medium / high, overdue and due-today highlighting
- **Themes** — Light, dark, or system, remembered across launches

All data stays on your machine (see [Data storage](#data-storage)).

## Tech stack

- **Backend**: Go + [Wails v2](https://wails.io), [`modernc.org/sqlite`](https://pkg.go.dev/modernc.org/sqlite) (pure Go SQLite, no CGO)
- **Frontend**: React 19 + TypeScript, Vite
- **Notes**: `react-markdown` + `remark-gfm`
- **Icons**: `lucide-react`

## Data storage

Kairon stores everything in a single SQLite file at `planner.db` inside your OS user config directory:

- Linux: `~/.config/planner/planner.db`
- macOS: `~/Library/Application Support/planner/planner.db`
- Windows: `%AppData%\planner\planner.db`

Schema migrations run automatically on startup.

## Live Development

```bash
wails dev
```

This runs the Go backend and a Vite dev server with hot reload. A browser-accessible Go bridge is also available at http://localhost:34115.

## Building

```bash
wails build
```

Configure the project in `wails.json` — see the [Wails project config docs](https://wails.io/docs/reference/project-config).

## Docs

| Doc | What it’s for |
| --- | --- |
| [GUIDE.md](GUIDE.md) | User guide — gestures, views, tips |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Dev setup, layout, PR guidelines |

## Contributing

Bug reports, feature suggestions, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Kairon is licensed under the [MIT License](LICENSE).
