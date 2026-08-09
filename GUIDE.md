# Kairon User Guide

How to move around Kairon — every click, double-click, drag, and shortcut that the UI cares about.

---

## Quick map

| Gesture | Typical meaning |
| --- | --- |
| **Single click** | Select, navigate, open, toggle |
| **Double click** | Toggle done (board tasks) · open full add modal (empty column space) |
| **Drag & drop** | Move a task to another day or project (board only) |
| **Enter** | Submit composers / modals |
| **Click outside overlay** | Close modal or detail panel |
| **Hover** | Reveal ghost actions (edit / delete) |

Deletes always ask for confirmation first.

---

## Sidebar

| Action | Result |
| --- | --- |
| Click **Board / Calendar / Notes / All Tasks** | Switch main view |
| Click a **project** | Open that project’s page |
| Click a **tag chip** | Filter the project list; click again to clear |
| Click **+** next to Projects | New project modal |
| Hover a project → **pencil** | Edit name, color, tags |
| Hover a project → **X** | Delete project (confirm; its tasks move to Inbox) |
| Click **collapse / expand** chevrons | Narrow or widen the sidebar |
| Click **Theme** | Cycle System → Light → Dark → System |

Collapsed sidebar still shows icon navigation; project names hide until you expand again.

---

## Board

Week schedule (Mon–Sun) on top, project columns underneath.

### Schedule navigation

| Action | Result |
| --- | --- |
| **← / →** | Shift the 7-day window by **one day** |
| **This week** | Jump back to the current Monday–Sunday week (appears when you’ve moved away) |

### Tasks in a column

| Action | Result |
| --- | --- |
| **Single click** task row | Open task detail (delayed slightly so double-click can win) |
| **Double click** task row | Toggle done / not done |
| Click the **checkbox** | Toggle done immediately |
| Click **X** (on hover) | Delete task (confirm) |
| Type in **+ Add task** and press **Enter** | Create a task in that day/project with default priority |
| **Double click** empty space in a column | Open the full **New task** modal (pre-filled with that day or project) |

### Drag and drop

| Action | Result |
| --- | --- |
| Drag a task onto another **day** column | Reschedule to that date (order preserved via fractional sort) |
| Drag onto a **project** column | Move into that project |
| Drop **on a task** | Insert above that task |
| Drop on **empty column area** | Append to the end of that column |

Today’s column is highlighted. Project columns show due date + priority labels; day columns show a project color dot.

---

## Calendar

| Action | Result |
| --- | --- |
| **← / →** | Previous / next month |
| **Today** | Jump to the current month and select today |
| Click a **day cell** | Select that day; agenda updates on the right |
| Type in agenda composer + **Enter** | Add a task due on the selected date |
| Click task title / row body | Open task detail |
| Click checkbox | Toggle done |
| Click **X** | Delete (confirm) |
| Floating **+** (bottom-right) | Quick-add modal for any date / project / priority |

Day cells show up to three active task titles as pills (project color on the left edge). Overdue days tint the date number.

---

## Project page

| Action | Result |
| --- | --- |
| **Edit** | Edit project name, color, tags |
| **New task** | Full new-task modal (project pre-selected) |
| Composer + **Enter** | Quick add into this project |
| Filter chips (**All / Active / Overdue / Due Today / Completed**) | Narrow the list |
| Click task row body | Open detail |
| Click checkbox | Toggle done |
| Click **X** | Delete (confirm) |

Side panel shows completion % and priority breakdown for the current project only.

---

## All Tasks

| Action | Result |
| --- | --- |
| **Search** | Filter by title or notes text |
| **Sort** | Priority, due date, title, or newest |
| **Group** | By project, priority, status, or none |
| Filter chips | All, Active, Overdue, Due Today, No Date, High Priority, Completed |
| **Export CSV** | Writes a CSV via the backend; path shown in a toast (click toast to dismiss) |
| **New task** | Full new-task modal |
| Click row / checkbox / **X** | Same as elsewhere — detail, toggle, delete |

---

## Notes

| Action | Result |
| --- | --- |
| **New** | Create a note and focus the editor |
| Click a note in the rail | Select it |
| **Search** | Filter notes by title or content |
| Change **project** select | Attach / detach project (saves immediately) |
| **Preview / Edit** | Toggle Markdown preview vs source |
| **Save** | Explicit save |
| Blur title or body | Autosave on blur |
| **Trash** | Delete note (confirm) |

Footer shows word count. Notes linked from a task show a **From task** badge. Markdown supports GFM (tables, lists, code, images via `![alt](url)`).

---

## Task detail

Opened from a single click on a task (lists) or a single click on the board (after the double-click delay).

| Action | Result |
| --- | --- |
| Edit title / due date / priority / project | Fields update in the form |
| Blur title or notes | Autosave |
| **Preview / Edit** on notes | Markdown preview toggle |
| **Save** | Persist and keep the panel open |
| **Delete task** | Confirm, then remove (linked auto-notes removed too) |
| Click **X** or the dimmed overlay | Close without an extra prompt (unsaved field edits may already have blurred-saved) |

Task notes stay linked: content you write here is mirrored into a linked note when appropriate.

---

## Modals

### New / edit project

- Name (required), color (swatches, native picker, or hex), tags (comma-separated)
- Overlay click or **Cancel** closes without saving
- **Add project** / **Save changes** submits

### New task

- Title (required), due date, priority, project, notes
- Used from Board (double-click empty column), Project **New task**, All Tasks, etc.
- Overlay click or **Cancel** dismisses

### Confirm dialogs

Shown before deleting a **task**, **project**, or **note**.

- **Cancel** / overlay → abort
- **Delete** → proceed  
  Deleting a project moves its tasks to Inbox (no project).

---

## Composers & keyboard

| Where | Keys |
| --- | --- |
| Task composer (`Add a task and press Enter…`) | **Enter** submits; focus expands date / priority / project options |
| Board column `+ Add task` | **Enter** submits quick add |
| Modal forms | **Enter** submits (when focus is in a single-line field) |

There is no global command palette yet — navigation is sidebar + in-view controls.

---

## Feedback chrome

| Element | Behavior |
| --- | --- |
| **Error banner** | Shown on failed API calls; click to dismiss |
| **Toast** | Success feedback (e.g. CSV export path); auto-hides ~4s or click to dismiss |

---

## Themes & greeting

- Theme preference is stored in `localStorage` (`kairon.theme`)
- Sidebar collapse is stored in `localStorage` (`kairon.sidebarCollapsed`)
- Board greeting mark uses **inverted** art in dark mode and **normal** art in light mode

---

## Data location

Everything lives in local SQLite:

| OS | Path |
| --- | --- |
| Linux | `~/.config/planner/planner.db` |
| macOS | `~/Library/Application Support/planner/planner.db` |
| Windows | `%AppData%\planner\planner.db` |

No sync, no cloud, no accounts.

---

## Tips

1. On the **board**, prefer **double-click** to check things off so you don’t accidentally open detail.
2. **Drag** is the fastest way to reschedule a whole pile of tasks across the week.
3. Use **project tags** in the sidebar when you have many boards.
4. **Notes Preview** is great for screenshot polish; Edit when you’re drafting.
5. **Export CSV** from All Tasks if you need a backup outside SQLite.
