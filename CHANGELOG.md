# Changelog

All notable changes to Kairon are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-08-15

### Added

- **Guide** — full handbook in Settings (same as `GUIDE.md`), with section jump chips
- **Command palette** — `Ctrl/Cmd+K` to capture or jump; `Ctrl/Cmd+N` for a new task
- **Recurring tasks** — daily / weekly / monthly; the next copy opens when you complete one
- **Notifications** — in-app inbox, History page, optional desktop toasts
- **Email** — SMTP daily / weekly / due reports with an offline queue
- **Backup & restore** — copy or replace `planner.db` from Settings → Data
- **Location & wipe** — shows the config folder and database path; Copy / Copied; Open the folder; wipe database, config, or both (confirms twice, then requires restart)
- Settings GitHub link to the public repository
- Vision and About in the Guide

### Changed

- Settings uses a two-pane layout (rail + panel): Guide, Updates, Notifications, Email, Mail queue, Data

## [1.0.1] — 2026-08-10

### Added

- In-app updater — silently checks GitHub Releases, downloads updates in the background, and shows a banner when ready
- Configurable check interval (24h / 48h / 7d / 15d / 1 month) plus a manual check from the sidebar

### Changed

- A few design polish pass on modals, dialogs, and frosted-glass overlays (light & dark)

## [1.0.0] — 2026-08-09

First public release.

### Added

- **Board** — week schedule, project columns, drag-and-drop between days/projects
- **Calendar** — month grid with day agenda
- **Projects** — full-width task lists, progress, edit name/color/tags
- **All Tasks** — search, filters, completion stats, CSV export
- **Notes** — Markdown edit and preview (GFM)
- Hover tooltips on tasks (title, due date, priority, project)
- Ghost edit/delete controls on hover
- Confirm dialogs before destructive actions
- Light / dark / system theme
- Collapsible sidebar with project tags filter
- Local SQLite storage under the user config directory (`planner/planner.db`)
- GitHub Actions release workflow for Linux, Windows, and macOS
- Linux `.deb` packaging via nfpm (installs binary, desktop entry, icon)
- Portable Linux binary, Windows `.exe`, and macOS universal `.app` zip
- User guide ([GUIDE.md](GUIDE.md)), contributing guide, MIT license

### Fixed

- Window resize / refit lag and cramped project modal layouts
- Cross-platform release builds (relative `wails.json` paths; Linux-only `webkit2_41` tag)

[1.1.0]: https://github.com/Lusan-sapkota/Kairon/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/Lusan-sapkota/Kairon/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Lusan-sapkota/Kairon/releases/tag/v1.0.0
