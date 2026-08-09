import {useEffect, useState} from 'react';
import type {Project, Task} from '../types';
import {PRIORITIES} from '../types';

type Props = {
    task: Task;
    projects: Project[];
    onClose: () => void;
    onSave: (input: {id: number; title: string; notes: string; dueDate?: string; priority: number; projectId?: number}) => void;
    onDelete: (id: number) => void;
};

export function TaskDetail({task, projects, onClose, onSave, onDelete}: Props) {
    const [title, setTitle] = useState(task.title);
    const [notes, setNotes] = useState(task.notes);
    const [dueDate, setDueDate] = useState(task.dueDate ?? '');
    const [priority, setPriority] = useState(task.priority);
    const [projectId, setProjectId] = useState<number | undefined>(task.projectId);

    useEffect(() => {
        setTitle(task.title);
        setNotes(task.notes);
        setDueDate(task.dueDate ?? '');
        setPriority(task.priority);
        setProjectId(task.projectId);
    }, [task]);

    function save(overrides: Partial<{title: string; notes: string; dueDate: string; priority: number; projectId?: number}> = {}) {
        const merged = {
            title,
            notes,
            dueDate,
            priority,
            projectId,
            ...overrides,
        };
        if (!merged.title.trim()) return;
        onSave({
            id: task.id,
            title: merged.title.trim(),
            notes: merged.notes,
            dueDate: merged.dueDate || undefined,
            priority: merged.priority,
            projectId: merged.projectId,
        });
    }

    return (
        <div className="detail-overlay" onClick={onClose}>
            <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
                <div className="detail-header">
                    <input
                        className="input detail-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => save()}
                    />
                    <button className="icon-btn" onClick={onClose}>×</button>
                </div>

                <div className="detail-field-row">
                    <label>Due date</label>
                    <input
                        type="date"
                        className="input input-sm"
                        value={dueDate}
                        onChange={(e) => {
                            setDueDate(e.target.value);
                            save({dueDate: e.target.value});
                        }}
                    />
                </div>

                <div className="detail-field-row">
                    <label>Priority</label>
                    <select
                        className="input input-sm"
                        value={priority}
                        onChange={(e) => {
                            const value = Number(e.target.value);
                            setPriority(value);
                            save({priority: value});
                        }}
                    >
                        {PRIORITIES.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>

                <div className="detail-field-row">
                    <label>Project</label>
                    <select
                        className="input input-sm"
                        value={projectId ?? ''}
                        onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : undefined;
                            setProjectId(value);
                            save({projectId: value});
                        }}
                    >
                        <option value="">No project</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <label className="detail-notes-label">Notes</label>
                <textarea
                    className="input textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={() => save()}
                    placeholder="Add details…"
                    rows={6}
                />

                <div className="detail-footer">
                    <button className="btn btn-danger" onClick={() => onDelete(task.id)}>Delete task</button>
                    <button className="btn" onClick={() => save()}>Save</button>
                </div>
            </div>
        </div>
    );
}
