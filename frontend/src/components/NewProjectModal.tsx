import {useState} from 'react';

const PROJECT_COLORS = ['#ff8552', '#f5a623', '#4d94ff', '#2ecc71', '#14b8a6', '#ec4899'];

type Props = {
    onClose: () => void;
    onCreate: (input: {name: string; color: string; tags: string}) => void;
};

export function NewProjectModal({onClose, onCreate}: Props) {
    const [name, setName] = useState('');
    const [color, setColor] = useState(PROJECT_COLORS[0]);
    const [tags, setTags] = useState('');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate({name: name.trim(), color, tags: tags.trim()});
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <form className="modal-panel" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
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

                <div className="detail-field-row">
                    <label>Color</label>
                    <div className="color-swatches">
                        {PROJECT_COLORS.map((c) => (
                            <button
                                type="button"
                                key={c}
                                className={`swatch ${color === c ? 'swatch-selected' : ''}`}
                                style={{background: c}}
                                onClick={() => setColor(c)}
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
        </div>
    );
}
