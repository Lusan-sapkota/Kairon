import {useEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {ChevronLeft, ChevronRight, Check, X} from 'lucide-react';
import type {Project, Task} from '../types';
import {greeting, priorityColor, todayISO} from '../types';
import {NewTaskModal} from './NewTaskModal';

type Props = {
    tasks: Task[];
    projects: Project[];
    onAddTask: (input: {title: string; notes?: string; dueDate?: string; priority: number; projectId?: number}) => void;
    onToggleTask: (id: number) => void;
    onSelectTask: (task: Task) => void;
    onDeleteTask: (id: number) => void;
    onMoveTaskDate: (id: number, dueDate: string | undefined, sortOrder: number) => void;
    onMoveTaskProject: (id: number, projectId: number | undefined, sortOrder: number) => void;
};

function toISO(d: Date): string {
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function useColumnCount(minColumnWidth: number, fallback: number) {
    const ref = useRef<HTMLDivElement>(null);
    const [count, setCount] = useState(fallback);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => setCount(Math.max(3, Math.floor(el.clientWidth / minColumnWidth)));
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [minColumnWidth]);

    return [ref, count] as const;
}

// Fractional indexing: dropping before `beforeId` slots the card between its new neighbors
// without touching every other card's order. `null` means "drop at the end of the column".
function computeSortOrder(columnTasks: Task[], beforeId: number | null, draggedId: number): number {
    const list = columnTasks.filter((t) => t.id !== draggedId);
    if (list.length === 0) return 1;
    if (beforeId === null) {
        return list[list.length - 1].sortOrder + 1;
    }
    const idx = list.findIndex((t) => t.id === beforeId);
    if (idx === -1) return list[list.length - 1].sortOrder + 1;
    const before = list[idx];
    const prev = list[idx - 1];
    return prev ? (prev.sortOrder + before.sortOrder) / 2 : before.sortOrder - 1;
}

export function BoardView({
    tasks,
    projects,
    onAddTask,
    onToggleTask,
    onSelectTask,
    onDeleteTask,
    onMoveTaskDate,
    onMoveTaskProject,
}: Props) {
    const [dayOffset, setDayOffset] = useState(0);
    const [containerRef, dayCount] = useColumnCount(220, 5);
    const [addModalContext, setAddModalContext] = useState<{dueDate?: string; projectId?: number} | null>(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({length: dayCount}, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + dayOffset + i);
        return d;
    });

    const tasksByDate = new Map<string, Task[]>();
    for (const t of tasks) {
        if (!t.dueDate) continue;
        if (!tasksByDate.has(t.dueDate)) tasksByDate.set(t.dueDate, []);
        tasksByDate.get(t.dueDate)!.push(t);
    }
    for (const list of tasksByDate.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);

    const projectById = new Map(projects.map((p) => [p.id, p]));
    const isCurrentWindow = dayOffset === 0;

    return (
        <div className="board">
            <div className="board-section">
                <div className="board-section-header">
                    <h2 className="view-title">{greeting()}, Chief</h2>
                    <div className="board-nav-group">
                        <button className="icon-btn" onClick={() => setDayOffset((o) => o - dayCount)} title="Previous days">
                            <ChevronLeft size={16} />
                        </button>
                        {!isCurrentWindow && (
                            <button className="btn-sm btn" onClick={() => setDayOffset(0)}>
                                Today
                            </button>
                        )}
                        <button className="icon-btn" onClick={() => setDayOffset((o) => o + dayCount)} title="Next days">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
                <div className="board-row board-row-days" ref={containerRef}>
                    {days.map((d) => {
                        const iso = toISO(d);
                        const dayTasks = tasksByDate.get(iso) ?? [];
                        return (
                            <BoardColumn
                                key={iso}
                                title={d.toLocaleDateString(undefined, {weekday: 'long'})}
                                subtitle={d.toLocaleDateString(undefined, {month: 'long', day: 'numeric'})}
                                highlighted={iso === todayISO()}
                                tasks={dayTasks}
                                projectById={projectById}
                                showProjectDot
                                onQuickAdd={(title) => onAddTask({title, dueDate: iso, priority: 0})}
                                onOpenAddModal={() => setAddModalContext({dueDate: iso})}
                                onToggle={onToggleTask}
                                onSelect={onSelectTask}
                                onDelete={onDeleteTask}
                                onDropTask={(draggedId, beforeId) => {
                                    const sortOrder = computeSortOrder(dayTasks, beforeId, draggedId);
                                    onMoveTaskDate(draggedId, iso, sortOrder);
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {projects.length > 0 && (
                <div className="board-section board-section-projects">
                    <div className="board-section-header">
                        <h3 className="board-subheading">Projects</h3>
                    </div>
                    <div className="board-row board-row-projects">
                        {projects.map((p) => {
                            const projectTasks = tasks
                                .filter((t) => t.projectId === p.id)
                                .sort((a, b) => a.sortOrder - b.sortOrder);
                            return (
                                <BoardColumn
                                    key={p.id}
                                    title={p.name}
                                    accentColor={p.color}
                                    tasks={projectTasks}
                                    projectById={projectById}
                                    onQuickAdd={(title) => onAddTask({title, priority: 0, projectId: p.id})}
                                    onOpenAddModal={() => setAddModalContext({projectId: p.id})}
                                    onToggle={onToggleTask}
                                    onSelect={onSelectTask}
                                    onDelete={onDeleteTask}
                                    onDropTask={(draggedId, beforeId) => {
                                        const sortOrder = computeSortOrder(projectTasks, beforeId, draggedId);
                                        onMoveTaskProject(draggedId, p.id, sortOrder);
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {addModalContext && (
                <NewTaskModal
                    projects={projects}
                    initialDueDate={addModalContext.dueDate}
                    initialProjectId={addModalContext.projectId}
                    onClose={() => setAddModalContext(null)}
                    onCreate={(input) => {
                        onAddTask(input);
                        setAddModalContext(null);
                    }}
                />
            )}
        </div>
    );
}

type ColumnProps = {
    title: string;
    subtitle?: string;
    accentColor?: string;
    highlighted?: boolean;
    tasks: Task[];
    projectById: Map<number, Project>;
    showProjectDot?: boolean;
    onQuickAdd: (title: string) => void;
    onOpenAddModal: () => void;
    onToggle: (id: number) => void;
    onSelect: (task: Task) => void;
    onDelete: (id: number) => void;
    onDropTask: (draggedId: number, beforeId: number | null) => void;
};

function BoardColumn({
    title,
    subtitle,
    accentColor,
    highlighted,
    tasks,
    projectById,
    showProjectDot,
    onQuickAdd,
    onOpenAddModal,
    onToggle,
    onSelect,
    onDelete,
    onDropTask,
}: ColumnProps) {
    const [draft, setDraft] = useState('');
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const [columnDragOver, setColumnDragOver] = useState(false);
    const clickTimer = useRef<number | null>(null);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!draft.trim()) return;
        onQuickAdd(draft.trim());
        setDraft('');
    }

    function handleTaskClick(t: Task) {
        if (clickTimer.current !== null) {
            window.clearTimeout(clickTimer.current);
            clickTimer.current = null;
            return;
        }
        clickTimer.current = window.setTimeout(() => {
            onSelect(t);
            clickTimer.current = null;
        }, 200);
    }

    function handleTaskDoubleClick(t: Task) {
        if (clickTimer.current !== null) {
            window.clearTimeout(clickTimer.current);
            clickTimer.current = null;
        }
        onToggle(t.id);
    }

    function readDraggedId(e: React.DragEvent): number | null {
        const raw = e.dataTransfer.getData('text/plain');
        const id = Number(raw);
        return raw && !Number.isNaN(id) ? id : null;
    }

    return (
        <div
            className={`board-column ${highlighted ? 'board-column-today' : ''} ${columnDragOver ? 'board-column-drag-over' : ''}`}
            style={accentColor ? ({'--tile-accent': accentColor} as CSSProperties) : undefined}
            onDragOver={(e) => {
                e.preventDefault();
                setColumnDragOver(true);
            }}
            onDragLeave={(e) => {
                if (e.target === e.currentTarget) setColumnDragOver(false);
            }}
            onDrop={(e) => {
                e.preventDefault();
                setColumnDragOver(false);
                const draggedId = readDraggedId(e);
                if (draggedId !== null) onDropTask(draggedId, null);
            }}
        >
            <div className="board-column-header">
                {accentColor && <span className="dot" style={{background: accentColor}} />}
                <div className="board-column-heading">
                    <span className="board-column-title">{title}</span>
                    {subtitle && <span className="board-column-subtitle">{subtitle}</span>}
                </div>
            </div>

            <div className="board-column-tasks">
                {tasks.map((t) => {
                    const project = t.projectId ? projectById.get(t.projectId) : undefined;
                    return (
                        <div
                            key={t.id}
                            draggable
                            className={`board-task ${t.done ? 'board-task-done' : ''} ${
                                dragOverId === t.id ? 'board-task-drag-over' : ''
                            }`}
                            onDragStart={(e) => {
                                e.stopPropagation();
                                e.dataTransfer.setData('text/plain', String(t.id));
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                                setDragOverId(null);
                                setColumnDragOver(false);
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverId(t.id);
                            }}
                            onDragLeave={() => setDragOverId((cur) => (cur === t.id ? null : cur))}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverId(null);
                                setColumnDragOver(false);
                                const draggedId = readDraggedId(e);
                                if (draggedId !== null && draggedId !== t.id) onDropTask(draggedId, t.id);
                            }}
                            onClick={() => handleTaskClick(t)}
                            onDoubleClick={() => handleTaskDoubleClick(t)}
                        >
                            <button
                                className={`checkbox ${t.done ? 'checkbox-checked' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggle(t.id);
                                }}
                                aria-label="Toggle done"
                            >
                                {t.done && <Check />}
                            </button>
                            <span className="board-task-title">{t.title}</span>
                            {t.priority > 0 && (
                                <span className="priority-dot" style={{background: priorityColor(t.priority)}} />
                            )}
                            {showProjectDot && project && (
                                <span className="dot" style={{background: project.color}} title={project.name} />
                            )}
                            <button
                                className="icon-btn ghost"
                                title="Delete task"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(t.id);
                                }}
                            >
                                <X size={13} />
                            </button>
                        </div>
                    );
                })}
                <div className="board-column-empty-space" onDoubleClick={onOpenAddModal} title="Double-click to add a task" />
            </div>

            <form className="board-quick-add" onSubmit={submit}>
                <input
                    className="board-quick-add-input"
                    placeholder="+ Add task"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                />
            </form>
        </div>
    );
}
