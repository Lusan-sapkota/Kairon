import {useMemo, useState} from 'react';
import type {Project, Task} from '../types';
import {greeting, todayISO} from '../types';
import {TaskRow} from './TaskRow';
import {FloatingQuickAdd} from './FloatingQuickAdd';
import greetImage from '../assets/images/greet-inverted.png';

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

    function shiftMonth(delta: number) {
        const d = new Date(cursor.year, cursor.month + delta, 1);
        setCursor({year: d.getFullYear(), month: d.getMonth()});
    }

    return (
        <div className="calendar-layout">
            <div className="calendar-panel">
                <div className="calendar-header">
                    <button className="icon-btn" onClick={() => shiftMonth(-1)}>‹</button>
                    <span className="calendar-title">{monthLabel}</span>
                    <button className="icon-btn" onClick={() => shiftMonth(1)}>›</button>
                </div>
                <div className="calendar-grid calendar-weekdays">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="calendar-weekday">{d}</div>
                    ))}
                </div>
                <div className="calendar-grid">
                    {cells.map((day, i) => {
                        if (day === null) return <div key={i} className="calendar-cell calendar-cell-empty" />;
                        const iso = toISO(cursor.year, cursor.month, day);
                        const dayTasks = tasksByDate.get(iso) ?? [];
                        const isToday = iso === todayISO();
                        const isSelected = iso === selectedDate;
                        return (
                            <button
                                key={i}
                                className={`calendar-cell ${isToday ? 'calendar-cell-today' : ''} ${
                                    isSelected ? 'calendar-cell-selected' : ''
                                }`}
                                onClick={() => setSelectedDate(iso)}
                            >
                                <span>{day}</span>
                                {dayTasks.length > 0 && (
                                    <span className="calendar-dots">
                                        {dayTasks.slice(0, 3).map((t) => (
                                            <span
                                                key={t.id}
                                                className="calendar-dot"
                                                style={{
                                                    background: t.projectId
                                                        ? projectById.get(t.projectId)?.color ?? '#5b5f6b'
                                                        : '#5b5f6b',
                                                    opacity: t.done ? 0.35 : 1,
                                                }}
                                            />
                                        ))}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="calendar-day-panel">
                {selectedDate === todayISO() ? (
                    <div className="greeting-block">
                        <img className="greeting-image" src={greetImage} alt="" />
                        <div>
                            <h2 className="view-title board-greeting">{greeting()}, Chief</h2>
                            <p className="day-panel-subtitle">Here's what's on your plate today.</p>
                        </div>
                    </div>
                ) : (
                    <h3 className="day-panel-title">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </h3>
                )}
                <div className="task-list">
                    {selectedTasks.length === 0 && (
                        <p className="empty-hint">Nothing here yet — use the + icon to add a task for this day.</p>
                    )}
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
            </div>

            <FloatingQuickAdd projects={projects} initialDueDate={selectedDate} onAdd={onAddTask} />
        </div>
    );
}
