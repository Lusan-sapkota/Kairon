import {useCallback, useEffect, useState, type ReactNode} from 'react';
import {
    Bell,
    BookOpen,
    CalendarClock,
    Check,
    Copy,
    Database,
    FolderOpen,
    Inbox,
    Mail,
    Monitor,
    RefreshCw,
    Send,
    Settings as SettingsIcon,
    Trash2,
} from 'lucide-react';
import {BrowserOpenURL, ClipboardSetText, EventsOn} from '../../wailsjs/runtime/runtime';
import {api} from '../api';
import {GuidePanel} from './GuidePanel';
import {ConfirmDialog, RestartRequiredDialog} from './ConfirmDialog';
import {
    QUEUE_TTL_OPTIONS,
    UPDATE_POLL_OPTIONS,
    WEEKDAY_OPTIONS,
    type DataLocations,
    type MailPrefs,
    type MailQueueItem,
    type MailQueueStats,
    type NotifyPrefs,
    type SMTPConfig,
    type UpdateInfo,
} from '../types';

type Section = 'guide' | 'updates' | 'notify' | 'email' | 'queue' | 'data';

type WipeScope = 'db' | 'config' | 'both';

const WIPE_COPY: Record<WipeScope, {title: string; message: string; confirmLabel: string}> = {
    db: {
        title: 'Wipe database?',
        message:
            'This deletes planner.db: tasks, notes, projects, settings, and mail. Downloaded updates in the config folder stay. Kairon must restart afterwards. Make a backup first if you might want any of it back.',
        confirmLabel: 'Wipe database',
    },
    config: {
        title: 'Wipe config folder?',
        message:
            'This deletes downloaded updates and other files beside the database. Your tasks and notes in planner.db stay. Kairon must restart afterwards.',
        confirmLabel: 'Wipe config',
    },
    both: {
        title: 'Wipe config and database?',
        message:
            "This deletes Kairon's config folder and database on this machine, including settings, mail, and downloaded updates. Kairon must restart afterwards. It cannot be undone. Make a backup first if you might want any of it back.",
        confirmLabel: 'Wipe both',
    },
};

function emptySMTP(): SMTPConfig {
    return {
        host: '',
        port: 587,
        username: '',
        password: '',
        passwordSet: false,
        fromName: 'Kairon',
        fromEmail: '',
        toEmail: '',
        security: 'starttls',
    };
}

function emptyNotify(): NotifyPrefs {
    return {
        enabled: false,
        desktop: true,
        inApp: true,
        dailyEnabled: true,
        dailyTime: '08:00',
        weeklyEnabled: false,
        weeklyDay: 1,
        weeklyTime: '09:00',
        dueToday: true,
        dueSoon1: true,
        dueSoon2: false,
        dueSoon3: false,
        overdue: true,
    };
}

function emptyPrefs(): MailPrefs {
    return {
        enabled: false,
        dailyEnabled: true,
        dailyTime: '08:00',
        weeklyEnabled: true,
        weeklyDay: 1,
        weeklyTime: '09:00',
        dueToday: true,
        dueSoon1: true,
        dueSoon2: false,
        dueSoon3: true,
        overdue: true,
        includeNoDue: false,
        includeCompleted: false,
        queueTTL: '48h',
    };
}

function statusLabel(status: string): string {
    switch (status) {
        case 'pending':
            return 'Queued';
        case 'sent':
            return 'Sent';
        case 'failed':
            return 'Failed';
        case 'expired':
            return 'Expired';
        default:
            return status;
    }
}

function kindLabel(kind: string): string {
    switch (kind) {
        case 'daily':
            return 'Daily';
        case 'weekly':
            return 'Weekly';
        case 'due':
            return 'Reminder';
        case 'test':
            return 'Test';
        default:
            return kind;
    }
}

function formatWhen(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
}

function Switch({
    checked,
    disabled,
    onChange,
    label,
    hint,
}: {
    checked: boolean;
    disabled?: boolean;
    onChange: (next: boolean) => void;
    label: string;
    hint?: string;
}) {
    return (
        <label className={`settings-switch-row ${disabled ? 'is-disabled' : ''}`}>
            <span>
                <strong>{label}</strong>
                {hint && <em>{hint}</em>}
            </span>
            <span className="settings-switch">
                <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
                <i />
            </span>
        </label>
    );
}

function Chip({
    checked,
    disabled,
    onChange,
    children,
}: {
    checked: boolean;
    disabled?: boolean;
    onChange: (next: boolean) => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            className={`settings-chip ${checked ? 'on' : ''}`}
            disabled={disabled}
            onClick={() => onChange(!checked)}
        >
            {children}
        </button>
    );
}

function LocationRow({
    label,
    path,
    copied,
    onCopy,
    onOpen,
}: {
    label: string;
    path: string;
    copied: boolean;
    onCopy: () => void;
    onOpen: () => void;
}) {
    return (
        <div className="settings-location">
            <span className="settings-label">{label}</span>
            <div className="settings-path-row">
                <p className="settings-path" title={path}>
                    {path}
                </p>
                <button
                    type="button"
                    className={`settings-location-action ${copied ? 'copied' : ''}`}
                    onClick={onCopy}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
                <button type="button" className="settings-location-action" onClick={onOpen}>
                    <FolderOpen size={14} />
                    Open
                </button>
            </div>
        </div>
    );
}

function ScheduleRows({
    disabled,
    dailyLabel,
    weeklyLabel,
    dailyEnabled,
    dailyTime,
    weeklyEnabled,
    weeklyDay,
    weeklyTime,
    onDailyEnabled,
    onDailyTime,
    onWeeklyEnabled,
    onWeeklyDay,
    onWeeklyTime,
}: {
    disabled?: boolean;
    dailyLabel: string;
    weeklyLabel: string;
    dailyEnabled: boolean;
    dailyTime: string;
    weeklyEnabled: boolean;
    weeklyDay: number;
    weeklyTime: string;
    onDailyEnabled: (next: boolean) => void;
    onDailyTime: (next: string) => void;
    onWeeklyEnabled: (next: boolean) => void;
    onWeeklyDay: (next: number) => void;
    onWeeklyTime: (next: string) => void;
}) {
    return (
        <div className={`settings-schedule ${disabled ? 'is-disabled' : ''}`}>
            <div className="settings-schedule-row">
                <Switch checked={dailyEnabled} disabled={disabled} onChange={onDailyEnabled} label={dailyLabel} />
                <label className="settings-field">
                    <span>Time</span>
                    <input className="input" type="time" value={dailyTime} disabled={disabled || !dailyEnabled} onChange={(e) => onDailyTime(e.target.value)} />
                </label>
            </div>
            <div className="settings-schedule-row weekly">
                <Switch checked={weeklyEnabled} disabled={disabled} onChange={onWeeklyEnabled} label={weeklyLabel} />
                <label className="settings-field">
                    <span>Day</span>
                    <select className="input" value={weeklyDay} disabled={disabled || !weeklyEnabled} onChange={(e) => onWeeklyDay(Number(e.target.value))}>
                        {WEEKDAY_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>
                                {d.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="settings-field">
                    <span>Time</span>
                    <input className="input" type="time" value={weeklyTime} disabled={disabled || !weeklyEnabled} onChange={(e) => onWeeklyTime(e.target.value)} />
                </label>
            </div>
        </div>
    );
}

type Props = {
    updateInfo: UpdateInfo | null;
};

const NAV: {id: Section; label: string; icon: typeof Bell}[] = [
    {id: 'guide', label: 'Guide', icon: BookOpen},
    {id: 'updates', label: 'Updates', icon: RefreshCw},
    {id: 'notify', label: 'Notifications', icon: Bell},
    {id: 'email', label: 'Email', icon: Mail},
    {id: 'queue', label: 'Mail queue', icon: Inbox},
    {id: 'data', label: 'Data', icon: Database},
];

const GITHUB_URL = 'https://github.com/Lusan-sapkota/Kairon';

function GitHubMark({size = 16}: {size?: number}) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-.99-.02-1.94-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.77.12 3.06.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14 0 1.54-.01 2.78-.01 3.16 0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
    );
}

export function SettingsView({updateInfo}: Props) {
    const [section, setSection] = useState<Section>('guide');
    const [version, setVersion] = useState('');
    const [poll, setPoll] = useState('7d');
    const [smtp, setSMTP] = useState<SMTPConfig>(emptySMTP());
    const [prefs, setPrefs] = useState<MailPrefs>(emptyPrefs());
    const [notifyPrefs, setNotifyPrefs] = useState<NotifyPrefs>(emptyNotify());
    const [desktopAvailable, setDesktopAvailable] = useState(true);
    const [queue, setQueue] = useState<MailQueueItem[]>([]);
    const [stats, setStats] = useState<MailQueueStats>({pending: 0, failed: 0, expired: 0, sent: 0});
    const [busy, setBusy] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [locations, setLocations] = useState<DataLocations | null>(null);
    const [dataConfirm, setDataConfirm] = useState<'restore' | WipeScope | null>(null);
    const [restartRequired, setRestartRequired] = useState(false);
    const [copiedPath, setCopiedPath] = useState<'config' | 'db' | null>(null);

    const loadMail = useCallback(async () => {
        const [mail, items, st] = await Promise.all([api.getMailSettings(), api.listMailQueue(), api.getMailQueueStats()]);
        setSMTP({...mail.smtp, password: ''});
        setPrefs(mail.prefs);
        setQueue(items ?? []);
        setStats(st);
    }, []);

    useEffect(() => {
        api.getVersion().then(setVersion).catch(() => {});
        api.getUpdateSettings()
            .then((s) => setPoll(s.pollInterval))
            .catch(() => {});
        loadMail().catch((err) => setError(String(err)));
        api.getNotifyPrefs()
            .then(setNotifyPrefs)
            .catch(() => {});
        api.desktopNotificationsAvailable()
            .then(setDesktopAvailable)
            .catch(() => {});
        api.getDataLocations()
            .then(setLocations)
            .catch(() => {});
        const unsub = EventsOn('data_reload', () => {
            loadMail().catch(() => {});
            api.getNotifyPrefs()
                .then(setNotifyPrefs)
                .catch(() => {});
            api.getDataLocations()
                .then(setLocations)
                .catch(() => {});
        });
        return () => unsub();
    }, [loadMail]);

    useEffect(() => {
        if (!copiedPath) return;
        const t = window.setTimeout(() => setCopiedPath(null), 1800);
        return () => window.clearTimeout(t);
    }, [copiedPath]);

    async function copyLocation(kind: 'config' | 'db', path: string) {
        try {
            await ClipboardSetText(path);
            setCopiedPath(kind);
        } catch {
            setError('Could not copy path');
        }
    }

    async function openLocation(path: string) {
        try {
            await api.openLocalPath(path);
        } catch {
            setError('Could not open that folder');
        }
    }

    async function withBusy(label: string, fn: () => Promise<void>) {
        setBusy(label);
        setError('');
        setNote('');
        try {
            await fn();
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Something went wrong');
        } finally {
            setBusy('');
        }
    }

    return (
        <div className="settings-view">
            <header className="settings-hero">
                <div className="settings-hero-identity">
                    <span className="settings-hero-icon">
                        <SettingsIcon size={22} />
                    </span>
                    <div>
                        <h2 className="settings-hero-title">Settings</h2>
                        <p className="settings-hero-sub">
                            {version ? `Kairon v${version}` : 'Kairon'} · local config only
                        </p>
                    </div>
                </div>
            </header>

            {error && (
                <div className="error-banner" onClick={() => setError('')}>
                    {error}
                </div>
            )}
            {note && (
                <div className="toast-banner" onClick={() => setNote('')}>
                    {note}
                </div>
            )}

            <div className="settings-shell">
                <nav className="settings-rail" aria-label="Settings sections">
                    <div className="settings-rail-items">
                        {NAV.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    type="button"
                                    key={item.id}
                                    className={`settings-rail-item ${section === item.id ? 'active' : ''}`}
                                    onClick={() => setSection(item.id)}
                                >
                                    <Icon size={16} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="settings-rail-foot">
                        <button
                            type="button"
                            className="settings-rail-github"
                            onClick={() => BrowserOpenURL(GITHUB_URL)}
                        >
                            <GitHubMark size={16} />
                            GitHub
                        </button>
                    </div>
                </nav>

                <div className="settings-panel">
                    {section === 'guide' && <GuidePanel />}

                    {section === 'updates' && (
                        <section className="settings-card">
                            <div className="settings-card-head">
                                <span className="settings-card-icon">
                                    <RefreshCw size={16} />
                                </span>
                                <div>
                                    <h3>Updates</h3>
                                    <p>Kairon checks GitHub Releases in the background.</p>
                                </div>
                            </div>
                            {updateInfo?.state === 'ready' && (
                                <p className="settings-hint">
                                    v{updateInfo.currentVersion} → v{updateInfo.version} is downloaded. Use the banner above to apply it.
                                </p>
                            )}
                            <div className="settings-toolbar">
                                <label className="settings-field">
                                    <span>Check frequency</span>
                                    <select
                                        className="input"
                                        value={poll}
                                        onChange={(e) => {
                                            const next = e.target.value;
                                            setPoll(next);
                                            api.setUpdatePollInterval(next).catch(() => {
                                                api.getUpdateSettings()
                                                    .then((s) => setPoll(s.pollInterval))
                                                    .catch(() => {});
                                            });
                                        }}
                                    >
                                        {UPDATE_POLL_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => api.checkForUpdates()}>
                                    Check now
                                </button>
                            </div>
                        </section>
                    )}

                    {section === 'notify' && (
                        <>
                            <section className="settings-card">
                                <div className="settings-card-head">
                                    <span className="settings-card-icon">
                                        <Bell size={16} />
                                    </span>
                                    <div>
                                        <h3>Application notifications</h3>
                                        <p>In-app inbox and optional desktop toasts. SMTP is not required.</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={notifyPrefs.enabled}
                                    onChange={(enabled) => setNotifyPrefs({...notifyPrefs, enabled})}
                                    label="Enable notifications"
                                    hint="Master switch for in-app and desktop alerts"
                                />
                                <div className="settings-choice-grid">
                                    <button
                                        type="button"
                                        className={`settings-choice ${notifyPrefs.inApp ? 'on' : ''}`}
                                        disabled={!notifyPrefs.enabled}
                                        onClick={() => setNotifyPrefs({...notifyPrefs, inApp: !notifyPrefs.inApp})}
                                    >
                                        <Bell size={18} />
                                        <span>
                                            <strong>In-app</strong>
                                            <em>Bell, History, and toasts inside Kairon</em>
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`settings-choice ${notifyPrefs.desktop ? 'on' : ''}`}
                                        disabled={!notifyPrefs.enabled || !desktopAvailable}
                                        onClick={() => setNotifyPrefs({...notifyPrefs, desktop: !notifyPrefs.desktop})}
                                    >
                                        <Monitor size={18} />
                                        <span>
                                            <strong>Desktop</strong>
                                            <em>{desktopAvailable ? 'OS notifications outside the window' : 'Not available in this environment'}</em>
                                        </span>
                                    </button>
                                </div>
                            </section>

                            <section className="settings-card">
                                <div className="settings-card-head">
                                    <span className="settings-card-icon">
                                        <CalendarClock size={16} />
                                    </span>
                                    <div>
                                        <h3>Schedule</h3>
                                        <p>When Kairon should ping you.</p>
                                    </div>
                                </div>
                                <ScheduleRows
                                    disabled={!notifyPrefs.enabled}
                                    dailyLabel="Daily summary"
                                    weeklyLabel="Weekly summary"
                                    dailyEnabled={notifyPrefs.dailyEnabled}
                                    dailyTime={notifyPrefs.dailyTime}
                                    weeklyEnabled={notifyPrefs.weeklyEnabled}
                                    weeklyDay={notifyPrefs.weeklyDay}
                                    weeklyTime={notifyPrefs.weeklyTime}
                                    onDailyEnabled={(dailyEnabled) => setNotifyPrefs({...notifyPrefs, dailyEnabled})}
                                    onDailyTime={(dailyTime) => setNotifyPrefs({...notifyPrefs, dailyTime})}
                                    onWeeklyEnabled={(weeklyEnabled) => setNotifyPrefs({...notifyPrefs, weeklyEnabled})}
                                    onWeeklyDay={(weeklyDay) => setNotifyPrefs({...notifyPrefs, weeklyDay})}
                                    onWeeklyTime={(weeklyTime) => setNotifyPrefs({...notifyPrefs, weeklyTime})}
                                />
                                <p className="settings-label">Due reminders</p>
                                <div className="settings-chips">
                                    <Chip checked={notifyPrefs.overdue} disabled={!notifyPrefs.enabled} onChange={(overdue) => setNotifyPrefs({...notifyPrefs, overdue})}>
                                        Overdue
                                    </Chip>
                                    <Chip checked={notifyPrefs.dueToday} disabled={!notifyPrefs.enabled} onChange={(dueToday) => setNotifyPrefs({...notifyPrefs, dueToday})}>
                                        Due today
                                    </Chip>
                                    <Chip checked={notifyPrefs.dueSoon1} disabled={!notifyPrefs.enabled} onChange={(dueSoon1) => setNotifyPrefs({...notifyPrefs, dueSoon1})}>
                                        1 day
                                    </Chip>
                                    <Chip checked={notifyPrefs.dueSoon2} disabled={!notifyPrefs.enabled} onChange={(dueSoon2) => setNotifyPrefs({...notifyPrefs, dueSoon2})}>
                                        2 days
                                    </Chip>
                                    <Chip checked={notifyPrefs.dueSoon3} disabled={!notifyPrefs.enabled} onChange={(dueSoon3) => setNotifyPrefs({...notifyPrefs, dueSoon3})}>
                                        3 days
                                    </Chip>
                                </div>
                                <div className="settings-actions">
                                    <button
                                        type="button"
                                        className="btn"
                                        disabled={!!busy}
                                        onClick={() =>
                                            withBusy('notify', async () => {
                                                await api.saveNotifyPrefs(notifyPrefs);
                                                setNotifyPrefs(await api.getNotifyPrefs());
                                                setNote('Notification settings saved');
                                            })
                                        }
                                    >
                                        <Check size={15} />
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        disabled={!!busy || !notifyPrefs.enabled}
                                        onClick={() =>
                                            withBusy('notify-test', async () => {
                                                await api.testNotification();
                                                setNote('Test notification sent');
                                            })
                                        }
                                    >
                                        Send test
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        disabled={!!busy || !notifyPrefs.enabled}
                                        onClick={() =>
                                            withBusy('notify-due', async () => {
                                                await api.sendNotificationNow('due');
                                                setNote('Due reminder sent');
                                            })
                                        }
                                    >
                                        Send due now
                                    </button>
                                </div>
                            </section>
                        </>
                    )}

                    {section === 'email' && (
                        <>
                            <section className="settings-card">
                                <div className="settings-card-head">
                                    <span className="settings-card-icon">
                                        <Mail size={16} />
                                    </span>
                                    <div>
                                        <h3>SMTP server</h3>
                                        <p>Stored only on this machine. Use an app password if 2FA is on.</p>
                                    </div>
                                </div>
                                <div className="settings-grid">
                                    <label className="settings-field settings-span-2">
                                        <span>Host</span>
                                        <input className="input" placeholder="smtp.gmail.com" value={smtp.host} onChange={(e) => setSMTP({...smtp, host: e.target.value})} />
                                    </label>
                                    <label className="settings-field">
                                        <span>Port</span>
                                        <input
                                            className="input"
                                            type="number"
                                            min={1}
                                            max={65535}
                                            value={smtp.port || ''}
                                            onChange={(e) => setSMTP({...smtp, port: Number(e.target.value) || 0})}
                                        />
                                    </label>
                                    <label className="settings-field">
                                        <span>Security</span>
                                        <select className="input" value={smtp.security} onChange={(e) => setSMTP({...smtp, security: e.target.value})}>
                                            <option value="starttls">STARTTLS (587)</option>
                                            <option value="tls">TLS (465)</option>
                                            <option value="none">None</option>
                                        </select>
                                    </label>
                                    <label className="settings-field">
                                        <span>Username</span>
                                        <input className="input" value={smtp.username} onChange={(e) => setSMTP({...smtp, username: e.target.value})} autoComplete="off" />
                                    </label>
                                    <label className="settings-field">
                                        <span>Password{smtp.passwordSet ? ' (saved)' : ''}</span>
                                        <input
                                            className="input"
                                            type="password"
                                            placeholder={smtp.passwordSet ? 'Leave blank to keep' : 'App password'}
                                            value={smtp.password ?? ''}
                                            onChange={(e) => setSMTP({...smtp, password: e.target.value})}
                                            autoComplete="new-password"
                                        />
                                    </label>
                                    <label className="settings-field">
                                        <span>From name</span>
                                        <input className="input" value={smtp.fromName} onChange={(e) => setSMTP({...smtp, fromName: e.target.value})} />
                                    </label>
                                    <label className="settings-field">
                                        <span>From address</span>
                                        <input className="input" type="email" placeholder="you@example.com" value={smtp.fromEmail} onChange={(e) => setSMTP({...smtp, fromEmail: e.target.value})} />
                                    </label>
                                    <label className="settings-field settings-span-2">
                                        <span>Send reports to</span>
                                        <input
                                            className="input"
                                            type="email"
                                            placeholder="Defaults to From / username"
                                            value={smtp.toEmail}
                                            onChange={(e) => setSMTP({...smtp, toEmail: e.target.value})}
                                        />
                                    </label>
                                </div>
                                <div className="settings-actions">
                                    <button
                                        type="button"
                                        className="btn"
                                        disabled={!!busy}
                                        onClick={() =>
                                            withBusy('smtp', async () => {
                                                await api.saveSMTPConfig({...smtp, port: smtp.port || 587});
                                                await loadMail();
                                                setNote('SMTP settings saved');
                                            })
                                        }
                                    >
                                        <Check size={15} />
                                        Save SMTP
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        disabled={!!busy}
                                        onClick={() =>
                                            withBusy('test', async () => {
                                                await api.saveSMTPConfig({...smtp, port: smtp.port || 587});
                                                await api.testSMTP();
                                                await loadMail();
                                                setNote('Test email sent (or queued if offline)');
                                            })
                                        }
                                    >
                                        <Send size={15} />
                                        Send test
                                    </button>
                                </div>
                            </section>

                            <section className="settings-card">
                                <div className="settings-card-head">
                                    <span className="settings-card-icon">
                                        <CalendarClock size={16} />
                                    </span>
                                    <div>
                                        <h3>Email reports</h3>
                                        <p>Queued locally, then sent when the SMTP server is reachable.</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={prefs.enabled}
                                    onChange={(enabled) => setPrefs({...prefs, enabled})}
                                    label="Enable email notifications"
                                    hint="Uses the SMTP server above"
                                />
                                <ScheduleRows
                                    disabled={!prefs.enabled}
                                    dailyLabel="Daily report"
                                    weeklyLabel="Weekly report"
                                    dailyEnabled={prefs.dailyEnabled}
                                    dailyTime={prefs.dailyTime}
                                    weeklyEnabled={prefs.weeklyEnabled}
                                    weeklyDay={prefs.weeklyDay}
                                    weeklyTime={prefs.weeklyTime}
                                    onDailyEnabled={(dailyEnabled) => setPrefs({...prefs, dailyEnabled})}
                                    onDailyTime={(dailyTime) => setPrefs({...prefs, dailyTime})}
                                    onWeeklyEnabled={(weeklyEnabled) => setPrefs({...prefs, weeklyEnabled})}
                                    onWeeklyDay={(weeklyDay) => setPrefs({...prefs, weeklyDay})}
                                    onWeeklyTime={(weeklyTime) => setPrefs({...prefs, weeklyTime})}
                                />
                                <p className="settings-label">Due reminders</p>
                                <div className="settings-chips">
                                    <Chip checked={prefs.overdue} disabled={!prefs.enabled} onChange={(overdue) => setPrefs({...prefs, overdue})}>
                                        Overdue
                                    </Chip>
                                    <Chip checked={prefs.dueToday} disabled={!prefs.enabled} onChange={(dueToday) => setPrefs({...prefs, dueToday})}>
                                        Due today
                                    </Chip>
                                    <Chip checked={prefs.dueSoon1} disabled={!prefs.enabled} onChange={(dueSoon1) => setPrefs({...prefs, dueSoon1})}>
                                        1 day
                                    </Chip>
                                    <Chip checked={prefs.dueSoon2} disabled={!prefs.enabled} onChange={(dueSoon2) => setPrefs({...prefs, dueSoon2})}>
                                        2 days
                                    </Chip>
                                    <Chip checked={prefs.dueSoon3} disabled={!prefs.enabled} onChange={(dueSoon3) => setPrefs({...prefs, dueSoon3})}>
                                        3 days
                                    </Chip>
                                </div>
                                <div className="settings-option-list">
                                    <Switch
                                        checked={prefs.includeNoDue}
                                        disabled={!prefs.enabled}
                                        onChange={(includeNoDue) => setPrefs({...prefs, includeNoDue})}
                                        label="Include tasks with no due date"
                                        hint="Adds undated work to the daily report"
                                    />
                                    <Switch
                                        checked={prefs.includeCompleted}
                                        disabled={!prefs.enabled}
                                        onChange={(includeCompleted) => setPrefs({...prefs, includeCompleted})}
                                        label="Include completed tasks"
                                    />
                                </div>
                                <label className="settings-field settings-field-narrow">
                                    <span>Keep queued mail for</span>
                                    <select className="input" value={prefs.queueTTL} onChange={(e) => setPrefs({...prefs, queueTTL: e.target.value})} disabled={!prefs.enabled}>
                                        {QUEUE_TTL_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <div className="settings-actions">
                                    <button
                                        type="button"
                                        className="btn"
                                        disabled={!!busy}
                                        onClick={() =>
                                            withBusy('prefs', async () => {
                                                await api.saveMailPrefs(prefs);
                                                await loadMail();
                                                setNote('Email alert settings saved');
                                            })
                                        }
                                    >
                                        <Check size={15} />
                                        Save reports
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        disabled={!!busy}
                                        onClick={() =>
                                            withBusy('daily', async () => {
                                                await api.sendMailNow('daily');
                                                await loadMail();
                                                setNote('Daily report queued');
                                            })
                                        }
                                    >
                                        Send daily
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        disabled={!!busy}
                                        onClick={() =>
                                            withBusy('weekly', async () => {
                                                await api.sendMailNow('weekly');
                                                await loadMail();
                                                setNote('Weekly report queued');
                                            })
                                        }
                                    >
                                        Send weekly
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        disabled={!!busy}
                                        onClick={() =>
                                            withBusy('due', async () => {
                                                await api.sendMailNow('due');
                                                await loadMail();
                                                setNote('Reminder queued');
                                            })
                                        }
                                    >
                                        Send reminder
                                    </button>
                                </div>
                            </section>
                        </>
                    )}

                    {section === 'queue' && (
                        <section className="settings-card">
                            <div className="settings-card-head">
                                <span className="settings-card-icon">
                                    <Inbox size={16} />
                                </span>
                                <div>
                                    <h3>Mail queue</h3>
                                    <p>Outbound mail waiting to send, retry, or expire.</p>
                                </div>
                            </div>
                            <div className="settings-metrics">
                                <div>
                                    <strong>{stats.pending}</strong>
                                    <span>Queued</span>
                                </div>
                                <div>
                                    <strong>{stats.failed}</strong>
                                    <span>Failed</span>
                                </div>
                                <div>
                                    <strong>{stats.expired}</strong>
                                    <span>Expired</span>
                                </div>
                                <div>
                                    <strong>{stats.sent}</strong>
                                    <span>Sent</span>
                                </div>
                            </div>
                            <div className="settings-actions">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    disabled={!!busy}
                                    onClick={() =>
                                        withBusy('retry', async () => {
                                            await api.retryAllMail();
                                            await loadMail();
                                            setNote('Retrying failed and expired mail');
                                        })
                                    }
                                >
                                    Retry all
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    disabled={!!busy}
                                    onClick={() =>
                                        withBusy('purge', async () => {
                                            await api.purgeMailQueue();
                                            await loadMail();
                                            setNote('Cleared sent, failed, and expired items');
                                        })
                                    }
                                >
                                    <Trash2 size={14} />
                                    Clear history
                                </button>
                                <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => withBusy('reload', loadMail)}>
                                    Refresh
                                </button>
                            </div>
                            {queue.length === 0 ? (
                                <p className="settings-empty">Queue is empty.</p>
                            ) : (
                                <div className="settings-queue">
                                    {queue.map((item) => (
                                        <div key={item.id} className="settings-queue-row">
                                            <div className="settings-queue-main">
                                                <span className={`queue-status queue-status-${item.status}`}>{statusLabel(item.status)}</span>
                                                <span className="queue-kind">{kindLabel(item.kind)}</span>
                                                <span className="queue-subject">{item.subject}</span>
                                            </div>
                                            <div className="settings-queue-meta">
                                                {item.status === 'pending' && <span>Next try {formatWhen(item.nextAttemptAt)}</span>}
                                                {item.status === 'sent' && item.sentAt && <span>Sent {formatWhen(item.sentAt)}</span>}
                                                <span>Expires {formatWhen(item.expiresAt)}</span>
                                                <span>
                                                    {item.attempts}/{item.maxAttempts} tries
                                                </span>
                                                {item.lastError && (
                                                    <span className="queue-error" title={item.lastError}>
                                                        {item.lastError}
                                                    </span>
                                                )}
                                                {item.status !== 'sent' && (
                                                    <button
                                                        type="button"
                                                        className="queue-retry"
                                                        onClick={() =>
                                                            withBusy('retry-one', async () => {
                                                                await api.retryMailItem(item.id);
                                                                await loadMail();
                                                            })
                                                        }
                                                    >
                                                        Retry
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {section === 'data' && (
                        <section className="settings-card settings-data-card">
                            <div className="settings-card-head">
                                <span className="settings-card-icon">
                                    <Database size={16} />
                                </span>
                                <div>
                                    <h3>Data</h3>
                                    <p>Local files on this machine. Wipe asks twice, then restart.</p>
                                </div>
                            </div>
                            {locations && (
                                <div className="settings-locations">
                                    <LocationRow
                                        label="Config folder"
                                        path={locations.configDir}
                                        copied={copiedPath === 'config'}
                                        onCopy={() => copyLocation('config', locations.configDir)}
                                        onOpen={() => openLocation(locations.configDir)}
                                    />
                                    <LocationRow
                                        label="Database"
                                        path={locations.database}
                                        copied={copiedPath === 'db'}
                                        onCopy={() => copyLocation('db', locations.database)}
                                        onOpen={() => openLocation(locations.database)}
                                    />
                                </div>
                            )}
                            <div className="settings-data-groups">
                                <div>
                                    <p className="settings-label">Backup</p>
                                    <div className="settings-actions">
                                        <button
                                            type="button"
                                            className="btn"
                                            disabled={!!busy}
                                            onClick={() =>
                                                withBusy('backup', async () => {
                                                    const path = await api.backupDatabase();
                                                    if (path) setNote(`Backup saved to ${path}`);
                                                })
                                            }
                                        >
                                            Backup now
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            disabled={!!busy}
                                            onClick={() => setDataConfirm('restore')}
                                        >
                                            Restore…
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p className="settings-label">Wipe</p>
                                    <div className="settings-actions">
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            disabled={!!busy || restartRequired}
                                            onClick={() => setDataConfirm('db')}
                                        >
                                            <Trash2 size={15} />
                                            Database
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            disabled={!!busy || restartRequired}
                                            onClick={() => setDataConfirm('config')}
                                        >
                                            <Trash2 size={15} />
                                            Config
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-danger-solid"
                                            disabled={!!busy || restartRequired}
                                            onClick={() => setDataConfirm('both')}
                                        >
                                            <Trash2 size={15} />
                                            Both
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {dataConfirm === 'restore' && (
                <ConfirmDialog
                    title="Restore from backup?"
                    message="You will pick a .db file next. That file replaces every task, note, project, setting, and mail queue on this machine. Kairon asks once more before it writes."
                    confirmLabel="Choose backup"
                    onCancel={() => setDataConfirm(null)}
                    onConfirm={() => {
                        setDataConfirm(null);
                        withBusy('restore', async () => {
                            const path = await api.restoreDatabase();
                            if (path) setNote('Data restored from backup');
                        });
                    }}
                />
            )}
            {dataConfirm && dataConfirm !== 'restore' && (
                <ConfirmDialog
                    title={WIPE_COPY[dataConfirm].title}
                    message={WIPE_COPY[dataConfirm].message}
                    confirmLabel={WIPE_COPY[dataConfirm].confirmLabel}
                    onCancel={() => setDataConfirm(null)}
                    onConfirm={() => {
                        const scope = dataConfirm;
                        setDataConfirm(null);
                        withBusy('wipe', async () => {
                            const wiped = await api.wipeLocalData(scope);
                            if (wiped) setRestartRequired(true);
                        });
                    }}
                />
            )}
            {restartRequired && (
                <RestartRequiredDialog
                    onRestart={() => {
                        api.restartApp().catch(() => setError('Could not restart. Quit Kairon from the menu, then open it again.'));
                    }}
                />
            )}
        </div>
    );
}
