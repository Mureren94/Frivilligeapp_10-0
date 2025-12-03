import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import type { User } from '../types';

const UserProfileModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
    const { roles } = useData();
    const roleName = useMemo(() => roles.find(r => r.id === user.role)?.name || 'Ukendt Rolle', [roles, user.role]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center relative">
                    <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl" aria-label="Luk">&times;</button>
                    <img
                        src={user.image || `https://ui-avatars.com/api/?name=${user.name.replace(/\s/g, '+')}&background=random&size=128`}
                        alt={`${user.name} profilbillede`}
                        className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-emerald-200 dark:ring-emerald-500/50"
                    />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{user.name}</h2>
                    <p className="text-sm font-medium text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/50 py-0.5 px-2 rounded-full inline-block mt-1">{roleName}</p>
                    <div className="mt-4 flex justify-center items-baseline gap-1">
                        <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{user.points}</span>
                        <span className="text-slate-500 dark:text-slate-400">point</span>
                    </div>

                    {user.phone && user.phone_is_public && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                             <p className="text-sm text-slate-500 dark:text-slate-400">Telefonnummer:</p>
                             <a href={`tel:${user.phone}`} className="text-lg font-semibold text-slate-800 dark:text-slate-200 hover:underline">{user.phone}</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const LeaderboardPage: React.FC = () => {
    const { users, currentUser } = useData();
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    
    const leaderboardData = useMemo(() => {
        return [...users].sort((a, b) => b.points - a.points);
    }, [users]);

    if (!currentUser) return null;

    return (
        <>
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Leaderboard</h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {leaderboardData.map((user, index) => (
                        <li 
                            key={user.id} 
                            onClick={() => setViewingUser(user)}
                            className={`p-4 flex items-center justify-between cursor-pointer transition-colors duration-200 ${user.email === currentUser.email ? 'bg-emerald-50 dark:bg-emerald-900/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                           <div className="flex items-center">
                                <span className="text-lg font-bold text-slate-500 dark:text-slate-400 w-10 text-center">{index + 1}.</span>
                                <img 
                                    src={user.image || `https://ui-avatars.com/api/?name=${user.name.replace(/\s/g, '+')}&background=random&size=64`} 
                                    alt={`${user.name} profilbillede`} 
                                    className="w-10 h-10 rounded-full object-cover mr-4"
                                />
                                <div>
                                    <span className="font-medium text-slate-800 dark:text-slate-100">{user.name}</span>
                                    {user.email === currentUser.email && <span className="text-xs text-emerald-600 dark:text-emerald-400 block">(Dig)</span>}
                                </div>
                            </div>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{user.points} point</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        {viewingUser && <UserProfileModal user={viewingUser} onClose={() => setViewingUser(null)} />}
        </>
    );
};