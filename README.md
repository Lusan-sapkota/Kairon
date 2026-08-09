<p align="center">
  <img src="frontend/src/assets/images/kairon-transparent.png" alt="Kairon logo" width="120" />
</p>

<h1 align="center">Kairon</h1>

<p align="center">
  <strong>v1.0.0</strong> — local-first desktop planner<br />
  Tasks · Projects · Calendar · Notes
</p>

<p align="center">
  <a href="https://github.com/Lusan-sapkota/Kairon/releases/latest"><img src="https://img.shields.io/badge/release-v1.0.0-ff8552.svg" alt="v1.0.0" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="GUIDE.md"><img src="https://img.shields.io/badge/docs-user%20guide-orange.svg" alt="User Guide" /></a>
  <a href="https://wails.io"><img src="https://img.shields.io/badge/built%20with-Wails-red.svg" alt="Wails" /></a>
</p>

<p align="center">
  A calm, self-contained planner for your desktop.<br />
  Built with <a href="https://wails.io">Wails</a> (Go) + React + TypeScript. SQLite on disk. No accounts. No network.
</p>

## Download

Get the packaged app from GitHub Releases — no need to build from source.

1. Open **[Releases](https://github.com/Lusan-sapkota/Kairon/releases)** (or jump to **[v1.0.0](https://github.com/Lusan-sapkota/Kairon/releases/tag/v1.0.0)**).
2. Under **Assets**, download the application bundle for your OS.
3. Unpack or install if needed, then run **Kairon**.

Your data stays local in SQLite (see [Data storage](#data-storage)). For clicks, drag-and-drop, and hover tooltips, see **[GUIDE.md](GUIDE.md)**.

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

## What’s in v1.0.0

- **Board** — Monday–Sunday schedule at full width; drag tasks across days or projects; ←/→ moves one day
- **Calendar** — Month grid with task pills + day agenda and floating quick-add
- **All tasks** — Search, filters, grouping, sort, side stats, CSV export
- **Projects** — Color + tags, edit name/color/tags, progress and priority breakdown
- **Notes** — Markdown edit/preview, project link, autosave on blur
- **Polish** — Light / dark / system themes, task hover tooltips, confirm-before-delete

## Features (summary)

| Area | Highlights |
| --- | --- |
| Capture | Composers, quick-add modal, board column `+ Add task` |
| Organize | Projects, tags, priorities, due dates |
| Plan | Week board + month calendar |
| Write | Markdown notes synced with task notes |
| Privacy | 100% local SQLite — no accounts, no sync |

## Data storage

Everything lives in `planner.db` under your OS config directory:

| OS | Path |
| --- | --- |
| Linux | `~/.config/planner/planner.db` |
| macOS | `~/Library/Application Support/planner/planner.db` |
| Windows | `%AppData%\planner\planner.db` |

Schema migrations run automatically on startup.

## Docs

| Doc | Purpose |
| --- | --- |
| [GUIDE.md](GUIDE.md) | User guide — gestures, views, tooltips, tips |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Dev setup, layout, PR guidelines |
| [LICENSE](LICENSE) | MIT |

## Contributing

Bug reports, ideas, and PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 Lusan Sapkota
