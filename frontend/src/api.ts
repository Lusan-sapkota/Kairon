import {main} from '../wailsjs/go/models';
import * as Go from '../wailsjs/go/main/App';
import type {Note, Project, Task} from './types';

export const api = {
    listProjects: (): Promise<Project[]> => Go.ListProjects(),
    createProject: (name: string, color: string, tags: string): Promise<Project> =>
        Go.CreateProject(new main.ProjectInput({name, color, tags})),
    updateProject: (id: number, name: string, color: string, tags: string): Promise<Project> =>
        Go.UpdateProject(new main.ProjectInput({id, name, color, tags})),
    deleteProject: (id: number): Promise<void> => Go.DeleteProject(id),

    listTasks: (): Promise<Task[]> => Go.ListTasks(),
    createTask: (input: {
        title: string;
        notes?: string;
        priority?: number;
        dueDate?: string;
        projectId?: number;
    }): Promise<Task> =>
        Go.CreateTask(
            new main.TaskInput({
                title: input.title,
                notes: input.notes ?? '',
                priority: input.priority ?? 0,
                dueDate: input.dueDate,
                projectId: input.projectId,
            })
        ),
    updateTask: (task: {
        id: number;
        title: string;
        notes?: string;
        priority?: number;
        dueDate?: string;
        projectId?: number;
    }): Promise<Task> =>
        Go.UpdateTask(
            new main.TaskInput({
                id: task.id,
                title: task.title,
                notes: task.notes ?? '',
                priority: task.priority ?? 0,
                dueDate: task.dueDate,
                projectId: task.projectId,
            })
        ),
    toggleTask: (id: number): Promise<Task> => Go.ToggleTaskDone(id),
    deleteTask: (id: number): Promise<void> => Go.DeleteTask(id),
    setTaskDueDate: (id: number, dueDate: string | undefined, sortOrder: number): Promise<Task> =>
        Go.SetTaskDueDate(id, dueDate ?? null, sortOrder),
    setTaskProject: (id: number, projectId: number | undefined, sortOrder: number): Promise<Task> =>
        Go.SetTaskProject(id, projectId ?? null, sortOrder),

    listNotes: (): Promise<Note[]> => Go.ListNotes(),
    createNote: (input: {title: string; content: string; projectId?: number}): Promise<Note> =>
        Go.CreateNote(new main.NoteInput({title: input.title, content: input.content, projectId: input.projectId})),
    updateNote: (note: {id: number; title: string; content: string; projectId?: number}): Promise<Note> =>
        Go.UpdateNote(
            new main.NoteInput({id: note.id, title: note.title, content: note.content, projectId: note.projectId})
        ),
    deleteNote: (id: number): Promise<void> => Go.DeleteNote(id),

    exportTasksCSV: (): Promise<string> => Go.ExportTasksCSV(),

    refitWindow: (): Promise<void> => Go.RefitWindow(),
};
