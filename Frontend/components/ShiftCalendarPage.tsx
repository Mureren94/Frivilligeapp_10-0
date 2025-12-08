


import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Shift, ShiftRole, ShiftTrade, User } from '../types';

type ShiftView = 'Kalender' | 'Mine Vagter' | 'Ledige Vagter' | 'Vagtbytte';

// --- Helper Components ---

const ConfirmButton: React.FC<{
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
    confirmText?: string;
}> = ({ onClick, className, children, confirmText = "Er du sikker?" }) => {
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (isConfirming) {
            const timer = setTimeout(() => setIsConfirming(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isConfirming]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isConfirming) {
            onClick();
            setIsConfirming(false);
        } else {
            setIsConfirming(true);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`${className} ${isConfirming ? '!bg-rose-600 !text-white animate-pulse' : ''}`}
        >
            {isConfirming ? confirmText : children}
        </button>
    );
};

const UserProfileModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
    const { roles } = useData();
    const roleName = useMemo(() => roles.find(r => r.id === user.role)?.name || 'Ukendt Rolle', [roles, user.role]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
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


const ShiftDetailsModal: React.FC<{ shift: Shift, onClose: () => void, onViewUser: (user: User) => void }> = ({ shift, onClose, onViewUser }) => {
    const { shiftRoles, users, handleTakeShiftRole } = useData();
    const rolesForShift = useMemo(() => {
        return shiftRoles.filter(r => r.shiftId === shift.id);
    }, [shiftRoles, shift.id]);

    const RoleUserDisplay: React.FC<{ role: ShiftRole }> = ({ role }) => {
        if (!role.userId) {
            return (
                <button onClick={() => handleTakeShiftRole(role.id)} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                    Ledig
                </button>
            );
        }
        const user = users.find(u => u.id === role.userId);
        return user ? (
            <button onClick={() => onViewUser(user)} className="flex items-center gap-2 rounded-md p-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random&size=32`} alt={user.name} className="w-6 h-6 rounded-full" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{user.name}</span>
            </button>
        ) : <span className="text-slate-500">Ukendt Bruger</span>;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700">
                    <h3 className="text-xl font-semibold dark:text-slate-100">{shift.title || "Vagt detaljer"}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(shift.date).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {shift.startTime && shift.endTime && ` • ${shift.startTime} - ${shift.endTime}`}
                    </p>
                </div>
                <div className="p-6 overflow-y-auto">
                    {shift.description && <p className="mb-4 text-slate-600 dark:text-slate-300">{shift.description}</p>}
                    <h4 className="text-lg font-semibold mb-2 dark:text-slate-200">Vagtroller</h4>
                    <ul className="space-y-2">
                        {rolesForShift.map(role => (
                            <li key={role.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{role.roleName}</span>
                                <RoleUserDisplay role={role} />
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 mt-auto border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">Luk</button>
                </div>
            </div>
        </div>
    );
};

const ShiftListCard: React.FC<{ shift: Shift, onDetailsClick: (shift: Shift) => void }> = ({ shift, onDetailsClick }) => {
    const formattedDate = useMemo(() => {
        // Add "T00:00:00" to handle timezone issues correctly
        const timezoneSafeDate = new Date(shift.date + 'T00:00:00');
        if (isNaN(timezoneSafeDate.getTime())) return "Ugyldig dato";

        const weekday = new Intl.DateTimeFormat('da-DK', { weekday: 'long' }).format(timezoneSafeDate);
        const day = timezoneSafeDate.getDate().toString().padStart(2, '0');
        const month = (timezoneSafeDate.getMonth() + 1).toString().padStart(2, '0');
        const year = timezoneSafeDate.getFullYear().toString().slice(-2);
        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day}-${month}-${year}`;
    }, [shift.date]);

    const shortDescription = shift.description
        ? (shift.description.length > 80 ? shift.description.substring(0, 80) + '...' : shift.description)
        : 'Ingen yderligere beskrivelse.';

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1">
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{formattedDate}</p>
                    {shift.startTime && shift.endTime && (
                        <p className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{shift.startTime} - {shift.endTime}</p>
                    )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{shift.title || 'Vagt'}</h3>
                <p className="text-slate-700 dark:text-slate-300 mt-2 flex-grow text-sm">
                    {shortDescription}
                </p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-700">
                <button onClick={() => onDetailsClick(shift)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                    Se Detaljer
                </button>
            </div>
        </div>
    );
};

// --- View Components ---

const CalendarView: React.FC<{ onShiftClick: (shift: Shift) => void }> = ({ onShiftClick }) => {
    const { shifts } = useData();
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    const availableMonths = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const months = [];
        for (let i = 0; i < 12; i++) {
            const date = new Date(year, i, 1);
            months.push({
                value: `${year}-${(i + 1).toString().padStart(2, '0')}`,
                label: date.toLocaleString('da-DK', { month: 'long', year: 'numeric' })
            });
        }
        return months;
    }, []);

    const filteredShifts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return shifts
            .filter(s => {
                const shiftDate = new Date(s.date);
                const monthMatch = selectedMonth === 'all' || s.date.startsWith(selectedMonth);
                return shiftDate >= today && monthMatch;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [shifts, selectedMonth]);

    return (
        <div>
            <div className="mb-4">
                <label htmlFor="month-filter" className="sr-only">Filtrer efter måned</label>
                <select
                    id="month-filter"
                    name="month-filter"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-slate-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                >
                    <option value="all">Alle Kommende Måneder</option>
                    {availableMonths.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                </select>
            </div>
            {filteredShifts.length === 0 ? (
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <p className="text-slate-500 dark:text-slate-400">Der er ingen kommende vagter i den valgte periode.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredShifts.map(shift => (
                        <ShiftListCard key={shift.id} shift={shift} onDetailsClick={onShiftClick} />
                    ))}
                </div>
            )}
        </div>
    );
};

const MyShiftsView: React.FC = () => {
    const { currentUser, shifts, shiftRoles, shiftTrades, handleLeaveShiftRole, handleInitiateShiftTrade } = useData();

    const myUpcomingShifts = useMemo(() => {
        if (!currentUser) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const myRoles = shiftRoles.filter(sr => sr.userId === currentUser.id);

        const rolesByShift = myRoles.reduce<Record<string, ShiftRole[]>>((acc, role) => {
            acc[role.shiftId] = acc[role.shiftId] || [];
            acc[role.shiftId].push(role);
            return acc;
        }, {});

        return shifts
            .map(shift => ({
                ...shift,
                roles: rolesByShift[shift.id] || []
            }))
            .filter(shift => {
                const shiftDate = new Date(shift.date + 'T00:00:00');
                return shift.roles.length > 0 && shiftDate >= today;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [currentUser, shifts, shiftRoles]);


    if (!currentUser) return null;

    if (myUpcomingShifts.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400 p-8">Du har ingen kommende vagter.</p>;
    }

    const isTradePending = (shiftRoleId: string) => shiftTrades.some(t => t.shiftRoleId === shiftRoleId && t.status === 'PENDING');

    return (
        <div className="space-y-4">
            {myUpcomingShifts.map(shift => (
                <div key={shift.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{shift.title || 'Vagt'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {new Date(shift.date).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {shift.startTime && shift.endTime && ` • ${shift.startTime} - ${shift.endTime}`}
                    </p>
                    <div className="space-y-2">
                        {shift.roles.map(role => (
                            <div key={role.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md">
                                <span className="font-medium text-slate-700 dark:text-slate-200">{role.roleName}</span>
                                <div className="flex gap-2 items-center self-end sm:self-center">
                                    <ConfirmButton
                                        onClick={() => handleLeaveShiftRole(role.id)}
                                        className="bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-900 font-medium py-1 px-3 rounded-full text-sm transition-colors duration-200"
                                    >
                                        Forlad Vagt
                                    </ConfirmButton>
                                    <button
                                        onClick={() => handleInitiateShiftTrade(role.id)}
                                        disabled={isTradePending(role.id)}
                                        className="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-900 font-medium py-1 px-3 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isTradePending(role.id) ? 'Bytte Anmodet' : 'Sæt til Bytte'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const AvailableShiftsView = () => {
    const { shifts, shiftRoles, handleTakeShiftRole } = useData();

    const shiftsWithAvailableRoles = useMemo(() => {
        const availableRoles = shiftRoles.filter(sr => sr.userId === null);
        const map: Record<string, { shift: Shift, roles: ShiftRole[] }> = {};
        availableRoles.forEach(role => {
            const shift = shifts.find(s => s.id === role.shiftId);
            if (shift) {
                if (!map[shift.id]) {
                    map[shift.id] = { shift, roles: [] };
                }
                map[shift.id].roles.push(role);
            }
        });
        return Object.values(map).sort((a, b) => new Date(a.shift.date).getTime() - new Date(b.shift.date).getTime());
    }, [shiftRoles, shifts]);

    return (
        <div className="space-y-4">
            {shiftsWithAvailableRoles.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 p-8">Der er ingen ledige vagter i øjeblikket.</p>}
            {shiftsWithAvailableRoles.map(({ shift, roles }) => (
                <div key={shift.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{shift.title || "Vagt"}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(shift.date).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {shift.startTime && shift.endTime && ` • ${shift.startTime} - ${shift.endTime}`}
                    </p>
                    <ul className="mt-3 space-y-2">
                        {roles.map(role => (
                            <li key={role.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{role.roleName}</span>
                                <button
                                    onClick={() => handleTakeShiftRole(role.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded text-sm"
                                >
                                    Tag Vagt
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

const ShiftTradeView = () => {
    const { currentUser, shiftTrades, shiftRoles, shifts, users, handleAcceptShiftTrade, handleCancelShiftTrade } = useData();

    const pendingTrades = useMemo(() => shiftTrades.filter(t => t.status === 'PENDING'), [shiftTrades]);

    if (!currentUser) return null;

    const UserDisplay: React.FC<{ userId: string | null }> = ({ userId }) => {
        if (!userId) {
            return <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ledig</span>;
        }
        const user = users.find(u => u.id === userId);
        if (!user) {
            return <span className="text-slate-500">Ukendt Bruger</span>;
        }
        return (
            <div className="flex items-center gap-2">
                <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random&size=32`} alt={user.name} className="w-6 h-6 rounded-full" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{user.name}</span>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {pendingTrades.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 p-8">Der er ingen åbne vagtbytte-anmodninger.</p>}
            {pendingTrades.map(trade => {
                const role = shiftRoles.find(r => r.id === trade.shiftRoleId);
                if (!role) return null;
                const shift = shifts.find(s => s.id === role.shiftId);
                if (!shift) return null;
                const offeringUser = users.find(u => u.id === trade.offeringUserId);
                if (!offeringUser) return null;

                const isMyTrade = trade.offeringUserId === currentUser.id;

                return (
                    <div key={trade.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{role.roleName}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {shift.title} - {new Date(shift.date).toLocaleDateString('da-DK')}
                                    {shift.startTime && shift.endTime && ` • ${shift.startTime} - ${shift.endTime}`}
                                </p>
                                <div className="mt-2 text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Udbydes af: </span>
                                    <UserDisplay userId={trade.offeringUserId} />
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {isMyTrade ? (
                                    <button onClick={() => handleCancelShiftTrade(trade.id)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-3 rounded text-sm">
                                        Annuller
                                    </button>
                                ) : (
                                    <button onClick={() => handleAcceptShiftTrade(trade.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded text-sm">
                                        Accepter Bytte
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- Main Page Component ---

export const ShiftCalendarPage: React.FC = () => {
    const [view, setView] = useState<ShiftView>('Kalender');
    const [viewingShift, setViewingShift] = useState<Shift | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    const renderContent = () => {
        switch (view) {
            case 'Kalender': return <CalendarView onShiftClick={setViewingShift} />;
            case 'Mine Vagter': return <MyShiftsView />;
            case 'Ledige Vagter': return <AvailableShiftsView />;
            case 'Vagtbytte': return <ShiftTradeView />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Vagtplan</h2>
            <div className="flex flex-wrap gap-2 border-b dark:border-slate-700 pb-4">
                {(['Kalender', 'Mine Vagter', 'Ledige Vagter', 'Vagtbytte'] as ShiftView[]).map(v => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${view === v ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        {v}
                    </button>
                ))}
            </div>
            {renderContent()}
            {viewingShift && <ShiftDetailsModal shift={viewingShift} onClose={() => setViewingShift(null)} onViewUser={setViewingUser} />}
            {viewingUser && <UserProfileModal user={viewingUser} onClose={() => setViewingUser(null)} />}
        </div>
    );
};
