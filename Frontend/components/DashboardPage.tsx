
import React, { useMemo } from 'react';
import type { Page } from '../types';
import { useData } from '../contexts/DataContext';

interface DashboardPageProps {
    setCurrentPage: (page: Page) => void;
}

const QuickLink: React.FC<{ onClick: () => void; title: string; description: string; icon: React.ReactElement }> = ({ onClick, title, description, icon }) => (
    <button
        onClick={onClick}
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 text-left w-full group"
    >
        <div className="flex items-center gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
    </button>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ setCurrentPage }) => {
    const { currentUser, tasks, signedUpTaskIds, shifts, shiftRoles, shiftTrades, users, settings } = useData();
    
    const upcomingTasks = useMemo(() => {
        return tasks
            .filter(task => signedUpTaskIds.includes(task.id) && !task.is_completed)
            .sort((a, b) => new Date(a.task_date).getTime() - new Date(b.task_date).getTime())
            .slice(0, 2); // Vis kun de næste 2 opgaver
    }, [tasks, signedUpTaskIds]);

    const upcomingShifts = useMemo(() => {
        if (!currentUser) return [];
        const myShiftRoles = shiftRoles.filter(sr => sr.userId === currentUser.id);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return shifts
            .filter(s => new Date(s.date) >= today)
            .map(s => {
                const rolesOnThisShift = myShiftRoles.filter(sr => sr.shiftId === s.id);
                return { ...s, roles: rolesOnThisShift };
            })
            .filter(s => s.roles.length > 0)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 2);
    }, [shifts, shiftRoles, currentUser]);

    const taskStats = useMemo(() => {
        const relevantTasks = tasks.filter(task => !task.is_template);
        const totalTasks = relevantTasks.length;
        const completedTasks = relevantTasks.filter(task => task.is_completed).length;
        const pendingTasks = totalTasks - completedTasks;
        return { totalTasks, completedTasks, pendingTasks };
    }, [tasks]);
    
    const shiftStats = useMemo(() => {
        if (!currentUser) return { availableUpcoming: 0, pendingTrades: 0, myShiftsRestOfYear: 0 };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingShifts = shifts.filter(s => new Date(s.date) >= today);
        const upcomingShiftIds = new Set(upcomingShifts.map(s => s.id));

        const availableUpcomingCount = shiftRoles.filter(sr => sr.userId === null && upcomingShiftIds.has(sr.shiftId)).length;
        const pendingTradesCount = shiftTrades.filter(t => t.status === 'PENDING').length;

        const endOfYear = new Date(today.getFullYear(), 11, 31);
        const myShiftsRestOfYearCount = shifts.filter(s => {
            const shiftDate = new Date(s.date);
            return shiftDate >= today && shiftDate <= endOfYear && shiftRoles.some(sr => sr.shiftId === s.id && sr.userId === currentUser.id);
        }).length;
        
        return {
            availableUpcoming: availableUpcomingCount,
            pendingTrades: pendingTradesCount,
            myShiftsRestOfYear: myShiftsRestOfYearCount,
        };
    }, [shifts, shiftRoles, shiftTrades, currentUser]);

    const pointStats = useMemo(() => {
        if (!currentUser) return { rank: 0, nextUserPoints: null };
        const sortedUsers = [...users].sort((a, b) => b.points - a.points);
        const myRankIndex = sortedUsers.findIndex(u => u.id === currentUser.id);
        const nextUser = myRankIndex > 0 ? sortedUsers[myRankIndex - 1] : null;

        return {
            rank: myRankIndex + 1,
            nextUserPoints: nextUser ? nextUser.points : null
        };
    }, [users, currentUser]);


    if (!currentUser) return null;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Velkommen tilbage, {currentUser.name}!</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Her er dit personlige overblik.</p>
            </div>

            <div className={`grid grid-cols-1 ${settings.enablePoints !== false ? 'lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-2'} gap-6`}>
                {settings.enablePoints !== false && (
                    <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center gap-6">
                        {(() => {
                            const goalPoints = settings.pointGoal || 0;
                            const userPoints = currentUser.points;
                            const radius = 60;
                            const stroke = 10;
                            const normalizedRadius = radius - stroke * 2;
                            const circumference = normalizedRadius * 2 * Math.PI;

                            const progress = goalPoints > 0 ? Math.min(100, (userPoints / goalPoints) * 100) : (userPoints > 0 ? 100 : 0);
                            const strokeDashoffset = circumference - (progress / 100) * circumference;

                            return (
                                <>
                                    <div className="relative w-32 h-32 flex-shrink-0">
                                        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                                            <circle stroke="currentColor" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} className="text-slate-200 dark:text-slate-700" r={normalizedRadius} cx={radius} cy={radius} />
                                            <circle stroke="currentColor" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} className="text-emerald-500 transition-all duration-500" r={normalizedRadius} cx={radius} cy={radius} />
                                        </svg>
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Dine Point</h3>
                                        <p className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">{userPoints}</p>
                                        {pointStats.nextUserPoints ? (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Du mangler {pointStats.nextUserPoints - currentUser.points + 1} point for at nå #{pointStats.rank - 1} pladsen!
                                            </p>
                                        ) : (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Du er nummer 1. Godt gået!</p>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                <div className={`${settings.enablePoints !== false ? 'lg:col-span-1' : 'col-span-1'} bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md`}>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Opgavestatistik</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                            <span className="text-slate-600 dark:text-slate-400">Total Opgaver</span>
                            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{taskStats.totalTasks}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                            <span className="text-slate-600 dark:text-slate-400">Fuldførte</span>
                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{taskStats.completedTasks}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Afventende</span>
                            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{taskStats.pendingTasks}</span>
                        </div>
                    </div>
                </div>
                
                 <div className={`${settings.enablePoints !== false ? 'lg:col-span-1' : 'col-span-1'} bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md`}>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Vagtplan Overblik</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                            <span className="text-slate-600 dark:text-slate-400">Ledige Vagter</span>
                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{shiftStats.availableUpcoming}</span>
                        </div>
                         <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                            <span className="text-slate-600 dark:text-slate-400">Til Bytte</span>
                            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{shiftStats.pendingTrades}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Dine Vagter (i år)</span>
                            <span className="text-xl font-bold text-sky-600 dark:text-sky-400">{shiftStats.myShiftsRestOfYear}</span>
                        </div>
                    </div>
                </div>


                <div className={`${settings.enablePoints !== false ? 'lg:col-span-3' : 'md:col-span-2 lg:col-span-2'} bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md`}>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Dine Næste Tilmeldinger</h3>
                    {upcomingTasks.length === 0 && upcomingShifts.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-slate-500 dark:text-slate-400">Du har ingen kommende opgaver eller vagter.</p>
                             <button onClick={() => setCurrentPage('Opgaveliste')} className="mt-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                                Find en ny opgave!
                            </button>
                        </div>
                    ) : (
                         <ul className="space-y-4">
                            {upcomingShifts.map(shift => (
                                <li key={shift.id} className="p-4 border dark:border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700/50">
                                    <div className="flex justify-between items-center">
                                         <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{shift.title || 'Vagt'}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {new Date(shift.date).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'long' })}
                                            </p>
                                        </div>
                                        <span className="text-xs font-semibold uppercase text-sky-600 bg-sky-100 dark:text-sky-400 dark:bg-sky-900/50 py-1 px-3 rounded-full">Vagt</span>
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 pl-2 border-l-2 dark:border-slate-600">
                                        Dine roller: {shift.roles.map(r => r.roleName).join(', ')}
                                    </div>
                                </li>
                            ))}
                            {upcomingTasks.map(task => (
                                <li key={task.id} className="p-4 border dark:border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{task.title}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(task.task_date).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold uppercase text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/50 py-1 px-3 rounded-full">Opgave</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div>
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Hurtige Links</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {settings.menuVisibility?.opgaveliste !== false && (
                        <QuickLink
                            onClick={() => setCurrentPage('Opgaveliste')}
                            title="Find nye opgaver"
                            description="Se listen over alle ledige opgaver."
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            }
                        />
                    )}
                     {settings.menuVisibility?.vagtplan !== false && (
                        <QuickLink
                            onClick={() => setCurrentPage('Vagtplan')}
                            title="Se Vagtplan"
                            description="Se kalender, tag vagter og byt."
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            }
                        />
                     )}
                     {settings.menuVisibility?.leaderboard !== false && settings.enablePoints !== false && (
                        <QuickLink
                            onClick={() => setCurrentPage('Leaderboard')}
                            title="Se Leaderboard"
                            description="Se hvem der fører i point."
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            }
                        />
                     )}
                     <QuickLink
                        onClick={() => setCurrentPage('Min Profil')}
                        title="Rediger din profil"
                        description="Opdater dine oplysninger."
                        icon={
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        }
                    />
                 </div>
            </div>

        </div>
    );
};
