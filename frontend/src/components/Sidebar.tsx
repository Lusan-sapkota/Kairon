import {useState} from 'react';
import type {Project, Task, View} from '../types';
import logo from '../assets/images/kairon-transparent.png';
import {NewProjectModal} from './NewProjectModal';

type Props = {
    projects: Project[];
    tasks: Task[];
    view: View;
    onSelectView: (view: View) => void;
    onAddProject: (name: string, color: string, tags: string) => void;
    onDeleteProject: (id: number) => void;
};

const COLLAPSED_KEY = 'kairon.sidebarCollapsed';

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

export function Sidebar({projects, tasks, view, onSelectView, onAddProject, onDeleteProject}: Props) {
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [activeTag, setActiveTag] = useState<string | null>(null);

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
                    {collapsed ? '»' : '«'}
                </button>
            </div>

            <nav className="nav-list">
                <button
                    className={`nav-item ${isSameView(view, {kind: 'today'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'today'})}
                    title="Board"
                >
                    <span className="nav-icon">⊞</span>
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
                    <span className="nav-icon">▤</span>
                    {!collapsed && 'Calendar'}
                </button>
                <button
                    className={`nav-item ${isSameView(view, {kind: 'notes'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'notes'})}
                    title="Notes"
                >
                    <span className="nav-icon">✎</span>
                    {!collapsed && 'Notes'}
                </button>
                <button
                    className={`nav-item ${isSameView(view, {kind: 'all'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'all'})}
                    title="All Tasks"
                >
                    <span className="nav-icon">☰</span>
                    {!collapsed && 'All Tasks'}
                </button>
            </nav>

            <div className="sidebar-section">
                {!collapsed && (
                    <div className="sidebar-section-header">
                        <span>Projects</span>
                        <button className="icon-btn" onClick={() => setAddModalOpen(true)} title="Add project">
                            +
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
                                        title="Delete project"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteProject(p.id);
                                        }}
                                    >
                                        ×
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

            {addModalOpen && (
                <NewProjectModal
                    onClose={() => setAddModalOpen(false)}
                    onCreate={(input) => {
                        onAddProject(input.name, input.color, input.tags);
                        setAddModalOpen(false);
                    }}
                />
            )}
        </aside>
    );
}
