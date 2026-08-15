import {main} from '../wailsjs/go/models';

export type Project = main.Project;
export type Task = main.Task;
export type Note = main.Note;

export type UpdateInfo = {
    state: string;
    currentVersion: string;
    version: string;
    installMode: string;
    canAutoApply: boolean;
    message: string;
};

export type UpdateSettings = {
    pollInterval: string;
};

export const UPDATE_POLL_OPTIONS = [
    {value: '24h', label: '24 hours'},
    {value: '48h', label: '48 hours'},
    {value: '7d', label: '7 days'},
    {value: '15d', label: '15 days'},
    {value: '30d', label: '1 month'},
] as const;

export type View =
    | {kind: 'today'}
    | {kind: 'upcoming'}
    | {kind: 'all'}
    | {kind: 'notes'}
    | {kind: 'settings'}
    | {kind: 'history'}
    | {kind: 'project'; projectId: number};

export type SMTPConfig = {
    host: string;
    port: number;
    username: string;
    password?: string;
    passwordSet: boolean;
    fromName: string;
    fromEmail: string;
    toEmail: string;
    security: string;
};

export type MailPrefs = {
    enabled: boolean;
    dailyEnabled: boolean;
    dailyTime: string;
    weeklyEnabled: boolean;
    weeklyDay: number;
    weeklyTime: string;
    dueToday: boolean;
    dueSoon1: boolean;
    dueSoon2: boolean;
    dueSoon3: boolean;
    overdue: boolean;
    includeNoDue: boolean;
    includeCompleted: boolean;
    queueTTL: string;
};

export type MailSettings = {
    smtp: SMTPConfig;
    prefs: MailPrefs;
};

export type MailQueueItem = {
    id: number;
    kind: string;
    dedupeKey: string;
    recipient: string;
    subject: string;
    status: string;
    attempts: number;
    maxAttempts: number;
    nextAttemptAt: string;
    expiresAt: string;
    lastError: string;
    createdAt: string;
    sentAt?: string;
};

export type MailQueueStats = {
    pending: number;
    failed: number;
    expired: number;
    sent: number;
};

export type NotifyPrefs = {
    enabled: boolean;
    desktop: boolean;
    inApp: boolean;
    dailyEnabled: boolean;
    dailyTime: string;
    weeklyEnabled: boolean;
    weeklyDay: number;
    weeklyTime: string;
    dueToday: boolean;
    dueSoon1: boolean;
    dueSoon2: boolean;
    dueSoon3: boolean;
    overdue: boolean;
};

export type AppNotification = {
    id: number;
    kind: string;
    title: string;
    body: string;
    dedupeKey: string;
    read: boolean;
    createdAt: string;
};

export const QUEUE_TTL_OPTIONS = [
    {value: '12h', label: '12 hours'},
    {value: '24h', label: '24 hours'},
    {value: '48h', label: '48 hours'},
    {value: '7d', label: '7 days'},
] as const;

export const WEEKDAY_OPTIONS = [
    {value: 0, label: 'Sunday'},
    {value: 1, label: 'Monday'},
    {value: 2, label: 'Tuesday'},
    {value: 3, label: 'Wednesday'},
    {value: 4, label: 'Thursday'},
    {value: 5, label: 'Friday'},
    {value: 6, label: 'Saturday'},
] as const;

export const PRIORITIES = [
    {value: 0, label: 'None', color: '#5b5f6b'},
    {value: 1, label: 'Low', color: '#4d94ff'},
    {value: 2, label: 'Medium', color: '#f5a623'},
    {value: 3, label: 'High', color: '#f5484c'},
] as const;

export function priorityColor(priority: number): string {
    return PRIORITIES.find((p) => p.value === priority)?.color ?? PRIORITIES[0].color;
}

export function priorityLabel(priority: number): string {
    return PRIORITIES.find((p) => p.value === priority)?.label ?? 'None';
}

let cachedTodayISO = '';
let cachedTodayAt = 0;

export function todayISO(): string {
    const now = Date.now();
    // Local calendar date rarely changes mid-session; refresh at most once a minute.
    if (cachedTodayISO && now - cachedTodayAt < 60_000) return cachedTodayISO;
    const d = new Date();
    const offset = d.getTimezoneOffset();
    cachedTodayISO = new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
    cachedTodayAt = now;
    return cachedTodayISO;
}

export function isOverdue(task: Task): boolean {
    return !!task.dueDate && !task.done && task.dueDate < todayISO();
}

export function isDueToday(task: Task): boolean {
    return !!task.dueDate && task.dueDate === todayISO();
}

export function formatShortDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
}

function formatTooltipDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'});
}

export function taskTooltip(task: Task, project?: Project): string {
    const parts: string[] = [];
    if (task.dueDate) parts.push(`Due ${formatTooltipDate(task.dueDate)}${isOverdue(task) ? ' (overdue)' : ''}`);
    if (task.priority > 0) parts.push(`${priorityLabel(task.priority)} priority`);
    if (project) parts.push(project.name);
    return parts.length > 0 ? `${task.title}\n${parts.join(' · ')}` : task.title;
}

export function greeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
}
