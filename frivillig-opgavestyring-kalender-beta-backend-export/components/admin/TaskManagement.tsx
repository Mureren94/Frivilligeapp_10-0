import React, { useState, useMemo } from 'react';
import type { Task, User, AppSettings } from '../../types';
import { useData } from '../../contexts/DataContext';
import { fileToBase64, generateId } from '../../utils';
import { TrashIcon, EditIcon, TemplateIcon } from '../icons';
import toast from 'react-hot-toast';

// --- Helper Component: Image Selector ---
interface TaskImageSelectorProps {
    currentImage: string | undefined;
    onImageChange: (base64: string) => void;
    idPrefix?: string; // Tilføjet for unikke IDs
}

const TaskImageSelector: React.FC<TaskImageSelectorProps> = ({ currentImage, onImageChange, idPrefix = 'task' }) => {
    const { tasks, settings, galleryImages } = useData();
    const [mode, setMode] = useState<'upload' | 'gallery'>('upload');

    const allImages = useMemo(() => {
        const images: string[] = [];
        if (settings.defaultTaskImage) images.push(settings.defaultTaskImage);
        galleryImages.forEach(img => images.push(img.data));
        tasks.forEach(t => {
            if (t.image && !images.includes(t.image)) images.push(t.image);
        });
        return Array.from(new Set(images));
    }, [tasks, settings.defaultTaskImage, galleryImages]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64Image = await fileToBase64(e.target.files[0]);
            onImageChange(base64Image);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                <button type="button" onClick={() => setMode('upload')} className={`text-sm font-medium pb-1 ${mode === 'upload' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Upload Ny</button>
                <button type="button" onClick={() => setMode('gallery')} className={`text-sm font-medium pb-1 ${mode === 'gallery' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Galleri ({allImages.length})</button>
            </div>
            <div className="flex items-start gap-4">
                {currentImage ? (
                    <div className="relative group flex-shrink-0">
                        <img src={currentImage} alt="Current" className="w-24 h-24 rounded object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                        <button type="button" onClick={() => onImageChange('')} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                    </div>
                ) : (
                    <div className="w-24 h-24 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">Intet billede</div>
                )}
                <div className="flex-grow">
                    {mode === 'upload' ? (
                        <div>
                             {/* FIX: Input nestet i label fjerner behovet for ID/for og løser tilgængelighedsfejl */}
                             <label className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/50 dark:file:text-emerald-300 dark:hover:file:bg-emerald-900 cursor-pointer">
                                 <span className="sr-only">Vælg billede til upload</span>
                                 <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                             </label>
                            <p className="text-xs text-slate-500 mt-2">Understøtter JPG, PNG, GIF, WebP.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                            {allImages.map((img, idx) => (
                                <button key={idx} type="button" onClick={() => onImageChange(img)} className="relative aspect-square rounded overflow-hidden border-2 border-transparent hover:border-emerald-500 focus:outline-none focus:border-emerald-500 transition-all">
                                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Helper Component: AdminTaskRow ---
interface AdminTaskRowProps {
    task: Task;
    isSelected: boolean;
    onToggleSelect: () => void;
    onUpdate: (taskId: string, field: keyof Task, value: any) => void;
    onDelete: (taskId: string) => void;
    onEdit: (task: Task) => void;
    categories: string[];
    users: User[];
    settings: AppSettings;
}

const AdminTaskRow: React.FC<AdminTaskRowProps> = ({ task, isSelected, onToggleSelect, onUpdate, onDelete, onEdit, categories, users, settings }) => {
    const handleImageChangeForTask = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64Image = await fileToBase64(e.target.files[0]);
            onUpdate(task.id, 'image', base64Image);
        }
    };

    const creator = useMemo(() => {
        if (!task.created_by) return null;
        return users.find(u => u.id === task.created_by);
    }, [task.created_by, users]);
    
    const imageUrl = task.image || settings.defaultTaskImage;

    return (
        <div className="p-4 border dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700/50 flex items-start gap-4">
            <input id={`select-row-${task.id}`} name={`select-row-${task.id}`} aria-label="Vælg række" type="checkbox" checked={isSelected} onChange={onToggleSelect} className="appearance-none h-5 w-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500 mt-1 flex-shrink-0" />
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 w-full">
                <div className="flex items-start gap-4 flex-grow">
                     <img src={imageUrl || `https://ui-avatars.com/api/?name=${task.title.replace(/\s/g, '+')}&background=random&size=64`} alt={task.title} className="w-16 h-16 rounded object-cover flex-shrink-0 bg-slate-200 dark:bg-slate-600" />
                    <div className="flex-grow">
                        <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">{task.title}{task.is_template && <TemplateIcon />}</p>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="font-bold uppercase tracking-wider text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded mr-2">Status</span>
                            {task.is_template ? "Skabelon" : "Opgave"}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(task.task_date).toLocaleDateString('da-DK')}
                            {creator && ` (Oprettet af: ${creator.name})`}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                            {/* FIX: Også her bruger vi label-nesting for at undgå ID-konflikter og manglende labels */}
                            <label className="text-xs cursor-pointer bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 px-2 py-1 rounded">
                                Upload
                                <input type="file" accept="image/*" onChange={handleImageChangeForTask} className="hidden" />
                            </label>
                            {task.image && (<button onClick={() => onUpdate(task.id, 'image', '')} className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/50 dark:hover:bg-rose-900 dark:text-rose-400 px-2 py-1 rounded">Fjern billede</button>)}
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-end gap-3 flex-shrink-0 self-start md:self-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-0.5">Status</span>
                        <div className="h-9 flex items-center">
                            <input type="checkbox" id={`completed-${task.id}`} name={`completed-${task.id}`} checked={task.is_completed} onChange={e => onUpdate(task.id, 'is_completed', e.target.checked)} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500" />
                            <label htmlFor={`completed-${task.id}`} className="ml-2 text-sm text-slate-900 dark:text-slate-300">Fuldført</label>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor={`category-${task.id}`} className="sr-only">Kategori</label>
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-0.5">Kategori</span>
                        <select id={`category-${task.id}`} name={`category-${task.id}`} value={task.category} onChange={e => onUpdate(task.id, 'category', e.target.value)} className="h-9 p-1 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm dark:text-white">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col">
                         <label htmlFor={`volunteers-${task.id}`} className="sr-only">Pladser</label>
                         <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-0.5">Pladser</span>
                         <input id={`volunteers-${task.id}`} name={`volunteers-${task.id}`} type="number" value={task.volunteers_needed} onChange={e => onUpdate(task.id, 'volunteers_needed', parseInt(e.target.value))} className="h-9 w-20 p-1 border dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <div className="flex items-center gap-1 h-9">
                         <button onClick={() => onEdit(task)} className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 p-1" title="Rediger opgave"><EditIcon /></button>
                         <button onClick={() => onDelete(task.id)} className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 p-1" title="Slet opgave"><TrashIcon /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Edit Modal Component ---
interface EditTaskModalProps {
    task: Task;
    onSave: (task: Task) => void;
    onClose: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onSave, onClose }) => {
    const { categories, settings } = useData();
    const minPoints = settings.minTaskPoints ?? 1;
    const maxPoints = settings.maxTaskPoints ?? 1000;
    
    const [editedTask, setEditedTask] = useState<Task>(task);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';

        if (name === "repeat_interval") {
            if (value) {
                setEditedTask(prev => ({ ...prev, repeat_interval: value as Task['repeat_interval'], repeat_frequency: prev.repeat_frequency || 1 }));
            } else {
                 setEditedTask(prev => { const newState = {...prev}; delete newState.repeat_interval; delete newState.repeat_frequency; return newState; });
            }
            return;
        }
        
        setEditedTask(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (['points', 'volunteers_needed', 'estimated_time'].includes(name) ? parseInt(value) || 0 : (name === 'repeat_frequency' ? Math.max(1, parseInt(value) || 1) : value))
        }));
    };
    
    const formattedDate = useMemo(() => {
        try {
            const date = new Date(editedTask.task_date);
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (error) { return ''; }
    }, [editedTask.task_date]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const localDate = e.target.value;
        setEditedTask(prev => ({ ...prev, task_date: localDate ? new Date(localDate).toISOString() : '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!editedTask.title || !editedTask.task_date || !editedTask.category) { setError('Udfyld venligst titel, dato og kategori.'); return; }
        
        const selectedDate = new Date(editedTask.task_date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (!editedTask.is_completed && !editedTask.is_template && selectedDate < now) { setError('Datoen kan ikke være i fortiden for en opgave, der ikke er fuldført.'); return; }
        if (settings.enablePoints !== false && (editedTask.points < minPoints || editedTask.points > maxPoints)) { setError(`Point skal være mellem ${minPoints} og ${maxPoints}.`); return; }

        onSave(editedTask);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto flex-1">
                        <h3 className="text-xl font-semibold mb-4 dark:text-slate-100">Rediger Opgave</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Titel</label>
                                <input id="edit-title" name="title" value={editedTask.title} onChange={handleChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/>
                             </div>
                            <div>
                                <label htmlFor="edit-date" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Dato</label>
                                <input id="edit-date" type="datetime-local" name="task_date_local" value={formattedDate} onChange={handleDateChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Beskrivelse</label>
                                <textarea id="edit-description" name="description" value={editedTask.description} onChange={handleChange} className="p-2 border rounded w-full h-24 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"></textarea>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Billede</label>
                                <TaskImageSelector idPrefix="edit-task" currentImage={editedTask.image} onImageChange={(base64) => setEditedTask(prev => ({ ...prev, image: base64 }))} />
                            </div>
                            <div>
                                <label htmlFor="edit-category" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Kategori</label>
                                <select id="edit-category" name="category" value={editedTask.category} onChange={handleChange} className="p-2 border rounded bg-white w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                            </div>
                            {settings.enablePoints !== false && (
                                <div>
                                    <label htmlFor="edit-points" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Point</label>
                                    <input id="edit-points" name="points" type="number" min={minPoints} max={maxPoints} value={editedTask.points} onChange={handleChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/>
                                </div>
                            )}
                            <div>
                                <label htmlFor="edit-volunteers" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Antal Frivillige</label>
                                <input id="edit-volunteers" name="volunteers_needed" type="number" value={editedTask.volunteers_needed} onChange={handleChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/>
                            </div>
                            <div>
                                <label htmlFor="edit-time" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Est. Tid (minutter)</label>
                                <input id="edit-time" name="estimated_time" type="number" value={editedTask.estimated_time || ''} onChange={handleChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="edit-repeat-interval" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Gentagelse</label>
                                <div className="flex items-center gap-2">
                                    <select id="edit-repeat-interval" name="repeat_interval" value={editedTask.repeat_interval || ''} onChange={handleChange} className="p-2 border rounded bg-white w-1/2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"><option value="">Ingen gentagelse</option><option value="dage">Dage</option><option value="uger">Uger</option><option value="måneder">Måneder</option></select>
                                    {editedTask.repeat_interval && (<div className="flex items-center gap-2 w-1/2"><span className="text-sm dark:text-slate-400">Hver</span><label htmlFor="edit-repeat-freq" className="sr-only">Frekvens</label><input id="edit-repeat-freq" name="repeat_frequency" type="number" value={editedTask.repeat_frequency || 1} onChange={handleChange} min="1" className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/></div>)}
                                </div>
                            </div>
                             <div className="md:col-span-2 flex items-center">
                                <input type="checkbox" id="edit-isTemplate" name="is_template" checked={!!editedTask.is_template} onChange={handleChange} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500"/>
                                <label htmlFor="edit-isTemplate" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Gem som skabelon</label>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end items-center gap-3 border-t dark:border-slate-700 mt-auto flex-shrink-0">
                        {error && <p className="text-sm text-rose-600 mr-auto">{error}</p>}
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Annuller</button>
                        <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Gem Ændringer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

type TaskManagementTab = 'create' | 'tasks' | 'templates' | 'categories';

// --- Main Component ---
export const TaskManagement: React.FC = () => {
    const { categories, setCategories, tasks, setTasks, currentUser, users, userTaskSignups, setUsers, settings, sendEmailNotification } = useData();
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [activeTab, setActiveTab] = useState<TaskManagementTab>('tasks');

    const minPoints = settings.minTaskPoints ?? 1;
    const maxPoints = settings.maxTaskPoints ?? 1000;

    // --- Kategori-håndtering ---
    const [newCategory, setNewCategory] = useState('');
    const handleAddCategory = () => {
        if (newCategory && !categories.includes(newCategory)) {
            // NOTE: I en rigtig backend-opsætning ville dette kalde en API service
            setCategories(prev => [...prev, newCategory].sort());
            setNewCategory('');
            toast.success(`Kategorien "${newCategory}" er tilføjet.`);
        }
    };
    const handleDeleteCategory = (catToDelete: string) => {
        if (window.confirm(`Er du sikker på, du vil slette kategorien "${catToDelete}"?`)) {
            // NOTE: I en rigtig backend-opsætning ville dette kalde en API service
            setCategories(prev => prev.filter(c => c !== catToDelete));
            toast.success(`Kategorien "${catToDelete}" er slettet.`);
        }
    };

    // --- Opgave-håndtering ---
    const initialNewTaskState = {
        title: '', description: '', task_date: '', category: categories[0] || '',
        volunteers_needed: 1, points: 10, image: '', is_template: false, estimated_time: 60,
    };
    const [newTask, setNewTask] = useState<Partial<Task> & typeof initialNewTaskState>(initialNewTaskState);
    const [newTaskError, setNewTaskError] = useState('');

    const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        if (name === "repeat_interval") {
            if (value) { setNewTask(prev => ({ ...prev, repeat_interval: value as Task['repeat_interval'], repeat_frequency: prev.repeat_frequency || 1 })); } 
            else { setNewTask(prev => { const newState = {...prev}; delete newState.repeat_interval; delete newState.repeat_frequency; return newState; }); }
            return;
        }
        setNewTask(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (['points', 'volunteers_needed', 'estimated_time'].includes(name) ? parseInt(value) || 0 : (name === 'repeat_frequency' ? Math.max(1, parseInt(value) || 1) : value)) }));
    };

    const handleAddTask = () => {
        setNewTaskError('');
        if (!newTask.title || !newTask.task_date || !newTask.category) { setNewTaskError('Udfyld venligst titel, dato og kategori.'); return; }
        const selectedDate = new Date(newTask.task_date);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        if (!newTask.is_template && selectedDate < now) { setNewTaskError('Datoen for en ny opgave kan ikke være i fortiden.'); return; }
        if (settings.enablePoints !== false && (newTask.points < minPoints || newTask.points > maxPoints)) { setNewTaskError(`Point skal være mellem ${minPoints} og ${maxPoints}.`); return; }

        const createdTask: Task = { ...newTask, id: generateId(), is_completed: false, created_by: currentUser?.id };
        setTasks(prevTasks => [...prevTasks, createdTask]);
        setNewTask(initialNewTaskState);
        toast.success(`Opgaven "${createdTask.title}" er oprettet.`);
        if (!createdTask.is_template) { sendEmailNotification('new_task', { task: createdTask }); }
    };

    const handleTaskUpdate = <K extends keyof Task>(taskId: string, field: K, value: Task[K]) => {
        const task = tasks.find(t => t.id === taskId);
        if (settings.enablePoints !== false && field === 'is_completed' && value === true && task && !task.is_completed) {
            const signedUpEmails = Object.keys(userTaskSignups).filter((email) => userTaskSignups[email].includes(taskId));
            if (signedUpEmails.length > 0) {
                 setUsers(prevUsers => prevUsers.map(user => { if (signedUpEmails.includes(user.email)) { return { ...user, points: user.points + task.points }; } return user; }));
                 toast.success(`${signedUpEmails.length} bruger(e) har fået ${task.points} point for fuldførelse!`);
            }
        }
         setTasks(tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t));
    };
    
    const handleSaveEditedTask = (updatedTask: Task) => {
        setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        setEditingTask(null);
        toast.success(`Opgaven "${updatedTask.title}" er opdateret.`);
    };

    const handleDeleteTask = (taskId: string) => {
         if (window.confirm(`Er du sikker på, du vil slette denne opgave?`)) {
            const taskToDelete = tasks.find(t => t.id === taskId);
            setTasks(tasks.filter(t => t.id !== taskId));
            if (taskToDelete) { toast.success(`Opgaven "${taskToDelete.title}" er slettet.`); }
        }
    };

    const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [taskCategoryFilter, setTaskCategoryFilter] = useState('all');
    const [taskSearch, setTaskSearch] = useState('');
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all');
    const [templateSearch, setTemplateSearch] = useState('');
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

    const allNormalTasks = useMemo(() => tasks.filter(t => !t.is_template).sort((a,b) => new Date(b.task_date).getTime() - new Date(a.task_date).getTime()), [tasks]);
    const allTemplates = useMemo(() => tasks.filter(t => t.is_template).sort((a,b) => new Date(b.task_date).getTime() - new Date(a.task_date).getTime()), [tasks]);

    const filteredTasks = useMemo(() => {
        return allNormalTasks.filter(task => {
            const statusMatch = taskStatusFilter === 'all' || (taskStatusFilter === 'completed' && task.is_completed) || (taskStatusFilter === 'active' && !task.is_completed);
            const categoryMatch = taskCategoryFilter === 'all' || task.category === taskCategoryFilter;
            const searchMatch = !taskSearch || task.title.toLowerCase().includes(taskSearch.toLowerCase());
            return statusMatch && categoryMatch && searchMatch;
        });
    }, [allNormalTasks, taskStatusFilter, taskCategoryFilter, taskSearch]);

    const filteredTemplates = useMemo(() => {
        return allTemplates.filter(template => {
            const categoryMatch = templateCategoryFilter === 'all' || template.category === templateCategoryFilter;
            const searchMatch = !templateSearch || template.title.toLowerCase().includes(templateSearch.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [allTemplates, templateCategoryFilter, templateSearch]);

    const handleToggleSelectTask = (taskId: string) => setSelectedTaskIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
    const handleToggleSelectAllTasks = () => selectedTaskIds.length === filteredTasks.length ? setSelectedTaskIds([]) : setSelectedTaskIds(filteredTasks.map(t => t.id));
    const handleToggleSelectTemplate = (templateId: string) => setSelectedTemplateIds(prev => prev.includes(templateId) ? prev.filter(id => id !== templateId) : [...prev, templateId]);
    const handleToggleSelectAllTemplates = () => selectedTemplateIds.length === filteredTemplates.length ? setSelectedTemplateIds([]) : setSelectedTemplateIds(filteredTemplates.map(t => t.id));
    
    const handleBulkDelete = (idsToDelete: string[], type: 'task' | 'template') => {
        const count = idsToDelete.length;
        if (count === 0) return;
        const itemType = type === 'task' ? 'opgaver' : 'skabeloner';
        if (window.confirm(`Er du sikker på, du vil slette ${count} valgte ${itemType}?`)) {
            setTasks(prev => prev.filter(t => !idsToDelete.includes(t.id)));
            toast.success(`${count} ${itemType} er slettet.`);
            if (type === 'task') setSelectedTaskIds([]); else setSelectedTemplateIds([]);
        }
    };

    const tabClasses = (tabName: TaskManagementTab) => `px-4 py-2 rounded-t-lg text-sm font-medium transition-colors duration-200 border-b-2 ${activeTab === tabName ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    <button className={`${tabClasses('tasks')} whitespace-nowrap`} onClick={() => setActiveTab('tasks')}>Administrer Opgaver</button>
                    <button className={`${tabClasses('templates')} whitespace-nowrap`} onClick={() => setActiveTab('templates')}>Skabeloner</button>
                    <button className={`${tabClasses('create')} whitespace-nowrap`} onClick={() => setActiveTab('create')}>Opret Ny</button>
                    <button className={`${tabClasses('categories')} whitespace-nowrap`} onClick={() => setActiveTab('categories')}>Kategorier</button>
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'create' && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4 dark:text-slate-100">Opret ny Opgave</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="create-title" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Titel</label>
                                <input id="create-title" name="title" value={newTask.title} onChange={handleNewTaskChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/>
                            </div>
                            <div>
                                <label htmlFor="create-date" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Dato</label>
                                <input id="create-date" type="datetime-local" name="task_date" value={newTask.task_date} onChange={handleNewTaskChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="create-description" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Beskrivelse</label>
                                <textarea id="create-description" name="description" value={newTask.description} onChange={handleNewTaskChange} className="p-2 border rounded w-full h-24 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"></textarea>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Billede</label>
                                <TaskImageSelector idPrefix="create-task" currentImage={newTask.image} onImageChange={(base64) => setNewTask(prev => ({ ...prev, image: base64 }))} />
                            </div>
                            <div>
                                <label htmlFor="create-category" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Kategori</label>
                                <select id="create-category" name="category" value={newTask.category} onChange={handleNewTaskChange} className="p-2 border rounded bg-white w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                            </div>
                            {settings.enablePoints !== false && (
                                <div>
                                    <label htmlFor="create-points" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Point</label>
                                    <input id="create-points" name="points" type="number" min={minPoints} max={maxPoints} value={newTask.points} onChange={handleNewTaskChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/>
                                </div>
                            )}
                            <div>
                                <label htmlFor="create-volunteers" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Antal Frivillige</label>
                                <input id="create-volunteers" name="volunteers_needed" type="number" value={newTask.volunteers_needed} onChange={handleNewTaskChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/>
                            </div>
                            <div>
                                <label htmlFor="create-time" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Est. Tid (minutter)</label>
                                <input id="create-time" name="estimated_time" type="number" value={newTask.estimated_time} onChange={handleNewTaskChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="create-repeat-interval" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Gentagelse</label>
                                <div className="flex items-center gap-2">
                                    <select id="create-repeat-interval" name="repeat_interval" value={newTask.repeat_interval || ''} onChange={handleNewTaskChange} className="p-2 border rounded bg-white w-1/2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"><option value="">Ingen gentagelse</option><option value="dage">Dage</option><option value="uger">Uger</option><option value="måneder">Måneder</option></select>
                                    {newTask.repeat_interval && (<div className="flex items-center gap-2 w-1/2"><span className="text-sm dark:text-slate-400">Hver</span><label htmlFor="create-repeat-freq" className="sr-only">Frekvens</label><input id="create-repeat-freq" name="repeat_frequency" type="number" value={newTask.repeat_frequency || 1} onChange={handleNewTaskChange} min="1" className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"/></div>)}
                                </div>
                            </div>
                            <div className="md:col-span-2 flex items-center">
                                <input type="checkbox" id="isTemplate" name="is_template" checked={!!newTask.is_template} onChange={handleNewTaskChange} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500"/>
                                <label htmlFor="isTemplate" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Gem som skabelon</label>
                            </div>
                        </div>
                        {newTaskError && <p className="text-center text-sm text-rose-600 mt-2">{newTaskError}</p>}
                        <button onClick={handleAddTask} className="mt-4 w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">Opret Opgave</button>
                    </div>
                )}
                {activeTab === 'categories' && (
                     <div>
                        <h3 className="text-xl font-semibold mb-4 dark:text-slate-100">Administrer Kategorier</h3>
                        <div className="flex gap-2 mb-4">
                            <label htmlFor="new-category-input" className="sr-only">Ny kategori</label>
                            <input id="new-category-input" name="new-category" type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Ny kategori..." className="flex-grow border border-slate-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 dark:text-white" />
                            <button onClick={handleAddCategory} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">Tilføj</button>
                        </div>
                        <div className="flex flex-wrap gap-2">{categories.map(cat => (<span key={cat} className="flex items-center bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium pl-3 pr-1 py-1 rounded-full">{cat}<button onClick={() => handleDeleteCategory(cat)} className="ml-2 text-rose-500 hover:text-rose-700"><TrashIcon /></button></span>))}</div>
                    </div>
                )}
                {activeTab === 'tasks' && (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                            <label htmlFor="task-search" className="sr-only">Søg på titel</label>
                            <input id="task-search" name="task-search" aria-label="Søg på titel" type="text" value={taskSearch} onChange={e => setTaskSearch(e.target.value)} placeholder="Søg på titel..." className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            <label htmlFor="task-status" className="sr-only">Filtrer efter status</label>
                            <select id="task-status" name="task-status" aria-label="Filtrer efter status" value={taskStatusFilter} onChange={e => setTaskStatusFilter(e.target.value as any)} className="p-2 border rounded bg-white w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"><option value="all">Alle Statusser</option><option value="active">Aktiv</option><option value="completed">Færdig</option></select>
                            <label htmlFor="task-category" className="sr-only">Filtrer efter kategori</label>
                            <select id="task-category" name="task-category" aria-label="Filtrer efter kategori" value={taskCategoryFilter} onChange={e => setTaskCategoryFilter(e.target.value)} className="p-2 border rounded bg-white w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"><option value="all">Alle Kategorier</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                            {selectedTaskIds.length > 0 && (<div className="lg:col-span-3"><button onClick={() => handleBulkDelete(selectedTaskIds, 'task')} className="bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700">Slet valgte ({selectedTaskIds.length})</button></div>)}
                        </div>
                        <div className="flex items-center gap-2 mb-2 p-2 border-b dark:border-slate-700">
                            <input id="select-all-tasks" name="select-all-tasks" type="checkbox" checked={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length} onChange={handleToggleSelectAllTasks} className="appearance-none h-5 w-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500"/>
                            <label htmlFor="select-all-tasks" className="text-sm font-medium text-slate-700 dark:text-slate-300">Vælg alle</label>
                        </div>
                        <div className="space-y-4 max-h-[32rem] overflow-y-auto">
                            {filteredTasks.map(task => <AdminTaskRow key={task.id} task={task} isSelected={selectedTaskIds.includes(task.id)} onToggleSelect={() => handleToggleSelectTask(task.id)} onUpdate={handleTaskUpdate} onDelete={handleDeleteTask} onEdit={setEditingTask} categories={categories} users={users} settings={settings} />)}
                        </div>
                    </div>
                )}
                 {activeTab === 'templates' && (
                     <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                            <label htmlFor="template-search" className="sr-only">Søg skabeloner</label>
                            <input id="template-search" name="template-search" type="text" value={templateSearch} onChange={e => setTemplateSearch(e.target.value)} placeholder="Søg på titel..." className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            <label htmlFor="template-category-filter" className="sr-only">Filtrer skabeloner efter kategori</label>
                            <select id="template-category-filter" name="template-category-filter" aria-label="Filtrer skabeloner efter kategori" value={templateCategoryFilter} onChange={e => setTemplateCategoryFilter(e.target.value)} className="p-2 border rounded bg-white w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"><option value="all">Alle Kategorier</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                            {selectedTemplateIds.length > 0 && (<div className="lg:col-span-3"><button onClick={() => handleBulkDelete(selectedTemplateIds, 'template')} className="bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700">Slet valgte ({selectedTemplateIds.length})</button></div>)}
                        </div>
                        <div className="flex items-center gap-2 mb-2 p-2 border-b dark:border-slate-700">
                            <input id="select-all-templates" name="select-all-templates" type="checkbox" checked={filteredTemplates.length > 0 && selectedTemplateIds.length === filteredTemplates.length} onChange={handleToggleSelectAllTemplates} className="appearance-none h-5 w-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500"/>
                            <label htmlFor="select-all-templates" className="text-sm font-medium text-slate-700 dark:text-slate-300">Vælg alle</label>
                        </div>
                        <div className="space-y-4 max-h-[32rem] overflow-y-auto">
                            {filteredTemplates.map(task => <AdminTaskRow key={task.id} task={task} isSelected={selectedTemplateIds.includes(task.id)} onToggleSelect={() => handleToggleSelectTemplate(task.id)} onUpdate={handleTaskUpdate} onDelete={handleDeleteTask} onEdit={setEditingTask} categories={categories} users={users} settings={settings} />)}
                        </div>
                    </div>
                )}
            </div>
            {editingTask && <EditTaskModal task={editingTask} onSave={handleSaveEditedTask} onClose={() => setEditingTask(null)} />}
        </div>
    );
};