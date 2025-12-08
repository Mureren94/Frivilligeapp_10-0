
import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import toast from 'react-hot-toast';

const ConfirmButton: React.FC<{ onClick: () => void; className?: string; children: React.ReactNode }> = ({ onClick, className, children }) => {
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (isConfirming) {
            const timer = setTimeout(() => setIsConfirming(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isConfirming]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
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
            type="button"
            onClick={handleClick}
            className={`${className} ${isConfirming ? '!bg-rose-700 animate-pulse ring-2 ring-rose-400' : ''}`}
        >
            {isConfirming ? 'Klik igen for at slette' : children}
        </button>
    );
};

export const InfoPanel: React.FC = () => {
    const { adminNotifications, setAdminNotifications } = useData();

    // Mark all notifications as read when the component is viewed
    useEffect(() => {
        const hasUnread = adminNotifications.some(n => !n.read);
        if (hasUnread) {
            setAdminNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const sortedNotifications = useMemo(() => {
        return [...adminNotifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [adminNotifications]);

    const handleClearAll = () => {
        setAdminNotifications([]);
        toast.success("Alle notifikationer er blevet slettet.");
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold dark:text-slate-100">Info Panel / Log</h3>
                {adminNotifications.length > 0 && (
                    <ConfirmButton
                        onClick={handleClearAll}
                        className="bg-rose-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-rose-600 transition-colors"
                    >
                        Ryd alle
                    </ConfirmButton>
                )}
            </div>
            
            {sortedNotifications.length === 0 ? (
                 <div className="text-center py-10">
                    <p className="text-slate-500 dark:text-slate-400">Der er ingen nye hændelser at vise.</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {sortedNotifications.map(notification => (
                        <div key={notification.id} className="p-3 border dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700/50">
                            <p className="text-sm text-slate-800 dark:text-slate-200">{notification.message}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {new Date(notification.timestamp).toLocaleString('da-DK', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
