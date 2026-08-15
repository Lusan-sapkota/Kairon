Local-first desktop planner for **tasks, projects, calendar, and notes**.
Built with [Wails](https://wails.io) (Go) + React + TypeScript. Data stays in SQLite on your machine — no accounts, no network.

Made by [Lusan Sapkota](https://lusansapkota.com.np).

## What’s new

- **Guide** — Settings → Guide has the full handbook (also [GUIDE.md](https://github.com/Lusan-sapkota/Kairon/blob/main/GUIDE.md))
- **Notifications** — in-app inbox, History page, optional desktop toasts
- **Email reports** — SMTP + queued daily / weekly / due digests
- **Backup & restore** — copy or replace `planner.db` from Settings → Data
- **Location & wipe** — config folder and database paths (Copy / Open); wipe database, config, or both, then restart
- **Recurring tasks** — daily / weekly / monthly on complete
- **Command palette** — Ctrl/Cmd+K to capture or jump

Full notes: [CHANGELOG.md](https://github.com/Lusan-sapkota/Kairon/blob/main/CHANGELOG.md)

## Install

| Platform | Asset | Steps |
|----------|--------|--------|
| **Linux** (Debian / Ubuntu 22.04+) | `kairon_*_amd64.deb` | `sudo apt install ./kairon_*_amd64.deb` — then open **Kairon** from the app menu |
| **Linux** (portable) | `kairon-linux-amd64` | `chmod +x kairon-linux-amd64 && ./kairon-linux-amd64` |
| **Windows** | `kairon-windows-amd64.exe` | Download and run |
| **macOS** | `kairon-darwin-universal.zip` | Unzip and open the `.app` |

Linux builds need **GTK3** and **WebKitGTK 4.1** (`libgtk-3-0`, `libwebkit2gtk-4.1-0`). The `.deb` pulls those in automatically.

## Features

- **Board** — week schedule, project columns, drag-and-drop
- **Calendar** — month grid + day agenda
- **Projects** — full-width task lists, progress, edit project details
- **All Tasks** — search, filters, stats, CSV export
- **Notes** — Markdown edit & preview
- **Command palette** — Ctrl/Cmd+K (jump / capture), Ctrl/Cmd+N (new task)
- **Repeat** — daily / weekly / monthly tasks
- **Notifications** — in-app + optional desktop; History archive
- **Email** — SMTP reports and reminders with an offline queue
- **Data** — backup / restore / wipe, local SQLite only
- **Updates** — GitHub Releases checker in Settings
- Hover tooltips, ghost edit/delete actions, light / dark / system theme

## Docs

- Changelog: [CHANGELOG.md](https://github.com/Lusan-sapkota/Kairon/blob/main/CHANGELOG.md)
- User guide: [GUIDE.md](https://github.com/Lusan-sapkota/Kairon/blob/main/GUIDE.md) (also in the app: **Settings → Guide**)
- Overview: [README](https://github.com/Lusan-sapkota/Kairon#readme)
