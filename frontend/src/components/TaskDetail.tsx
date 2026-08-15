import {useEffect, useState} from 'react';
import {X, CalendarClock, Flag, FolderKanban, StickyNote, Eye, Pencil, CheckCircle2, Circle, Repeat} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {Project, Task} from '../types';
import {PRIORITIES, formatShortDate, isOverdue, priorityLabel, repeatLabel} from '../types';
import {normalizeMarkdown, markdownComponents} from '../markdown';
import {RepeatSelect} from './RepeatSelect';

type Props = {
    task: Task;
    projects: Project[];
    onClose: () => void;
    onSave: (input: {id: number; title: string; notes: string; dueDate?: string; priority: number; projectId?: number; repeat?: string}) => void;
    onDelete: (id: number) => void;
};

export function TaskDetail({task, projects, onClose, onSave, onDelete}: Props) {
    const [title, setTitle] = useState(task.title);
    const [notes, setNotes] = useState(task.notes);
    const [dueDate, setDueDate] = useState(task.dueDate ?? '');
    const [priority, setPriority] = useState(task.priority);
    const [projectId, setProjectId] = useState<number | undefined>(task.projectId);
    const [repeat, setRepeat] = useState(task.repeat ?? '');
    const [previewing, setPreviewing] = useState(!!task.notes);

    const project = projects.find((p) => p.id === projectId);
    const accent = project?.color ?? '#ff8552';

    useEffect(() => {
        setTitle(task.title);
        setNotes(task.notes);
        setDueDate(task.dueDate ?? '');
        setPriority(task.priority);
        setProjectId(task.projectId);
        setRepeat(task.repeat ?? '');
        setPreviewing(!!task.notes);
    }, [task]);

    function save(overrides: Partial<{title: string; notes: string; dueDate: string; priority: number; projectId?: number; repeat: string}> = {}) {
        const merged = {
            title,
            notes,
            dueDate,
            priority,
            projectId,
            repeat,
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
            repeat: merged.repeat || undefined,
        });
    }

    return (
        <div className="detail-overlay" onClick={onClose}>
            <div className="detail-panel" onClick={(e) => e.stopPropagation()} style={{'--modal-accent': accent} as React.CSSProperties}>
                <div className="modal-hero modal-hero-detail">
                    <div className="modal-hero-accent" />
                    <div className="modal-hero-body">
                        <div className="modal-hero-top">
                            <div className="modal-hero-identity">
                                <span className="modal-hero-mark" style={{background: accent}}>
                                    {project?.name.charAt(0).toUpperCase() ?? 'T'}
                                </span>
                                <div>
                                    <p className="modal-hero-kicker">Task details</p>
                                    <div className="modal-hero-chips">
                                        <span className={`modal-chip ${task.done ? 'modal-chip-done' : ''}`}>
                                            {task.done ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                            {task.done ? 'Completed' : 'Open'}
                                        </span>
                                        {project && <span className="modal-chip">{project.name}</span>}
                                        {task.dueDate && (
                                            <span className={`modal-chip ${isOverdue(task) ? 'modal-chip-overdue' : ''}`}>
                                                <CalendarClock size={12} />
                                                {formatShortDate(task.dueDate)}
                                            </span>
                                        )}
                                        {priority > 0 && (
                                            <span className="modal-chip">
                                                <Flag size={12} />
                                                {priorityLabel(priority)}
                                            </span>
                                        )}
                                        {repeat && (
                                            <span className="modal-chip">
                                                <Repeat size={12} />
                                                {repeatLabel(repeat)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button type="button" className="icon-btn modal-close" onClick={onClose} title="Close">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="detail-panel-body">
                    <div className="detail-header">
                        <input
                            className="input detail-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => save()}
                            placeholder="Task title"
                        />
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
                        <div className="detail-meta-cell">
                            <span className="detail-meta-label"><Repeat size={13} />Repeat</span>
                            <RepeatSelect
                                value={repeat}
                                onChange={(value) => {
                                    setRepeat(value);
                                    save({repeat: value});
                                }}
                            />
                        </div>
                    </div>

                    <div className="detail-notes-section">
                        <div className="detail-notes-header">
                            <span className="detail-meta-label"><StickyNote size={13} />Notes</span>
                            <button
                                type="button"
                                className="icon-btn ghost"
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
                        <button type="button" className="btn btn-danger" onClick={() => onDelete(task.id)}>Delete task</button>
                        <button type="button" className="btn" onClick={() => save()}>Save changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
