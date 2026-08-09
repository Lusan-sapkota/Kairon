import {useEffect, useState} from 'react';
import {Plus, NotebookPen, Eye, Pencil} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {Note, Project} from '../types';

type Props = {
    notes: Note[];
    projects: Project[];
    onCreate: () => Promise<Note>;
    onSave: (note: {id: number; title: string; content: string; projectId?: number}) => void;
    onDelete: (id: number) => void;
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
}

// Converts pasted `<Image src="…" alt="…" caption="…" />` component tags into
// standard Markdown image syntax so they render like any other markdown image.
function normalizeMarkdown(md: string): string {
    return md.replace(/<Image\b([^>]*)\/?>/gi, (_match, rawAttrs: string) => {
        const attrs: Record<string, string> = {};
        const attrPattern = /(\w+)\s*=\s*"([^"]*)"|(\w+)\s*=\s*'([^']*)'/g;
        let m: RegExpExecArray | null;
        while ((m = attrPattern.exec(rawAttrs))) {
            const key = (m[1] ?? m[3]).toLowerCase();
            attrs[key] = m[2] ?? m[4] ?? '';
        }
        if (!attrs.src) return _match;
        const image = `![${attrs.alt ?? ''}](${attrs.src})`;
        return attrs.caption ? `${image}\n*${attrs.caption}*` : image;
    });
}

export function NotesView({notes, projects, onCreate, onSave, onDelete}: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(notes[0]?.id ?? null);
    const selected = notes.find((n) => n.id === selectedId) ?? null;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [projectId, setProjectId] = useState<number | undefined>(undefined);
    const [previewing, setPreviewing] = useState(false);

    useEffect(() => {
        setTitle(selected?.title ?? '');
        setContent(selected?.content ?? '');
        setProjectId(selected?.projectId);
        setPreviewing(false);
    }, [selectedId]);

    async function handleCreate() {
        const note = await onCreate();
        setSelectedId(note.id);
    }

    function save(overrides: Partial<{title: string; content: string; projectId?: number}> = {}) {
        if (!selected) return;
        const merged = {title, content, projectId, ...overrides};
        onSave({id: selected.id, title: merged.title || 'Untitled note', content: merged.content, projectId: merged.projectId});
    }

    return (
        <div className="notes-layout">
            <div className="notes-list-panel">
                <div className="notes-list-header">
                    <span>Notes</span>
                    <button className="icon-btn" onClick={handleCreate} title="New note"><Plus size={14} /></button>
                </div>
                <div className="notes-list">
                    {notes.map((n) => (
                        <div
                            key={n.id}
                            className={`note-list-item ${n.id === selectedId ? 'active' : ''}`}
                            onClick={() => setSelectedId(n.id)}
                        >
                            <span className="note-list-title">{n.title || 'Untitled note'}</span>
                            {n.taskId && (
                                <span className="note-source-badge">From task · {formatDate(n.createdAt)}</span>
                            )}
                            <span className="note-list-preview">{n.content.slice(0, 60)}</span>
                        </div>
                    ))}
                    {notes.length === 0 && <p className="empty-hint">No notes yet</p>}
                </div>
            </div>

            <div className="note-editor">
                {selected ? (
                    <>
                        <div className="note-editor-header">
                            <input
                                className="input note-title-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={() => save()}
                                placeholder="Note title"
                            />
                            {selected.taskId && (
                                <span className="note-source-badge">From task · {formatDate(selected.createdAt)}</span>
                            )}
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
                            <button
                                className="icon-btn"
                                onClick={() => setPreviewing((p) => !p)}
                                title={previewing ? 'Edit' : 'Preview markdown'}
                            >
                                {previewing ? <Pencil size={14} /> : <Eye size={14} />}
                            </button>
                            <button className="btn btn-danger" onClick={() => {
                                onDelete(selected.id);
                                setSelectedId(null);
                            }}>Delete</button>
                        </div>
                        {previewing ? (
                            <div className="note-content note-preview">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(content)}</ReactMarkdown>
                            </div>
                        ) : (
                            <textarea
                                className="input textarea note-content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onBlur={() => save()}
                                placeholder="Write something… (Markdown supported, e.g. ![alt](image-url))"
                            />
                        )}
                    </>
                ) : (
                    <div className="notes-empty-state">
                        <NotebookPen size={30} strokeWidth={1.5} />
                        <p>Select a note or create a new one</p>
                        <button className="btn" onClick={handleCreate}><Plus size={15} />New note</button>
                    </div>
                )}
            </div>
        </div>
    );
}
