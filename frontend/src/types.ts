import {main} from '../wailsjs/go/models';

export type Project = main.Project;
export type Task = main.Task;
export type Note = main.Note;

export type View =
    | {kind: 'today'}
    | {kind: 'upcoming'}
    | {kind: 'all'}
    | {kind: 'notes'}
    | {kind: 'project'; projectId: number};

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
