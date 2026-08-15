export function notifyKindLabel(kind: string): string {
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

export function formatNotifyWhen(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
}

export function formatNotifyDay(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    const startOf = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
    const diff = (startOf(today) - startOf(d)) / 86_400_000;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'});
}
