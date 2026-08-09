# Contributing to Kairon

Thanks for your interest in improving Kairon! This is a small, local-first planner app, so the bar for contributing is low  bug reports, small fixes, and focused feature PRs are all welcome.

## Ways to contribute

- **Report a bug**  open an issue with steps to reproduce, what you expected, what happened instead, your OS, and the Kairon version (or commit hash) you're running.
- **Suggest a feature**  open an issue describing the problem it solves, not just the feature itself. Small, focused additions are easier to review than large ones.
- **Submit a fix or feature**  open a pull request (see below).
- **Improve docs**  the README, this file, or inline code comments are all fair game.

## Prerequisites

- [Go](https://go.dev/) 1.25 or newer
- [Node.js](https://nodejs.org/) 18 or newer (with npm)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation) v2.13 or newer  `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

## Getting set up

```bash
git clone git@github.com:Lusan-sapkota/Kairon.git
cd Kairon
wails dev
```

`wails dev` starts the Go backend and a Vite dev server with hot reload for the frontend. If you want to call Go methods directly from browser devtools, a dev server is also available at http://localhost:34115.

## Project structure

```
kairon/
├── main.go              # Wails app entrypoint / window config
├── app.go                # Exported Go methods (bound to the frontend)
├── db.go                 # SQLite connection, schema, migrations
├── models.go              # Task / Project / Note structs
└── frontend/
    ├── src/
    │   ├── App.tsx          # Top-level state and view routing
    │   ├── api.ts            # Typed wrapper around generated Wails bindings
    │   ├── types.ts           # Shared frontend types and helpers
    │   └── components/         # One component per view/widget
    └── wailsjs/               # Auto-generated Go↔TS bindings (do not hand-edit)
```

## Making changes

1. Create a branch off `main`: `git checkout -b feat/short-description`.
2. Keep PRs focused  one feature or fix per PR is much easier to review than a mixed bag.
3. Match the existing style:
   - Go: run `gofmt` before committing.
   - TypeScript/React: no Tailwind or CSS-in-JS  this project uses plain CSS with custom properties in `frontend/src/App.css`. Reuse existing classes and variables where you can.
   - Avoid adding new dependencies unless there's a clear need.
4. Write commit messages as `type: short description` (e.g. `fix: correct due-date sort order`, `feat: add note tagging`). Common types: `feat`, `fix`, `docs`, `refactor`, `chore`.

## Before submitting a PR

- `cd frontend && npx tsc --noEmit`  type-check the frontend.
- `wails build`  confirm the app still builds end-to-end.
- Actually run the app (`wails dev`) and click through the area you changed. UI changes should be checked in both light and dark theme.

## Pull requests

Describe *what* changed and *why* in the PR body. Screenshots or a short clip are appreciated for anything UI-visible. Link the issue it addresses, if any.

By submitting a contribution, you agree it will be licensed under the project's [MIT license](LICENSE).
