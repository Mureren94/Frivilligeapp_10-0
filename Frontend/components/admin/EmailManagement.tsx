import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import toast from 'react-hot-toast';
import type { NotificationType, EmailTemplateType } from '../../types';

const PlaceholderInfo: React.FC<{ placeholders: string[] }> = ({ placeholders }) => (
    <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md">
        <p className="font-semibold">Tilgængelige pladsholdere:</p>
        <div className="flex flex-wrap gap-x-2">
        {placeholders.map(p => <code key={p} className="bg-slate-200 dark:bg-slate-600 px-1 rounded">{`{{${p}}}`}</code>)}
        </div>
    </div>
);

export const EmailManagement: React.FC = () => {
    const { settings, handleSaveSettings, userHasPermission, roles } = useData();
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => { setLocalSettings(settings); }, [settings]);

    const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const smtpField = name.split('.')[1];
        setLocalSettings(prev => ({ ...prev, smtp: { ...prev.smtp, [smtpField]: value } }));
    };
    
    const handleTemplateChange = (type: EmailTemplateType, field: 'subject' | 'body' | 'deliveryMethod', value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            email_templates: {
                ...prev.email_templates,
                [type]: {
                    ...prev.email_templates![type],
                    [field]: value,
                }
            }
        }));
    };
    
    const handleRoleDefaultChange = (type: NotificationType, roleId: string, checked: boolean) => {
        setLocalSettings(prev => {
            const currentDefaults = prev.notification_role_defaults || { new_task: [], shift_trade_completed: [], newsletter: [] };
            const newRolesForType = checked ? [...currentDefaults[type], roleId] : currentDefaults[type].filter(id => id !== roleId);
            return { ...prev, notification_role_defaults: { ...currentDefaults, [type]: newRolesForType } };
        });
    };

    const onSave = () => { handleSaveSettings(localSettings); };
    
    const notificationTypes: {id: NotificationType, name: string}[] = [
        { id: 'new_task', name: 'Nye Opgaver' },
        { id: 'shift_trade_completed', name: 'Gennemførte Vagtbytter' },
        { id: 'newsletter', name: 'Nyhedsbreve' },
    ];
    
    const templateDetails: { [key in EmailTemplateType]: { name: string; placeholders: string[] } } = {
        password_reset: { name: "Nulstilling af Adgangskode", placeholders: ['userName', 'resetLink', 'siteName'] },
        new_task: { name: "Ny Opgave Notifikation", placeholders: ['taskTitle', 'taskDescription', 'taskDate', 'taskPoints', 'siteName'] },
        shift_trade_completed: { name: "Vagtbytte Gennemført", placeholders: ['offeringUserName', 'acceptingUserName', 'shiftTitle', 'shiftDate', 'roleName', 'siteName'] },
        newsletter: { name: "Nyhedsbrev", placeholders: ['siteName'] }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-8">
            <h3 className="text-xl font-semibold dark:text-slate-100">Email Indstillinger</h3>
            {userHasPermission('manage_settings') ? (
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold mb-2 dark:text-slate-200">Email Skabeloner</h4>
                     <div className="space-y-4">
                        {Object.keys(templateDetails).map(key => {
                            const type = key as EmailTemplateType;
                            const details = templateDetails[type];
                            return (
                                <div key={type} className="p-4 border dark:border-slate-700 rounded-lg">
                                    <h5 className="font-semibold text-md dark:text-slate-100">{details.name}</h5>
                                    <div className="mt-2 space-y-2">
                                        <input id={`subject-${type}`} name={`subject-${type}`} aria-label="Emne" type="text" value={localSettings.email_templates?.[type]?.subject || ''} onChange={e => handleTemplateChange(type, 'subject', e.target.value)} placeholder="Emne" className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                                        <textarea id={`body-${type}`} name={`body-${type}`} aria-label="Brødtekst" value={localSettings.email_templates?.[type]?.body || ''} onChange={e => handleTemplateChange(type, 'body', e.target.value)} placeholder="Brødtekst" rows={6} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                                        <div className="mt-2 space-y-1">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-400">Leveringsmetode (for flere modtagere)</label>
                                            <div className="flex items-center gap-x-6 gap-y-2 flex-wrap">
                                                {(['to', 'cc', 'bcc'] as const).map(method => (
                                                    <div key={method} className="flex items-center">
                                                        <input type="radio" id={`delivery-${type}-${method}`} name={`delivery-${type}`} value={method} checked={localSettings.email_templates?.[type]?.deliveryMethod === method} onChange={e => handleTemplateChange(type, 'deliveryMethod', e.target.value)} className="h-4 w-4 border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-700" />
                                                        <label htmlFor={`delivery-${type}-${method}`} className="ml-2 block text-sm text-slate-900 dark:text-slate-300">{method.toUpperCase()}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <PlaceholderInfo placeholders={details.placeholders} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-lg font-semibold mb-2 dark:text-slate-200">Email Notifikationer (Standard for Roller)</h4>
                    <div className="space-y-4">
                       {notificationTypes.map(type => (
                            <div key={type.id}>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{type.name}</label>
                                <div className="mt-2 flex flex-wrap gap-4">
                                    {roles.map(role => (
                                        <div key={role.id} className="flex items-center">
                                             <input id={`role-default-${type.id}-${role.id}`} type="checkbox" checked={localSettings.notification_role_defaults?.[type.id]?.includes(role.id) ?? false} onChange={e => handleRoleDefaultChange(type.id, role.id, e.target.checked)} className="appearance-none h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-emerald-600 checked:border-transparent checked:bg-checkbox-mark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-emerald-500" />
                                            <label htmlFor={`role-default-${type.id}-${role.id}`} className="ml-2 block text-sm text-slate-900 dark:text-slate-300">{role.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                       ))}
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-lg font-semibold mb-2 dark:text-slate-200">SMTP Server Indstillinger</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="smtp-senderEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Afsender Email</label>
                            <input type="email" id="smtp-senderEmail" name="smtp.senderEmail" value={localSettings.smtp.senderEmail} onChange={handleSmtpChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="smtp-host" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Host</label>
                            <input type="text" id="smtp-host" name="smtp.host" value={localSettings.smtp.host} onChange={handleSmtpChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="smtp-port" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Port</label>
                            <input type="text" id="smtp-port" name="smtp.port" value={localSettings.smtp.port} onChange={handleSmtpChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="smtp-user" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Brugernavn</label>
                            <input type="text" id="smtp-user" name="smtp.user" value={localSettings.smtp.user} onChange={handleSmtpChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="smtp-pass" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Adgangskode</label>
                            <input type="password" id="smtp-pass" name="smtp.pass" value={localSettings.smtp.pass} onChange={handleSmtpChange} className="p-2 border rounded w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
                        </div>
                    </div>
                </div>
                <button onClick={onSave} className="w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">Gem Email Indstillinger</button>
            </div>
            ) : ( <p className="text-slate-500 dark:text-slate-400">Du har ikke de nødvendige rettigheder til at ændre email indstillinger.</p> )}
        </div>
    );
};