import {useState} from 'react';
import {createPortal} from 'react-dom';
import {X, Plus, Palette, Check, FolderKanban} from 'lucide-react';
import type {Project} from '../types';

const PROJECT_COLORS = ['#ff8552', '#f5a623', '#f5484c', '#2ecc71', '#14b8a6', '#4d94ff', '#8b5cf6', '#ec4899'];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

type Props = {
    project?: Project;
    onClose: () => void;
    onSave: (input: {id?: number; name: string; color: string; tags: string}) => void;
};

export function NewProjectModal({project, onClose, onSave}: Props) {
    const isEdit = !!project;
    const [name, setName] = useState(project?.name ?? '');
    const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0]);
    const [hexDraft, setHexDraft] = useState(project?.color ?? PROJECT_COLORS[0]);
    const [tags, setTags] = useState(project?.tags ?? '');

    function pickColor(c: string) {
        setColor(c);
        setHexDraft(c);
    }

    function handleHexChange(v: string) {
        setHexDraft(v);
        if (HEX_RE.test(v)) setColor(v);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
            id: project?.id,
            name: name.trim(),
            color,
            tags: tags.trim(),
        });
    }

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <form
                className="modal-panel modal-panel-lg modal-panel-has-hero"
                style={{'--modal-accent': color} as React.CSSProperties}
                onClick={(e) => e.stopPropagation()}
                onSubmit={submit}
            >
                <div className="modal-hero">
                    <div className="modal-hero-accent" />
                    <div className="modal-hero-body">
                        <div className="modal-hero-top">
                            <div className="modal-hero-identity">
                                <span className="modal-hero-mark" style={{background: color}}>
                                    {name.trim().charAt(0).toUpperCase() || <FolderKanban size={18} />}
                                </span>
                                <div>
                                    <h2 className="modal-hero-title">{isEdit ? 'Edit project' : 'New project'}</h2>
                                    <p className="modal-hero-sub">
                                        {isEdit ? 'Update the name, color, and tags for this project.' : 'Group related tasks with a color and optional tags.'}
                                    </p>
                                </div>
                            </div>
                            <button type="button" className="icon-btn modal-close" onClick={onClose}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="modal-panel-body">
                    <div className="modal-field">
                        <label className="modal-field-label">Project name</label>
                        <input
                            autoFocus
                            className="input"
                            placeholder="e.g. Kairon, Personal, Work"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="modal-field">
                        <label className="modal-field-label"><Palette size={13} />Color</label>
                        <div className="color-picker-row">
                            <span className="color-preview" style={{background: color}}>
                                {name.trim().charAt(0).toUpperCase() || '?'}
                            </span>
                            <input
                                type="color"
                                className="color-input-native"
                                value={color}
                                onChange={(e) => pickColor(e.target.value)}
                                title="Pick a custom color"
                            />
                            <input
                                className="input input-sm color-hex-input"
                                value={hexDraft}
                                onChange={(e) => handleHexChange(e.target.value)}
                                onBlur={() => setHexDraft(color)}
                                maxLength={7}
                                spellCheck={false}
                            />
                        </div>
                        <div className="color-swatches">
                            {PROJECT_COLORS.map((c) => (
                                <button
                                    type="button"
                                    key={c}
                                    className={`swatch ${color === c ? 'swatch-selected' : ''}`}
                                    style={{background: c}}
                                    onClick={() => pickColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="modal-field">
                        <label className="modal-field-label">Tags</label>
                        <input
                            className="input"
                            placeholder="Comma separated, e.g. work, urgent"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn">
                            {isEdit ? (
                                <><Check size={15} />Save changes</>
                            ) : (
                                <><Plus size={15} />Add project</>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>,
        document.body
    );
}
