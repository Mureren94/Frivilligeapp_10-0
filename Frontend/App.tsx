import React, { useState, useEffect } from 'react';
import type { Page } from './types';
import { DataProvider, useData } from './contexts/DataContext';
import { Header } from './components/Header';
import { TaskListPage } from './components/TaskListPage';
import { ProfilePage } from './components/ProfilePage';
import { LeaderboardPage } from './components/LeaderboardPage';
import { AdminPage } from './components/AdminPage';
import { LoginPage } from './components/LoginPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { DashboardPage } from './components/DashboardPage';
import { Toaster } from 'react-hot-toast';
import { ShiftCalendarPage } from './components/ShiftCalendarPage';

const InvalidTokenPage: React.FC = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="w-full max-w-md p-8 space-y-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg text-center">
            <h1 className="text-2xl font-bold text-rose-600 dark:text-rose-400">Ugyldigt Link</h1>
            <p className="text-slate-600 dark:text-slate-300">Dette link til nulstilling af adgangskode er ugyldigt eller udløbet. Prøv venligst igen.</p>
            <a href="#" onClick={() => window.location.hash = ''} className="inline-block mt-4 text-emerald-600 dark:text-emerald-400 hover:underline">Tilbage til login</a>
        </div>
    </div>
);


const AppContent: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
    const { 
        settings, 
        theme, 
        passwordResetTokens, 
        handlePasswordReset, 
        handleForgotPasswordRequest,
        handleLogin,
        handleLogout,
        currentUser,
        userHasPermission
    } = useData();

    // State for "routing"
    const [view, setView] = useState<{page: 'app' | 'reset-password' | 'forgot-password', token?: string}>({page: 'app'});
    const [loginMessage, setLoginMessage] = useState('');

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        // Update page title
        document.title = settings.siteName;

        // Update favicon
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        if(settings.siteIcon) {
            link.href = settings.siteIcon;
        } else {
            link.removeAttribute('href');
        }
    }, [settings]);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#reset-password')) {
                const params = new URLSearchParams(hash.split('?')[1]);
                const token = params.get('token');
                if (token) {
                    setView({ page: 'reset-password', token });
                }
            } else if (hash.startsWith('#forgot-password')) {
                setView({ page: 'forgot-password' });
            } else {
                setView({ page: 'app' });
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial check

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const onLoginSuccess = () => {
        setCurrentPage('Dashboard');
        setLoginMessage('');
    }

    const onLogout = () => {
        handleLogout(() => setCurrentPage('Opgaveliste'));
    };
    
    const onPasswordResetSuccess = () => {
        setLoginMessage('Adgangskode er opdateret! Du kan nu logge ind.');
        window.location.hash = '';
    }

    // --- Page Rendering Logic ---
    if (view.page === 'reset-password' && view.token) {
        const tokenData = passwordResetTokens.find(t => t.token === view.token && t.expires > Date.now());
        if (tokenData) {
            return <ResetPasswordPage tokenData={tokenData} onReset={handlePasswordReset} onResetSuccess={onPasswordResetSuccess} />;
        } else {
            return <InvalidTokenPage />;
        }
    }

    if (view.page === 'forgot-password') {
        return <ForgotPasswordPage onRequest={handleForgotPasswordRequest} />;
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} onLoginSuccess={onLoginSuccess} message={loginMessage} />;
    }
    
    const renderPage = () => {
        switch (currentPage) {
            case 'Dashboard':
                return <DashboardPage setCurrentPage={setCurrentPage} />;
            case 'Opgaveliste':
                return <TaskListPage />;
            case 'Vagtplan':
                return <ShiftCalendarPage />;
            case 'Min Profil':
                return <ProfilePage />;
            case 'Leaderboard':
                return <LeaderboardPage />;
            case 'Admin':
                 if (userHasPermission('access_admin_panel')) {
                    return <AdminPage />;
                }
                return null;
            default:
                return <DashboardPage setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onLogout={onLogout}
            />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderPage()}
            </main>
        </div>
    );
};

const App: React.FC = () => (
    <DataProvider>
        <Toaster position="top-center" toastOptions={{
            className: 'dark:bg-slate-700 dark:text-slate-100',
        }}/>
        <AppContent />
    </DataProvider>
);


export default App;