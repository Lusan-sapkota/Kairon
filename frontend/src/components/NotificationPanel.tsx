import {Bell, CheckCheck, History, Trash2, X} from 'lucide-react';
import type {AppNotification} from '../types';
import {formatNotifyWhen, notifyKindLabel} from '../notify';

type Props = {
    items: AppNotification[];
    onClose: () => void;
    onRead: (id: number) => void;
    onReadAll: () => void;
    onClear: () => void;
    onOpenHistory: () => void;
};

export function NotificationPanel({items, onClose, onRead, onReadAll, onClear, onOpenHistory}: Props) {
    return (
        <div className="notify-overlay" onClick={onClose}>
            <aside className="notify-panel" onClick={(e) => e.stopPropagation()} aria-label="Notifications">
                <header className="notify-panel-head">
                    <div className="notify-panel-title">
                        <Bell size={16} />
                        <h2>Notifications</h2>
                    </div>
                    <button type="button" className="icon-btn" onClick={onClose} title="Close">
                        <X size={16} />
                    </button>
                </header>
                <div className="notify-panel-actions">
                    <button type="button" className="btn btn-ghost" onClick={onReadAll} disabled={items.every((n) => n.read)}>
                        <CheckCheck size={14} />
                        Mark all read
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={onClear} disabled={items.length === 0}>
                        <Trash2 size={14} />
                        Clear
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                            onOpenHistory();
                            onClose();
                        }}
                    >
                        <History size={14} />
                        History
                    </button>
                </div>
                {items.length === 0 ? (
                    <p className="notify-empty">No notifications yet. Turn them on in Settings when you want daily, weekly, or due reminders in the app.</p>
                ) : (
                    <div className="notify-list">
                        {items.map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                className={`notify-item ${item.read ? 'read' : 'unread'}`}
                                onClick={() => {
                                    if (!item.read) onRead(item.id);
                                }}
                            >
                                <div className="notify-item-meta">
                                    <span className="notify-kind">{notifyKindLabel(item.kind)}</span>
                                    <span className="notify-when">{formatNotifyWhen(item.createdAt)}</span>
                                </div>
                                <strong>{item.title}</strong>
                                {item.body && <p>{item.body}</p>}
                            </button>
                        ))}
                    </div>
                )}
            </aside>
        </div>
    );
}
