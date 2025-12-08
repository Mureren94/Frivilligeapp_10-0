import React, { useState } from 'react';
import type { PasswordResetToken } from '../types';

interface ResetPasswordPageProps {
    onReset: (email: string, newPass: string) => boolean;
    tokenData: PasswordResetToken;
    onResetSuccess: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onReset, tokenData, onResetSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Adgangskoden skal være på mindst 6 tegn.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Adgangskoderne er ikke ens.');
            return;
        }

        const result = onReset(tokenData.email, password);
        if (result) {
            setSuccess(true);
            onResetSuccess();
        } else {
            setError('Noget gik galt. Prøv venligst igen.');
        }
    };
    
    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
                <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg text-center">
                     <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Success!</h1>
                    <p className="text-slate-700 dark:text-slate-300">Din adgangskode er blevet ændret. Omdirigerer til login...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold text-center text-emerald-600 dark:text-emerald-400">Nulstil Adgangskode</h1>
                    <p className="mt-2 text-sm text-center text-slate-600 dark:text-slate-300">Opret en ny adgangskode for {tokenData.email}</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-sm text-center text-rose-500 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-md">{error}</p>}
                    <div>
                        <div>
                            <label htmlFor="new-password"className="sr-only">Ny adgangskode</label>
                            <input
                                id="new-password"
                                name="password"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-700 rounded-t-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                                placeholder="Ny adgangskode"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password"className="sr-only">Bekræft adgangskode</label>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-700 rounded-b-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                                placeholder="Bekræft adgangskode"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-800 transition-colors"
                        >
                            Gem ny adgangskode
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};