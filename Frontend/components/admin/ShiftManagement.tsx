import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import type { Shift, ShiftRole, User } from '../../types';
import { TrashIcon, EditIcon } from '../icons';
import { generateId } from '../../utils';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { ShiftRoleTypeManagement } from './ShiftRoleTypeManagement';

// --- Helper Components ---

const UserSelector: React.FC<{
    value: string | null;
    onChange: (userId: string | null) => void;
}> = ({ value, onChange }) => {
    const { users } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const selectedUser = useMemo(() => users.find(u => u.id === value), [users, value]);
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users.filter(u => u.id !== value);
        return users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) && u.id !== value);
    }, [users, searchTerm, value]);
    const handleSelect = (user: User) => { onChange(user.id); setSearchTerm(''); setIsOpen(false); };
    const handleClear = () => { onChange(null); setSearchTerm(''); setIsOpen(false); };
    return (
        <div className="relative w-full">
            <div className="flex items-center">
                <input id={`user-select-${value || 'new'}`} name="user-select" type="text" value={isOpen ? searchTerm : (selectedUser?.name || '')} onChange={e => { setSearchTerm(e.target.value); setIsOpen(true); }} onFocus={() => { setSearchTerm(''); setIsOpen(true); }} onBlur={() => setTimeout(() => setIsOpen(false), 200)} placeholder="Søg efter bruger..." className="w-full p-2 border rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                {value && (<button type="button" onClick={handleClear} className="absolute right-2 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>)}
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <ul>
                        <li onMouseDown={handleClear} className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-600 font-semibold">-- Ledig --</li>
                        {filteredUsers.map(user => (<li key={user.id} onMouseDown={() => handleSelect(user)} className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">{user.name}</li>))}
                        {filteredUsers.length === 0 && searchTerm && <li className="px-3 py-2 text-slate-500">Ingen resultater</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};

interface EditShiftModalProps {
    shift: Shift;
    onSave: (shift: Shift, roles: { id?: string; roleName: string; userId: string | null }[]) => void;
    onClose: () => void;
}

const EditShiftModal: React.FC<EditShiftModalProps> = ({ shift: initialShift, onSave, onClose }) => {
    const { shiftRoles, userHasPermission, shiftRoleTypes } = useData();
    const [shift, setShift] = useState(initialShift);
    const [roles, setRoles] = useState(() => shiftRoles.filter(r => r.shiftId === initialShift.id));

    const canManageRoles = useMemo(() => userHasPermission('manage_roles'), [userHasPermission]);

    const handleRoleChange = (index: number, field: 'roleName' | 'userId', value: string | null) => {
        const newRoles = [...roles];
        newRoles[index] = { ...newRoles[index], [field]: value };
        setRoles(newRoles);
    };

    const addRole = () => setRoles([...roles, { id: `new-${Date.now()}`, shiftId: shift.id, roleName: '', userId: null }]);
    const removeRole = (id: string) => {
        const roleToRemove = roles.find(r => r.id === id);
        if (roleToRemove && roleToRemove.userId) {
            toast.error("Kan ikke slette en rolle, der er tildelt en bruger. Gør rollen ledig først.");
            return;
        }
        setRoles(roles.filter(r => r.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(shift, roles);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6">
                    <h3 className="text-xl font-semibold mb-4 dark:text-slate-100">Rediger Vagt</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="edit-shift-date" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Dato</label>
                                <input id="edit-shift-date" name="date" type="date" value={shift.date} onChange={e => setShift(s => ({ ...s, date: e.target.value }))} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="edit-shift-start" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Fra kl.</label>
                                <input id="edit-shift-start" name="startTime" type="time" value={shift.startTime || ''} onChange={e => setShift(s => ({ ...s, startTime: e.target.value }))} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="edit-shift-end" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Til kl.</label>
                                <input id="edit-shift-end" name="endTime" type="time" value={shift.endTime || ''} onChange={e => setShift(s => ({ ...s, endTime: e.target.value }))} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="edit-shift-title" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Titel (valgfri)</label>
                            <input id="edit-shift-title" name="title" type="text" value={shift.title || ''} onChange={e => setShift(s => ({ ...s, title: e.target.value }))} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="edit-shift-desc" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Beskrivelse (valgfri)</label>
                            <textarea id="edit-shift-desc" name="description" value={shift.description || ''} onChange={e => setShift(s => ({ ...s, description: e.target.value }))} className="p-2 border rounded w-full h-24 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                        </div>
                    </div>
                </div>
                <div className="p-6 border-y dark:border-slate-700 overflow-y-auto">
                    <h4 className="text-lg font-semibold mb-2 dark:text-slate-200">Vagtroller</h4>
                    <div className="space-y-2">
                        {roles.map((role, index) => (
                            <div key={role.id} className="flex gap-2 items-center">
                                <select
                                    id={`edit-role-type-${role.id}`}
                                    name={`edit-role-type-${role.id}`}
                                    value={role.roleName}
                                    onChange={e => handleRoleChange(index, 'roleName', e.target.value)}
                                    className="flex-grow p-2 border rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="" disabled>Vælg rolle...</option>
                                    {shiftRoleTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>

                                <UserSelector
                                    value={role.userId}
                                    onChange={userId => handleRoleChange(index, 'userId', userId)}
                                />

                                {canManageRoles && (
                                    <button type="button" onClick={() => removeRole(role.id)} className="text-rose-500 hover:text-rose-700 p-2"><TrashIcon /></button>
                                )}
                            </div>
                        ))}
                    </div>
                    {canManageRoles && (
                        <button type="button" onClick={addRole} className="mt-3 text-sm font-medium text-emerald-600 hover:underline">Tilføj Rolle</button>
                    )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 mt-auto">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">Annuller</button>
                    <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">Gem Vagt</button>
                </div>
            </form>
        </div>
    );
};

// --- Main Component ---

type ShiftManagementTab = 'shifts' | 'create' | 'roles';

export const ShiftManagement: React.FC = () => {
    const { shifts, setShifts, shiftRoles, setShiftRoles, users, shiftRoleTypes, userHasPermission } = useData();
    const [activeTab, setActiveTab] = useState<ShiftManagementTab>('shifts');
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [shiftSearch, setShiftSearch] = useState('');

    // --- Create new shift state ---
    const [newShift, setNewShift] = useState({ date: '', startTime: '', endTime: '', title: '', description: '' });
    const [newShiftRoles, setNewShiftRoles] = useState<{ tempId: string, roleName: string, userId: string | null }[]>([
        { tempId: 'temp1', roleName: '', userId: null },
    ]);

    const handleCreateShift = async () => {
        if (!newShift.date || newShiftRoles.some(r => !r.roleName.trim())) {
            toast.error("Dato skal være udfyldt, og alle roller skal have en type.");
            return;
        }
        const createdShift: Shift = { ...newShift, id: generateId() };
        const createdRoles: ShiftRole[] = newShiftRoles
            .filter(r => r.roleName.trim())
            .map(role => ({
                id: generateId(),
                shiftId: createdShift.id,
                userId: role.userId,
                roleName: role.roleName
            }));

        try {
            await api.createShift({ ...createdShift, roles: createdRoles });
            setShifts(prev => [...prev, createdShift]);
            setShiftRoles(prev => [...prev, ...createdRoles]);
            setNewShift({ date: '', startTime: '', endTime: '', title: '', description: '' });
            setNewShiftRoles([
                { tempId: 'temp1', roleName: '', userId: null },
            ]);
            toast.success("Ny vagt er oprettet!");
            setActiveTab('shifts');
        } catch (e) {
            toast.error("Kunne ikke oprette vagt.");
        }
    };

    const handleNewShiftRoleChange = (tempId: string, field: 'roleName' | 'userId', value: string | null) => {
        setNewShiftRoles(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
    };

    const addRoleToNewShift = () => setNewShiftRoles(prev => [...prev, { tempId: `temp${Date.now()}`, roleName: '', userId: null }]);
    const removeRoleFromNewShift = (tempId: string) => setNewShiftRoles(prev => prev.filter(r => r.tempId !== tempId));

    const handleSaveEditedShift = async (updatedShift: Shift, updatedRolesData: { id?: string; roleName: string; userId: string | null }[]) => {
        try {
            await api.updateShift({ ...updatedShift, roles: updatedRolesData });
            setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));

            // Note: Since the backend handles role updates, we should theoretically re-fetch data.
            // For simplicity, we update local state optimistically here, assuming success.
            // In a real app, re-fetching shiftRoles might be safer.
            const existingRoleIdsOnShift = shiftRoles.filter(r => r.shiftId === updatedShift.id).map(r => r.id);
            const updatedRoleIds = updatedRolesData.map(r => r.id).filter(Boolean);
            const rolesToDelete = existingRoleIdsOnShift.filter(id => !updatedRoleIds.includes(id));
            const rolesToUpdate = updatedRolesData.filter(r => r.id && !r.id.startsWith('new-'));
            const rolesToAdd = updatedRolesData.filter(r => r.id && r.id.startsWith('new-')).map(({ id, ...rest }) => ({ ...rest, id: generateId(), shiftId: updatedShift.id }));

            setShiftRoles(prev => {
                let nextState = prev.filter(r => !rolesToDelete.includes(r.id));
                rolesToUpdate.forEach(updatedRole => { nextState = nextState.map(r => r.id === updatedRole.id ? { ...r, ...updatedRole } : r); });
                return [...nextState, ...rolesToAdd];
            });

            toast.success(`Vagt for ${updatedShift.date} er gemt.`);
            setEditingShift(null);
        } catch (e) {
            toast.error("Kunne ikke gemme ændringer.");
        }
    };

    const handleDeleteShift = async (shiftId: string) => {
        if (window.confirm("Er du sikker? Dette sletter vagten og alle dens roller.")) {
            try {
                await api.deleteShift(shiftId);
                setShifts(prev => prev.filter(s => s.id !== shiftId));
                setShiftRoles(prev => prev.filter(r => r.shiftId !== shiftId));
                toast.success("Vagten er slettet.");
            } catch (e) {
                toast.error("Kunne ikke slette vagt.");
            }
        }
    };

    const handleDownloadShiftTemplate = () => {
        const uniqueRoleNames = [...new Set(shiftRoles.map(r => r.roleName))].sort();
        const header = ["Dato", "Starttid", "Sluttid", "Overskrift", "Beskrivelse", ...uniqueRoleNames].map(h => `"${h}"`).join(',');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        const exampleAssignments = uniqueRoleNames.map((_, index) => {
            return users[index] ? `"${users[index].name}"` : `"Ledig"`;
        });
        const exampleRowData = [`"${dateString}"`, `"10:00"`, `"16:00"`, `"Sommerfest Eksempel"`, `"Dette er en eksempelbeskrivelse"`].concat(exampleAssignments);
        const csvString = header + "\n" + exampleRowData.join(',');
        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
        const link = document.createElement("a");
        link.setAttribute("href", csvContent);
        link.setAttribute("download", "vagtplan_skabelon.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim());
                if (lines.length < 2) throw new Error("CSV skal have mindst 2 rækker (header + data).");
                const header = lines[0].split(',').map(h => h.trim());
                const dateIndex = header.findIndex(h => h.toLowerCase() === 'dato');
                const titleIndex = header.findIndex(h => h.toLowerCase() === 'overskrift');
                const descIndex = header.findIndex(h => h.toLowerCase() === 'beskrivelse');
                const startIndex = header.findIndex(h => h.toLowerCase() === 'starttid');
                const endIndex = header.findIndex(h => h.toLowerCase() === 'sluttid');
                const fixedCols = [dateIndex, titleIndex, descIndex, startIndex, endIndex].filter(i => i !== -1);
                const roleIndices = header.map((_, i) => i).filter(i => !fixedCols.includes(i));
                if (dateIndex === -1) throw new Error("CSV mangler 'Dato' kolonne.");

                let successCount = 0;
                for (let i = 1; i < lines.length; i++) {
                    const data = lines[i].split(',');
                    const shiftId = generateId();
                    const newShift = {
                        id: shiftId,
                        date: new Date(data[dateIndex]).toISOString().split('T')[0],
                        title: data[titleIndex] || '',
                        description: data[descIndex] || '',
                        startTime: startIndex !== -1 ? data[startIndex] : undefined,
                        endTime: endIndex !== -1 ? data[endIndex] : undefined,
                    };

                    const newRoles = [];
                    roleIndices.forEach(idx => {
                        const roleName = header[idx];
                        const assignedName = data[idx]?.trim();
                        let assignedUserId: string | null = null;
                        if (assignedName && assignedName.toLowerCase() !== 'ledig') {
                            const user = users.find(u => u.name.toLowerCase() === assignedName.toLowerCase());
                            assignedUserId = user ? user.id : null;
                        }
                        newRoles.push({
                            id: generateId(),
                            shiftId,
                            roleName,
                            userId: assignedUserId,
                        });
                    });

                    // API Call per row
                    await api.createShift({ ...newShift, roles: newRoles });
                    setShifts(prev => [...prev, newShift]);
                    setShiftRoles(prev => [...prev, ...newRoles]);
                    successCount++;
                }

                toast.success(`Importerede ${successCount} vagter.`);
            } catch (error: any) {
                toast.error(`Import Fejl: ${error.message}`);
                console.error("CSV Import error:", error);
            } finally {
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const availableMonths = useMemo(() => {
        const monthSet = new Set<string>();
        shifts.forEach(shift => {
            const month = shift.date.substring(0, 7);
            monthSet.add(month);
        });
        return Array.from(monthSet).sort().reverse();
    }, [shifts]);

    const filteredAndSortedShifts = useMemo(() => {
        return shifts
            .filter(s => {
                const monthMatch = selectedMonth === 'all' || s.date.startsWith(selectedMonth);
                const searchMatch = !shiftSearch || (s.title || '').toLowerCase().includes(shiftSearch.toLowerCase());
                return monthMatch && searchMatch;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [shifts, selectedMonth, shiftSearch]);

    const handleToggleSelectShift = (shiftId: string) => { setSelectedShiftIds(prev => prev.includes(shiftId) ? prev.filter(id => id !== shiftId) : [...prev, shiftId]); };
    const handleToggleSelectAll = () => { if (selectedShiftIds.length === filteredAndSortedShifts.length) { setSelectedShiftIds([]); } else { setSelectedShiftIds(filteredAndSortedShifts.map(s => s.id)); } };

    const handleBulkDeleteShifts = async () => {
        if (selectedShiftIds.length === 0) return;
        if (window.confirm(`Slet ${selectedShiftIds.length} vagter?`)) {
            try {
                for (const id of selectedShiftIds) {
                    await api.deleteShift(id);
                }
                setShifts(prev => prev.filter(s => !selectedShiftIds.includes(s.id)));
                setShiftRoles(prev => prev.filter(r => !selectedShiftIds.includes(r.shiftId)));
                toast.success("Slettet.");
                setSelectedShiftIds([]);
            } catch (e) {
                toast.error("Fejl under sletning.");
            }
        }
    };

    const tabClasses = (tabName: ShiftManagementTab) =>
        `px-4 py-2 rounded-t-lg text-sm font-medium transition-colors duration-200 border-b-2 ${activeTab === tabName
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button className={tabClasses('shifts')} onClick={() => setActiveTab('shifts')}>Administrer Vagter</button>
                    <button className={tabClasses('create')} onClick={() => setActiveTab('create')}>Opret Ny Vagt</button>
                    {userHasPermission('manage_shift_roles') && (
                        <button className={tabClasses('roles')} onClick={() => setActiveTab('roles')}>Vagtroller</button>
                    )}
                </nav>
            </div>

            {activeTab === 'create' && (
                <div>
                    <h3 className="text-xl font-semibold mb-4 dark:text-slate-100">Opret Ny Vagt</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="new-shift-date" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Dato</label>
                                <input id="new-shift-date" name="date" type="date" value={newShift.date} onChange={e => setNewShift(s => ({ ...s, date: e.target.value }))} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="new-shift-start" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Fra kl.</label>
                                <input id="new-shift-start" name="startTime" type="time" value={newShift.startTime} onChange={e => setNewShift(s => ({ ...s, startTime: e.target.value }))} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="new-shift-end" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Til kl.</label>
                                <input id="new-shift-end" name="endTime" type="time" value={newShift.endTime} onChange={e => setNewShift(s => ({ ...s, endTime: e.target.value }))} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="new-shift-title" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Titel (valgfri)</label>
                            <input id="new-shift-title" name="title" type="text" value={newShift.title} onChange={e => setNewShift(s => ({ ...s, title: e.target.value }))} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="new-shift-desc" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Beskrivelse (valgfri)</label>
                            <textarea id="new-shift-desc" name="description" value={newShift.description} onChange={e => setNewShift(s => ({ ...s, description: e.target.value }))} className="p-2 border rounded w-full h-24 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"></textarea>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h4 className="text-md font-semibold dark:text-slate-200">Vagtroller</h4>
                        <div className="space-y-2 mt-2">
                            {newShiftRoles.map((role) => (
                                <div key={role.tempId} className="flex flex-col sm:flex-row gap-2">
                                    <select
                                        id={`new-role-type-${role.tempId}`}
                                        name={`new-role-type-${role.tempId}`}
                                        value={role.roleName}
                                        onChange={e => handleNewShiftRoleChange(role.tempId, 'roleName', e.target.value)}
                                        className="sm:flex-1 p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="" disabled>Vælg rolle...</option>
                                        {shiftRoleTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>

                                    <div className="sm:flex-1">
                                        <UserSelector
                                            value={role.userId}
                                            onChange={userId => handleNewShiftRoleChange(role.tempId, 'userId', userId)}
                                        />
                                    </div>
                                    <button onClick={() => removeRoleFromNewShift(role.tempId)} className="text-rose-500 p-2 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded"><TrashIcon /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addRoleToNewShift} className="mt-2 text-sm font-medium text-emerald-600 hover:underline">Tilføj Rolle</button>
                    </div>
                    <button onClick={handleCreateShift} className="mt-4 w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">Opret Vagt</button>

                    <div className="pt-6 mt-6 border-t dark:border-slate-700">
                        <h4 className="text-lg font-semibold mb-2 dark:text-slate-200">...eller Importer Vagtplan fra CSV</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">Format: `Dato,Starttid,Sluttid,Overskrift,Beskrivelse,RolleNavn1,RolleNavn2,...`</p>
                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                            <label htmlFor="shift-csv-import" className="w-full sm:flex-1 text-center cursor-pointer bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-md transition-colors">
                                Vælg fil & Importer
                            </label>
                            <input id="shift-csv-import" type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
                            <button onClick={handleDownloadShiftTemplate} className="w-full sm:w-auto text-center bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-md transition-colors border border-slate-300 dark:border-slate-600 text-sm font-medium">
                                Hent Skabelon
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'shifts' && (
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        <input
                            id="shift-search"
                            name="shift-search"
                            aria-label="Søg efter vagter"
                            type="text"
                            value={shiftSearch}
                            onChange={e => setShiftSearch(e.target.value)}
                            placeholder="Søg på titel eller beskrivelse..."
                            className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                        />
                        <select
                            id="shift-month-filter"
                            name="shift-month-filter"
                            aria-label="Filtrer efter måned"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="p-2 border rounded bg-white w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="all">Alle Måneder</option>
                            {availableMonths.map(month => <option key={month} value={month}>{new Date(month + '-02').toLocaleString('da-DK', { month: 'long', year: 'numeric' })}</option>)}
                        </select>
                        {selectedShiftIds.length > 0 && (
                            <div className="sm:col-span-2">
                                <button onClick={handleBulkDeleteShifts} className="bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700">Slet valgte ({selectedShiftIds.length})</button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mb-2 p-2 border-b dark:border-slate-700">
                        <input
                            type="checkbox"
                            id="select-all-shifts"
                            name="select-all-shifts"
                            checked={filteredAndSortedShifts.length > 0 && selectedShiftIds.length === filteredAndSortedShifts.length}
                            onChange={handleToggleSelectAll}
                            className="appearance-none h-5 w-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500"
                        />
                        <label htmlFor="select-all-shifts" className="text-sm font-medium text-slate-700 dark:text-slate-300">Vælg alle</label>
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {filteredAndSortedShifts.map(s => {
                            const rolesForShift = shiftRoles.filter(r => r.shiftId === s.id);
                            return (
                                <div key={s.id} className="p-4 border dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-grow">
                                        <input
                                            type="checkbox"
                                            id={`shift-select-${s.id}`}
                                            name={`shift-select-${s.id}`}
                                            aria-label={`Vælg vagt ${s.title}`}
                                            checked={selectedShiftIds.includes(s.id)}
                                            onChange={() => handleToggleSelectShift(s.id)}
                                            className="appearance-none h-5 w-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500 flex-shrink-0"
                                        />
                                        <div className="flex-grow">
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{s.title || 'Vagt'}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {new Date(s.date).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                {s.startTime && s.endTime ? ` • ${s.startTime} - ${s.endTime}` : ''}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{rolesForShift.length} roller ({rolesForShift.filter(r => r.userId).length} besat)</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => setEditingShift(s)} className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 p-2" title="Rediger"><EditIcon /></button>
                                        <button onClick={() => handleDeleteShift(s.id)} className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 p-2" title="Slet"><TrashIcon /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'roles' && userHasPermission('manage_shift_roles') && (
                <ShiftRoleTypeManagement />
            )}

            {editingShift && (
                <EditShiftModal
                    shift={editingShift}
                    onSave={handleSaveEditedShift}
                    onClose={() => setEditingShift(null)}
                />
            )}
        </div>
    );
};