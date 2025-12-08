import React, { useState, useMemo } from 'react';
import type { User } from '../../types';
import { useData } from '../../contexts/DataContext';
import { TrashIcon, KeyIcon, EditIcon } from '../icons';
import { generateId } from '../../utils';
import toast from 'react-hot-toast';

interface EditUserModalProps {
    user: User;
    onSave: (user: User) => void;
    onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onSave, onClose }) => {
    const { currentUser, roles, userHasPermission, settings } = useData();
    const [editedUser, setEditedUser] = useState<User>(user);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        const newValue = name === 'points' ? parseInt(value) || 0 : value;

        setEditedUser(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedUser);
    };

    const canEditRole = userHasPermission('manage_roles') && user.id !== currentUser?.id;

    // Filter roles for edit: Regular admins cannot assign superadmin role
    const availableRoles = useMemo(() => {
        if (currentUser?.role === 'superadmin') return roles;
        return roles.filter(r => r.id !== 'superadmin');
    }, [roles, currentUser]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4 dark:text-slate-100">Rediger Bruger</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="edit-user-name" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Navn</label>
                                <input id="edit-user-name" name="name" value={editedUser.name} onChange={handleChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="edit-user-email" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Email</label>
                                <input id="edit-user-email" name="email" type="email" value={editedUser.email} onChange={handleChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                            {settings.enablePoints !== false && (
                                <div>
                                    <label htmlFor="edit-user-points" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Point</label>
                                    <input id="edit-user-points" name="points" type="number" value={editedUser.points} onChange={handleChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                </div>
                            )}
                            <div>
                                <label htmlFor="edit-user-role" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Rolle</label>
                                <select id="edit-user-role" name="role" value={editedUser.role} onChange={handleChange} disabled={!canEditRole} className="p-2 border rounded bg-white w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white disabled:opacity-50">
                                    {availableRoles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                                {!canEditRole && <p className="text-xs text-slate-500 mt-1">Kun brugere med "Administrer Roller" rettigheden kan ændre roller.</p>}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">Annuller</button>
                        <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">Gem Ændringer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

type UserManagementTab = 'manage' | 'create';

export const UserManagement: React.FC = () => {
    // FIX: Vi henter handleSaveUser og handleDeleteUser fra DataContext
    const { users, currentUser, handleForgotPasswordRequest, roles, settings, handleSaveUser, handleDeleteUser } = useData();
    const [activeTab, setActiveTab] = useState<UserManagementTab>('manage');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState('bruger');

    const [userSearch, setUserSearch] = useState('');
    const [importStatus, setImportStatus] = useState('');
    const [csvImportRole, setCsvImportRole] = useState<string>('bruger');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

    // Filter accessible roles based on current user's role
    const assignableRoles = useMemo(() => {
        if (!currentUser) return [];
        // Super Admin can assign any role
        if (currentUser.role === 'superadmin') return roles;
        // Other Admins cannot assign 'superadmin' role
        return roles.filter(r => r.id !== 'superadmin');
    }, [roles, currentUser]);

    const handleAddUser = async (name: string, email: string, roleId: string) => {
        if (name && email) {
            if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                toast.error(`En bruger med emailen ${email} eksisterer allerede.`);
                return false;
            }

            // Security check: double check if user is trying to assign superadmin without being one
            if (roleId === 'superadmin' && currentUser?.role !== 'superadmin') {
                toast.error('Du har ikke rettigheder til at oprette en Super Admin.');
                return false;
            }

            const newUser: User = {
                id: generateId(),
                name,
                email,
                // Assign a temporary password, user will reset it
                password: generateId().slice(0, 8),
                role: roleId,
                points: 0,
                notification_preferences: {
                    new_task: true,
                    shift_trade_completed: true,
                    newsletter: true
                }
            };

            // FIX: Kald API via DataContext
            const success = await handleSaveUser(newUser);
            if (success) {
                toast.success(`Bruger '${name}' oprettet som ${roles.find(r => r.id === roleId)?.name}. Der er sendt en email for at sætte adgangskode.`);
                handleForgotPasswordRequest(email); // send reset link
                setNewUserName('');
                setNewUserEmail('');
            }
            return success;
        }
        return false;
    };

    const onUserUpdate = async (updatedUser: User) => {
        const success = await handleSaveUser(updatedUser);
        if (success) {
            setEditingUser(null);
            toast.success(`Bruger ${updatedUser.name} er opdateret.`);
        }
    };

    const onDeleteUser = async (userId: string) => {
        if (userId === currentUser?.id) {
            toast.error("Du kan ikke slette dig selv.");
            return;
        }
        if (window.confirm("Er du sikker på, du vil slette denne bruger?")) {
            await handleDeleteUser(userId);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUserIds.length === 0) return;
        if (selectedUserIds.includes(currentUser?.id || '')) {
            toast.error("Du kan ikke slette dig selv som en del af en massehandling.");
            return;
        }
        if (window.confirm(`Er du sikker på, du vil slette ${selectedUserIds.length} valgte brugere?`)) {
            // FIX: Loop gennem ID'er og slet dem
            for (const id of selectedUserIds) {
                await handleDeleteUser(id);
            }
            toast.success(`${selectedUserIds.length} brugere blev slettet.`);
            setSelectedUserIds([]);
        }
    };

    const handleToggleSelectUser = (userId: string) => {
        setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const roleMatch = selectedRoleFilter === 'all' || user.role === selectedRoleFilter;
            const searchMatch = !userSearch || user.name.toLowerCase().includes(userSearch.toLowerCase()) || user.email.toLowerCase().includes(userSearch.toLowerCase());
            return roleMatch && searchMatch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [users, selectedRoleFilter, userSearch]);

    const handleToggleSelectAll = () => {
        if (selectedUserIds.length === filteredUsers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredUsers.map(u => u.id));
        }
    };

    const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Security check for CSV import as well
        if (csvImportRole === 'superadmin' && currentUser?.role !== 'superadmin') {
            toast.error('Du har ikke rettigheder til at importere brugere som Super Admin.');
            if (event.target) event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                setImportStatus('Importerer...');
                const text = e.target?.result as string;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim());
                if (lines.length < 2) throw new Error("CSV skal have mindst 2 rækker (header + data).");

                const header = lines[0].split(',').map(h => h.trim().toLowerCase());
                const nameIndex = header.indexOf('navn');
                const emailIndex = header.indexOf('email');

                if (nameIndex === -1 || emailIndex === -1) {
                    throw new Error("CSV skal indeholde kolonnerne 'Navn' og 'Email'.");
                }

                let createdCount = 0;
                let skippedCount = 0;

                const existingEmails = new Set(users.map(u => u.email.toLowerCase()));

                for (let i = 1; i < lines.length; i++) {
                    const data = lines[i].split(',');
                    const name = data[nameIndex]?.trim();
                    const email = data[emailIndex]?.trim();

                    if (name && email) {
                        if (existingEmails.has(email.toLowerCase())) {
                            skippedCount++;
                            continue;
                        }
                        const newUser: User = {
                            id: generateId(),
                            name,
                            email,
                            password: generateId(),
                            role: csvImportRole,
                            points: 0,
                        };

                        // FIX: Kald API for hver bruger
                        await handleSaveUser(newUser);
                        handleForgotPasswordRequest(newUser.email);

                        existingEmails.add(email.toLowerCase());
                        createdCount++;
                    }
                }

                setImportStatus(`Færdig! ${createdCount} brugere oprettet. ${skippedCount} sprunget over (eksisterende email).`);
                toast.success(`${createdCount} brugere importeret. Links til nulstilling af adgangskode er sendt.`);

            } catch (error: any) {
                setImportStatus(`Fejl: ${error.message}`);
                toast.error(`Import Fejl: ${error.message}`);
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Navn,Email\nEksempel Navn,eksempel@email.dk";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "bruger_skabelon.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const tabClasses = (tabName: UserManagementTab) =>
        `px-4 py-2 rounded-t-lg text-sm font-medium transition-colors duration-200 border-b-2 ${activeTab === tabName
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button className={tabClasses('manage')} onClick={() => setActiveTab('manage')}>Administrer Brugere</button>
                    <button className={tabClasses('create')} onClick={() => setActiveTab('create')}>Opret / Importer</button>
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'manage' && (
                    <div>
                        {/* Filters and bulk actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                            <input id="user-search" name="user-search" aria-label="Søg brugere" type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Søg på navn eller email..." className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            <select id="user-role-filter" name="user-role-filter" aria-label="Filtrer efter rolle" value={selectedRoleFilter} onChange={e => setSelectedRoleFilter(e.target.value)} className="p-2 border rounded bg-white w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                                <option value="all">Alle Roller</option>
                                {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                            </select>
                            {selectedUserIds.length > 0 && (
                                <div className="sm:col-span-2">
                                    <button onClick={handleBulkDelete} className="bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700">Slet valgte ({selectedUserIds.length})</button>
                                </div>
                            )}
                        </div>

                        {/* User list */}
                        <div className="flex items-center gap-2 mb-2 p-2 border-b dark:border-slate-700">
                            <input
                                type="checkbox"
                                id="select-all-users"
                                name="select-all-users"
                                checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                                onChange={handleToggleSelectAll}
                                className="appearance-none h-5 w-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500"
                            />
                            <label htmlFor="select-all-users" className="text-sm font-medium text-slate-700 dark:text-slate-300">Vælg alle</label>
                        </div>
                        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                            {filteredUsers.map(user => (
                                <div key={user.id} className="p-3 border dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-grow">
                                        <input
                                            type="checkbox"
                                            id={`user-select-${user.id}`}
                                            name={`user-select-${user.id}`}
                                            aria-label={`Vælg bruger ${user.name}`}
                                            checked={selectedUserIds.includes(user.id)}
                                            onChange={() => handleToggleSelectUser(user.id)}
                                            className="appearance-none h-5 w-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500 flex-shrink-0"
                                        />
                                        <img src={user.image || `https://ui-avatars.com/api/?name=${user.name.replace(/\s/g, '+')}&background=random&size=64`} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                        <div className="flex-grow">
                                            <p className="font-medium text-slate-800 dark:text-slate-100">{user.name} {user.id === currentUser?.id && <span className="text-xs text-emerald-500">(Dig)</span>}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                                        <span className="text-xs font-semibold text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-900/50 py-1 px-2 rounded-full">{roles.find(r => r.id === user.role)?.name || 'Ukendt'}</span>
                                        {settings.enablePoints !== false && (
                                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/50 py-1 px-2 rounded-full">{user.points}p</span>
                                        )}
                                        <button onClick={() => setEditingUser(user)} className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 p-1" title="Rediger bruger"><EditIcon /></button>
                                        <button onClick={() => handleForgotPasswordRequest(user.email)} className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 p-1" title="Send nulstil adgangskode"><KeyIcon /></button>
                                        <button onClick={() => onDeleteUser(user.id)} disabled={user.id === currentUser?.id} className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 p-1 disabled:opacity-40 disabled:cursor-not-allowed" title="Slet bruger"><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'create' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-4 dark:text-slate-100">Opret Ny Bruger</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input id="new-user-name" name="new-user-name" aria-label="Navn" type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Navn" className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                                <input id="new-user-email" name="new-user-email" aria-label="Email" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email" className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                                <div className="sm:col-span-2">
                                    <label htmlFor="new-user-role" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Vælg Rolle</label>
                                    <select
                                        id="new-user-role"
                                        value={newUserRole}
                                        onChange={e => setNewUserRole(e.target.value)}
                                        className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                    >
                                        {assignableRoles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => handleAddUser(newUserName, newUserEmail, newUserRole)} className="mt-3 w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">Opret Bruger & Send Invitation</button>
                        </div>
                        <div className="pt-6 border-t dark:border-slate-700">
                            <h3 className="text-xl font-semibold mb-2 dark:text-slate-100">...eller Importer fra CSV</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">CSV skal indeholde kolonnerne 'Navn' og 'Email'.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="csv-role-select" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Tildel rolle ved import</label>
                                    <select id="csv-role-select" name="csv-role-select" value={csvImportRole} onChange={e => setCsvImportRole(e.target.value)} className="p-2 border rounded bg-white w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                                        {assignableRoles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="csv-import" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Vælg CSV-fil</label>
                                    <div className="flex gap-2">
                                        <input id="csv-import" name="csv-import" type="file" accept=".csv" onChange={handleCsvImport} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/50 dark:file:text-emerald-300 dark:hover:file:bg-emerald-900" />
                                        <button onClick={handleDownloadTemplate} className="text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-md font-medium whitespace-nowrap">
                                            Hent Skabelon
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {importStatus && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{importStatus}</p>}
                        </div>
                    </div>
                )}
            </div>

            {editingUser && <EditUserModal user={editingUser} onSave={onUserUpdate} onClose={() => setEditingUser(null)} />}
        </div>
    );
};