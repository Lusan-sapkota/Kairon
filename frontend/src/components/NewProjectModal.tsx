import {useState} from 'react';
import {createPortal} from 'react-dom';

const PROJECT_COLORS = ['#ff8552', '#f5a623', '#f5484c', '#2ecc71', '#14b8a6', '#4d94ff', '#8b5cf6', '#ec4899'];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

type Props = {
    onClose: () => void;
    onCreate: (input: {name: string; color: string; tags: string}) => void;
};

export function NewProjectModal({onClose, onCreate}: Props) {
    const [name, setName] = useState('');
    const [color, setColor] = useState(PROJECT_COLORS[0]);
    const [hexDraft, setHexDraft] = useState(PROJECT_COLORS[0]);
    const [tags, setTags] = useState('');

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
        onCreate({name: name.trim(), color, tags: tags.trim()});
    }

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <form className="modal-panel modal-panel-lg" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
                <div className="modal-header">
                    <span>New project</span>
                    <button type="button" className="icon-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <input
                    autoFocus
                    className="input"
                    placeholder="Project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <div className="modal-field">
                    <label className="modal-field-label">Color</label>
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

                <input
                    className="input"
                    placeholder="Tags (comma separated, e.g. work, urgent)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />

                <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn">
                        Add project
                    </button>
                </div>
            </form>
        </div>,
        document.body
    );
}
