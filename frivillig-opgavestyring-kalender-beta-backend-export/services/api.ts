const API_BASE_URL = 'https://api.voreskerne.com/app'; 

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const defaultOptions: RequestInit = {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
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
    login: (credentials: any) => fetchJson('/login', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: () => fetchJson('/logout', { method: 'POST' }),
    getInitData: () => fetchJson('/init'),

    createTask: (task: any) => fetchJson('/tasks', { method: 'POST', body: JSON.stringify(task) }),
    signUpTask: (taskId: string) => fetchJson('/tasks/signup', { method: 'POST', body: JSON.stringify({ taskId }) }),
    unregisterTask: (taskId: string) => fetchJson('/tasks/unregister', { method: 'POST', body: JSON.stringify({ taskId }) }),
    
    takeShiftRole: (shiftRoleId: string) => fetchJson('/shifts/take', { method: 'POST', body: JSON.stringify({ shiftRoleId }) }),
    leaveShiftRole: (shiftRoleId: string) => fetchJson('/shifts/leave', { method: 'POST', body: JSON.stringify({ shiftRoleId }) }),
    
    addShiftRoleType: (name: string) => fetchJson('/shift_role_types', { method: 'POST', body: JSON.stringify({ name }) }),
    deleteShiftRoleType: (name: string) => fetchJson('/shift_role_types', { method: 'DELETE', body: JSON.stringify({ name }) }),

    updateProfile: (data: any) => fetchJson('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    
    saveUser: (user: any) => fetchJson('/users', { method: 'POST', body: JSON.stringify(user) }),
    deleteUser: (id: string) => fetchJson('/users', { method: 'DELETE', body: JSON.stringify({ id }) }),

    saveSettings: (settings: any) => fetchJson('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
    addCategory: (name: string) => fetchJson('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
    deleteCategory: (name: string) => fetchJson('/categories', { method: 'DELETE', body: JSON.stringify({ name }) }),
    
    saveRole: (role: any) => fetchJson('/roles', { method: 'POST', body: JSON.stringify(role) }),
    deleteRole: (id: string) => fetchJson('/roles', { method: 'DELETE', body: JSON.stringify({ id }) }),
    
    uploadGalleryImage: (image: any) => fetchJson('/gallery', { method: 'POST', body: JSON.stringify(image) }),
    deleteGalleryImage: (id: string) => fetchJson('/gallery', { method: 'DELETE', body: JSON.stringify({ id }) }),
    
    getImageUrl: (path: string) => {
        if (!path) return '';
        if (path.startsWith('data:') || path.startsWith('http')) return path;
        
        // Hvis billedstien (path) allerede starter med 'app/', 
        // skal vi fjerne '/app' fra API_BASE_URL for at undgå dubletter.
        const baseUrl = path.startsWith('app/') 
            ? API_BASE_URL.replace(/\/app$/, '') 
            : API_BASE_URL;

        return `${baseUrl}/${path}`;
    }
};