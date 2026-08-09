import {memo} from 'react';
import {Check, X, CalendarClock} from 'lucide-react';
import type {Project, Task} from '../types';
import {formatShortDate, isOverdue, priorityColor, taskTooltip} from '../types';

type Props = {
    task: Task;
    project?: Project;
    onToggle: (id: number) => void;
    onSelect: (task: Task) => void;
    onDelete: (id: number) => void;
};

export const TaskRow = memo(function TaskRow({task, project, onToggle, onSelect, onDelete}: Props) {
    return (
        <div className={`task-row ${task.done ? 'task-done' : ''}`}>
            <button
                className={`checkbox ${task.done ? 'checkbox-checked' : ''}`}
                onClick={() => onToggle(task.id)}
                aria-label="Toggle done"
            >
                {task.done && <Check />}
            </button>

            <div className="task-main" onClick={() => onSelect(task)} title={taskTooltip(task, project)}>
                <span className="task-title">{task.title}</span>
                <div className="task-meta">
                    {project && (
                        <span className="chip" style={{color: project.color, borderColor: project.color}}>
                            <span className="dot" style={{background: project.color}} /> {project.name}
                        </span>
                    )}
                    {task.dueDate && (
                        <span className={`chip ${isOverdue(task) ? 'chip-overdue' : ''}`}>
                            <CalendarClock /> {formatShortDate(task.dueDate)}
                        </span>
                    )}
                    {task.priority > 0 && (
                        <span className="priority-dot" style={{background: priorityColor(task.priority)}} />
                    )}
                </div>
            </div>

            <button className="icon-btn ghost" title="Delete task" onClick={() => onDelete(task.id)}>
                <X size={13} />
            </button>
        </div>
    );
});
