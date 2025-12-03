
import React, { useState, useMemo } from 'react';
import type { Task } from '../types';
import { useData } from '../contexts/DataContext';
import { RepeatIcon, ClockIcon } from './icons';
import { getDueDateInfo, fileToBase64 } from '../utils';

// --- Create Task Modal Component ---
interface CreateTaskModalProps {
    categories: string[];
    onClose: () => void;
    onSave: (taskData: Omit<Task, 'id' | 'created_by' | 'is_completed'>) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ categories, onClose, onSave }) => {
    const { settings } = useData();
    const minPoints = settings.minTaskPoints ?? 1;
    const maxPoints = settings.maxTaskPoints ?? 1000;

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        task_date: '',
        category: categories[0] || '',
        volunteers_needed: 1,
        points: 10,
        estimated_time: 60,
        image: '',
        is_template: false,
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTask(prev => ({
            ...prev,
            [name]: ['points', 'volunteers_needed', 'estimated_time'].includes(name) 
                ? parseInt(value) || 0 
                : value
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64Image = await fileToBase64(e.target.files[0]);
            setNewTask(prev => ({ ...prev, image: base64Image }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title || !newTask.task_date || !newTask.category) {
            setError('Udfyld venligst titel, dato og kategori.');
            return;
        }
        
        const selectedDate = new Date(newTask.task_date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (selectedDate < now) {
            setError('Datoen kan ikke være i fortiden.');
            return;
        }

        if (settings.enablePoints !== false && (newTask.points < minPoints || newTask.points > maxPoints)) {
            setError(`Point skal være mellem ${minPoints} og ${maxPoints}.`);
            return;
        }

        onSave(newTask);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto flex-1">
                         <h3 className="text-xl font-semibold mb-4 dark:text-slate-100">Opret Ny Opgave</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Titel</label>
                                <input 
                                    id="task-title" 
                                    name="title" // VIGTIG: Denne manglede måske eller var forkert
                                    value={newTask.title} 
                                    onChange={handleChange} 
                                    className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="task-date" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Dato</label>
                                <div className="relative">
                                    <input 
                                        id="task-date" 
                                        name="task_date" // VIGTIG
                                        type="datetime-local" 
                                        value={newTask.task_date} 
                                        onChange={handleChange} 
                                        className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Beskrivelse</label>
                                <textarea 
                                    id="task-description" 
                                    name="description" // VIGTIG
                                    value={newTask.description} 
                                    onChange={handleChange} 
                                    className="p-2 border rounded w-full h-24 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                ></textarea>
                            </div>
                             <div className="md:col-span-2">
                                <label htmlFor="task-image" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Billede (valgfrit)</label>
                                <input 
                                    id="task-image" 
                                    name="image" 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload} 
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/50 dark:file:text-emerald-300 dark:hover:file:bg-emerald-900" 
                                />
                            </div>
                            <div>
                                <label htmlFor="task-category" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Kategori</label>
                                <select 
                                    id="task-category" 
                                    name="category" // VIGTIG
                                    value={newTask.category} 
                                    onChange={handleChange} 
                                    className="p-2 border rounded bg-white w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            {settings.enablePoints !== false && (
                                <div>
                                    <label htmlFor="task-points" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Point</label>
                                    <input 
                                        id="task-points" 
                                        name="points" // VIGTIG
                                        type="number" 
                                        min={minPoints} 
                                        max={maxPoints} 
                                        value={newTask.points} 
                                        onChange={handleChange} 
                                        className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Tilladt: {minPoints} - {maxPoints} point</p>
                                </div>
                            )}
                             <div>
                                <label htmlFor="task-volunteers" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Antal Frivillige</label>
                                <input 
                                    id="task-volunteers" 
                                    name="volunteers_needed" // VIGTIG
                                    type="number" 
                                    value={newTask.volunteers_needed} 
                                    onChange={handleChange} 
                                    className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="task-estimated_time" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Est. Tid (min)</label>
                                <input 
                                    id="task-estimated_time" 
                                    name="estimated_time" // VIGTIG
                                    type="number" 
                                    value={newTask.estimated_time} 
                                    onChange={handleChange} 
                                    className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>
                         {error && <p className="text-rose-600 text-sm mt-4">{error}</p>}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end items-center gap-3 border-t dark:border-slate-700 mt-auto flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Annuller</button>
                        <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Opret Opgave</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// --- Task Detail Overlay Component ---
interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    isSignedUp: boolean;
    onSignUp: (id: string) => void;
    onUnregister: (id: string) => void;
    imageUrl: string | undefined;
    dueDateInfo: { text: string; color: string; textColor: string };
    repeatText: string | null;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, isSignedUp, onSignUp, onUnregister, imageUrl, dueDateInfo, repeatText }) => {
    const { settings } = useData();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center p-4" onClick={onClose}>
             <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="relative h-48 sm:h-64 bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                    {imageUrl ? (
                        <img src={imageUrl} alt={task.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                            Ingen billede
                        </div>
                    )}
                    <button onClick={onClose} className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {isSignedUp && (
                        <div className="absolute bottom-4 right-4 bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                            Du er tilmeldt
                        </div>
                    )}
                </div>
                
                <div className="p-6 sm:p-8 overflow-y-auto">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/50 py-1 px-3 rounded-full">{task.category}</span>
                                {dueDateInfo.text && (
                                    <span className={`text-xs font-bold py-1 px-3 rounded-full ${dueDateInfo.color} bg-opacity-20 ${dueDateInfo.textColor}`}>
                                        {dueDateInfo.text}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{task.title}</h2>
                            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
                                <span>{new Date(task.task_date).toLocaleDateString('da-DK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                {repeatText && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><RepeatIcon /> {repeatText}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {settings.enablePoints !== false && (
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{task.points} Point</div>
                            )}
                            {task.estimated_time && task.estimated_time > 0 && (
                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
                                    <ClockIcon />
                                    <span>{task.estimated_time} min</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none mb-8">
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Beskrivelse</h4>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 border dark:border-slate-700">
                        <div className="text-sm">
                            <span className="block text-slate-500 dark:text-slate-400">Ledige pladser</span>
                            <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">{task.volunteers_needed} frivillige mangler</span>
                        </div>
                        
                        {isSignedUp ? (
                            <button onClick={() => { onUnregister(task.id); onClose(); }} className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                Afmeld Opgave
                            </button>
                        ) : task.volunteers_needed > 0 ? (
                            <button onClick={() => { onSignUp(task.id); onClose(); }} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                Påtag Opgave {settings.enablePoints !== false && `(+${task.points} point)`}
                            </button>
                        ) : (
                            <button disabled className="w-full sm:w-auto bg-slate-400 dark:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed">
                                Ingen ledige pladser
                            </button>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
};


// --- Main Component ---

export const TaskListPage: React.FC = () => {
    const { tasks, signedUpTaskIds, handleSignUp, handleUnregister, categories, settings, userHasPermission, handleCreateTask } = useData();
    const [selectedCategory, setSelectedCategory] = useState('Alle');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);

    const filteredTasks = useMemo(() => {
        const nonCompleted = tasks.filter(task => !task.is_completed && !task.is_template);
        if (selectedCategory === 'Alle') {
            return nonCompleted;
        }
        return nonCompleted.filter(task => task.category === selectedCategory);
    }, [tasks, selectedCategory]);

    const getRepeatText = (task: Task): string | null => {
        if (task.repeat_interval && task.repeat_frequency && task.repeat_frequency > 0) {
            const interval = task.repeat_interval;
            const frequency = task.repeat_frequency;
            
            let intervalSingular = '';
            switch(interval) {
                case 'dage': intervalSingular = 'dag'; break;
                case 'uger': intervalSingular = 'uge'; break;
                case 'måneder': intervalSingular = 'måned'; break;
            }

            if (frequency === 1) {
                return `Gentages hver ${intervalSingular}`;
            }
            return `Gentages hver ${frequency}. ${interval}`;
        }
        return null;
    }
    
    const canCreateTasks = userHasPermission('create_task_frontend') || userHasPermission('manage_tasks');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200 dark:border-slate-700 pb-2 gap-4">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Ledige Opgaver</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {canCreateTasks && (
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Opret Opgave
                        </button>
                    )}
                    
                    <div className="relative">
                        <label htmlFor="category-filter" className="sr-only">Filtrer efter kategori</label>
                        <select
                            id="category-filter"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-slate-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                        >
                            <option value="Alle">Alle Kategorier</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {filteredTasks.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-10">Der er ingen ledige opgaver, der matcher den valgte kategori.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTasks.map(task => {
                        const isSignedUp = signedUpTaskIds.includes(task.id);
                        const repeatText = getRepeatText(task);
                        const imageUrl = task.image || settings.defaultTaskImage;

                        return (
                        <div key={task.id} className="relative bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col transition-all duration-200 group">
                            {isSignedUp && (
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 shadow-sm">
                                    Tilmeldt
                                </div>
                            )}
                            
                            {/* Image Section */}
                            <div className="h-32 overflow-hidden relative cursor-pointer" onClick={() => setViewingTask(task)}>
                                {imageUrl ? (
                                    <img src={imageUrl} alt={task.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">Ingen billede</div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
                            </div>

                            <div className="p-3 flex flex-col flex-grow">
                                {/* Title */}
                                <h3 
                                    className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-2"
                                    onClick={() => setViewingTask(task)}
                                >
                                    {task.title}
                                </h3>
                                
                                {/* Description Excerpt */}
                                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 flex-grow cursor-pointer" onClick={() => setViewingTask(task)}>
                                    {task.description}
                                </p>
                                
                                {/* Meta Info Row with Date included */}
                                <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs font-medium text-slate-600 dark:text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                                    <span className="text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30 px-2 py-0.5 rounded">{task.category}</span>
                                    {settings.enablePoints !== false && (
                                        <span className="text-emerald-600 dark:text-emerald-400">{task.points} Point</span>
                                    )}
                                    {task.estimated_time && task.estimated_time > 0 && (
                                        <span className="flex items-center gap-0.5"><ClockIcon /> {task.estimated_time}m</span>
                                    )}
                                    <span>{task.volunteers_needed} pladser</span>
                                    {/* Date and Time added here */}
                                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 border-l pl-2 dark:border-slate-600">
                                        {new Date(task.task_date).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        {repeatText && <RepeatIcon />}
                                    </span>
                                </div>

                                {/* Buttons Row */}
                                <div className="flex gap-2 mt-auto">
                                    <button 
                                        onClick={() => setViewingTask(task)}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold py-2 px-3 rounded transition-colors"
                                    >
                                        Læs mere
                                    </button>
                                    
                                    {isSignedUp ? (
                                        <button 
                                            onClick={() => handleUnregister(task.id)} 
                                            className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/50 dark:hover:bg-rose-900 dark:text-rose-400 text-xs font-semibold py-2 px-3 rounded transition-colors"
                                        >
                                            Afmeld
                                        </button>
                                    ) : task.volunteers_needed > 0 ? (
                                        <button 
                                            onClick={() => handleSignUp(task.id)} 
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded transition-colors"
                                        >
                                            Påtag
                                        </button>
                                    ) : (
                                        <button disabled className="flex-1 bg-slate-300 dark:bg-slate-600 text-white text-xs font-semibold py-2 px-3 rounded cursor-not-allowed">
                                            Fyldt
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}

            {isCreateModalOpen && (
                <CreateTaskModal 
                    categories={categories}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSave={handleCreateTask}
                />
            )}

            {viewingTask && (
                <TaskDetailModal
                    task={viewingTask}
                    onClose={() => setViewingTask(null)}
                    isSignedUp={signedUpTaskIds.includes(viewingTask.id)}
                    onSignUp={handleSignUp}
                    onUnregister={handleUnregister}
                    imageUrl={viewingTask.image || settings.defaultTaskImage}
                    dueDateInfo={getDueDateInfo(viewingTask.task_date)}
                    repeatText={getRepeatText(viewingTask)}
                />
            )}
        </div>
    );
};
