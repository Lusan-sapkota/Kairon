import {useState} from 'react';
import type {Project} from '../types';
import {PRIORITIES} from '../types';

type Props = {
    projects: Project[];
    initialDueDate?: string;
    initialProjectId?: number;
    onClose: () => void;
    onCreate: (input: {title: string; notes?: string; dueDate?: string; priority: number; projectId?: number}) => void;
};

export function NewTaskModal({projects, initialDueDate, initialProjectId, onClose, onCreate}: Props) {
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState(initialDueDate ?? '');
    const [priority, setPriority] = useState(0);
    const [projectId, setProjectId] = useState<number | undefined>(initialProjectId);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate({title: title.trim(), notes, dueDate: dueDate || undefined, priority, projectId});
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <form className="modal-panel" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
                <div className="modal-header">
                    <span>New task</span>
                    <button type="button" className="icon-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <input
                    autoFocus
                    className="input"
                    placeholder="Task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <div className="detail-field-row">
                    <label>Due date</label>
                    <input
                        type="date"
                        className="input input-sm"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>

                <div className="detail-field-row">
                    <label>Priority</label>
                    <select
                        className="input input-sm"
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value))}
                    >
                        {PRIORITIES.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="detail-field-row">
                    <label>Category</label>
                    <select
                        className="input input-sm"
                        value={projectId ?? ''}
                        onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
                    >
                        <option value="">No project</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                <textarea
                    className="input textarea"
                    placeholder="Notes…"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn">
                        Add task
                    </button>
                </div>
            </form>
        </div>
    );
}
