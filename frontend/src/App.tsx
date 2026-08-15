import {useCallback, useEffect, useState} from 'react';
import './App.css';
import {api} from './api';
import {EventsOn} from '../wailsjs/runtime/runtime';
import type {AppNotification, UpdateInfo} from './types';
import {Sidebar} from './components/Sidebar';
import {AllTasksView} from './components/AllTasksView';
import {ProjectView} from './components/ProjectView';
import {BoardView} from './components/BoardView';
import {CalendarView} from './components/CalendarView';
import {NotesView} from './components/NotesView';
import {TaskDetail} from './components/TaskDetail';
import {SettingsView} from './components/SettingsView';
import {HistoryView} from './components/HistoryView';
import {NotificationPanel} from './components/NotificationPanel';
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
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshAll = useCallback(async () => {
        const [p, t, n] = await Promise.all([api.listProjects(), api.listTasks(), api.listNotes()]);
        setProjects(p);
        setTasks(t);
        setNotes(n);
    }, []);

    useEffect(() => {
        refreshAll()
            .catch((err) => setError(String(err)))
            .finally(() => setLoading(false));
    }, [refreshAll]);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(''), 4000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        api.getUpdateInfo()
            .then((info) => {
                if (info.state === 'ready') setUpdateInfo(info);
            })
            .catch(() => {});

        return EventsOn('update_ready', (info: UpdateInfo) => {
            setUpdateInfo(info);
        });
    }, []);

    const refreshNotifications = useCallback(async () => {
        const [items, count] = await Promise.all([api.listNotifications(), api.unreadNotificationCount()]);
        setNotifications(items ?? []);
        setUnreadCount(count ?? 0);
    }, []);

    useEffect(() => {
        refreshNotifications().catch(() => {});
        return EventsOn('app_notification', (item: AppNotification) => {
            setNotifications((cur) => [item, ...cur.filter((n) => n.id !== item.id)].slice(0, 400));
            setUnreadCount((n) => n + (item.read ? 0 : 1));
            if (item.title) setToast(item.title);
        });
    }, [refreshNotifications]);

    const handleDismissUpdate = useCallback(() => {
        api.dismissUpdate().catch(() => {});
        setUpdateInfo(null);
    }, []);

    const handleRestartForUpdate = useCallback(() => {
        api.applyUpdateAndRestart().catch((err) => {
            setError(typeof err === 'string' ? err : 'Could not apply update');
        });
    }, []);

    const handleOpenUpdatePackage = useCallback(() => {
        api.openUpdatePackage().catch((err) => {
            setError(typeof err === 'string' ? err : 'Could not open update package');
        });
    }, []);

    useEffect(() => {
        let fittedFor = `${window.screen.width}x${window.screen.height}`;
        let lastSeen = fittedFor;
        let debounceTimer = 0;
        const interval = window.setInterval(() => {
            const current = `${window.screen.width}x${window.screen.height}`;
            if (current === lastSeen) return;
            lastSeen = current;
            window.clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(() => {
                const settled = `${window.screen.width}x${window.screen.height}`;
                if (settled === fittedFor) return;
                fittedFor = settled;
                api.refitWindow(window.screen.width, window.screen.height).catch(() => {});
            }, 700);
        }, 1000);
        return () => {
            window.clearInterval(interval);
            window.clearTimeout(debounceTimer);
        };
    }, []);

    const withErrorHandling = useCallback(async (fn: () => Promise<void>) => {
        try {
            await fn();
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Something went wrong');
        }
    }, []);

    const handleAddTask = useCallback(
        (input: {title: string; notes?: string; dueDate?: string; priority: number; projectId?: number}) => {
            withErrorHandling(async () => {
                await api.createTask(input);
                setTasks(await api.listTasks());
            });
        },
        [withErrorHandling]
    );

    const handleToggleTask = useCallback(
        (id: number) => {
            withErrorHandling(async () => {
                await api.toggleTask(id);
                setTasks(await api.listTasks());
            });
        },
        [withErrorHandling]
    );

    const handleDeleteTask = useCallback(
        (id: number) => {
            setPendingConfirm({
                title: 'Delete task',
                message: `Delete "${tasks.find((t) => t.id === id)?.title ?? 'this task'}"? This can't be undone.`,
                onConfirm: () => {
                    withErrorHandling(async () => {
                        await api.deleteTask(id);
                        setTasks(await api.listTasks());
                        setSelectedTaskId((cur) => (cur === id ? null : cur));
                    });
                },
            });
        },
        [tasks, withErrorHandling]
    );

    const handleSelectTask = useCallback((task: Task) => {
        setSelectedTaskId(task.id);
    }, []);

    const handleSaveTask = useCallback(
        (input: {id: number; title: string; notes: string; dueDate?: string; priority: number; projectId?: number}) => {
            withErrorHandling(async () => {
                await api.updateTask(input);
                setTasks(await api.listTasks());
            });
        },
        [withErrorHandling]
    );

    const handleMoveTaskDate = useCallback(
        (id: number, dueDate: string | undefined, sortOrder: number) => {
            setTasks((prev) => prev.map((t) => (t.id === id ? {...t, dueDate, sortOrder} : t)));
            withErrorHandling(async () => {
                await api.setTaskDueDate(id, dueDate, sortOrder);
                setTasks(await api.listTasks());
            });
        },
        [withErrorHandling]
    );

    const handleMoveTaskProject = useCallback(
        (id: number, projectId: number | undefined, sortOrder: number) => {
            setTasks((prev) => prev.map((t) => (t.id === id ? {...t, projectId, sortOrder} : t)));
            withErrorHandling(async () => {
                await api.setTaskProject(id, projectId, sortOrder);
                setTasks(await api.listTasks());
            });
        },
        [withErrorHandling]
    );

    const handleAddProject = useCallback(
        (name: string, color: string, tags: string) => {
            withErrorHandling(async () => {
                await api.createProject(name, color, tags);
                setProjects(await api.listProjects());
            });
        },
        [withErrorHandling]
    );

    const handleUpdateProject = useCallback(
        (id: number, name: string, color: string, tags: string) => {
            withErrorHandling(async () => {
                await api.updateProject(id, name, color, tags);
                setProjects(await api.listProjects());
            });
        },
        [withErrorHandling]
    );

    const handleDeleteProject = useCallback(
        (id: number) => {
            const project = projects.find((p) => p.id === id);
            const taskCount = tasks.filter((t) => t.projectId === id).length;
            const impact = taskCount > 0 ? ` ${taskCount} task${taskCount === 1 ? '' : 's'} will be moved to Inbox.` : '';
            setPendingConfirm({
                title: 'Delete project',
                message: `Delete "${project?.name ?? 'this project'}"?${impact} This can't be undone.`,
                onConfirm: () => {
                    withErrorHandling(async () => {
                        await api.deleteProject(id);
                        await refreshAll();
                        setView((v) => (v.kind === 'project' && v.projectId === id ? {kind: 'all'} : v));
                    });
                },
            });
        },
        [projects, tasks, refreshAll, withErrorHandling]
    );

    const handleCreateNote = useCallback(async (): Promise<Note> => {
        const projectId = view.kind === 'project' ? view.projectId : undefined;
        const note = await api.createNote({title: 'Untitled note', content: '', projectId});
        setNotes(await api.listNotes());
        return note;
    }, [view]);

    const handleSaveNote = useCallback(
        (note: {id: number; title: string; content: string; projectId?: number}) => {
            withErrorHandling(async () => {
                await api.updateNote(note);
                // Notes-only refresh  avoid reloading tasks/projects on every blur autosave.
                setNotes(await api.listNotes());
            });
        },
        [withErrorHandling]
    );

    const handleDeleteNote = useCallback(
        (id: number) => {
            setPendingConfirm({
                title: 'Delete note',
                message: `Delete "${notes.find((n) => n.id === id)?.title || 'Untitled note'}"? This can't be undone.`,
                onConfirm: () => {
                    withErrorHandling(async () => {
                        await api.deleteNote(id);
                        setNotes(await api.listNotes());
                    });
                },
            });
        },
        [notes, withErrorHandling]
    );

    const handleExportTasks = useCallback(() => {
        withErrorHandling(async () => {
            const path = await api.exportTasksCSV();
            if (path) setToast(`Exported ${tasks.length} task${tasks.length === 1 ? '' : 's'} to ${path}`);
        });
    }, [tasks.length, withErrorHandling]);

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
                onSelectTask={handleSelectTask}
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
                onSelectTask={handleSelectTask}
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
                onSelectTask={handleSelectTask}
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
    } else if (view.kind === 'settings') {
        content = <SettingsView updateInfo={updateInfo} />;
    } else if (view.kind === 'history') {
        content = (
            <HistoryView
                items={notifications}
                unreadCount={unreadCount}
                onRead={(id) => {
                    api.markNotificationRead(id)
                        .then(refreshNotifications)
                        .catch(() => {});
                }}
                onReadAll={() => {
                    api.markAllNotificationsRead()
                        .then(refreshNotifications)
                        .catch(() => {});
                }}
                onDelete={(id) => {
                    api.deleteNotification(id)
                        .then(refreshNotifications)
                        .catch(() => {});
                }}
                onClear={() => {
                    setPendingConfirm({
                        title: 'Clear history',
                        message: "Remove every alert from history? This can't be undone.",
                        onConfirm: () => {
                            api.clearNotifications()
                                .then(refreshNotifications)
                                .catch(() => {});
                        },
                    });
                }}
            />
        );
    } else {
        const project = projects.find((p) => p.id === view.projectId);
        const projectTasks = tasks.filter((t) => t.projectId === view.projectId);
        content = project ? (
            <ProjectView
                project={project}
                tasks={projectTasks}
                projects={projects}
                onAddTask={handleAddTask}
                onUpdateProject={handleUpdateProject}
                onToggleTask={handleToggleTask}
                onSelectTask={handleSelectTask}
                onDeleteTask={handleDeleteTask}
            />
        ) : (
            <div className="loading-state">Project not found</div>
        );
    }

    return (
        <div id="App">
            <Sidebar
                projects={projects}
                tasks={tasks}
                view={view}
                unreadCount={unreadCount}
                onSelectView={setView}
                onOpenNotifications={() => {
                    setNotifyOpen(true);
                    refreshNotifications().catch(() => {});
                }}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
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
                {updateInfo && (
                    <div className="update-banner">
                        <div className="update-banner-text">
                            <strong>Update ready</strong>
                            <span>
                                v{updateInfo.currentVersion} → v{updateInfo.version}. {updateInfo.message}
                            </span>
                        </div>
                        <div className="update-banner-actions">
                            {updateInfo.canAutoApply ? (
                                <button type="button" className="update-banner-btn primary" onClick={handleRestartForUpdate}>
                                    Restart now
                                </button>
                            ) : (
                                <button type="button" className="update-banner-btn primary" onClick={handleOpenUpdatePackage}>
                                    Open installer
                                </button>
                            )}
                            <button type="button" className="update-banner-btn" onClick={handleDismissUpdate}>
                                Later
                            </button>
                        </div>
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

            {notifyOpen && (
                <NotificationPanel
                    items={notifications}
                    onClose={() => setNotifyOpen(false)}
                    onRead={(id) => {
                        api.markNotificationRead(id)
                            .then(refreshNotifications)
                            .catch(() => {});
                    }}
                    onReadAll={() => {
                        api.markAllNotificationsRead()
                            .then(refreshNotifications)
                            .catch(() => {});
                    }}
                    onClear={() => {
                        api.clearNotifications()
                            .then(refreshNotifications)
                            .catch(() => {});
                    }}
                    onOpenHistory={() => setView({kind: 'history'})}
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
