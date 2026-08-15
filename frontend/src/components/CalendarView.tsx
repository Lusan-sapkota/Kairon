import {memo, useCallback, useMemo, useState} from 'react';
import {ChevronLeft, ChevronRight, CalendarDays, CircleCheck} from 'lucide-react';
import type {Project, Task} from '../types';
import {todayISO} from '../types';
import {TaskRow} from './TaskRow';
import {TaskComposer} from './TaskComposer';
import {FloatingQuickAdd} from './FloatingQuickAdd';

type Props = {
    tasks: Task[];
    projects: Project[];
    onAddTask: (input: import('../types').TaskDraft) => void;
    onToggleTask: (id: number) => void;
    onSelectTask: (task: Task) => void;
    onDeleteTask: (id: number) => void;
};

type DayModel = {
    key: string;
    day: number;
    iso: string;
    pills: {id: number; title: string; color: string}[];
    activeCount: number;
    doneCount: number;
    hasOverdue: boolean;
};

function toISO(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function isOverdueVs(task: Task, today: string): boolean {
    return !!task.dueDate && !task.done && task.dueDate < today;
}

type DayCellProps = {
    model: DayModel;
    isToday: boolean;
    isSelected: boolean;
    onSelect: (iso: string) => void;
};

const CalendarDayCell = memo(function CalendarDayCell({model, isToday, isSelected, onSelect}: DayCellProps) {
    return (
        <button
            type="button"
            className={[
                'calendar-cell',
                isToday ? 'calendar-cell-today' : '',
                isSelected ? 'calendar-cell-selected' : '',
                model.activeCount + model.doneCount > 0 ? 'calendar-cell-has-tasks' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            onClick={() => onSelect(model.iso)}
        >
            <span className={`calendar-cell-day ${model.hasOverdue ? 'calendar-cell-day-overdue' : ''}`}>
                {model.day}
            </span>
            <div className="calendar-cell-tasks">
                {model.pills.map((p) => (
                    <span key={p.id} className="calendar-pill" style={{borderLeftColor: p.color}}>
                        {p.title}
                    </span>
                ))}
                {model.activeCount > 3 && (
                    <span className="calendar-pill-more">+{model.activeCount - 3} more</span>
                )}
                {model.activeCount === 0 && model.doneCount > 0 && (
                    <span className="calendar-pill-more">{model.doneCount} done</span>
                )}
            </div>
        </button>
    );
});

export function CalendarView({tasks, projects, onAddTask, onToggleTask, onSelectTask, onDeleteTask}: Props) {
    const todayKey = useMemo(() => todayISO(), []);
    const now = useMemo(() => {
        const d = new Date();
        return {year: d.getFullYear(), month: d.getMonth()};
    }, []);

    const [cursor, setCursor] = useState(now);
    const [selectedDate, setSelectedDate] = useState(todayKey);

    const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

    const tasksByDate = useMemo(() => {
        const map = new Map<string, Task[]>();
        for (const t of tasks) {
            if (!t.dueDate) continue;
            if (!map.has(t.dueDate)) map.set(t.dueDate, []);
            map.get(t.dueDate)!.push(t);
        }
        for (const list of map.values()) {
            list.sort((a, b) => Number(a.done) - Number(b.done) || b.priority - a.priority);
        }
        return map;
    }, [tasks]);

    const monthLabel = useMemo(
        () =>
            new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
            }),
        [cursor.year, cursor.month]
    );

    const {firstDay, daysInMonth} = useMemo(() => {
        const first = new Date(cursor.year, cursor.month, 1).getDay();
        const days = new Date(cursor.year, cursor.month + 1, 0).getDate();
        return {firstDay: first, daysInMonth: days};
    }, [cursor.year, cursor.month]);

    const dayModels = useMemo(() => {
        const models: (DayModel | null)[] = Array(firstDay).fill(null);
        for (let day = 1; day <= daysInMonth; day++) {
            const iso = toISO(cursor.year, cursor.month, day);
            const dayTasks = tasksByDate.get(iso) ?? [];
            const activeTasks = dayTasks.filter((t) => !t.done);
            models.push({
                key: iso,
                day,
                iso,
                activeCount: activeTasks.length,
                doneCount: dayTasks.length - activeTasks.length,
                hasOverdue: dayTasks.some((t) => isOverdueVs(t, todayKey)),
                pills: activeTasks.slice(0, 3).map((t) => ({
                    id: t.id,
                    title: t.title,
                    color: t.projectId
                        ? projectById.get(t.projectId)?.color ?? 'var(--text-faint)'
                        : 'var(--text-faint)',
                })),
            });
        }
        return models;
    }, [cursor.year, cursor.month, firstDay, daysInMonth, tasksByDate, projectById, todayKey]);

    const monthStats = useMemo(() => {
        let total = 0;
        let done = 0;
        let overdue = 0;
        for (const model of dayModels) {
            if (!model) continue;
            total += model.activeCount + model.doneCount;
            done += model.doneCount;
            if (model.hasOverdue) {
                const dayTasks = tasksByDate.get(model.iso) ?? [];
                overdue += dayTasks.filter((t) => isOverdueVs(t, todayKey)).length;
            }
        }
        return {total, done, overdue, active: total - done};
    }, [dayModels, tasksByDate, todayKey]);

    const selectedTasks = tasksByDate.get(selectedDate) ?? [];
    const isSelectedToday = selectedDate === todayKey;
    const isCurrentMonth = cursor.year === now.year && cursor.month === now.month;

    const selectedLabel = useMemo(
        () =>
            new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            }),
        [selectedDate]
    );

    const selectDate = useCallback((iso: string) => {
        setSelectedDate(iso);
    }, []);

    function shiftMonth(delta: number) {
        const d = new Date(cursor.year, cursor.month + delta, 1);
        setCursor({year: d.getFullYear(), month: d.getMonth()});
    }

    function goToday() {
        setCursor(now);
        setSelectedDate(todayKey);
    }

    const openCount = useMemo(() => selectedTasks.filter((t) => !t.done).length, [selectedTasks]);

    return (
        <div className="calendar-view">
            <header className="calendar-toolbar">
                <div className="calendar-toolbar-identity">
                    <span className="calendar-toolbar-icon">
                        <CalendarDays size={18} />
                    </span>
                    <div>
                        <h2 className="calendar-toolbar-title">{monthLabel}</h2>
                        <p className="calendar-toolbar-sub">
                            {monthStats.total === 0
                                ? 'No dated tasks this month'
                                : `${monthStats.active} active · ${monthStats.done} done`}
                            {monthStats.overdue > 0 ? ` · ${monthStats.overdue} overdue` : ''}
                        </p>
                    </div>
                </div>
                <div className="calendar-toolbar-nav">
                    <button className="icon-btn" onClick={() => shiftMonth(-1)} title="Previous month">
                        <ChevronLeft size={16} />
                    </button>
                    {(!isCurrentMonth || !isSelectedToday) && (
                        <button className="btn btn-sm btn-ghost" onClick={goToday}>
                            Today
                        </button>
                    )}
                    <button className="icon-btn" onClick={() => shiftMonth(1)} title="Next month">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </header>

            <div className="calendar-body">
                <div className="calendar-month">
                    <div className="calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                            <div key={d} className="calendar-weekday">
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="calendar-grid">
                        {dayModels.map((model, i) =>
                            model ? (
                                <CalendarDayCell
                                    key={model.key}
                                    model={model}
                                    isToday={model.iso === todayKey}
                                    isSelected={model.iso === selectedDate}
                                    onSelect={selectDate}
                                />
                            ) : (
                                <div key={`empty-${i}`} className="calendar-cell calendar-cell-empty" />
                            )
                        )}
                    </div>
                </div>

                <aside className="calendar-agenda">
                    <div className="calendar-agenda-header">
                        <div>
                            <p className="calendar-agenda-eyebrow">{isSelectedToday ? 'Today' : 'Agenda'}</p>
                            <h3 className="calendar-agenda-title">{selectedLabel}</h3>
                        </div>
                        <span className="calendar-agenda-count">{openCount} open</span>
                    </div>

                    <TaskComposer projects={projects} defaultDueDate={selectedDate} onAdd={onAddTask} />

                    {selectedTasks.length === 0 ? (
                        <div className="calendar-agenda-empty">
                            <span className="calendar-agenda-empty-icon">
                                <CircleCheck size={20} />
                            </span>
                            <p className="empty-hint">Nothing scheduled  add a task for this day.</p>
                        </div>
                    ) : (
                        <div className="task-list calendar-agenda-list">
                            {selectedTasks.map((t) => (
                                <TaskRow
                                    key={t.id}
                                    task={t}
                                    project={t.projectId ? projectById.get(t.projectId) : undefined}
                                    onToggle={onToggleTask}
                                    onSelect={onSelectTask}
                                    onDelete={onDeleteTask}
                                />
                            ))}
                        </div>
                    )}
                </aside>
            </div>

            <FloatingQuickAdd projects={projects} initialDueDate={selectedDate} onAdd={onAddTask} />
        </div>
    );
}
