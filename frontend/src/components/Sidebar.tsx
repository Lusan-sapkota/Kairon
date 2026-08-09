import {useState} from 'react';
import type {Project, Task, View} from '../types';

type Props = {
    projects: Project[];
    tasks: Task[];
    view: View;
    onSelectView: (view: View) => void;
    onAddProject: (name: string, color: string) => void;
    onDeleteProject: (id: number) => void;
};

const PROJECT_COLORS = ['#ff8552', '#f5a623', '#4d94ff', '#2ecc71', '#14b8a6', '#ec4899'];

function isSameView(a: View, b: View): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'project' && b.kind === 'project') return a.projectId === b.projectId;
    return true;
}

export function Sidebar({projects, tasks, view, onSelectView, onAddProject, onDeleteProject}: Props) {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [color, setColor] = useState(PROJECT_COLORS[0]);

    const openTaskCount = tasks.filter((t) => !t.done).length;

    function submitProject(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        onAddProject(name.trim(), color);
        setName('');
        setColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]);
        setAdding(false);
    }

    return (
        <aside className="sidebar">
            <div className="brand">
                <span className="brand-mark">◆</span>
                <span className="brand-name">Kairon</span>
            </div>

            <nav className="nav-list">
                <button
                    className={`nav-item ${isSameView(view, {kind: 'today'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'today'})}
                >
                    <span className="nav-icon">☀</span> Today
                    {openTaskCount > 0 && <span className="nav-count">{openTaskCount}</span>}
                </button>
                <button
                    className={`nav-item ${isSameView(view, {kind: 'upcoming'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'upcoming'})}
                >
                    <span className="nav-icon">▤</span> Calendar
                </button>
                <button
                    className={`nav-item ${isSameView(view, {kind: 'all'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'all'})}
                >
                    <span className="nav-icon">☰</span> All Tasks
                </button>
                <button
                    className={`nav-item ${isSameView(view, {kind: 'notes'}) ? 'active' : ''}`}
                    onClick={() => onSelectView({kind: 'notes'})}
                >
                    <span className="nav-icon">✎</span> Notes
                </button>
            </nav>

            <div className="sidebar-section">
                <div className="sidebar-section-header">
                    <span>Projects</span>
                    <button className="icon-btn" onClick={() => setAdding((v) => !v)} title="Add project">
                        +
                    </button>
                </div>

                {adding && (
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
                        >
                            <span className="dot" style={{background: p.color}} />
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
                        </div>
                    ))}
                    {projects.length === 0 && !adding && <p className="empty-hint">No projects yet</p>}
                </div>
            </div>
        </aside>
    );
}
