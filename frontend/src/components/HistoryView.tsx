import {useDeferredValue, useMemo, useState} from 'react';
import {CheckCheck, History, Inbox, SearchX, Trash2} from 'lucide-react';
import type {AppNotification} from '../types';
import {formatNotifyDay, formatNotifyWhen, notifyKindLabel} from '../notify';

type Props = {
    items: AppNotification[];
    unreadCount: number;
    onRead: (id: number) => void;
    onReadAll: () => void;
    onDelete: (id: number) => void;
    onClear: () => void;
};

type FilterKey = 'all' | 'unread' | 'daily' | 'weekly' | 'due' | 'test';

const FILTERS: {key: FilterKey; label: string}[] = [
    {key: 'all', label: 'All'},
    {key: 'unread', label: 'Unread'},
    {key: 'daily', label: 'Daily'},
    {key: 'weekly', label: 'Weekly'},
    {key: 'due', label: 'Reminders'},
    {key: 'test', label: 'Tests'},
];

function matchesFilter(item: AppNotification, filter: FilterKey): boolean {
    switch (filter) {
        case 'unread':
            return !item.read;
        case 'daily':
        case 'weekly':
        case 'due':
        case 'test':
            return item.kind === filter;
        default:
            return true;
    }
}

export function HistoryView({items, unreadCount, onRead, onReadAll, onDelete, onClear}: Props) {
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [filter, setFilter] = useState<FilterKey>('all');

    const counts = useMemo(() => {
        const byKind = {daily: 0, weekly: 0, due: 0, test: 0};
        for (const item of items) {
            if (item.kind in byKind) byKind[item.kind as keyof typeof byKind] += 1;
        }
        return byKind;
    }, [items]);

    const visible = useMemo(() => {
        const term = deferredSearch.trim().toLowerCase();
        return items.filter((item) => {
            if (!matchesFilter(item, filter)) return false;
            if (!term) return true;
            return (
                item.title.toLowerCase().includes(term) ||
                item.body.toLowerCase().includes(term) ||
                notifyKindLabel(item.kind).toLowerCase().includes(term)
            );
        });
    }, [items, filter, deferredSearch]);

    const groups = useMemo(() => {
        const buckets: {label: string; items: AppNotification[]}[] = [];
        const index = new Map<string, number>();
        for (const item of visible) {
            const label = formatNotifyDay(item.createdAt);
            const existing = index.get(label);
            if (existing == null) {
                index.set(label, buckets.length);
                buckets.push({label, items: [item]});
            } else {
                buckets[existing].items.push(item);
            }
        }
        return buckets;
    }, [visible]);

    return (
        <div className="all-tasks-view history-view">
            <header className="all-tasks-hero">
                <div className="all-tasks-hero-text">
                    <h2 className="all-tasks-hero-title">History</h2>
                    <p className="all-tasks-hero-sub">
                        {items.length} alert{items.length === 1 ? '' : 's'}
                        {unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
                    </p>
                </div>
                <div className="task-view-header-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={onReadAll} disabled={unreadCount === 0}>
                        <CheckCheck size={14} />
                        Mark all read
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={onClear} disabled={items.length === 0}>
                        <Trash2 size={14} />
                        Clear history
                    </button>
                </div>
            </header>

            <div className="all-tasks-layout">
                <div className="all-tasks-main">
                    <div className="all-tasks-controls">
                        <input
                            className="input all-tasks-search"
                            placeholder="Search alerts…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="tag-filter-row">
                        {FILTERS.map((f) => (
                            <button
                                type="button"
                                key={f.key}
                                className={`tag-chip ${filter === f.key ? 'tag-chip-active' : ''}`}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {visible.length === 0 ? (
                        <div className="all-tasks-empty">
                            <span className="all-tasks-empty-icon">
                                {items.length === 0 ? <Inbox size={22} /> : <SearchX size={22} />}
                            </span>
                            <p>
                                {items.length === 0
                                    ? 'No alerts yet. Turn on application notifications in Settings, then send a test.'
                                    : 'Nothing matches that filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="all-tasks-list-scroll history-scroll">
                            {groups.map((group) => (
                                <section key={group.label} className="history-group">
                                    <h3 className="history-group-title">{group.label}</h3>
                                    <div className="history-list">
                                        {group.items.map((item) => (
                                            <article
                                                key={item.id}
                                                className={`history-item ${item.read ? 'read' : 'unread'}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="history-item-body"
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
                                                <button
                                                    type="button"
                                                    className="icon-btn ghost history-item-delete"
                                                    title="Remove from history"
                                                    onClick={() => onDelete(item.id)}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </div>

                <aside className="all-tasks-side">
                    <div className="side-card">
                        <span className="side-card-title">Inbox</span>
                        <div className="hero-figure">{unreadCount}</div>
                        <p className="settings-hint">unread</p>
                    </div>
                    <div className="side-card">
                        <span className="side-card-title">By type</span>
                        <ul className="side-stat-list">
                            <li>
                                <History size={14} />
                                <span className="side-stat-label">Daily</span>
                                <span className="side-stat-value">{counts.daily}</span>
                            </li>
                            <li>
                                <span className="side-stat-label">Weekly</span>
                                <span className="side-stat-value">{counts.weekly}</span>
                            </li>
                            <li>
                                <span className="side-stat-label">Reminders</span>
                                <span className="side-stat-value">{counts.due}</span>
                            </li>
                            <li>
                                <span className="side-stat-label">Tests</span>
                                <span className="side-stat-value">{counts.test}</span>
                            </li>
                            <li className="side-stat-total">
                                <span className="side-stat-label">Total kept</span>
                                <span className="side-stat-value">{items.length}</span>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
}
