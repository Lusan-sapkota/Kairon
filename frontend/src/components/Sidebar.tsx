import {useEffect, useState} from 'react';
import {
    LayoutGrid,
    CalendarDays,
    NotebookPen,
    ListChecks,
    ChevronsLeft,
    ChevronsRight,
    Plus,
    X,
    Pencil,
    Sun,
    Moon,
    MonitorCog,
    RefreshCw,
} from 'lucide-react';
import type {Project, Task, View} from '../types';
import {UPDATE_POLL_OPTIONS} from '../types';
import {api} from '../api';
import logo from '../assets/images/kairon-transparent.png';
import {NewProjectModal} from './NewProjectModal';

type Props = {
    projects: Project[];
    tasks: Task[];
    view: View;
    onSelectView: (view: View) => void;
    onAddProject: (name: string, color: string, tags: string) => void;
    onUpdateProject: (id: number, name: string, color: string, tags: string) => void;
    onDeleteProject: (id: number) => void;
};

type ThemePref = 'system' | 'light' | 'dark';

const COLLAPSED_KEY = 'kairon.sidebarCollapsed';
const THEME_KEY = 'kairon.theme';
const THEME_ORDER: Record<ThemePref, ThemePref> = {system: 'light', light: 'dark', dark: 'system'};
const THEME_LABEL: Record<ThemePref, string> = {system: 'System', light: 'Light', dark: 'Dark'};

function resolveTheme(pref: ThemePref): 'light' | 'dark' {
    if (pref === 'system') {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return pref;
}

function isSameView(a: View, b: View): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'project' && b.kind === 'project') return a.projectId === b.projectId;
    return true;
}

function projectTags(p: Project): string[] {
    return p.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
}

export function Sidebar({projects, tasks, view, onSelectView, onAddProject, onUpdateProject, onDeleteProject}: Props) {
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [themePref, setThemePref] = useState<ThemePref>(
        () => (localStorage.getItem(THEME_KEY) as ThemePref | null) ?? 'system'
    );
    const [updatePoll, setUpdatePoll] = useState('7d');

    const openTaskCount = tasks.filter((t) => !t.done).length;

    const allTags = [...new Set(projects.flatMap(projectTags))].sort();
    const visibleProjects = activeTag ? projects.filter((p) => projectTags(p).includes(activeTag)) : projects;

    function toggleCollapsed() {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
            return next;
        });
    }

    useEffect(() => {
        const apply = () => document.documentElement.setAttribute('data-theme', resolveTheme(themePref));
        apply();
        if (themePref !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, [themePref]);

    useEffect(() => {
        api.getUpdateSettings()
            .then((s) => setUpdatePoll(s.pollInterval))
            .catch(() => {});
    }, []);

    function cycleTheme() {
        setThemePref((prev) => {
            const next = THEME_ORDER[prev];
            localStorage.setItem(THEME_KEY, next);
            return next;
        });
    }

    const ThemeIcon = themePref === 'system' ? MonitorCog : themePref === 'light' ? Sun : Moon;

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="brand">
                    <img className="brand-mark" src={logo} alt="" />
                    {!collapsed && <span className="brand-name">Kairon</span>}
                </div>
                <button
                    className="icon-btn sidebar-toggle"
                    onClick={toggleCollapsed}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
                </button>
            </div>

            <nav className="nav-list">
                <button
                    className={`nav-item ${isSameView(view, {kind: 'today'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'today'})}
                    title="Board"
                >
                    <span className="nav-icon"><LayoutGrid size={16} /></span>
                    {!collapsed && (
                        <>
                            Board
                            {openTaskCount > 0 && <span className="nav-count">{openTaskCount}</span>}
                        </>
                    )}
                </button>
                <button
                    className={`nav-item ${isSameView(view, {kind: 'upcoming'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'upcoming'})}
                    title="Calendar"
                >
                    <span className="nav-icon"><CalendarDays size={16} /></span>
                    {!collapsed && 'Calendar'}
                </button>
                <button
                    className={`nav-item ${isSameView(view, {kind: 'notes'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'notes'})}
                    title="Notes"
                >
                    <span className="nav-icon"><NotebookPen size={16} /></span>
                    {!collapsed && 'Notes'}
                </button>
                <button
                    className={`nav-item ${isSameView(view, {kind: 'all'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'all'})}
                    title="All Tasks"
                >
                    <span className="nav-icon"><ListChecks size={16} /></span>
                    {!collapsed && 'All Tasks'}
                </button>
            </nav>

            <div className="sidebar-section">
                {!collapsed && (
                    <div className="sidebar-section-header">
                        <span>Projects</span>
                        <button className="icon-btn" onClick={() => setAddModalOpen(true)} title="Add project">
                            <Plus size={14} />
                        </button>
                    </div>
                )}

                {!collapsed && allTags.length > 0 && (
                    <div className="tag-filter-row">
                        {allTags.map((tag) => (
                            <button
                                type="button"
                                key={tag}
                                className={`tag-chip ${activeTag === tag ? 'tag-chip-active' : ''}`}
                                onClick={() => setActiveTag((cur) => (cur === tag ? null : tag))}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                <div className="project-list">
                    {visibleProjects.map((p) => (
                        <div
                            key={p.id}
                            className={`nav-item project-item ${
                                isSameView(view, {kind: 'project', projectId: p.id}) ? 'active' : ''
                            }`}
                            onClick={() => onSelectView({kind: 'project', projectId: p.id})}
                            title={p.name}
                        >
                            <span className="dot" style={{background: p.color}} />
                            {!collapsed && (
                                <>
                                    <span className="project-name">{p.name}</span>
                                    <button
                                        className="icon-btn ghost"
                                        title="Edit project"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingProject(p);
                                        }}
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        className="icon-btn ghost"
                                        title="Delete project"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteProject(p.id);
                                        }}
                                    >
                                        <X size={13} />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                    {visibleProjects.length === 0 && !collapsed && (
                        <p className="empty-hint">{activeTag ? `No projects tagged "${activeTag}"` : 'No projects yet'}</p>
                    )}
                </div>
            </div>

            <div className="sidebar-footer">
                <div className="nav-item sidebar-update-row">
                    <button
                        type="button"
                        className="sidebar-update-check"
                        title="Check for updates now"
                        onClick={() => api.checkForUpdates().catch(() => {})}
                    >
                        <RefreshCw size={16} />
                    </button>
                    {!collapsed && (
                        <select
                            id="update-poll-select"
                            className="sidebar-inline-select"
                            value={updatePoll}
                            aria-label="Update check frequency"
                            onChange={(e) => {
                                const next = e.target.value;
                                setUpdatePoll(next);
                                api.setUpdatePollInterval(next).catch(() => {
                                    api.getUpdateSettings()
                                        .then((s) => setUpdatePoll(s.pollInterval))
                                        .catch(() => {});
                                });
                            }}
                        >
                            {UPDATE_POLL_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <button
                    className="nav-item sidebar-theme-btn"
                    onClick={cycleTheme}
                    title={`Theme: ${THEME_LABEL[themePref]} (click to change)`}
                >
                    <span className="nav-icon">
                        <ThemeIcon size={16} />
                    </span>
                    {!collapsed && `Theme: ${THEME_LABEL[themePref]}`}
                </button>
            </div>

            {addModalOpen && (
                <NewProjectModal
                    onClose={() => setAddModalOpen(false)}
                    onSave={(input) => {
                        onAddProject(input.name, input.color, input.tags);
                        setAddModalOpen(false);
                    }}
                />
            )}

            {editingProject && (
                <NewProjectModal
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    onSave={(input) => {
                        if (input.id != null) {
                            onUpdateProject(input.id, input.name, input.color, input.tags);
                        }
                        setEditingProject(null);
                    }}
                />
            )}
        </aside>
    );
}
