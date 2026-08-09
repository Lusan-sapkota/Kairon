import {useState} from 'react';
import type {Project, Task, View} from '../types';
import logo from '../assets/images/kairon-transparent.png';

type Props = {
    projects: Project[];
    tasks: Task[];
    view: View;
    onSelectView: (view: View) => void;
    onAddProject: (name: string, color: string) => void;
    onDeleteProject: (id: number) => void;
};

const PROJECT_COLORS = ['#ff8552', '#f5a623', '#4d94ff', '#2ecc71', '#14b8a6', '#ec4899'];
const COLLAPSED_KEY = 'kairon.sidebarCollapsed';

function isSameView(a: View, b: View): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'project' && b.kind === 'project') return a.projectId === b.projectId;
    return true;
}

export function Sidebar({projects, tasks, view, onSelectView, onAddProject, onDeleteProject}: Props) {
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [color, setColor] = useState(PROJECT_COLORS[0]);

    const openTaskCount = tasks.filter((t) => !t.done).length;

    function toggleCollapsed() {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
            if (next) setAdding(false);
            return next;
        });
    }

    function submitProject(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        onAddProject(name.trim(), color);
        setName('');
        setColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]);
        setAdding(false);
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
                    className={`nav-item ${isSameView(view, {kind: 'all'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'all'})}
                    title="All Tasks"
                >
                    <span className="nav-icon">☰</span>
                    {!collapsed && 'All Tasks'}
                </button>
                <button
                    className={`nav-item ${isSameView(view, {kind: 'notes'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'notes'})}
                    title="Notes"
                >
                    <span className="nav-icon">✎</span>
                    {!collapsed && 'Notes'}
                </button>
            </nav>

            <div className="sidebar-section">
                {!collapsed && (
                    <div className="sidebar-section-header">
                        <span>Projects</span>
                        <button className="icon-btn" onClick={() => setAdding((v) => !v)} title="Add project">
                            +
                        </button>
                    </div>
                )}

                {adding && !collapsed && (
                    <form className="add-project-form" onSubmit={submitProject}>
                        <input
                            autoFocus
                            className="input input-sm"
                            placeholder="Project name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
                        />
                        <div className="color-swatches">
                            {PROJECT_COLORS.map((c) => (
                                <button
                                    type="button"
                                    key={c}
                                    className={`swatch ${color === c ? 'swatch-selected' : ''}`}
                                    style={{background: c}}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                        <button type="submit" className="btn btn-sm">Add</button>
                    </form>
                )}

                <div className="project-list">
                    {projects.map((p) => (
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
                    {projects.length === 0 && !adding && !collapsed && <p className="empty-hint">No projects yet</p>}
                </div>
            </div>
        </aside>
    );
}
