import {useMemo, useState} from 'react';
import type {Project, Task} from '../types';
import {PRIORITIES, isDueToday, isOverdue} from '../types';
import {TaskRow} from './TaskRow';
import {NewTaskModal} from './NewTaskModal';

type Props = {
    tasks: Task[];
    projects: Project[];
    onAddTask: (input: {title: string; notes?: string; dueDate?: string; priority: number; projectId?: number}) => void;
    onToggleTask: (id: number) => void;
    onSelectTask: (task: Task) => void;
    onDeleteTask: (id: number) => void;
};

type FilterKey = 'all' | 'active' | 'overdue' | 'today' | 'noDate' | 'highPriority' | 'completed';
type SortKey = 'priority' | 'dueDate' | 'title' | 'created';
type GroupKey = 'none' | 'project' | 'priority' | 'status';

const FILTERS: {key: FilterKey; label: string}[] = [
    {key: 'all', label: 'All'},
    {key: 'active', label: 'Active'},
    {key: 'overdue', label: 'Overdue'},
    {key: 'today', label: 'Due Today'},
    {key: 'noDate', label: 'No Date'},
    {key: 'highPriority', label: 'High Priority'},
    {key: 'completed', label: 'Completed'},
];

function matchesFilter(t: Task, filter: FilterKey): boolean {
    switch (filter) {
        case 'active':
            return !t.done;
        case 'overdue':
            return isOverdue(t);
        case 'today':
            return isDueToday(t);
        case 'noDate':
            return !t.dueDate;
        case 'highPriority':
            return t.priority === 3;
        case 'completed':
            return t.done;
        default:
            return true;
    }
}

function compareTasks(a: Task, b: Task, sort: SortKey): number {
    switch (sort) {
        case 'priority':
            return b.priority - a.priority || a.title.localeCompare(b.title);
        case 'dueDate':
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        case 'title':
            return a.title.localeCompare(b.title);
        case 'created':
            return b.createdAt.localeCompare(a.createdAt);
    }
}

export function AllTasksView({tasks, projects, onAddTask, onToggleTask, onSelectTask, onDeleteTask}: Props) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterKey>('all');
    const [sort, setSort] = useState<SortKey>('priority');
    const [groupBy, setGroupBy] = useState<GroupKey>('project');
    const [addModalOpen, setAddModalOpen] = useState(false);

    const projectById = new Map(projects.map((p) => [p.id, p]));

    const stats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.done).length;
        return {
            total,
            active: total - completed,
            overdue: tasks.filter(isOverdue).length,
            dueToday: tasks.filter(isDueToday).length,
            completed,
            completionPct: total === 0 ? 0 : Math.round((completed / total) * 100),
        };
    }, [tasks]);

    const priorityBreakdown = useMemo(
        () =>
            [...PRIORITIES].reverse().map((p) => ({
                ...p,
                count: tasks.filter((t) => t.priority === p.value).length,
            })),
        [tasks]
    );

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return tasks
            .filter((t) => matchesFilter(t, filter))
            .filter((t) => !term || t.title.toLowerCase().includes(term) || t.notes.toLowerCase().includes(term))
            .sort((a, b) => compareTasks(a, b, sort));
    }, [tasks, filter, search, sort]);

    function renderRow(t: Task) {
        return (
            <TaskRow
                key={t.id}
                task={t}
                project={t.projectId ? projectById.get(t.projectId) : undefined}
                onToggle={onToggleTask}
                onSelect={onSelectTask}
                onDelete={onDeleteTask}
            />
        );
    }

    let body;
    if (visible.length === 0) {
        body = (
            <div className="all-tasks-empty">
                <span className="all-tasks-empty-icon">{tasks.length === 0 ? '✓' : '⌕'}</span>
                <p className="empty-hint">
                    {tasks.length === 0 ? 'No tasks yet. Add your first one to get started.' : 'No tasks match your filters.'}
                </p>
            </div>
        );
    } else if (groupBy === 'none') {
        body = <div className="task-list">{visible.map(renderRow)}</div>;
    } else {
        const groups = new Map<string, {label: string; items: Task[]}>();

        if (groupBy === 'project') {
            groups.set('inbox', {label: 'Inbox', items: []});
            for (const p of projects) groups.set(String(p.id), {label: p.name, items: []});
            for (const t of visible) {
                const key = t.projectId ? String(t.projectId) : 'inbox';
                if (!groups.has(key)) groups.set(key, {label: 'Inbox', items: []});
                groups.get(key)!.items.push(t);
            }
        } else if (groupBy === 'priority') {
            for (const p of [...PRIORITIES].reverse()) groups.set(String(p.value), {label: p.label, items: []});
            for (const t of visible) groups.get(String(t.priority))!.items.push(t);
        } else {
            groups.set('active', {label: 'Active', items: []});
            groups.set('done', {label: 'Completed', items: []});
            for (const t of visible) groups.get(t.done ? 'done' : 'active')!.items.push(t);
        }

        body = (
            <>
                {[...groups.values()]
                    .filter((g) => g.items.length > 0)
                    .map((g) => (
                        <div key={g.label} className="task-group">
                            <h4 className="task-group-title">
                                {g.label} <span className="task-group-count">{g.items.length}</span>
                            </h4>
                            <div className="task-list">{g.items.map(renderRow)}</div>
                        </div>
                    ))}
            </>
        );
    }

    return (
        <div className="all-tasks-view">
            <div className="task-view-header">
                <h2 className="view-title">All Tasks</h2>
                <button className="icon-btn" onClick={() => setAddModalOpen(true)} title="Add task">
                    +
                </button>
            </div>

            <div className="all-tasks-layout">
                <div className="all-tasks-main">
                    <div className="all-tasks-controls">
                        <input
                            className="input all-tasks-search"
                            placeholder="Search tasks…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select className="input input-sm" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                            <option value="priority">Sort: Priority</option>
                            <option value="dueDate">Sort: Due date</option>
                            <option value="title">Sort: Title</option>
                            <option value="created">Sort: Newest</option>
                        </select>
                        <select
                            className="input input-sm"
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as GroupKey)}
                        >
                            <option value="project">Group: Project</option>
                            <option value="priority">Group: Priority</option>
                            <option value="status">Group: Status</option>
                            <option value="none">Group: None</option>
                        </select>
                    </div>

                    <div className="tag-filter-row">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                className={`tag-chip ${filter === f.key ? 'tag-chip-active' : ''}`}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="all-tasks-list-scroll">{body}</div>
                </div>

                <aside className="all-tasks-side">
                    <div className="side-card">
                        <span className="side-card-title">Completion</span>
                        <span className="hero-figure">{stats.completionPct}%</span>
                        <div className="meter">
                            <div className="meter-fill" style={{width: `${stats.completionPct}%`}} />
                        </div>
                        <ul className="side-stat-list">
                            <li>
                                <span className="dot" style={{background: 'var(--accent)'}} />
                                <span className="side-stat-label">Active</span>
                                <span className="side-stat-value">{stats.active}</span>
                            </li>
                            <li>
                                <span className="dot" style={{background: 'var(--danger)'}} />
                                <span className="side-stat-label">Overdue</span>
                                <span className="side-stat-value">{stats.overdue}</span>
                            </li>
                            <li>
                                <span className="dot" style={{background: '#f5a623'}} />
                                <span className="side-stat-label">Due today</span>
                                <span className="side-stat-value">{stats.dueToday}</span>
                            </li>
                            <li>
                                <span className="dot" style={{background: 'var(--success)'}} />
                                <span className="side-stat-label">Completed</span>
                                <span className="side-stat-value">{stats.completed}</span>
                            </li>
                            <li className="side-stat-total">
                                <span className="side-stat-label">Total tasks</span>
                                <span className="side-stat-value">{stats.total}</span>
                            </li>
                        </ul>
                    </div>

                    <div className="side-card">
                        <span className="side-card-title">By priority</span>
                        <ul className="priority-breakdown">
                            {priorityBreakdown.map((p) => (
                                <li key={p.value}>
                                    <span className="priority-breakdown-label">{p.label}</span>
                                    <div className="meter meter-sm" style={{background: `${p.color}26`}}>
                                        <div
                                            className="meter-fill"
                                            style={{
                                                background: p.color,
                                                width: stats.total ? `${(p.count / stats.total) * 100}%` : '0%',
                                            }}
                                        />
                                    </div>
                                    <span className="priority-breakdown-count">{p.count}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </div>

            {addModalOpen && (
                <NewTaskModal
                    projects={projects}
                    onClose={() => setAddModalOpen(false)}
                    onCreate={(input) => {
                        onAddTask(input);
                        setAddModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
