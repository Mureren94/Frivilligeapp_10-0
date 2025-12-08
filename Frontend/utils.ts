
// ========= HELPER FUNCTIONS =========
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

// Safe ID generator that works in all environments (including non-secure HTTP)
export const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const getDueDateInfo = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateString);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Forfalden', color: 'bg-rose-500', textColor: 'text-rose-700 dark:text-rose-400' };
    if (diffDays === 0) return { text: 'I dag', color: 'bg-rose-500', textColor: 'text-rose-700 dark:text-rose-400' };
    if (diffDays === 1) return { text: 'I morgen', color: 'bg-amber-400', textColor: 'text-amber-700 dark:text-amber-400' };
    if (diffDays <= 7) return { text: `Om ${diffDays} dage`, color: 'bg-yellow-400', textColor: 'text-yellow-700 dark:text-yellow-400' };
    return { text: '', color: 'bg-slate-400', textColor: 'text-slate-700' };
};
