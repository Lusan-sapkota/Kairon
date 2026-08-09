import {useState} from 'react';
import {createPortal} from 'react-dom';
import {Plus, X, CalendarClock, Flag, FolderKanban} from 'lucide-react';
import type {Project} from '../types';
import {PRIORITIES} from '../types';

type Props = {
    projects: Project[];
    initialDueDate?: string;
    initialProjectId?: number;
    onAdd: (input: {title: string; notes?: string; dueDate?: string; priority: number; projectId?: number}) => void;
};

export function FloatingQuickAdd({projects, initialDueDate, initialProjectId, onAdd}: Props) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState(initialDueDate ?? '');
    const [priority, setPriority] = useState(0);
    const [projectId, setProjectId] = useState<number | undefined>(initialProjectId);

    function toggleOpen() {
        setOpen((wasOpen) => {
            if (!wasOpen) {
                setTitle('');
                setNotes('');
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
        onAdd({title: title.trim(), notes: notes.trim() || undefined, dueDate: dueDate || undefined, priority, projectId});
        setTitle('');
        setNotes('');
        setOpen(false);
    }

    return (
        <>
            {open &&
                createPortal(
                    <div className="modal-overlay" onClick={() => setOpen(false)}>
                        <form
                            className="modal-panel modal-panel-xl"
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={submit}
                        >
                            <div className="modal-header">
                                <span>New task, any date</span>
                                <button type="button" className="icon-btn" onClick={() => setOpen(false)}>
                                    <X size={16} />
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
                                <label><CalendarClock />Due date</label>
                                <input
                                    type="date"
                                    className="input input-sm"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>

                            <div className="detail-field-row">
                                <label><Flag />Priority</label>
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
                                <label><FolderKanban />Category</label>
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
                                placeholder="Notes (optional)…"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />

                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn">
                                    <Plus size={15} />Add task
                                </button>
                            </div>
                        </form>
                    </div>,
                    document.body
                )}
            <button className={`fab ${open ? 'fab-open' : ''}`} onClick={toggleOpen} title="Add a task for any date">
                <Plus />
            </button>
        </>
    );
}
