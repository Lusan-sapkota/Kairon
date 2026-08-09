import {useEffect, useState} from 'react';
import './App.css';
import {api} from './api';
import {Sidebar} from './components/Sidebar';
import {TaskListView} from './components/TaskListView';
import {AllTasksView} from './components/AllTasksView';
import {BoardView} from './components/BoardView';
import {CalendarView} from './components/CalendarView';
import {NotesView} from './components/NotesView';
import {TaskDetail} from './components/TaskDetail';
import {ConfirmDialog} from './components/ConfirmDialog';
import type {Note, Project, Task, View} from './types';

type PendingConfirm = {
    title: string;
    message: string;
    onConfirm: () => void;
};

function App() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [view, setView] = useState<View>({kind: 'today'});
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

    async function refreshAll() {
        const [p, t, n] = await Promise.all([api.listProjects(), api.listTasks(), api.listNotes()]);
        setProjects(p);
        setTasks(t);
        setNotes(n);
    }

    useEffect(() => {
        refreshAll()
            .catch((err) => setError(String(err)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(''), 4000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        // Wails' Linux backend doesn't rescale the window when it's dragged onto a
        // monitor with a different DPI, so it can get stuck rendering at its old size.
        // Watch for the screen actually changing and ask the backend to re-fit the window.
        let lastScreen = `${window.screen.width}x${window.screen.height}x${window.devicePixelRatio}`;
        function checkScreen() {
            const current = `${window.screen.width}x${window.screen.height}x${window.devicePixelRatio}`;
            if (current !== lastScreen) {
                lastScreen = current;
                api.refitWindow().catch(() => {});
            }
        }
        window.addEventListener('focus', checkScreen);
        document.addEventListener('visibilitychange', checkScreen);
        window.addEventListener('resize', checkScreen);
        return () => {
            window.removeEventListener('focus', checkScreen);
            document.removeEventListener('visibilitychange', checkScreen);
            window.removeEventListener('resize', checkScreen);
        };
    }, []);

    async function withErrorHandling(fn: () => Promise<void>) {
        try {
            await fn();
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Something went wrong');
        }
    }

    function handleAddTask(input: {title: string; notes?: string; dueDate?: string; priority: number; projectId?: number}) {
        withErrorHandling(async () => {
            await api.createTask(input);
            setTasks(await api.listTasks());
        });
    }

    function handleToggleTask(id: number) {
        withErrorHandling(async () => {
            await api.toggleTask(id);
            setTasks(await api.listTasks());
        });
    }

    function performDeleteTask(id: number) {
        withErrorHandling(async () => {
            await api.deleteTask(id);
            setTasks(await api.listTasks());
            if (selectedTaskId === id) setSelectedTaskId(null);
        });
    }

    function handleDeleteTask(id: number) {
        const task = tasks.find((t) => t.id === id);
        setPendingConfirm({
            title: 'Delete task',
            message: `Delete "${task?.title ?? 'this task'}"? This can't be undone.`,
            onConfirm: () => performDeleteTask(id),
        });
    }

    function handleSaveTask(input: {id: number; title: string; notes: string; dueDate?: string; priority: number; projectId?: number}) {
        withErrorHandling(async () => {
            await api.updateTask(input);
            setTasks(await api.listTasks());
        });
    }

    function handleMoveTaskDate(id: number, dueDate: string | undefined, sortOrder: number) {
        setTasks((prev) => prev.map((t) => (t.id === id ? {...t, dueDate, sortOrder} : t)));
        withErrorHandling(async () => {
            await api.setTaskDueDate(id, dueDate, sortOrder);
            setTasks(await api.listTasks());
        });
    }

    function handleMoveTaskProject(id: number, projectId: number | undefined, sortOrder: number) {
        setTasks((prev) => prev.map((t) => (t.id === id ? {...t, projectId, sortOrder} : t)));
        withErrorHandling(async () => {
            await api.setTaskProject(id, projectId, sortOrder);
            setTasks(await api.listTasks());
        });
    }

    function handleAddProject(name: string, color: string, tags: string) {
        withErrorHandling(async () => {
            await api.createProject(name, color, tags);
            setProjects(await api.listProjects());
        });
    }

    function performDeleteProject(id: number) {
        withErrorHandling(async () => {
            await api.deleteProject(id);
            await refreshAll();
            if (view.kind === 'project' && view.projectId === id) {
                setView({kind: 'all'});
            }
        });
    }

    function handleDeleteProject(id: number) {
        const project = projects.find((p) => p.id === id);
        const taskCount = tasks.filter((t) => t.projectId === id).length;
        const impact = taskCount > 0 ? ` ${taskCount} task${taskCount === 1 ? '' : 's'} will be moved to Inbox.` : '';
        setPendingConfirm({
            title: 'Delete project',
            message: `Delete "${project?.name ?? 'this project'}"?${impact} This can't be undone.`,
            onConfirm: () => performDeleteProject(id),
        });
    }

    async function handleCreateNote(): Promise<Note> {
        const projectId = view.kind === 'project' ? view.projectId : undefined;
        const note = await api.createNote({title: 'Untitled note', content: '', projectId});
        setNotes(await api.listNotes());
        return note;
    }

    function handleSaveNote(note: {id: number; title: string; content: string; projectId?: number}) {
        withErrorHandling(async () => {
            await api.updateNote(note);
            // A note linked to a task mirrors its edits back onto that task, so refresh
            // everything to keep the Task Detail panel (and any other view) in sync.
            await refreshAll();
        });
    }

    function performDeleteNote(id: number) {
        withErrorHandling(async () => {
            await api.deleteNote(id);
            setNotes(await api.listNotes());
        });
    }

    function handleDeleteNote(id: number) {
        const note = notes.find((n) => n.id === id);
        setPendingConfirm({
            title: 'Delete note',
            message: `Delete "${note?.title || 'Untitled note'}"? This can't be undone.`,
            onConfirm: () => performDeleteNote(id),
        });
    }

    function handleExportTasks() {
        withErrorHandling(async () => {
            const path = await api.exportTasksCSV();
            if (path) setToast(`Exported ${tasks.length} task${tasks.length === 1 ? '' : 's'} to ${path}`);
        });
    }

    const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

    let content;
    if (loading) {
        content = <div className="loading-state">Loading…</div>;
    } else if (view.kind === 'today') {
        content = (
            <BoardView
                tasks={tasks}
                projects={projects}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onSelectTask={(t) => setSelectedTaskId(t.id)}
                onDeleteTask={handleDeleteTask}
                onMoveTaskDate={handleMoveTaskDate}
                onMoveTaskProject={handleMoveTaskProject}
            />
        );
    } else if (view.kind === 'upcoming') {
        content = (
            <CalendarView
                tasks={tasks}
                projects={projects}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onSelectTask={(t) => setSelectedTaskId(t.id)}
                onDeleteTask={handleDeleteTask}
            />
        );
    } else if (view.kind === 'all') {
        content = (
            <AllTasksView
                tasks={tasks}
                projects={projects}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onSelectTask={(t) => setSelectedTaskId(t.id)}
                onDeleteTask={handleDeleteTask}
                onExportTasks={handleExportTasks}
            />
        );
    } else if (view.kind === 'notes') {
        content = (
            <NotesView
                notes={notes}
                projects={projects}
                onCreate={handleCreateNote}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
            />
        );
    } else {
        const project = projects.find((p) => p.id === view.projectId);
        const projectTasks = tasks.filter((t) => t.projectId === view.projectId);
        content = (
            <TaskListView
                title={project?.name ?? 'Project'}
                tasks={projectTasks}
                projects={projects}
                defaultProjectId={view.projectId}
                emptyHint="No tasks in this project yet."
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onSelectTask={(t) => setSelectedTaskId(t.id)}
                onDeleteTask={handleDeleteTask}
            />
        );
    }

    return (
        <div id="App">
            <Sidebar
                projects={projects}
                tasks={tasks}
                view={view}
                onSelectView={setView}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
            />
            <main className="main-content">
                {error && (
                    <div className="error-banner" onClick={() => setError('')}>
                        {error}
                    </div>
                )}
                {toast && (
                    <div className="toast-banner" onClick={() => setToast('')}>
                        {toast}
                    </div>
                )}
                {content}
            </main>

            {selectedTask && (
                <TaskDetail
                    task={selectedTask}
                    projects={projects}
                    onClose={() => setSelectedTaskId(null)}
                    onSave={handleSaveTask}
                    onDelete={handleDeleteTask}
                />
            )}

            {pendingConfirm && (
                <ConfirmDialog
                    title={pendingConfirm.title}
                    message={pendingConfirm.message}
                    onConfirm={() => {
                        pendingConfirm.onConfirm();
                        setPendingConfirm(null);
                    }}
                    onCancel={() => setPendingConfirm(null)}
                />
            )}
        </div>
    );
}

export default App;
