Local-first desktop planner for **tasks, projects, calendar, and notes**.  
Built with [Wails](https://wails.io) (Go) + React + TypeScript. Data stays in SQLite on your machine — no accounts, no network.

## What’s new in this release

- **In-app updater** — checks GitHub Releases in the background, downloads the right asset for your install, and prompts you to restart (or open the `.deb` installer on Linux)
- **Update check frequency** — choose 24 hours, 48 hours, 7 days, 15 days, or 1 month in the sidebar
- **Design polish** — clearer frosted modals and dialogs in light and dark themes

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
- **All Tasks** — search, filters, stats
- **Notes** — Markdown edit & preview
- Hover tooltips, ghost edit/delete actions, local SQLite storage

## Docs

- Changelog: [CHANGELOG.md](https://github.com/Lusan-sapkota/Kairon/blob/main/CHANGELOG.md)
- User guide: [GUIDE.md](https://github.com/Lusan-sapkota/Kairon/blob/main/GUIDE.md)
- Screenshots & overview: [README](https://github.com/Lusan-sapkota/Kairon#readme)
