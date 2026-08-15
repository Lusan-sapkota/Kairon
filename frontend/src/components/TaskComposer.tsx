import {useEffect, useState} from 'react';
import {Plus} from 'lucide-react';
import type {Project} from '../types';
import {PRIORITIES} from '../types';
import {RepeatSelect} from './RepeatSelect';

type Props = {
    projects: Project[];
    defaultProjectId?: number;
    defaultDueDate?: string;
    onAdd: (input: {title: string; dueDate?: string; priority: number; projectId?: number; repeat?: string}) => void;
};

export function TaskComposer({projects, defaultProjectId, defaultDueDate, onAdd}: Props) {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState(defaultDueDate ?? '');
    const [priority, setPriority] = useState(0);
    const [projectId, setProjectId] = useState<number | undefined>(defaultProjectId);
    const [repeat, setRepeat] = useState('');
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (defaultDueDate !== undefined) setDueDate(defaultDueDate);
    }, [defaultDueDate]);

    useEffect(() => {
        setProjectId(defaultProjectId);
    }, [defaultProjectId]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd({title: title.trim(), dueDate: dueDate || undefined, priority, projectId, repeat: repeat || undefined});
        setTitle('');
        setPriority(0);
        setRepeat('');
        setExpanded(false);
        if (!defaultDueDate) setDueDate('');
        else setDueDate(defaultDueDate);
    }

    return (
        <form className="composer" onSubmit={submit}>
            <div className="composer-row">
                <input
                    className="input"
                    placeholder="Add a task and press Enter…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={() => setExpanded(true)}
                />
                <button type="submit" className="btn"><Plus size={15} />Add</button>
            </div>
            {expanded && (
                <div className="composer-options">
                    <input
                        type="date"
                        className="input input-sm"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                    <select
                        className="input input-sm"
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value))}
                    >
                        {PRIORITIES.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label} priority
                            </option>
                        ))}
                    </select>
                    <select
                        className="input input-sm"
                        value={projectId ?? ''}
                        onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
                    >
                        <option value="">No project</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <RepeatSelect value={repeat} onChange={setRepeat} />
                </div>
            )}
        </form>
    );
}
