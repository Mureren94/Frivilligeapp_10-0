
import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Profile, Task } from '../types';
import { useData } from '../contexts/DataContext';
import { fileToBase64, getDueDateInfo } from '../utils';

export const ProfilePage: React.FC = () => {
    const { currentUser, tasks, signedUpTaskIds, handleProfileSave, handleUnregister, shifts, shiftRoles, settings } = useData();

    // The profile object is derived from the currentUser from context
    const profile: Profile | null = useMemo(() => {
        if (!currentUser) return null;
        return {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            image: currentUser.image,
            points: currentUser.points,
            role: currentUser.role,
            phone: currentUser.phone,
            phone_is_public: currentUser.phone_is_public,
            notification_preferences: currentUser.notification_preferences,
        };
    }, [currentUser]);

    const [name, setName] = useState(profile?.name || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [image, setImage] = useState(profile?.image);
    const [imagePreview, setImagePreview] = useState(profile?.image);
    const [phone, setPhone] = useState(profile?.phone || '');
    const [isPhoneHidden, setIsPhoneHidden] = useState(profile?.phone_is_public === false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [notifyOnNewTask, setNotifyOnNewTask] = useState(profile?.notification_preferences?.new_task ?? true);
    const [notifyOnShiftTrade, setNotifyOnShiftTrade] = useState(profile?.notification_preferences?.shift_trade_completed ?? true);
    const [notifyOnNewsletter, setNotifyOnNewsletter] = useState(profile?.notification_preferences?.newsletter ?? true);


    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setEmail(profile.email);
            setImage(profile.image);
            setImagePreview(profile.image);
            setPhone(profile.phone || '');
            setIsPhoneHidden(profile.phone_is_public === false);
            setNotifyOnNewTask(profile.notification_preferences?.new_task ?? true);
            setNotifyOnShiftTrade(profile.notification_preferences?.shift_trade_completed ?? true);
            setNotifyOnNewsletter(profile.notification_preferences?.newsletter ?? true);
        }
    }, [profile]);


    const upcomingTasks = useMemo(() => {
        return tasks
            .filter(task => signedUpTaskIds.includes(task.id) && !task.is_completed)
            .sort((a, b) => new Date(a.task_date).getTime() - new Date(b.task_date).getTime());
    }, [tasks, signedUpTaskIds]);

    const completedTasks = useMemo(() => {
        return tasks
            .filter(task => signedUpTaskIds.includes(task.id) && task.is_completed)
            .sort((a, b) => new Date(b.task_date).getTime() - new Date(a.task_date).getTime());
    }, [tasks, signedUpTaskIds]);

    const groupedUpcomingTasks = useMemo(() => {
        const groups: { [date: string]: Task[] } = {};
        upcomingTasks.forEach(task => {
            const dateStr = new Date(task.task_date).toLocaleDateString('da-DK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(task);
        });
        return groups;
    }, [upcomingTasks]);

    const upcomingShifts = useMemo(() => {
        if (!currentUser) return [];

        const myShiftRoleIds = new Set(shiftRoles.filter(sr => sr.userId === currentUser.id).map(sr => sr.id));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return shifts
            .map(s => {
                const rolesOnThisShift = shiftRoles.filter(sr => sr.shiftId === s.id && myShiftRoleIds.has(sr.id));
                return { ...s, roles: rolesOnThisShift };
            })
            .filter(s => s.roles.length > 0 && new Date(s.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [shifts, shiftRoles, currentUser]);


    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64Image = await fileToBase64(file);
            setImage(base64Image);
            setImagePreview(base64Image);
        }
    };

    const handleSave = () => {
        if (!profile) return;

        setPasswordError('');
        if (password || confirmPassword) {
            if (password.length < 6) {
                setPasswordError('Adgangskoden skal være på mindst 6 tegn.');
                return;
            }
            if (password !== confirmPassword) {
                setPasswordError('Adgangskoderne er ikke ens.');
                return;
            }
        }

        const profileUpdate: Partial<Profile> = {
            id: profile.id,
            name,
            email,
            image,
            phone,
            phone_is_public: !isPhoneHidden,
            notification_preferences: {
                new_task: notifyOnNewTask,
                shift_trade_completed: notifyOnShiftTrade,
                newsletter: notifyOnNewsletter
            }
        };

        if (password) {
            profileUpdate.password = password;
        }

        handleProfileSave(profileUpdate);
        setPassword('');
        setConfirmPassword('');
        toast.success('Profilen er gemt!');
    };

    if (!profile) {
        return <div>Indlæser profil...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Min Profil</h2>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md grid md:grid-cols-3 gap-8 transition-colors duration-300">
                <div className="md:col-span-1 flex flex-col items-center">
                    <img src={imagePreview || `https://ui-avatars.com/api/?name=${name}&background=random`} alt="Profile" className="w-40 h-40 rounded-full object-cover mb-4 ring-4 ring-emerald-200 dark:ring-emerald-500/50" />
                    <input type="file" id="profile-image-upload" name="profile-image-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
                    <label htmlFor="profile-image-upload" className="cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded transition-colors duration-200">
                        Skift billede
                    </label>
                    {settings.enablePoints !== false && (
                        <div className="mt-6 w-full text-center">
                            <h3 className="text-base font-medium text-slate-600 dark:text-slate-400">Mine Optjente Point</h3>
                            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{profile.points}</p>
                        </div>
                    )}
                </div>
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-400">Navn</label>
                        {/* TILFØJET: name="name" og autocomplete="name" */}
                        <input type="text" id="name" name="name" autocomplete="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-400">Email</label>
                        {/* TILFØJET: name="email" og autocomplete="email" */}
                        <input type="email" id="email" name="email" autocomplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-400">Telefonnummer</label>
                        {/* TILFØJET: name="phone" og autocomplete="tel" */}
                        <input type="tel" id="phone" name="phone" autocomplete="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 dark:text-white" />
                    </div>
                    <div className="flex items-center">
                        <input
                            id="phone-hidden"
                            type="checkbox"
                            checked={isPhoneHidden}
                            onChange={e => setIsPhoneHidden(e.target.checked)}
                            name="phone-hidden"
                            className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500"
                        />
                        <label htmlFor="phone-hidden" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
                            Skjul telefonnummer for andre
                        </label>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-2">Notifikationsindstillinger</h4>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input id="notify-new-task" name="notify-new-task" type="checkbox" checked={notifyOnNewTask} onChange={e => setNotifyOnNewTask(e.target.checked)} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500" />
                                <label htmlFor="notify-new-task" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Modtag email ved nye opgaver</label>
                            </div>
                            <div className="flex items-center">
                                <input id="notify-shift-trade" name="notify-shift-trade" type="checkbox" checked={notifyOnShiftTrade} onChange={e => setNotifyOnShiftTrade(e.target.checked)} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500" />
                                <label htmlFor="notify-shift-trade" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Modtag email når din vagt er byttet</label>
                            </div>
                            <div className="flex items-center">
                                <input id="notify-newsletter" name="notify-newsletter" type="checkbox" checked={notifyOnNewsletter} onChange={e => setNotifyOnNewsletter(e.target.checked)} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500" />
                                <label htmlFor="notify-newsletter" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Modtag nyhedsbreve</label>
                            </div>
                        </div>
                    </div>


                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-2">Skift Adgangskode</h4>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-400">Ny Adgangskode (lad stå tom for ikke at ændre)</label>
                                {/* TILFØJET: name="new-password" og autocomplete="new-password" */}
                                <input type="password" id="password" name="new-password" autocomplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-400">Bekræft Ny Adgangskode</label>
                                {/* TILFØJET: name="confirm-password" og autocomplete="new-password" */}
                                <input type="password" id="confirm-password" name="confirm-password" autocomplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                            {passwordError && <p className="text-sm text-rose-600">{passwordError}</p>}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                            Gem Profil
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Tasks */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md transition-colors duration-300 flex flex-col h-[32rem]">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex-shrink-0">Mine Tilmeldte Opgaver</h3>
                    {upcomingTasks.length > 0 ? (
                        <div className="space-y-6 overflow-y-auto pr-2 -mr-2">
                            {Object.keys(groupedUpcomingTasks).map(date => (
                                <div key={date}>
                                    <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 pb-2 border-b dark:border-slate-700 mb-3">{date}</h4>
                                    <ul className="space-y-3">
                                        {groupedUpcomingTasks[date].map(task => {
                                            const dueDateInfo = getDueDateInfo(task.task_date);
                                            return (
                                                <li key={task.id} className="p-3 border dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700/50 flex flex-col gap-2">
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-100">{task.title}</p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">{task.category}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        {dueDateInfo.text && (
                                                            <div className={`flex items-center gap-1.5 text-xs font-medium ${dueDateInfo.textColor}`}>
                                                                <span className={`h-2 w-2 rounded-full ${dueDateInfo.color}`}></span>
                                                                {dueDateInfo.text}
                                                            </div>
                                                        )}
                                                        {settings.enablePoints !== false && (
                                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/50 py-0.5 px-2 rounded-full">{task.points}p</span>
                                                        )}
                                                        <button onClick={() => handleUnregister(task.id)} className="text-xs bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-900 font-medium py-0.5 px-2 rounded-full transition-colors">
                                                            Afmeld
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-slate-500 dark:text-slate-400 text-center">Du har ingen kommende opgaver.</p>
                        </div>
                    )}
                </div>

                {/* Completed Tasks History */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md transition-colors duration-300 flex flex-col h-[32rem]">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex-shrink-0">Fuldførte Opgaver</h3>
                    {completedTasks.length > 0 ? (
                        <div className="space-y-3 overflow-y-auto pr-2 -mr-2">
                            {completedTasks.map(task => (
                                <div key={task.id} className="p-3 border dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center opacity-80">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{task.title}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                            {new Date(task.task_date).toLocaleDateString('da-DK')}
                                        </p>
                                    </div>
                                    {settings.enablePoints !== false && (
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/50 py-0.5 px-2 rounded-full">+{task.points}p</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-slate-500 dark:text-slate-400 text-center">Du har endnu ikke fuldført nogen opgaver.</p>
                        </div>
                    )}
                </div>

                {/* Upcoming Shifts */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md transition-colors duration-300 flex flex-col h-[32rem]">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex-shrink-0">Mine Kommende Vagter</h3>
                    {upcomingShifts.length > 0 ? (
                        <div className="space-y-3 overflow-y-auto pr-2 -mr-2">
                            {upcomingShifts.map(shift => (
                                <div key={shift.id} className="p-3 border dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700/50">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{shift.title || 'Vagt'}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(shift.date).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Dine roller: {shift.roles.map(r => r.roleName).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-slate-500 dark:text-slate-400 text-center">Du har ingen kommende vagter.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
