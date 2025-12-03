const API_BASE_URL = 'https://api.voreskerne.com/app'; 

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const defaultOptions: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include', 
    };

    const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }

    return response.json();
}

export const api = {
    // Auth
    login: (credentials: any) => fetchJson('/login', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: () => fetchJson('/logout', { method: 'POST' }),
    getInitData: () => fetchJson('/init'),

    // Tasks
    createTask: (task: any) => fetchJson('/tasks', { method: 'POST', body: JSON.stringify(task) }),
    signUpTask: (taskId: string) => fetchJson('/tasks/signup', { method: 'POST', body: JSON.stringify({ taskId }) }),
    unregisterTask: (taskId: string) => fetchJson('/tasks/unregister', { method: 'POST', body: JSON.stringify({ taskId }) }),
    
    // Shifts
    takeShiftRole: (shiftRoleId: string) => fetchJson('/shifts/take', { method: 'POST', body: JSON.stringify({ shiftRoleId }) }),
    leaveShiftRole: (shiftRoleId: string) => fetchJson('/shifts/leave', { method: 'POST', body: JSON.stringify({ shiftRoleId }) }),
    
    // Vagtroller
    addShiftRoleType: (name: string) => fetchJson('/shift_role_types', { method: 'POST', body: JSON.stringify({ name }) }),
    deleteShiftRoleType: (name: string) => fetchJson('/shift_role_types', { method: 'DELETE', body: JSON.stringify({ name }) }),

    // User
    updateProfile: (data: any) => fetchJson('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),

    // --- NYE METODER (PAKKE 3) ---

    // Settings
    saveSettings: (settings: any) => fetchJson('/settings', { method: 'PUT', body: JSON.stringify(settings) }),

    // Categories
    addCategory: (name: string) => fetchJson('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
    deleteCategory: (name: string) => fetchJson('/categories', { method: 'DELETE', body: JSON.stringify({ name }) }),

    // Gallery
    uploadGalleryImage: (image: any) => fetchJson('/gallery', { method: 'POST', body: JSON.stringify(image) }),
    deleteGalleryImage: (id: string) => fetchJson('/gallery', { method: 'DELETE', body: JSON.stringify({ id }) }),
    
    // Image helper
    getImageUrl: (path: string) => {
        if (!path) return '';
        if (path.startsWith('data:') || path.startsWith('http')) return path;
        return `${API_BASE_URL}/${path}`;
    }
};