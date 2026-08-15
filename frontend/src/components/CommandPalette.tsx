import {useEffect, useMemo, useRef, useState} from 'react';
import {
    CalendarDays,
    History,
    LayoutGrid,
    ListChecks,
    NotebookPen,
    Plus,
    Search,
    Settings,
    StickyNote,
    FolderKanban,
    CheckSquare,
    BookOpen,
} from 'lucide-react';
import type {Note, Project, Task, View} from '../types';

type Props = {
    open: boolean;
    projects: Project[];
    tasks: Task[];
    notes: Note[];
    onClose: () => void;
    onNewTask: () => void;
    onQuickAdd: (title: string) => void;
    onNewNote: () => void;
    onSelectView: (view: View) => void;
    onSelectTask: (task: Task) => void;
};

type Item = {
    id: string;
    title: string;
    hint: string;
    icon: typeof Search;
    run: () => void;
};

function matches(hay: string, needle: string): boolean {
    return hay.toLowerCase().includes(needle);
}

export function CommandPalette({open, projects, tasks, notes, onClose, onNewTask, onQuickAdd, onNewNote, onSelectView, onSelectTask}: Props) {
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        setQuery('');
        setActive(0);
        const t = window.setTimeout(() => inputRef.current?.focus(), 20);
        return () => window.clearTimeout(t);
    }, [open]);

    const items = useMemo(() => {
        const term = query.trim().toLowerCase();
        const list: Item[] = [];

        if (term) {
            list.push({
                id: 'add-task',
                title: `Add task “${query.trim()}”`,
                hint: 'Create',
                icon: Plus,
                run: () => {},
            });
        } else {
            list.push(
                {id: 'new-task', title: 'New task', hint: 'Ctrl+N', icon: Plus, run: onNewTask},
                {id: 'new-note', title: 'New note', hint: 'Notes', icon: StickyNote, run: onNewNote},
            );
        }

        const destinations: Item[] = [
            {id: 'view-board', title: 'Board', hint: 'Go to', icon: LayoutGrid, run: () => onSelectView({kind: 'today'})},
            {id: 'view-cal', title: 'Calendar', hint: 'Go to', icon: CalendarDays, run: () => onSelectView({kind: 'upcoming'})},
            {id: 'view-notes', title: 'Notes', hint: 'Go to', icon: NotebookPen, run: () => onSelectView({kind: 'notes'})},
            {id: 'view-all', title: 'All Tasks', hint: 'Go to', icon: ListChecks, run: () => onSelectView({kind: 'all'})},
            {id: 'view-history', title: 'History', hint: 'Go to', icon: History, run: () => onSelectView({kind: 'history'})},
            {id: 'view-settings', title: 'Settings', hint: 'Go to', icon: Settings, run: () => onSelectView({kind: 'settings'})},
            {id: 'view-guide', title: 'Guide', hint: 'Settings', icon: BookOpen, run: () => onSelectView({kind: 'settings'})},
        ];
        for (const item of destinations) {
            if (!term || matches(item.title, term)) list.push(item);
        }

        for (const project of projects) {
            if (term && !matches(project.name, term) && !matches(project.tags, term)) continue;
            list.push({
                id: `project-${project.id}`,
                title: project.name,
                hint: 'Project',
                icon: FolderKanban,
                run: () => onSelectView({kind: 'project', projectId: project.id}),
            });
        }

        if (term) {
            for (const task of tasks) {
                if (!matches(task.title, term) && !matches(task.notes ?? '', term)) continue;
                list.push({
                    id: `task-${task.id}`,
                    title: task.title,
                    hint: task.done ? 'Done' : 'Task',
                    icon: CheckSquare,
                    run: () => onSelectTask(task),
                });
            }
            for (const note of notes) {
                if (!matches(note.title, term) && !matches(note.content, term)) continue;
                list.push({
                    id: `note-${note.id}`,
                    title: note.title || 'Untitled note',
                    hint: 'Note',
                    icon: NotebookPen,
                    run: () => onSelectView({kind: 'notes'}),
                });
            }
        }

        return list.slice(0, 40);
    }, [query, projects, tasks, notes, onNewNote, onNewTask, onSelectTask, onSelectView]);

    useEffect(() => {
        setActive(0);
    }, [query]);

    if (!open) return null;

    function run(index: number) {
        const item = items[index];
        if (!item) return;
        onClose();
        if (item.id === 'add-task') {
            onQuickAdd(query.trim());
            return;
        }
        item.run();
    }

    return (
        <div className="command-overlay" onClick={onClose}>
            <div className="command-palette" onClick={(e) => e.stopPropagation()}>
                <div className="command-search">
                    <Search size={16} />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Add a task, jump to a view, find a note…"
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setActive((i) => Math.min(items.length - 1, i + 1));
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setActive((i) => Math.max(0, i - 1));
                            } else if (e.key === 'Enter') {
                                e.preventDefault();
                                run(active);
                            }
                        }}
                    />
                    <kbd>esc</kbd>
                </div>
                <div className="command-list">
                    {items.length === 0 ? (
                        <p className="command-empty">Nothing matches.</p>
                    ) : (
                        items.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    type="button"
                                    key={item.id}
                                    className={`command-item ${index === active ? 'active' : ''}`}
                                    onMouseEnter={() => setActive(index)}
                                    onClick={() => run(index)}
                                >
                                    <Icon size={15} />
                                    <span>{item.title}</span>
                                    <em>{item.hint}</em>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
