import {useState} from 'react';
import {Plus} from 'lucide-react';
import type {Project, Task} from '../types';
import {TaskComposer} from './TaskComposer';
import {TaskRow} from './TaskRow';
import {NewTaskModal} from './NewTaskModal';

type Props = {
    title: string;
    tasks: Task[];
    projects: Project[];
    defaultProjectId?: number;
    groupByProject?: boolean;
    cardLayout?: boolean;
    emptyHint?: string;
    onAddTask: (input: import('../types').TaskDraft) => void;
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
    cardLayout,
    emptyHint,
    onAddTask,
    onToggleTask,
    onSelectTask,
    onDeleteTask,
}: Props) {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const projectById = new Map(projects.map((p) => [p.id, p]));
    const listClass = cardLayout ? 'task-grid' : 'task-list';

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
                        <div className={listClass}>{groupTasks.map(renderRow)}</div>
                    </div>
                ))}
            </>
        );
    } else {
        body = <div className={listClass}>{tasks.map(renderRow)}</div>;
    }

    return (
        <div className="task-view">
            <div className="task-view-header">
                <h2 className="view-title">{title}</h2>
                <button className="icon-btn" onClick={() => setAddModalOpen(true)} title="Add task">
                    <Plus size={16} />
                </button>
            </div>
            <TaskComposer projects={projects} defaultProjectId={defaultProjectId} onAdd={onAddTask} />
            {body}

            {addModalOpen && (
                <NewTaskModal
                    projects={projects}
                    initialProjectId={defaultProjectId}
                    onClose={() => setAddModalOpen(false)}
                    onCreate={(input) => {
                        onAddTask(input);
                        setAddModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
