<p align="center">
  <img src="frontend/src/assets/images/kairon-transparent.png" alt="Kairon logo" width="120" />
</p>

<h1 align="center">Kairon</h1>

<p align="center">
  <strong>v1.0.0</strong> — local-first desktop planner<br />
  Tasks · Projects · Calendar · Notes
</p>

<p align="center">
  <a href="https://github.com/Lusan-sapkota/Kairon/releases/tag/v1.0.0"><img src="https://img.shields.io/badge/release-v1.0.0-ff8552.svg" alt="v1.0.0" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="GUIDE.md"><img src="https://img.shields.io/badge/docs-user%20guide-orange.svg" alt="User Guide" /></a>
  <a href="https://wails.io"><img src="https://img.shields.io/badge/built%20with-Wails-red.svg" alt="Wails" /></a>
</p>

<p align="center">
  A calm, self-contained planner for your desktop.<br />
  Built with <a href="https://wails.io">Wails</a> (Go) + React + TypeScript. SQLite on disk. No accounts. No network.
</p>

## Download

Grab the **v1.0.0** application package from GitHub Releases:

**[→ Releases · v1.0.0](https://github.com/Lusan-sapkota/Kairon/releases/tag/v1.0.0)**

| Platform | Artifact (typical) |
| --- | --- |
| Linux | `kairon` binary (or packaged build from `wails build`) |
| Windows | `.exe` / NSIS installer when built with Windows targets |
| macOS | `.app` / package when built on Darwin |

After install, launch Kairon like any desktop app. Your data stays in the local SQLite file (see [Data storage](#data-storage)).

> Building from source? See [Building](#building) below.

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

Interactions (click, double-click, drag, hover tooltips): **[GUIDE.md](GUIDE.md)**.

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

## Requirements

**To run a release build:** a supported desktop OS (Linux / Windows / macOS depending on the artifact you download).

**To build from source:**

- [Go](https://go.dev/) 1.25+
- [Node.js](https://nodejs.org/) 18+ (npm)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation) v2.13+

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

## Data storage

Everything lives in `planner.db` under your OS config directory:

| OS | Path |
| --- | --- |
| Linux | `~/.config/planner/planner.db` |
| macOS | `~/Library/Application Support/planner/planner.db` |
| Windows | `%AppData%\planner\planner.db` |

Schema migrations run automatically on startup.

## Live development

```bash
git clone git@github.com:Lusan-sapkota/Kairon.git
cd Kairon
wails dev
```

Hot-reloads the frontend. Go bridge also available at http://localhost:34115 for browser-side debugging.

## Building

Production package (current platform):

```bash
wails build
```

Binary lands in `build/bin/` (e.g. `kairon` on Linux). Product metadata for installers is set in `wails.json` (`Info.productVersion` = **1.0.0**).

Cross-platform / installer options depend on your host OS and Wails setup — see the [Wails build docs](https://wails.io/docs/reference/cli#build) and [project config](https://wails.io/docs/reference/project-config).

### Release checklist (maintainers)

1. Confirm `wails.json` → `Info.productVersion` is `1.0.0`
2. `wails build` on each target you ship
3. Commit release notes / README
4. Tag: `git tag -a v1.0.0 -m "Kairon v1.0.0"`
5. Push tag: `git push origin v1.0.0`
6. Create a GitHub Release and attach `build/bin` artifacts

## Tech stack

- **Backend:** Go + [Wails v2](https://wails.io), [`modernc.org/sqlite`](https://pkg.go.dev/modernc.org/sqlite) (no CGO)
- **Frontend:** React 19 + TypeScript + Vite
- **Notes:** `react-markdown` + `remark-gfm`
- **Icons:** `lucide-react`

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
