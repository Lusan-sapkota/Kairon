import {useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {ChevronLeft, ChevronRight, Check, X} from 'lucide-react';
import type {Project, Task} from '../types';
import {formatShortDate, greeting, isOverdue, priorityColor, priorityLabel, taskTooltip, todayISO} from '../types';
import {NewTaskModal} from './NewTaskModal';
import greetImage from '../assets/images/greet.png';
import greetImageInverted from '../assets/images/greet-inverted.png';

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

const WEEK_DAYS = 7;

function toISO(d: Date): string {
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/** Monday-start week containing `d`. */
function startOfWeek(d: Date): Date {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay(); // 0 Sun … 6 Sat
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    return start;
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
    const [addModalContext, setAddModalContext] = useState<{dueDate?: string; projectId?: number} | null>(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = todayISO();
    const weekStart = startOfWeek(today);

    const days = Array.from({length: WEEK_DAYS}, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + dayOffset + i);
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
    const isCurrentWeek = dayOffset === 0;

    const todayTasks = tasksByDate.get(todayKey) ?? [];
    const focusStats = {
        todayOpen: todayTasks.filter((t) => !t.done).length,
        overdue: tasks.filter(isOverdue).length,
        activeProjects: projects.filter((p) => tasks.some((t) => t.projectId === p.id && !t.done)).length,
    };

    return (
        <div className="board">
            <header className="board-hero">
                <div className="board-hero-identity">
                    <div className="greeting-image-wrap" aria-hidden>
                        <img className="greeting-image greeting-image-dark" src={greetImageInverted} alt="" />
                        <img className="greeting-image greeting-image-light" src={greetImage} alt="" />
                    </div>
                    <div className="board-hero-text">
                        <h2 className="board-hero-title">{greeting()}, Chief</h2>
                        <p className="board-hero-sub">
                            {focusStats.todayOpen === 0
                                ? 'Clear day ahead — schedule something or clear backlog.'
                                : `${focusStats.todayOpen} open today`}
                            {focusStats.overdue > 0 ? ` · ${focusStats.overdue} overdue` : ''}
                        </p>
                    </div>
                </div>
                <div className="board-hero-stats">
                    <div className="board-stat">
                        <span className="board-stat-value">{focusStats.todayOpen}</span>
                        <span className="board-stat-label">Today</span>
                    </div>
                    <div className="board-stat">
                        <span className={`board-stat-value ${focusStats.overdue > 0 ? 'board-stat-danger' : ''}`}>
                            {focusStats.overdue}
                        </span>
                        <span className="board-stat-label">Overdue</span>
                    </div>
                    <div className="board-stat">
                        <span className="board-stat-value">{focusStats.activeProjects}</span>
                        <span className="board-stat-label">Projects</span>
                    </div>
                </div>
            </header>

            <div className="board-section board-section-days">
                <div className="board-section-header">
                    <h3 className="board-subheading">Schedule</h3>
                    <div className="board-nav-group">
                        <button className="icon-btn" onClick={() => setDayOffset((o) => o - 1)} title="Previous day">
                            <ChevronLeft size={16} />
                        </button>
                        {!isCurrentWeek && (
                            <button className="btn-sm btn" onClick={() => setDayOffset(0)}>
                                This week
                            </button>
                        )}
                        <button className="icon-btn" onClick={() => setDayOffset((o) => o + 1)} title="Next day">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
                <div className="board-row board-row-days">
                    {days.map((d) => {
                        const iso = toISO(d);
                        const dayTasks = tasksByDate.get(iso) ?? [];
                        return (
                            <BoardColumn
                                key={iso}
                                title={d.toLocaleDateString(undefined, {weekday: 'long'})}
                                subtitle={d.toLocaleDateString(undefined, {month: 'long', day: 'numeric'})}
                                highlighted={iso === todayKey}
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
                        <span className="board-section-hint">{projects.length} boards</span>
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
                                    showTaskMeta
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
    showTaskMeta?: boolean;
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
    showTaskMeta,
    onQuickAdd,
    onOpenAddModal,
    onToggle,
    onSelect,
    onDelete,
    onDropTask,
}: ColumnProps) {
    const [draft, setDraft] = useState('');
    const [dragOverId, setDragOverId] = useState<number | null>(null);
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
            className={`board-column ${highlighted ? 'board-column-today' : ''}`}
            style={accentColor ? ({'--tile-accent': accentColor} as CSSProperties) : undefined}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
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
                <span className="board-column-count">{tasks.filter((t) => !t.done).length}</span>
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
                            onDragEnd={() => setDragOverId(null)}
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
                                const draggedId = readDraggedId(e);
                                if (draggedId !== null && draggedId !== t.id) onDropTask(draggedId, t.id);
                            }}
                            onClick={() => handleTaskClick(t)}
                            onDoubleClick={() => handleTaskDoubleClick(t)}
                            title={taskTooltip(t, project)}
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
                            {showTaskMeta ? (
                                <span className="board-task-meta">
                                    {t.dueDate && (
                                        <span className={isOverdue(t) ? 'board-task-meta-overdue' : ''}>
                                            {formatShortDate(t.dueDate)}
                                        </span>
                                    )}
                                    {t.priority > 0 && (
                                        <span
                                            className="board-task-meta-priority"
                                            style={{color: priorityColor(t.priority)}}
                                        >
                                            {priorityLabel(t.priority)}
                                        </span>
                                    )}
                                </span>
                            ) : (
                                t.priority > 0 && (
                                    <span className="priority-dot" style={{background: priorityColor(t.priority)}} />
                                )
                            )}
                            {showProjectDot && project && (
                                <span className="dot" style={{background: project.color}} />
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
