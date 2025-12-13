import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';


interface LoginPageProps {
    onLogin: (email: string, password: string, remember: boolean) => Promise<boolean>;
    onLoginSuccess: () => void;
    message?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onLoginSuccess, message }) => {
    const { settings } = useData();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            await onLogin(email, password, rememberMe);
            onLoginSuccess();
        } catch (err: any) {
            console.error("Login error caught in page:", err);
            // Vis den specifikke fejlbesked fra backend (f.eks. "Forkert adgangskode")
            setError(err.message || 'Der skete en fejl under login.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold text-center text-emerald-600 dark:text-emerald-400">{settings.siteName}</h1>
                    <h2 className="mt-2 text-lg text-center text-slate-600 dark:text-slate-300">Log ind for at fortsætte</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-sm text-center text-rose-500 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-md">{error}</p>}
                    {message && <p className="text-sm text-center text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-md">{message}</p>}

                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-700 rounded-t-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                                placeholder="Email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="sr-only">Password</label>
                            <input
                                id="password-input"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-700 rounded-b-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                                placeholder="Adgangskode"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Husk mig
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="#forgot-password" className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-500">
                                Glemt adgangskode?
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-800 transition-colors"
                        >
                            Log ind
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};