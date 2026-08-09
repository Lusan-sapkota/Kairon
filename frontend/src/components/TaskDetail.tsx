import {useEffect, useState} from 'react';
import {X, CalendarClock, Flag, FolderKanban, StickyNote, Eye, Pencil} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {Project, Task} from '../types';
import {PRIORITIES} from '../types';
import {normalizeMarkdown, markdownComponents} from '../markdown';

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
    const [previewing, setPreviewing] = useState(!!task.notes);

    useEffect(() => {
        setTitle(task.title);
        setNotes(task.notes);
        setDueDate(task.dueDate ?? '');
        setPriority(task.priority);
        setProjectId(task.projectId);
        // Default to preview for tasks that already have notes; empty notes have
        // nothing to preview, so drop straight into editing them.
        setPreviewing(!!task.notes);
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
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>

                <div className="detail-meta-grid">
                    <div className="detail-meta-cell">
                        <span className="detail-meta-label"><CalendarClock size={13} />Due date</span>
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

                    <div className="detail-meta-cell">
                        <span className="detail-meta-label"><Flag size={13} />Priority</span>
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

                    <div className="detail-meta-cell">
                        <span className="detail-meta-label"><FolderKanban size={13} />Project</span>
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
                </div>

                <div className="detail-notes-section">
                    <div className="detail-notes-header">
                        <span className="detail-meta-label"><StickyNote size={13} />Notes</span>
                        <button
                            className="icon-btn"
                            onClick={() => setPreviewing((p) => !p)}
                            title={previewing ? 'Edit' : 'Preview markdown'}
                        >
                            {previewing ? <Pencil size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                    {previewing ? (
                        <div className="detail-notes-textarea note-preview">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{normalizeMarkdown(notes)}</ReactMarkdown>
                        </div>
                    ) : (
                        <textarea
                            className="input textarea detail-notes-textarea"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={() => save()}
                            placeholder="Add details… (Markdown supported)"
                        />
                    )}
                </div>

                <div className="detail-footer">
                    <button className="btn btn-danger" onClick={() => onDelete(task.id)}>Delete task</button>
                    <button className="btn" onClick={() => save()}>Save</button>
                </div>
            </div>
        </div>
    );
}
