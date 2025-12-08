import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { TrashIcon } from '../icons';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const ShiftRoleTypeManagement: React.FC = () => {
    const { shiftRoleTypes, setShiftRoleTypes } = useData();
    const [newRoleType, setNewRoleType] = useState('');

    const handleAdd = async () => {
        if (newRoleType && !shiftRoleTypes.includes(newRoleType)) {
            try {
                await api.addShiftRoleType(newRoleType);
                setShiftRoleTypes(prev => [...prev, newRoleType].sort());
                setNewRoleType('');
                toast.success(`Rollen "${newRoleType}" er tilføjet.`);
            } catch (e) {
                toast.error("Kunne ikke gemme rollen.");
            }
        }
    };

    const handleDelete = async (name: string) => {
        if (window.confirm(`Er du sikker på, du vil slette rolletypen "${name}"?`)) {
            try {
                await api.deleteShiftRoleType(name);
                setShiftRoleTypes(prev => prev.filter(r => r !== name));
                toast.success("Rollen er slettet.");
            } catch (e) {
                toast.error("Kunne ikke slette rollen.");
            }
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 dark:text-slate-100">Administrer Vagtroller</h3>
            <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">Definer de typer af roller, man kan vælge imellem, når man opretter en vagt.</p>
            
            <div className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    value={newRoleType} 
                    onChange={e => setNewRoleType(e.target.value)} 
                    placeholder="Ny rolletype (f.eks. 'Dørmand')..." 
                    className="flex-grow border border-slate-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 dark:text-white" 
                />
                <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">Tilføj</button>
            </div>

            <div className="flex flex-wrap gap-2">
                {shiftRoleTypes.map(role => (
                    <span key={role} className="flex items-center bg-slate-100 dark:bg-slate-700 border dark:border-slate-600 text-slate-800 dark:text-slate-200 text-sm font-medium pl-3 pr-1 py-1 rounded-full">
                        {role}
                        <button onClick={() => handleDelete(role)} className="ml-2 text-rose-500 hover:text-rose-700 p-1"><TrashIcon /></button>
                    </span>
                ))}
            </div>
        </div>
    );
};