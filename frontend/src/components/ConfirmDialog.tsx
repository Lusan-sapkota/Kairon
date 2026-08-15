import {createPortal} from 'react-dom';
import {RotateCw, TriangleAlert} from 'lucide-react';

type Props = {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmDialog({title, message, confirmLabel = 'Delete', onConfirm, onCancel}: Props) {
    return createPortal(
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-panel confirm-panel" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-hero">
                    <div className="confirm-hero-accent" />
                    <div className="confirm-hero-body">
                        <div className="confirm-icon-wrap">
                            <TriangleAlert size={22} />
                        </div>
                        <div>
                            <p className="modal-hero-kicker">Confirm action</p>
                            <h2 className="confirm-title">{title}</h2>
                        </div>
                    </div>
                </div>
                <p className="confirm-message">{message}</p>
                <div className="modal-footer confirm-footer">
                    <button type="button" className="btn btn-ghost" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-danger btn-danger-solid" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export function RestartRequiredDialog({onRestart}: {onRestart: () => void}) {
    return createPortal(
        <div className="modal-overlay restart-required-overlay">
            <div className="modal-panel confirm-panel" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-hero">
                    <div className="confirm-hero-accent" />
                    <div className="confirm-hero-body">
                        <div className="confirm-icon-wrap">
                            <RotateCw size={22} />
                        </div>
                        <div>
                            <p className="modal-hero-kicker">Restart required</p>
                            <h2 className="confirm-title">Restart Kairon</h2>
                        </div>
                    </div>
                </div>
                <p className="confirm-message">
                    Those files are gone. This window cannot keep running and will crash if you stay here. Restart now so Kairon can open a clean copy.
                </p>
                <div className="modal-footer confirm-footer">
                    <button type="button" className="btn" onClick={onRestart}>
                        <RotateCw size={15} />
                        Restart now
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
