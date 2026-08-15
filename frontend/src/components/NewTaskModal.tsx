import {useState} from 'react';
import {createPortal} from 'react-dom';
import {X, CalendarClock, Flag, FolderKanban, Plus, ListTodo, Repeat} from 'lucide-react';
import type {Project} from '../types';
import {PRIORITIES} from '../types';
import {RepeatSelect} from './RepeatSelect';

type Props = {
    projects: Project[];
    initialDueDate?: string;
    initialProjectId?: number;
    onClose: () => void;
    onCreate: (input: {title: string; notes?: string; dueDate?: string; priority: number; projectId?: number; repeat?: string}) => void;
};

export function NewTaskModal({projects, initialDueDate, initialProjectId, onClose, onCreate}: Props) {
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState(initialDueDate ?? '');
    const [priority, setPriority] = useState(0);
    const [projectId, setProjectId] = useState<number | undefined>(initialProjectId);
    const [repeat, setRepeat] = useState('');

    const project = projects.find((p) => p.id === projectId);
    const accent = project?.color ?? '#ff8552';

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate({title: title.trim(), notes, dueDate: dueDate || undefined, priority, projectId, repeat: repeat || undefined});
    }

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <form
                className="modal-panel modal-panel-xl modal-panel-has-hero"
                style={{'--modal-accent': accent} as React.CSSProperties}
                onClick={(e) => e.stopPropagation()}
                onSubmit={submit}
            >
                <div className="modal-hero">
                    <div className="modal-hero-accent" />
                    <div className="modal-hero-body">
                        <div className="modal-hero-top">
                            <div className="modal-hero-identity">
                                <span className="modal-hero-icon-wrap">
                                    <ListTodo size={22} />
                                </span>
                                <div>
                                    <h2 className="modal-hero-title">New task</h2>
                                    <p className="modal-hero-sub">Capture what needs doing  due date, priority, and project are optional.</p>
                                </div>
                            </div>
                            <button type="button" className="icon-btn modal-close" onClick={onClose}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="modal-panel-body modal-panel-body-fill">
                    <input
                        autoFocus
                        className="input modal-title-input"
                        placeholder="Task title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <div className="detail-meta-grid">
                        <div className="detail-meta-cell">
                            <span className="detail-meta-label"><CalendarClock size={13} />Due date</span>
                            <input
                                type="date"
                                className="input input-sm"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

                        <div className="detail-meta-cell">
                            <span className="detail-meta-label"><Flag size={13} />Priority</span>
                            <select
                                className="input input-sm"
                                value={priority}
                                onChange={(e) => setPriority(Number(e.target.value))}
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="detail-meta-cell">
                            <span className="detail-meta-label"><FolderKanban size={13} />Project</span>
                            <select
                                className="input input-sm"
                                value={projectId ?? ''}
                                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <option value="">No project</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="detail-meta-cell">
                            <span className="detail-meta-label"><Repeat size={13} />Repeat</span>
                            <RepeatSelect value={repeat} onChange={setRepeat} />
                        </div>
                    </div>

                    <div className="detail-notes-section">
                        <div className="detail-notes-header">
                            <span className="detail-meta-label">Notes</span>
                        </div>
                        <textarea
                            className="input textarea detail-notes-textarea"
                            placeholder="Add details… (Markdown supported)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="modal-footer detail-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn">
                            <Plus size={15} />Add task
                        </button>
                    </div>
                </div>
            </form>
        </div>,
        document.body
    );
}
