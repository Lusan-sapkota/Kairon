import {useMemo, useState} from 'react';
import {Plus, CircleCheck, ListTodo, Pencil} from 'lucide-react';
import type {Project, Task} from '../types';
import {PRIORITIES, isDueToday, isOverdue} from '../types';
import {TaskComposer} from './TaskComposer';
import {TaskRow} from './TaskRow';
import {NewTaskModal} from './NewTaskModal';
import {NewProjectModal} from './NewProjectModal';

type Props = {
    project: Project;
    tasks: Task[];
    projects: Project[];
    onAddTask: (input: {title: string; notes?: string; dueDate?: string; priority: number; projectId?: number}) => void;
    onUpdateProject: (id: number, name: string, color: string, tags: string) => void;
    onToggleTask: (id: number) => void;
    onSelectTask: (task: Task) => void;
    onDeleteTask: (id: number) => void;
};

type FilterKey = 'all' | 'active' | 'overdue' | 'today' | 'completed';

const FILTERS: {key: FilterKey; label: string}[] = [
    {key: 'all', label: 'All'},
    {key: 'active', label: 'Active'},
    {key: 'overdue', label: 'Overdue'},
    {key: 'today', label: 'Due Today'},
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
        case 'completed':
            return t.done;
        default:
            return true;
    }
}

export function ProjectView({
    project,
    tasks,
    projects,
    onAddTask,
    onUpdateProject,
    onToggleTask,
    onSelectTask,
    onDeleteTask,
}: Props) {
    const [filter, setFilter] = useState<FilterKey>('all');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const tags = useMemo(
        () =>
            project.tags
                ? project.tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                : [],
        [project.tags]
    );

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

    const visible = useMemo(
        () =>
            [...tasks]
                .filter((t) => matchesFilter(t, filter))
                .sort((a, b) => Number(a.done) - Number(b.done) || b.priority - a.priority || a.title.localeCompare(b.title)),
        [tasks, filter]
    );

    const accentStyle = {
        '--project-accent': project.color,
        '--project-accent-soft': `${project.color}28`,
    } as React.CSSProperties;

    return (
        <div className="project-view" style={accentStyle}>
            <header className="project-hero">
                <div className="project-hero-accent" aria-hidden />
                <div className="project-hero-body">
                    <div className="project-hero-top">
                        <div className="project-hero-identity">
                            <span className="project-hero-mark" style={{background: project.color}}>
                                {project.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="project-hero-text">
                                <h2 className="project-hero-title">{project.name}</h2>
                                <p className="project-hero-sub">
                                    {stats.active === 0 && stats.total === 0
                                        ? 'No tasks yet  add one below'
                                        : `${stats.active} active · ${stats.completed} done`}
                                </p>
                            </div>
                        </div>
                        <div className="project-hero-actions">
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setEditModalOpen(true)}
                                title="Edit project"
                            >
                                <Pencil size={14} />
                                Edit
                            </button>
                            <button className="btn btn-sm" onClick={() => setAddModalOpen(true)} title="Add task">
                                <Plus size={15} />
                                New task
                            </button>
                        </div>
                    </div>

                    {(tags.length > 0 || stats.total > 0) && (
                        <div className="project-hero-meta">
                            {tags.map((tag) => (
                                <span key={tag} className="project-tag">
                                    {tag}
                                </span>
                            ))}
                            <div className="project-hero-stats-inline">
                                <span className="project-stat-pill">
                                    <ListTodo size={12} />
                                    {stats.total} total
                                </span>
                                {stats.overdue > 0 && (
                                    <span className="project-stat-pill project-stat-pill-danger">
                                        {stats.overdue} overdue
                                    </span>
                                )}
                                <span className="project-stat-pill project-stat-pill-accent">
                                    {stats.completionPct}% complete
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="project-layout">
                <div className="project-main">
                    <TaskComposer
                        projects={projects}
                        defaultProjectId={project.id}
                        onAdd={onAddTask}
                    />

                    {tasks.length > 0 && (
                        <div className="tag-filter-row project-filters">
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
                    )}

                    {visible.length === 0 ? (
                        <div className="project-empty">
                            <span className="project-empty-icon">
                                <CircleCheck size={22} />
                            </span>
                            <p className="empty-hint">
                                {tasks.length === 0
                                    ? 'No tasks in this project yet.'
                                    : 'No tasks match this filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="task-list project-task-list">
                            {visible.map((t) => (
                                <TaskRow
                                    key={t.id}
                                    task={t}
                                    project={project}
                                    onToggle={onToggleTask}
                                    onSelect={onSelectTask}
                                    onDelete={onDeleteTask}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <aside className="project-side">
                    <div className="side-card project-side-card">
                        <span className="side-card-title">Progress</span>
                        <span className="hero-figure">{stats.completionPct}%</span>
                        <div className="meter">
                            <div
                                className="meter-fill"
                                style={{
                                    width: `${stats.completionPct}%`,
                                    background: `linear-gradient(90deg, ${project.color}, var(--accent-2))`,
                                }}
                            />
                        </div>
                        <ul className="side-stat-list">
                            <li>
                                <span className="dot" style={{background: project.color}} />
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
                    initialProjectId={project.id}
                    onClose={() => setAddModalOpen(false)}
                    onCreate={(input) => {
                        onAddTask(input);
                        setAddModalOpen(false);
                    }}
                />
            )}

            {editModalOpen && (
                <NewProjectModal
                    project={project}
                    onClose={() => setEditModalOpen(false)}
                    onSave={(input) => {
                        if (input.id != null) {
                            onUpdateProject(input.id, input.name, input.color, input.tags);
                        }
                        setEditModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
