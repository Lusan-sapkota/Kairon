# Changelog

All notable changes to Kairon are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.1]: https://github.com/Lusan-sapkota/Kairon/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Lusan-sapkota/Kairon/releases/tag/v1.0.0
