
import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import toast from 'react-hot-toast';
import type { Role } from '../../types';
import { ALL_PERMISSIONS, PermissionId } from '../../permissions';
import { EditIcon, TrashIcon } from '../icons';
import { generateId } from '../../utils';

interface RoleEditModalProps {
    role: Partial<Role> & { permissions: PermissionId[] };
    onSave: (role: Role) => void;
    onClose: () => void;
}

const RoleEditModal: React.FC<RoleEditModalProps> = ({ role, onSave, onClose }) => {
    const [editedRole, setEditedRole] = useState(role);

    const handlePermissionChange = (permissionId: PermissionId, checked: boolean) => {
        setEditedRole(prev => {
            const newPermissions = checked
                ? [...prev.permissions, permissionId]
                : prev.permissions.filter(p => p !== permissionId);
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editedRole.name) {
            toast.error("Rollen skal have et navn.");
            return;
        }
        onSave({
            ...editedRole,
            id: editedRole.id || generateId(),
            name: editedRole.name,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6">
                    <h3 className="text-xl font-semibold mb-4 dark:text-slate-100">{role.id ? 'Rediger Rolle' : 'Opret Ny Rolle'}</h3>
                    <input
                        type="text"
                        value={editedRole.name || ''}
                        onChange={e => setEditedRole(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Rollenavn"
                        className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                    />
                </div>
                <div className="p-6 border-y dark:border-slate-700 overflow-y-auto">
                    <h4 className="text-lg font-semibold mb-2 dark:text-slate-200">Rettigheder</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ALL_PERMISSIONS.map(permission => (
                            <div key={permission.id} className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id={`perm-${permission.id}`}
                                        name={`perm-${permission.id}`}
                                        type="checkbox"
                                        checked={editedRole.permissions.includes(permission.id)}
                                        onChange={e => handlePermissionChange(permission.id, e.target.checked)}
                                        className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor={`perm-${permission.id}`} className="font-medium text-slate-700 dark:text-slate-300">{permission.name}</label>
                                    <p className="text-slate-500 dark:text-slate-400">{permission.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 mt-auto">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">Annuller</button>
                    <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">Gem Rolle</button>
                </div>
            </form>
        </div>
    );
};

export const RoleManagement: React.FC = () => {
    const { roles, setRoles, users } = useData();
    const [editingRole, setEditingRole] = useState<Role | (Partial<Role> & { permissions: PermissionId[] }) | null>(null);

    const handleSaveRole = (roleToSave: Role) => {
        setRoles(prev => {
            const exists = prev.some(r => r.id === roleToSave.id);
            if (exists) {
                return prev.map(r => r.id === roleToSave.id ? roleToSave : r);
            }
            return [...prev, roleToSave];
        });
        toast.success(`Rollen "${roleToSave.name}" er gemt.`);
        setEditingRole(null);
    };

    const handleDeleteRole = (roleId: string) => {
        const roleInUse = users.some(u => u.role === roleId);
        if (roleInUse) {
            toast.error("Kan ikke slette en rolle, der er tildelt en eller flere brugere.");
            return;
        }
        if (window.confirm("Er du sikker på, du vil slette denne rolle?")) {
            setRoles(prev => prev.filter(r => r.id !== roleId));
            toast.success("Rollen er slettet.");
        }
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
            <div className="flex justify-between items-center">
                 <h3 className="text-xl font-semibold dark:text-slate-100">Roller & Rettigheder</h3>
                 <button onClick={() => setEditingRole({ name: '', permissions: [] })} className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700">Opret Ny Rolle</button>
            </div>
            <div className="space-y-2">
                {roles.map(role => {
                    const isRoleInUse = users.some(u => u.role === role.id);
                    
                    return (
                    <div key={role.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{role.name} {role.is_default && <span className="text-xs font-normal text-slate-500">(standard)</span>}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{role.permissions.length} rettigheder</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <button onClick={() => setEditingRole(role)} className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 p-1" title="Rediger rolle"><EditIcon /></button>
                            <button 
                                onClick={() => handleDeleteRole(role.id)} 
                                disabled={!!role.is_default || isRoleInUse} 
                                className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 p-1 disabled:opacity-40 disabled:cursor-not-allowed" 
                                title={
                                    role.is_default 
                                    ? "Standardroller kan ikke slettes" 
                                    : isRoleInUse 
                                        ? "Rollen er i brug og kan ikke slettes" 
                                        : "Slet rolle"}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                )})}
            </div>
            {editingRole && (
                <RoleEditModal 
                    role={editingRole}
                    onSave={handleSaveRole}
                    onClose={() => setEditingRole(null)}
                />
            )}
        </div>
    );
};
