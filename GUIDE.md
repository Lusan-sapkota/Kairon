# Kairon User Guide

How to move around Kairon — clicks, double-clicks, drags, hovers, tooltips, keyboard, and view-by-view behavior.

---

## Quick map

| Gesture | Typical meaning |
| --- | --- |
| **Single click** | Select, navigate, open detail, toggle |
| **Double click** | Toggle done (board tasks) · open full **New task** modal (empty column space) |
| **Drag & drop** | Move a task to another day or project (**Board** only) |
| **Hover** | Show tooltips · reveal ghost edit/delete buttons |
| **Enter** | Submit composers / modals |
| **Focus** (composer input) | Expand date / priority / project options |
| **Blur** | Autosave notes / task detail fields |
| **Click outside overlay** | Close modal or task detail |

Deletes always ask for confirmation first.

---

## Hover & tooltips

Kairon uses native browser tooltips (`title`) plus hover-revealed actions.

### Task detail tooltip

Hover the **task title / main row body** (lists and board) to see a tooltip built from:

1. Task title  
2. Due date (weekday + short date), with **(overdue)** when past due and not done  
3. Priority label when priority is Low / Medium / High  
4. Project name when the task belongs to a project  

Examples:

- `Review board redesign` alone (no due date, priority, or project)  
- `Ship onboarding polish` then `Due Fri, Aug 8 (overdue) · High priority · Kairon`

Shown on:

- **Board** — hover a task card  
- **Calendar agenda**, **Project**, **All Tasks** — hover the task title area (`TaskRow`)

### Other hover tooltips

| Where | Tooltip |
| --- | --- |
| Sidebar nav icons (esp. when collapsed) | Board, Calendar, Notes, All Tasks |
| Sidebar project row | Full project name |
| Sidebar pencil / X | Edit project / Delete project |
| Sidebar chevrons | Expand sidebar / Collapse sidebar |
| Theme control | `Theme: System\|Light\|Dark (click to change)` |
| Board ← / → | Previous day / Next day |
| Board empty column space | Double-click to add a task |
| Board / list delete (X) | Delete task |
| Calendar ← / → | Previous month / Next month |
| Calendar FAB (+) | Add a task for any date |
| Project **Edit** / **New task** | Edit project / Add task |
| Notes **New** / trash / Preview·Edit | New note / Delete note / mode tip |
| All Tasks **Export CSV** | Export all tasks as CSV |
| Color picker (project modal) | Pick a custom color |
| Checkbox | Accessible “Toggle done” label |

### Hover-revealed actions (“ghost” buttons)

These stay hidden until you hover the parent row:

| Location | Revealed controls |
| --- | --- |
| Sidebar project | Pencil (edit) · X (delete) |
| Task row (lists) | X (delete) |
| Board task | X (delete) |

---

## Sidebar

| Action | Result |
| --- | --- |
| Click **Board / Calendar / Notes / All Tasks** | Switch main view |
| Click a **project** | Open that project’s page |
| Click a **tag chip** | Filter projects to that tag; click again to clear |
| Click **+** next to Projects | New project modal |
| Hover project → **pencil** | Edit name, color, tags |
| Hover project → **X** | Delete project (confirm). Tasks in that project move to **Inbox** (no project) |
| Click **collapse / expand** | Narrow icon rail or full sidebar (remembered) |
| Click **Theme** | Cycle **System → Light → Dark → System** (remembered) |

When collapsed: labels hide; icon `title` tooltips still name each destination. Project list names hide until expanded.

Open-task count badge on **Board** shows how many tasks are not done.

---

## Board

Greeting (“Good morning/afternoon/evening/night, Chief”) depends on local time. Focus stats show **Today** (open), **Overdue**, and active **Projects**. Schedule is a fixed **Monday–Sunday** week that fills the width; project boards sit underneath.

### Schedule navigation

| Action | Result |
| --- | --- |
| **← / →** | Shift the 7-day window by **one day** |
| **This week** | Jump back to the current Mon–Sun week (only when you’ve moved away) |

Today’s column is highlighted. Each column header shows an **open-task count**.

### Tasks in a column

| Action | Result |
| --- | --- |
| **Hover** task | Tooltip with title · due · priority · project (see above) |
| **Single click** task | Open task detail (~200ms delay so double-click can win) |
| **Double click** task | Toggle done / not done (strikethrough when done) |
| Click **checkbox** | Toggle done immediately |
| Hover → **X** | Delete task (confirm) |
| Type in **+ Add task** + **Enter** | Quick-add with default (none) priority for that day/project |
| **Double click** empty column space | Full **New task** modal (day or project pre-filled) |

**Day columns** show a project color **dot**. **Project columns** show due date + priority text.

### Drag and drop

| Action | Result |
| --- | --- |
| Drag onto another **day** column | Reschedule to that date |
| Drag onto a **project** column | Move into that project |
| Drop **on a task** | Insert above that task |
| Drop on **empty column area** | Append to the end |

Order uses fractional indexing so neighbors don’t all reshuffle.

---

## Calendar

Full-bleed month grid + day agenda.

| Action | Result |
| --- | --- |
| **← / →** | Previous / next month |
| **Today** | Jump to current month and select today |
| Click a **day cell** | Select that day; agenda updates |
| Agenda composer + **Enter** | Add a task due on the selected date (focus expands options) |
| Hover task row | Detail tooltip |
| Click task body | Open detail |
| Click checkbox | Toggle done |
| Hover → **X** | Delete (confirm) |
| Floating **+** (bottom-right) | Quick-add modal (any date / project / priority / notes) |

### Month cell visuals

- Up to **three** active task titles as pills (project color on the left edge)  
- **+N more** when there are additional open tasks  
- **N done** when the day only has completed tasks  
- Overdue days tint the date number  
- Selected day uses an accent outline  

Toolbar subtitle summarizes the month: active · done · overdue.

---

## Project page

| Action | Result |
| --- | --- |
| **Edit** | Edit name, color, tags |
| **New task** | Full new-task modal (this project selected) |
| Composer + **Enter** | Quick add into this project; focus expands options |
| Filter chips | All · Active · Overdue · Due Today · Completed |
| Hover task | Detail tooltip |
| Click task body | Open detail |
| Checkbox / **X** | Toggle done / delete (confirm) |

Hero shows project mark, tags, and inline counts. Side panel: completion % and priority breakdown for **this project only**.

---

## All Tasks

| Action | Result |
| --- | --- |
| **Search** | Filter by title or notes (search updates are deferred for smoothness) |
| **Sort** | Priority · Due date · Title · Newest |
| **Group** | Project · Priority · Status · None |
| Filter chips | All · Active · Overdue · Due Today · No Date · High Priority · Completed |
| **Export CSV** | Backend writes a file; path appears in a toast |
| **New task** | Full new-task modal |
| Hover / click / checkbox / **X** | Tooltip · detail · toggle · delete |

Side panel: overall completion and priority breakdown across **all** tasks.

---

## Notes

| Action | Result |
| --- | --- |
| **New** | Create a note and focus the editor |
| Click a note in the rail | Select it |
| **Search** | Filter by title or content (deferred) |
| Change **project** select | Attach / detach; saves immediately |
| **Preview / Edit** | Markdown preview vs source |
| **Save** | Explicit save |
| Blur title or body | Autosave on blur |
| **Trash** | Delete note (confirm) |

Footer shows **word count**. Notes created from a task show a **From task** badge. Markdown (GFM): headings, lists, tables, code, blockquotes, images via `![alt](url)`.

---

## Task detail

Opened from a single click on a list row, or a single click on the board (after the double-click delay).

| Action | Result |
| --- | --- |
| Edit title / due date / priority / project | Form fields |
| Blur title or notes | Autosave |
| **Preview / Edit** on notes | Markdown preview toggle |
| **Save** | Persist; panel stays open |
| **Delete task** | Confirm, then remove (linked auto-notes removed) |
| **X** or dimmed overlay | Close (blur may already have saved) |

Task notes stay linked: content written here is mirrored into a linked note when appropriate.

---

## Modals

### New / edit project

- **Name** (required)  
- **Color** — swatches, native color picker, or hex  
- **Tags** — comma-separated (e.g. `work, urgent`)  
- Overlay / **Cancel** — discard  
- **Add project** / **Save changes** — submit  

### New task

- Title (required), due date, priority, project, notes  
- Opened from Board (double-click empty space), Project / All Tasks **New task**, etc.  
- Overlay / **Cancel** dismisses  

### Calendar floating quick-add

Same fields as new task; FAB title: “Add a task for any date”. Opening resets the form and seeds the currently selected calendar date.

### Confirm dialogs

Before deleting a **task**, **project**, or **note**:

- **Cancel** / overlay → abort  
- **Delete** → proceed  

---

## Composers & keyboard

| Where | Behavior |
| --- | --- |
| `Add a task and press Enter…` | **Enter** submits. **Focus** expands date / priority / project row |
| Board `+ Add task` | **Enter** submits quick add |
| Modal single-line fields | **Enter** submits the form |

No global command palette — navigation is sidebar + in-view controls.

---

## Visual language (at a glance)

| Cue | Meaning |
| --- | --- |
| Green checkbox / strikethrough | Done |
| Red / danger chips & overdue tint | Past due and still open |
| Priority color (text or dot) | None / Low / Medium / High |
| Project color dot or chip | Which project owns the task |
| Accent outline / glow | Selected day or today column |

---

## Feedback chrome

| Element | Behavior |
| --- | --- |
| **Error banner** | Failed API call; click to dismiss |
| **Toast** | Success (e.g. CSV path); auto-hides ~4s or click to dismiss |

---

## Themes & greeting

| Preference | Storage |
| --- | --- |
| Theme (system / light / dark) | `localStorage` → `kairon.theme` |
| Sidebar collapsed | `localStorage` → `kairon.sidebarCollapsed` |

Board greeting art: **inverted** mark in dark mode, **normal** mark in light mode.

---

## Data location

Everything lives in local SQLite — no sync, no cloud, no accounts:

| OS | Path |
| --- | --- |
| Linux | `~/.config/planner/planner.db` |
| macOS | `~/Library/Application Support/planner/planner.db` |
| Windows | `%AppData%\planner\planner.db` |

---

## Tips

1. On the **board**, **double-click** to complete tasks so you don’t open detail by accident; use the checkbox for an instant toggle.  
2. **Hover** a task anytime you want due / priority / project without opening it.  
3. **Drag** across the week to reschedule in bulk.  
4. **Tag chips** in the sidebar tame a long project list.  
5. Composer **focus** (not only Enter) unlocks date and priority without opening a modal.  
6. **Export CSV** from All Tasks for a backup outside SQLite.  
7. Notes **Preview** for reading; **Edit** while drafting — blur autosaves.
