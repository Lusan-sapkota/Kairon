import {useState} from 'react';
import type {Project} from '../types';
import {PRIORITIES} from '../types';

type Props = {
    projects: Project[];
    initialDueDate?: string;
    initialProjectId?: number;
    onAdd: (input: {title: string; dueDate?: string; priority: number; projectId?: number}) => void;
};

export function FloatingQuickAdd({projects, initialDueDate, initialProjectId, onAdd}: Props) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState(initialDueDate ?? '');
    const [priority, setPriority] = useState(0);
    const [projectId, setProjectId] = useState<number | undefined>(initialProjectId);

    function toggleOpen() {
        setOpen((wasOpen) => {
            if (!wasOpen) {
                setTitle('');
                setDueDate(initialDueDate ?? '');
                setPriority(0);
                setProjectId(initialProjectId);
            }
            return !wasOpen;
        });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd({title: title.trim(), dueDate: dueDate || undefined, priority, projectId});
        setTitle('');
        setOpen(false);
    }

    return (
        <>
            {open && (
                <form className="fab-panel" onSubmit={submit}>
                    <div className="fab-panel-header">
                        <span>New task, any date</span>
                        <button type="button" className="icon-btn" onClick={() => setOpen(false)}>
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
                    <div className="fab-panel-row">
                        <label>Due date</label>
                        <input
                            type="date"
                            className="input input-sm"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                    <div className="fab-panel-row">
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
                    <div className="fab-panel-row">
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
                    <button type="submit" className="btn">
                        Add task
                    </button>
                </form>
            )}
            <button className="fab" onClick={toggleOpen} title="Add a task for any date">
                {open ? '×' : '+'}
            </button>
        </>
    );
}
