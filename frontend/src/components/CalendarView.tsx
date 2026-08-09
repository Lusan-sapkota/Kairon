import {useMemo, useState} from 'react';
import {ChevronLeft, ChevronRight, CalendarDays, CircleCheck} from 'lucide-react';
import type {Project, Task} from '../types';
import {isOverdue, todayISO} from '../types';
import {TaskRow} from './TaskRow';
import {TaskComposer} from './TaskComposer';
import {FloatingQuickAdd} from './FloatingQuickAdd';

type Props = {
    tasks: Task[];
    projects: Project[];
    onAddTask: (input: {title: string; notes?: string; dueDate?: string; priority: number; projectId?: number}) => void;
    onToggleTask: (id: number) => void;
    onSelectTask: (task: Task) => void;
    onDeleteTask: (id: number) => void;
};

function toISO(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function CalendarView({tasks, projects, onAddTask, onToggleTask, onSelectTask, onDeleteTask}: Props) {
    const today = new Date();
    const [cursor, setCursor] = useState({year: today.getFullYear(), month: today.getMonth()});
    const [selectedDate, setSelectedDate] = useState(todayISO());

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

    const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });

    const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

    const projectById = new Map(projects.map((p) => [p.id, p]));
    const selectedTasks = tasksByDate.get(selectedDate) ?? [];
    const isSelectedToday = selectedDate === todayISO();
    const isCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth();

    const monthStats = useMemo(() => {
        let total = 0;
        let done = 0;
        let overdue = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const iso = toISO(cursor.year, cursor.month, d);
            const dayTasks = tasksByDate.get(iso) ?? [];
            total += dayTasks.length;
            done += dayTasks.filter((t) => t.done).length;
            overdue += dayTasks.filter(isOverdue).length;
        }
        return {total, done, overdue, active: total - done};
    }, [cursor, daysInMonth, tasksByDate]);

    const selectedLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    function shiftMonth(delta: number) {
        const d = new Date(cursor.year, cursor.month + delta, 1);
        setCursor({year: d.getFullYear(), month: d.getMonth()});
    }

    function goToday() {
        const now = new Date();
        setCursor({year: now.getFullYear(), month: now.getMonth()});
        setSelectedDate(todayISO());
    }

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
                        {cells.map((day, i) => {
                            if (day === null) return <div key={i} className="calendar-cell calendar-cell-empty" />;
                            const iso = toISO(cursor.year, cursor.month, day);
                            const dayTasks = tasksByDate.get(iso) ?? [];
                            const activeTasks = dayTasks.filter((t) => !t.done);
                            const isToday = iso === todayISO();
                            const isSelected = iso === selectedDate;
                            const hasOverdue = dayTasks.some(isOverdue);
                            return (
                                <button
                                    key={i}
                                    className={[
                                        'calendar-cell',
                                        isToday ? 'calendar-cell-today' : '',
                                        isSelected ? 'calendar-cell-selected' : '',
                                        dayTasks.length > 0 ? 'calendar-cell-has-tasks' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    onClick={() => setSelectedDate(iso)}
                                >
                                    <span className={`calendar-cell-day ${hasOverdue ? 'calendar-cell-day-overdue' : ''}`}>
                                        {day}
                                    </span>
                                    <div className="calendar-cell-tasks">
                                        {activeTasks.slice(0, 3).map((t) => {
                                            const color = t.projectId
                                                ? projectById.get(t.projectId)?.color ?? 'var(--text-faint)'
                                                : 'var(--text-faint)';
                                            return (
                                                <span key={t.id} className="calendar-pill" style={{borderLeftColor: color}}>
                                                    {t.title}
                                                </span>
                                            );
                                        })}
                                        {activeTasks.length > 3 && (
                                            <span className="calendar-pill-more">+{activeTasks.length - 3} more</span>
                                        )}
                                        {activeTasks.length === 0 && dayTasks.length > 0 && (
                                            <span className="calendar-pill-more">{dayTasks.length} done</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <aside className="calendar-agenda">
                    <div className="calendar-agenda-header">
                        <div>
                            <p className="calendar-agenda-eyebrow">{isSelectedToday ? 'Today' : 'Agenda'}</p>
                            <h3 className="calendar-agenda-title">{selectedLabel}</h3>
                        </div>
                        <span className="calendar-agenda-count">
                            {selectedTasks.filter((t) => !t.done).length} open
                        </span>
                    </div>

                    <TaskComposer
                        projects={projects}
                        defaultDueDate={selectedDate}
                        onAdd={onAddTask}
                    />

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
