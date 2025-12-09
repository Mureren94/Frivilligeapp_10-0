// services/api.ts - FIXED VERSION

// URL'en skal være roden af din backend-mappe
// VIGTIGT: Ingen skråstreg til sidst.
const API_BASE_URL = 'https://api.voreskerne.com/app';
const SERVER_URL = 'https://api.voreskerne.com';

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

    // Sikrer at vi kun har én skråstreg mellem base og endpoint
    const endpoint = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(fullUrl, defaultOptions);

    if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
            const text = await response.text(); // Læs som tekst først
            try {
                const errorData = JSON.parse(text); // Prøv at parse som JSON
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch {
                // Hvis det er HTML (f.eks. en 404 side fra serveren)
                if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                    console.error("Serveren sendte HTML fejl:", text);
                    errorMessage = `Serverfejl: Kunne ikke nå ${fullUrl} (Serveren svarede med HTML i stedet for data)`;
                } else {
                    errorMessage = text || errorMessage;
                }
            }
        } catch (e) {
            // Ignorer læsefejl
        }
        throw new Error(errorMessage);
    }

    // Håndter "No Content" svar (f.eks. ved sletning)
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// Helper: Hent URL til billede
// Denne funktion sikrer, at billedstier fra databasen (f.eks. 'app/uploads/img.jpg')
// bliver til gyldige URLs (f.eks. 'https://api.voreskerne.com/app/uploads/img.jpg')
const getImageUrl = (path: string | undefined) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Vi renser stien for at undgå at stien bliver '.../app/app/...'
    let cleanPath = path;

    // Hvis stien i databasen allerede starter med 'app/', fjerner vi det, 
    // fordi API_BASE_URL allerede indeholder '/app'
    if (path.startsWith('app/')) {
        cleanPath = path.substring(4);
    } else if (path.startsWith('/app/')) {
        cleanPath = path.substring(5);
    } else if (path.startsWith('/')) {
        cleanPath = path.substring(1);
    }

    return `${API_BASE_URL}/${cleanPath}`;
};

export const api = {
    // --- AUTH ---
    login: (credentials: any) => fetchJson('/login', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: () => fetchJson('/logout', { method: 'POST' }),
    getInitData: () => fetchJson('/init'),

    // --- TASKS ---
    createTask: (task: any) => fetchJson('/tasks', { method: 'POST', body: JSON.stringify(task) }),
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

    // --- SHIFT TRADES ---
    initiateShiftTrade: (tradeData: any) => fetchJson('/shift_trades', { method: 'POST', body: JSON.stringify(tradeData) }),
    acceptShiftTrade: (tradeId: string) => fetchJson('/shift_trades/accept', { method: 'POST', body: JSON.stringify({ tradeId }) }),
    cancelShiftTrade: (tradeId: string) => fetchJson('/shift_trades', { method: 'DELETE', body: JSON.stringify({ tradeId }) }),

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

    markNotificationsAsRead: () => fetchJson('/notifications/read', { method: 'POST' }),

    getImageUrl
};