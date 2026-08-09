import {useEffect, useState} from 'react';
import './App.css';
import {api} from './api';
import {Sidebar} from './components/Sidebar';
import {TaskListView} from './components/TaskListView';
import {CalendarView} from './components/CalendarView';
import {NotesView} from './components/NotesView';
import {TaskDetail} from './components/TaskDetail';
import type {Note, Project, Task, View} from './types';
import {isDueToday, isOverdue} from './types';

function App() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [view, setView] = useState<View>({kind: 'today'});
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    async function withErrorHandling(fn: () => Promise<void>) {
        try {
            await fn();
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Something went wrong');
        }
    }

    function handleAddTask(input: {title: string; dueDate?: string; priority: number; projectId?: number}) {
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

    function handleDeleteTask(id: number) {
        withErrorHandling(async () => {
            await api.deleteTask(id);
            setTasks(await api.listTasks());
            if (selectedTaskId === id) setSelectedTaskId(null);
        });
    }

    function handleSaveTask(input: {id: number; title: string; notes: string; dueDate?: string; priority: number; projectId?: number}) {
        withErrorHandling(async () => {
            await api.updateTask(input);
            setTasks(await api.listTasks());
        });
    }

    function handleAddProject(name: string, color: string) {
        withErrorHandling(async () => {
            await api.createProject(name, color);
            setProjects(await api.listProjects());
        });
    }

    function handleDeleteProject(id: number) {
        withErrorHandling(async () => {
            await api.deleteProject(id);
            await refreshAll();
            if (view.kind === 'project' && view.projectId === id) {
                setView({kind: 'all'});
            }
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
            setNotes(await api.listNotes());
        });
    }

    function handleDeleteNote(id: number) {
        withErrorHandling(async () => {
            await api.deleteNote(id);
            setNotes(await api.listNotes());
        });
    }

    const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

    let content;
    if (loading) {
        content = <div className="loading-state">Loading…</div>;
    } else if (view.kind === 'today') {
        const todayTasks = tasks.filter((t) => isOverdue(t) || isDueToday(t));
        content = (
            <TaskListView
                title="Today"
                tasks={todayTasks}
                projects={projects}
                defaultProjectId={undefined}
                emptyHint="No tasks due today. Enjoy the calm."
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onSelectTask={(t) => setSelectedTaskId(t.id)}
                onDeleteTask={handleDeleteTask}
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
            <TaskListView
                title="All Tasks"
                tasks={tasks}
                projects={projects}
                groupByProject
                emptyHint="No tasks yet. Add your first one above."
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onSelectTask={(t) => setSelectedTaskId(t.id)}
                onDeleteTask={handleDeleteTask}
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
        </div>
    );
}

export default App;
