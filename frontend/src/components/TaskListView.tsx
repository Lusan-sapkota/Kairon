import type {Project, Task} from '../types';
import {TaskComposer} from './TaskComposer';
import {TaskRow} from './TaskRow';

type Props = {
    title: string;
    tasks: Task[];
    projects: Project[];
    defaultProjectId?: number;
    groupByProject?: boolean;
    emptyHint?: string;
    onAddTask: (input: {title: string; dueDate?: string; priority: number; projectId?: number}) => void;
    onToggleTask: (id: number) => void;
    onSelectTask: (task: Task) => void;
    onDeleteTask: (id: number) => void;
};

export function TaskListView({
    title,
    tasks,
    projects,
    defaultProjectId,
    groupByProject,
    emptyHint,
    onAddTask,
    onToggleTask,
    onSelectTask,
    onDeleteTask,
}: Props) {
    const projectById = new Map(projects.map((p) => [p.id, p]));

    function renderRow(t: Task) {
        return (
            <TaskRow
                key={t.id}
                task={t}
                project={t.projectId ? projectById.get(t.projectId) : undefined}
                onToggle={onToggleTask}
                onSelect={onSelectTask}
                onDelete={onDeleteTask}
            />
        );
    }

    let body;
    if (tasks.length === 0) {
        body = <p className="empty-hint">{emptyHint ?? 'Nothing here yet'}</p>;
    } else if (groupByProject) {
        const groups = new Map<string, Task[]>();
        for (const t of tasks) {
            const key = t.projectId ? String(t.projectId) : 'inbox';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(t);
        }
        body = (
            <>
                {[...groups.entries()].map(([key, groupTasks]) => (
                    <div key={key} className="task-group">
                        <h4 className="task-group-title">
                            {key === 'inbox' ? 'Inbox' : projectById.get(Number(key))?.name ?? 'Inbox'}
                        </h4>
                        <div className="task-list">{groupTasks.map(renderRow)}</div>
                    </div>
                ))}
            </>
        );
    } else {
        body = <div className="task-list">{tasks.map(renderRow)}</div>;
    }

    return (
        <div className="task-view">
            <h2 className="view-title">{title}</h2>
            <TaskComposer projects={projects} defaultProjectId={defaultProjectId} onAdd={onAddTask} />
            {body}
        </div>
    );
}
