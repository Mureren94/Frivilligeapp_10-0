// services/api.ts - PRODUCTION READY

// 1. Konfiguration af URLs
// SERVER_URL: Roden af dit domæne (bruges til at bygge stier til billeder)
const SERVER_URL = 'https://api.voreskerne.com';

// API_BASE_URL: Hvor din index.php lytter (bruges til data-kald)
// Vi fjerner '/app' herfra, da din nye backend/index.php selv håndterer routing smart.
// Hvis din backend ligger i roden, er dette fint. Hvis den ligger i en mappe, tilføj den her.
const API_BASE_URL = 'https://api.voreskerne.com'; 

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const defaultOptions: RequestInit = {
        ...options,
        headers: { 
            'Content-Type': 'application/json', 
            ...options.headers 
        },
        // VIGTIGT: Sender cookies med (session ID) så login virker
        credentials: 'include', 
    };
    
    // Vi sikrer os at URL'en starter med en skråstreg hvis den mangler
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    
    const response = await fetch(`${API_BASE_URL}${normalizedUrl}`, defaultOptions);
    
    // Håndter HTTP fejl (f.eks. 401 Unauthorized eller 500 Server Error)
    if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
            // Prøv at læse fejlbeskeden fra PHP backenden (jsonResponse(['error' => '...']))
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            // Hvis svaret ikke er JSON (f.eks. en fatal PHP error tekst), brug standard teksten
        }
        throw new Error(errorMessage);
    }
    
    // Hvis status er 204 No Content (bruges nogle gange ved sletning), returner null
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

export const api = {
    // --- AUTH ---
    login: (credentials: any) => fetchJson('/login', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: () => fetchJson('/logout', { method: 'POST' }),
    getInitData: () => fetchJson('/init'),

    // --- TASKS ---
    createTask: (task: any) => fetchJson('/tasks', { method: 'POST', body: JSON.stringify(task) }),
    // Vi bruger PUT til opdatering af opgaver (inkl. billeder)
    updateTask: (task: any) => fetchJson('/tasks', { method: 'PUT', body: JSON.stringify(task) }),
    deleteTask: (id: string) => fetchJson('/tasks', { method: 'DELETE', body: JSON.stringify({ id }) }),
    signUpTask: (taskId: string) => fetchJson('/tasks/signup', { method: 'POST', body: JSON.stringify({ taskId }) }),
    unregisterTask: (taskId: string) => fetchJson('/tasks/unregister', { method: 'POST', body: JSON.stringify({ taskId }) }),
    
    // --- SHIFTS ---
    createShift: (shiftData: any) => fetchJson('/shifts', { method: 'POST', body: JSON.stringify(shiftData) }),
    updateShift: (shiftData: any) => fetchJson('/shifts', { method: 'PUT', body: JSON.stringify(shiftData) }),
    deleteShift: (id: string) => fetchJson('/shifts', { method: 'DELETE', body: JSON.stringify({ id }) }),
    takeShiftRole: (shiftRoleId: string) => fetchJson('/shifts/take', { method: 'POST', body: JSON.stringify({ shiftRoleId }) }),
    leaveShiftRole: (shiftRoleId: string) => fetchJson('/shifts/leave', { method: 'POST', body: JSON.stringify({ shiftRoleId }) }),
    
    // --- SHIFT ROLE TYPES ---
    addShiftRoleType: (name: string) => fetchJson('/shift_role_types', { method: 'POST', body: JSON.stringify({ name }) }),
    deleteShiftRoleType: (name: string) => fetchJson('/shift_role_types', { method: 'DELETE', body: JSON.stringify({ name }) }),

    // --- USERS & PROFILE ---
    updateProfile: (data: any) => fetchJson('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    saveUser: (user: any) => fetchJson('/users', { method: 'POST', body: JSON.stringify(user) }),
    deleteUser: (id: string) => fetchJson('/users', { method: 'DELETE', body: JSON.stringify({ id }) }),

    // --- SETTINGS & CATEGORIES ---
    saveSettings: (settings: any) => fetchJson('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
    addCategory: (name: string) => fetchJson('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
    deleteCategory: (name: string) => fetchJson('/categories', { method: 'DELETE', body: JSON.stringify({ name }) }),
    
    // --- ROLES ---
    saveRole: (role: any) => fetchJson('/roles', { method: 'POST', body: JSON.stringify(role) }),
    deleteRole: (id: string) => fetchJson('/roles', { method: 'DELETE', body: JSON.stringify({ id }) }),
    
    // --- GALLERY ---
    uploadGalleryImage: (image: any) => fetchJson('/gallery', { method: 'POST', body: JSON.stringify(image) }),
    deleteGalleryImage: (id: string) => fetchJson('/gallery', { method: 'DELETE', body: JSON.stringify({ id }) }),
    
    // --- HELPER: Image URL ---
    getImageUrl: (path: string | undefined) => {
        if (!path) return '';
        
        // Hvis det allerede er en fuld URL (f.eks. fra en ekstern kilde eller base64 preview), brug den
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        
        // Backend gemmer stien som 'app/uploads/filnavn.jpg'
        // Vi skal sikre os, at vi ikke sætter skråstreger forkert sammen
        
        // Fjern evt. ledende skråstreg fra stien
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        
        // Byg den fulde URL. 
        // Eksempel resultat: https://api.voreskerne.com/app/uploads/billede.jpg
        return `${SERVER_URL}/${cleanPath}`;
    }
};