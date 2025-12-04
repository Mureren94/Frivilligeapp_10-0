import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { fileToBase64 } from '../../utils';
import toast from 'react-hot-toast';

export const SuperAdminSettings: React.FC = () => {
    const { settings, handleSaveSettings, userHasPermission } = useData();
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => { setLocalSettings(settings); }, [settings]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
         if (type === 'color') { setLocalSettings(prev => ({ ...prev, [name]: value })); return; }
        if (name === 'pointGoal' || name === 'minTaskPoints' || name === 'maxTaskPoints') {
            const numValue = value === '' ? undefined : parseInt(value, 10);
            setLocalSettings(prev => ({ ...prev, [name]: numValue }));
            return;
        }
        setLocalSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleMenuVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setLocalSettings(prev => ({ ...prev, menuVisibility: { ...prev.menuVisibility, [name]: checked, } }));
    };
    
    const handleEnablePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSettings(prev => ({ ...prev, enablePoints: e.target.checked }));
    };
    
    const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64Icon = await fileToBase64(e.target.files[0]);
            setLocalSettings(prev => ({ ...prev, siteIcon: base64Icon }));
        }
    };

    const handleDefaultTaskImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64Image = await fileToBase64(e.target.files[0]);
            setLocalSettings(prev => ({ ...prev, defaultTaskImage: base64Image }));
        }
    };

    const onSave = () => {
        if ((localSettings.minTaskPoints || 0) > (localSettings.maxTaskPoints || 1000)) {
            toast.error("Minimum point kan ikke være højere end maksimum point.");
            return;
        }
        handleSaveSettings(localSettings);
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
            <h3 className="text-xl font-semibold dark:text-slate-100">Generelle Sideindstillinger</h3>
            {userHasPermission('manage_settings') ? (
            <>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div className="sm:col-span-2">
                            <label htmlFor="siteName" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Side Navn</label>
                            <input type="text" id="siteName" name="siteName" value={localSettings.siteName} onChange={handleSettingsChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                        </div>
                        <div>
                        <label htmlFor="siteNameColor" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Titel Farve</label>
                        <input type="color" id="siteNameColor" name="siteNameColor" value={localSettings.siteNameColor} onChange={handleSettingsChange} className="p-1 h-10 w-full block bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none" title="Vælg en farve"/>
                        </div>
                    </div>
                    {localSettings.enablePoints !== false && (
                        <div>
                            <label htmlFor="pointGoal" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Point Mål (for progress ring)</label>
                            <input type="number" id="pointGoal" name="pointGoal" value={localSettings.pointGoal ?? ''} onChange={handleSettingsChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                    )}
                    {localSettings.enablePoints !== false && (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="minTaskPoints" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Minimum point for opgaver</label>
                                <input type="number" id="minTaskPoints" name="minTaskPoints" value={localSettings.minTaskPoints ?? ''} onChange={handleSettingsChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            </div>
                            <div>
                                <label htmlFor="maxTaskPoints" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Maksimum point for opgaver</label>
                                <input type="number" id="maxTaskPoints" name="maxTaskPoints" value={localSettings.maxTaskPoints ?? ''} onChange={handleSettingsChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            </div>
                        </div>
                    )}
                    <div>
                        <label htmlFor="siteIcon" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Side Ikon (favicon)</label>
                        <div className="flex items-center gap-4">
                            {localSettings.siteIcon && <img src={localSettings.siteIcon} alt="Site Icon Preview" className="w-10 h-10 rounded" />}
                            <input type="file" id="siteIcon" name="siteIcon" accept="image/png, image/jpeg, image/x-icon, image/svg+xml" onChange={handleIconChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/50 dark:file:text-emerald-300 dark:hover:file:bg-emerald-900" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="defaultTaskImage" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Standard Opgavebillede</label>
                        <div className="flex items-center gap-4">
                            {localSettings.defaultTaskImage && <img src={localSettings.defaultTaskImage} alt="Standard opgavebillede" className="w-16 h-16 rounded object-cover" />}
                            <input type="file" id="defaultTaskImage" name="defaultTaskImage" accept="image/png, image/jpeg" onChange={handleDefaultTaskImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/50 dark:file:text-emerald-300 dark:hover:file:bg-emerald-900" />
                        </div>
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-lg font-semibold mb-2 dark:text-slate-200">Menu Synlighed</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Vælg hvilke hovedmenupunkter der skal være synlige for alle brugere.</p>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <input id="enable-points" name="enablePoints" type="checkbox" checked={localSettings.enablePoints ?? true} onChange={handleEnablePointsChange} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500" />
                            <label htmlFor="enable-points" className="ml-2 block text-sm font-medium text-slate-900 dark:text-slate-300">Aktiver Pointsystem</label>
                        </div>
                        <div className="flex items-center">
                            <input id="vis-opgaveliste" name="opgaveliste" type="checkbox" checked={localSettings.menuVisibility?.opgaveliste ?? true} onChange={handleMenuVisibilityChange} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500" />
                            <label htmlFor="vis-opgaveliste" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Vis 'Opgaveliste'</label>
                        </div>
                         <div className="flex items-center">
                            <input id="vis-vagtplan" name="vagtplan" type="checkbox" checked={localSettings.menuVisibility?.vagtplan ?? true} onChange={handleMenuVisibilityChange} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500" />
                            <label htmlFor="vis-vagtplan" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Vis 'Vagtplan'</label>
                        </div>
                         <div className="flex items-center">
                            <input id="vis-leaderboard" name="leaderboard" type="checkbox" checked={localSettings.menuVisibility?.leaderboard ?? true} onChange={handleMenuVisibilityChange} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500" />
                            <label htmlFor="vis-leaderboard" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Vis 'Leaderboard'</label>
                        </div>
                    </div>
                </div>
                <button onClick={onSave} className="w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">Gem Sideindstillinger</button>
            </>
            ) : ( <p className="text-slate-500 dark:text-slate-400">Du har ikke de nødvendige rettigheder til at ændre sideindstillinger.</p> )}
        </div>
    );
};