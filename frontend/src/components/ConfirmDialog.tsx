import {createPortal} from 'react-dom';
import {TriangleAlert} from 'lucide-react';

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
                <div className="confirm-title">
                    <TriangleAlert size={18} />
                    {title}
                </div>
                <p className="confirm-message">{message}</p>
                <div className="modal-footer">
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
