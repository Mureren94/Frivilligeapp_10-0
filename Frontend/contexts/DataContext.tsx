import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Task, User, IDataContext, AppSettings, Role, Shift, ShiftRole, ShiftTrade, AdminNotification, GalleryImage, Profile } from '../types';
import type { PermissionId } from '../permissions';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const DataContext = createContext<IDataContext | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [shiftRoleTypes, setShiftRoleTypes] = useState<string[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [settings, setSettings] = useState<AppSettings>({} as AppSettings);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [signedUpTaskIds, setSignedUpTaskIds] = useState<string[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [shiftRoles, setShiftRoles] = useState<ShiftRole[]>([]);
    const [shiftTrades, setShiftTrades] = useState<ShiftTrade[]>([]);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [userTaskSignups, setUserTaskSignups] = useState<any>({});
    const [passwordResetTokens, setPasswordResetTokens] = useState<any[]>([]);
    const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const data: any = await api.getInitData();
            setUsers(data.users); setRoles(data.roles); setTasks(data.tasks);
            setCategories(data.categories); setShiftRoleTypes(data.shiftRoleTypes || []);
            setSettings(data.settings); setShifts(data.shifts); setShiftRoles(data.shiftRoles);
            setShiftTrades(data.shiftTrades); setGalleryImages(data.galleryImages);
            if (data.currentUser) { setCurrentUser(data.currentUser); setSignedUpTaskIds(data.signedUpTaskIds); }
        } catch (error) { console.error("Kunne ikke hente data", error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const savedTheme = localStorage.getItem('volunteer_theme') as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('volunteer_theme', newTheme);
            return newTheme;
        });
    }, []);

    const userHasPermission = useCallback((permission: PermissionId): boolean => {
        if (!currentUser) return false;
        const userRole = roles.find(r => r.id === currentUser.role);
        return userRole?.permissions?.includes(permission) ?? false;
    }, [currentUser, roles]);

    const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
        try {
            const res: any = await api.login({ email, password });
            if (res.success) { await fetchData(); return true; }
            return false;
        } catch (e) { return false; }
    }, []);

    const handleLogout = useCallback(async (callback: () => void) => {
        await api.logout(); setCurrentUser(null); callback();
    }, []);

    const handleCreateTask = useCallback(async (newTaskData: any) => {
        try {
            const createdTask = await api.createTask(newTaskData) as Task;
            setTasks(prev => [...prev, createdTask]);
            toast.success(`Opgaven "${createdTask.title}" er oprettet.`);
        } catch (e) { toast.error("Fejl ved oprettelse af opgave"); }
    }, []);

    const handleSignUp = useCallback(async (taskId: string) => {
        try {
            await api.signUpTask(taskId);
            setSignedUpTaskIds(prev => [...prev, taskId]);
            setTasks(prev => prev.map(t => t.id === taskId ? {...t, volunteers_needed: t.volunteers_needed - 1} : t));
            toast.success("Du er tilmeldt!");
        } catch (e) { toast.error("Kunne ikke tilmelde opgave"); }
    }, []);

    const handleUnregister = useCallback(async (taskId: string) => {
        try {
            await api.unregisterTask(taskId);
            setSignedUpTaskIds(prev => prev.filter(id => id !== taskId));
             setTasks(prev => prev.map(t => t.id === taskId ? {...t, volunteers_needed: t.volunteers_needed + 1} : t));
            toast.success("Du er afmeldt.");
        } catch (e) { toast.error("Fejl ved afmelding"); }
    }, []);

    const handleProfileSave = useCallback(async (profileUpdate: Partial<Profile>) => {
        try {
            await api.updateProfile(profileUpdate);
            setUsers(prev => prev.map(u => u.id === profileUpdate.id ? { ...u, ...profileUpdate } as User : u));
            if (currentUser && currentUser.id === profileUpdate.id) {
                setCurrentUser(prev => prev ? { ...prev, ...profileUpdate } as User : null);
            }
            toast.success('Profil opdateret');
        } catch (e) { toast.error("Fejl ved gemning af profil"); }
    }, [currentUser]);

    const handleTakeShiftRole = useCallback(async (shiftRoleId: string) => {
        try {
            await api.takeShiftRole(shiftRoleId);
            if (currentUser) {
                setShiftRoles(prev => prev.map(r => r.id === shiftRoleId ? { ...r, userId: currentUser.id } : r));
                toast.success("Vagt taget!");
            }
        } catch (e) { toast.error("Kunne ikke tage vagt."); }
    }, [currentUser]);

    const handleLeaveShiftRole = useCallback(async (shiftRoleId: string) => {
        try {
            await api.leaveShiftRole(shiftRoleId);
            setShiftRoles(prev => prev.map(r => r.id === shiftRoleId ? { ...r, userId: null } : r));
            toast.success("Du har forladt vagten.");
        } catch (e) { toast.error("Fejl ved forladelse af vagt"); }
    }, []);

    const handleSaveSettings = useCallback(async (newSettings: AppSettings) => {
        try {
            await api.saveSettings(newSettings);
            setSettings(newSettings);
            toast.success("Indstillinger gemt.");
        } catch (e) { toast.error("Kunne ikke gemme indstillinger."); }
    }, []);

    const handleAddCategory = useCallback(async (name: string) => {
        try {
            await api.addCategory(name);
            setCategories(prev => [...prev, name].sort());
            toast.success("Kategori tilføjet.");
        } catch (e) { toast.error("Fejl ved tilføjelse."); }
    }, []);

    const handleDeleteCategory = useCallback(async (name: string) => {
        try {
            await api.deleteCategory(name);
            setCategories(prev => prev.filter(c => c !== name));
            toast.success("Kategori slettet.");
        } catch (e) { toast.error("Fejl ved sletning."); }
    }, []);

    const handleSaveRole = useCallback(async (role: Role) => {
        try {
            await api.saveRole(role);
            setRoles(prev => {
                const exists = prev.some(r => r.id === role.id);
                return exists ? prev.map(r => r.id === role.id ? role : r) : [...prev, role];
            });
            toast.success("Rolle gemt.");
        } catch (e) { toast.error("Kunne ikke gemme rolle."); }
    }, []);

    const handleDeleteRole = useCallback(async (roleId: string) => {
        try {
            await api.deleteRole(roleId);
            setRoles(prev => prev.filter(r => r.id !== roleId));
            toast.success("Rolle slettet.");
        } catch (e) { toast.error("Kunne ikke slette rolle."); }
    }, []);

    const handleSaveUser = useCallback(async (user: User) => {
        try {
            await api.saveUser(user);
            setUsers(prev => {
                const exists = prev.some(u => u.id === user.id);
                return exists ? prev.map(u => u.id === user.id ? user : u) : [...prev, user];
            });
            return true;
        } catch (e) { toast.error("Kunne ikke gemme bruger."); return false; }
    }, []);

    const handleDeleteUser = useCallback(async (userId: string) => {
        try {
            await api.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast.success("Bruger slettet.");
        } catch (e) { toast.error("Kunne ikke slette bruger."); }
    }, []);

    const handlePasswordReset = (email: string, newPass: string) => true;
    const handleForgotPasswordRequest = (email: string): 'success' => 'success';
    const sendEmailNotification = () => {};
    const handleInitiateShiftTrade = () => {};
    const handleAcceptShiftTrade = () => {};
    const handleCancelShiftTrade = () => {};

    if (isLoading) {
        return <div className="flex h-screen justify-center items-center text-emerald-600 font-semibold">Indlæser FrivilligPortalen...</div>;
    }

    const value: IDataContext = {
        tasks, categories, shiftRoleTypes, users, roles, shifts, shiftRoles, shiftTrades, settings, currentUser,
        userTaskSignups, passwordResetTokens, signedUpTaskIds, theme, adminNotifications, galleryImages,
        setTasks, setCategories, setShiftRoleTypes, setUsers, setRoles, setShifts, setShiftRoles, setShiftTrades, setSettings,
        setPasswordResetTokens, setAdminNotifications, setGalleryImages,
        handleLogin, handleLogout, handleSignUp, handleCreateTask, handleUnregister, handleProfileSave,
        handlePasswordReset, handleForgotPasswordRequest, toggleTheme, userHasPermission, sendEmailNotification,
        handleTakeShiftRole, handleLeaveShiftRole, handleInitiateShiftTrade, handleAcceptShiftTrade, handleCancelShiftTrade,
        handleSaveSettings, handleAddCategory, handleDeleteCategory, handleSaveRole, handleDeleteRole, handleSaveUser, handleDeleteUser
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
}