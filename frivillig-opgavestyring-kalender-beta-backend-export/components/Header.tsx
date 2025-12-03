
import React, { useMemo, useState, useEffect } from 'react';
import type { Page } from '../types';
import { useData } from '../contexts/DataContext';
import { MoonIcon, SunIcon } from './icons';

export interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, onLogout }) => {
    const { currentUser, theme, toggleTheme, settings, userHasPermission, adminNotifications } = useData();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMenuOpen]);


    const hasUnreadNotifications = useMemo(() => {
        return userHasPermission('access_admin_panel') && adminNotifications.some(n => !n.read);
    }, [adminNotifications, userHasPermission]);

    const baseNavItems = useMemo(() => {
        if (!currentUser) return [];
        const items: Page[] = ['Dashboard'];

        if (settings.menuVisibility?.opgaveliste !== false) {
            items.push('Opgaveliste');
        }
        if (settings.menuVisibility?.vagtplan !== false) {
            items.push('Vagtplan');
        }
        items.push('Min Profil');
        if (settings.menuVisibility?.leaderboard !== false && settings.enablePoints !== false) {
            items.push('Leaderboard');
        }
        
        if (userHasPermission('access_admin_panel')) {
            items.push('Admin');
        }
        return items;
    }, [currentUser, userHasPermission, settings.menuVisibility, settings.enablePoints]);

    if (!currentUser) return null; // Don't render header if not logged in

    const siteNameStyle = settings.siteNameColor ? { color: settings.siteNameColor } : {};

    const getNavItemClasses = (item: Page) => {
        const baseClasses = 'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200';
        if (item === 'Admin' && hasUnreadNotifications) {
            return `${baseClasses} bg-rose-500 text-white animate-pulse`;
        }
        if (currentPage === item) {
            return `${baseClasses} bg-emerald-600 text-white`;
        }
        return `${baseClasses} text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white`;
    };

    const getMobileNavItemClasses = (item: Page) => {
        const baseClasses = 'w-full text-left block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200';
        if (item === 'Admin' && hasUnreadNotifications) {
            return `${baseClasses} bg-rose-500 text-white animate-pulse`;
        }
        if (currentPage === item) {
            return `${baseClasses} bg-emerald-600 text-white`;
        }
        return `${baseClasses} text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700`;
    };

    return (
        <header className="bg-white dark:bg-slate-800 shadow-md dark:shadow-slate-700/50 sticky top-0 z-50 transition-colors duration-300">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <h1 
                            className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
                            style={siteNameStyle}
                        >
                            {settings.siteName}
                        </h1>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-center space-x-4">
                            {baseNavItems.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setCurrentPage(item)}
                                    className={getNavItemClasses(item)}
                                >
                                    {item}
                                </button>
                            ))}
                            {settings.enablePoints !== false && (
                                <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1.5 rounded-full">
                                    <span className="font-bold text-sm text-emerald-800 dark:text-emerald-200">{currentUser.points}</span>
                                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">point</span>
                                </div>
                            )}
                             <button onClick={toggleTheme} className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200" aria-label="Skift tema">
                                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                            </button>
                            <button onClick={onLogout} className="text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                                Log ud
                            </button>
                        </div>
                    </div>
                    <div className="md:hidden flex items-center gap-2">
                        {settings.enablePoints !== false && (
                            <div className="flex-shrink-0 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-1 rounded-full text-xs">
                                <span>{currentUser.points} Point</span>
                            </div>
                        )}
                        <button onClick={toggleTheme} className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200" aria-label="Skift tema">
                            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                        </button>
                         <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200" aria-controls="mobile-menu" aria-expanded={isMenuOpen}>
                            <span className="sr-only">Åbn menu</span>
                            {isMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </nav>
            {isMenuOpen && (
                <div className="md:hidden" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {baseNavItems.map((item) => (
                            <button
                                key={item}
                                onClick={() => {
                                    setCurrentPage(item);
                                    setIsMenuOpen(false);
                                }}
                                className={getMobileNavItemClasses(item)}
                                aria-current={item === currentPage ? 'page' : undefined}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                    <div className="pt-3 pb-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="px-2 space-y-1">
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                                Log ud
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
