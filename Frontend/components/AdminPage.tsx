import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { TaskManagement } from './admin/TaskManagement';
import { UserManagement } from './admin/UserManagement';
import { SuperAdminSettings } from './admin/SuperAdminSettings';
import { ShiftManagement } from './admin/ShiftManagement';
// Vi fjerner importen af ShiftRoleTypeManagement herfra, da den nu bruges inde i ShiftManagement
import { RoleManagement } from './admin/RoleManagement';
import { InfoPanel } from './admin/InfoPanel';
import { EmailManagement } from './admin/EmailManagement';
import { GalleryManagement } from './admin/GalleryManagement';

type AdminView = 'Info' | 'Opgaver' | 'Vagter' | 'Brugere' | 'Roller' | 'Galleri' | 'Email' | 'SuperAdmin';

export const AdminPage: React.FC = () => {
    const { userHasPermission, adminNotifications } = useData();

    const availableViews = useMemo(() => {
        const views: AdminView[] = [];
        if (userHasPermission('access_admin_panel')) {
             views.push('Info');
        }
        if (userHasPermission('manage_tasks') || userHasPermission('manage_categories')) {
            views.push('Opgaver');
        }
        if (userHasPermission('manage_shifts')) {
            views.push('Vagter');
            // 'Vagtroller' er fjernet herfra, da den nu er en fane under 'Vagter'
        }
        if (userHasPermission('manage_gallery')) {
            views.push('Galleri');
        }
        if (userHasPermission('manage_users')) {
            views.push('Brugere');
        }
        if (userHasPermission('manage_roles')) {
            views.push('Roller');
        }
        if (userHasPermission('manage_settings')) {
            views.push('Email');
            views.push('SuperAdmin');
        }
        return views;
    }, [userHasPermission]);
    
    const unreadCount = useMemo(() => adminNotifications.filter(n => !n.read).length, [adminNotifications]);

    const [adminView, setAdminView] = useState<AdminView | null>(availableViews[0] || null);
    
    const renderAdminView = () => {
        switch(adminView) {
            case 'Info':
                return <InfoPanel />;
            case 'Opgaver':
                return <TaskManagement />;
            case 'Vagter':
                return <ShiftManagement />;
            // Case 'Vagtroller' er fjernet
            case 'Galleri':
                return <GalleryManagement />;
            case 'Brugere':
                return <UserManagement />;
            case 'Roller':
                return <RoleManagement />;
            case 'Email':
                return <EmailManagement />;
            case 'SuperAdmin':
                return <SuperAdminSettings />;
            default:
                return <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md"><p className="text-slate-500 dark:text-slate-400">Vælg venligst en sektion ovenfor.</p></div>;
        }
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Admin Panel</h2>

            {availableViews.length > 0 ? (
                <>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md flex justify-center flex-wrap gap-2 border dark:border-slate-700">
                        {availableViews.map(view => (
                            <button key={view} onClick={() => setAdminView(view)} className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${adminView === view ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                {view === 'SuperAdmin' ? 'Sideindstillinger' : view}
                                {view === 'Info' && unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    {renderAdminView()}
                </>
            ) : (
                 <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Ingen adgang</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Du har ikke de nødvendige rettigheder til at se indholdet på denne side.</p>
                </div>
            )}
        </div>
    );
};