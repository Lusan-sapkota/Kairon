import {memo, useCallback, useDeferredValue, useEffect, useMemo, useState} from 'react';
import {Plus, NotebookPen, Eye, Pencil, Search, Trash2} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {Note, Project} from '../types';
import {normalizeMarkdown, markdownComponents} from '../markdown';

type Props = {
    notes: Note[];
    projects: Project[];
    onCreate: () => Promise<Note>;
    onSave: (note: {id: number; title: string; content: string; projectId?: number}) => void;
    onDelete: (id: number) => void;
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
}

function formatFullDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
}

function wordCount(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
}

type NoteRailItemProps = {
    note: Note;
    project?: Project;
    active: boolean;
    onSelect: (id: number) => void;
};

const NoteRailItem = memo(function NoteRailItem({note, project, active, onSelect}: NoteRailItemProps) {
    const preview = note.content.trim() ? note.content.replace(/\s+/g, ' ').slice(0, 80) : 'Empty note';
    return (
        <button
            type="button"
            className={`note-list-item ${active ? 'active' : ''}`}
            onClick={() => onSelect(note.id)}
        >
            <span className="note-list-title">{note.title || 'Untitled note'}</span>
            <span className="note-list-preview">{preview}</span>
            <span className="note-list-meta">
                <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                {project && (
                    <span className="note-list-project" style={{color: project.color}}>
                        <span className="dot" style={{background: project.color}} />
                        {project.name}
                    </span>
                )}
                {note.taskId && <span className="note-list-badge">From task</span>}
            </span>
        </button>
    );
});

export function NotesView({notes, projects, onCreate, onSave, onDelete}: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(notes[0]?.id ?? null);
    const selected = notes.find((n) => n.id === selectedId) ?? null;
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [projectId, setProjectId] = useState<number | undefined>(undefined);
    const [previewing, setPreviewing] = useState(false);

    const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

    const visible = useMemo(() => {
        const term = deferredSearch.trim().toLowerCase();
        if (!term) return notes;
        return notes.filter(
            (n) =>
                n.title.toLowerCase().includes(term) ||
                n.content.toLowerCase().includes(term)
        );
    }, [notes, deferredSearch]);

    useEffect(() => {
        setTitle(selected?.title ?? '');
        setContent(selected?.content ?? '');
        setProjectId(selected?.projectId);
        setPreviewing(!!selected?.content);
    }, [selectedId]);

    useEffect(() => {
        if (selectedId !== null && !notes.some((n) => n.id === selectedId)) {
            setSelectedId(null);
        }
    }, [notes, selectedId]);

    const selectNote = useCallback((id: number) => {
        setSelectedId(id);
    }, []);

    async function handleCreate() {
        const note = await onCreate();
        setSelectedId(note.id);
        setPreviewing(false);
    }

    function save(overrides: Partial<{title: string; content: string; projectId?: number}> = {}) {
        if (!selected) return;
        const merged = {title, content, projectId, ...overrides};
        onSave({
            id: selected.id,
            title: merged.title || 'Untitled note',
            content: merged.content,
            projectId: merged.projectId,
        });
    }

    const words = wordCount(content);
    const linkedProject = projectId ? projectById.get(projectId) : undefined;

    return (
        <div className="notes-view">
            <aside className="notes-rail">
                <div className="notes-rail-header">
                    <div>
                        <h2 className="notes-rail-title">Notes</h2>
                        <p className="notes-rail-sub">{notes.length} note{notes.length === 1 ? '' : 's'}</p>
                    </div>
                    <button className="btn btn-sm" onClick={handleCreate} title="New note">
                        <Plus size={14} />
                        New
                    </button>
                </div>

                <div className="notes-search-wrap">
                    <Search size={14} className="notes-search-icon" />
                    <input
                        className="input notes-search"
                        placeholder="Search notes…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="notes-list">
                    {visible.map((n) => (
                        <NoteRailItem
                            key={n.id}
                            note={n}
                            project={n.projectId ? projectById.get(n.projectId) : undefined}
                            active={n.id === selectedId}
                            onSelect={selectNote}
                        />
                    ))}
                    {visible.length === 0 && (
                        <p className="empty-hint notes-list-empty">
                            {notes.length === 0 ? 'No notes yet' : 'No notes match your search'}
                        </p>
                    )}
                </div>
            </aside>

            <section className="note-workspace">
                {selected ? (
                    <>
                        <div className="note-workspace-toolbar">
                            <div className="note-workspace-meta">
                                <span className="note-workspace-date">
                                    Updated {formatFullDate(selected.updatedAt || selected.createdAt)}
                                </span>
                                {linkedProject && (
                                    <span className="note-list-project" style={{color: linkedProject.color}}>
                                        <span className="dot" style={{background: linkedProject.color}} />
                                        {linkedProject.name}
                                    </span>
                                )}
                                {selected.taskId && (
                                    <span className="note-source-badge">
                                        From task · {formatFullDate(selected.createdAt)}
                                    </span>
                                )}
                            </div>
                            <div className="note-workspace-actions">
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
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className={`btn btn-ghost btn-sm ${previewing ? 'note-mode-active' : ''}`}
                                    onClick={() => setPreviewing((p) => !p)}
                                    title={previewing ? 'Edit' : 'Preview markdown'}
                                >
                                    {previewing ? <Pencil size={14} /> : <Eye size={14} />}
                                    {previewing ? 'Edit' : 'Preview'}
                                </button>
                                <button className="btn btn-sm" onClick={() => save()}>
                                    Save
                                </button>
                                <button
                                    className="icon-btn"
                                    title="Delete note"
                                    onClick={() => onDelete(selected.id)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <input
                            className="note-title-field"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => save()}
                            placeholder="Untitled note"
                        />

                        {previewing ? (
                            <div className="note-content note-preview">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                    {normalizeMarkdown(content)}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <textarea
                                className="note-body-field"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onBlur={() => save()}
                                placeholder="Start writing… Markdown supported"
                            />
                        )}

                        <footer className="note-workspace-footer">
                            <span>
                                {words} word{words === 1 ? '' : 's'}
                            </span>
                            <span>Markdown · autosaves on blur</span>
                        </footer>
                    </>
                ) : (
                    <div className="notes-empty-state">
                        <span className="notes-empty-icon">
                            <NotebookPen size={28} strokeWidth={1.5} />
                        </span>
                        <h3 className="notes-empty-title">Your notes live here</h3>
                        <p className="empty-hint">Capture ideas, meeting scraps, and project context.</p>
                        <button className="btn" onClick={handleCreate}>
                            <Plus size={15} />
                            New note
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
