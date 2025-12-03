import React, { useState } from 'react';

interface ForgotPasswordPageProps {
    onRequest: (email: string) => 'success';
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onRequest }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !email.includes('@')) {
            setError('Indtast venligst en gyldig email-adresse.');
            return;
        }

        onRequest(email);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
                <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg text-center">
                     <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Tjek din indbakke</h1>
                    <p className="text-slate-700 dark:text-slate-300">Hvis en konto er tilknyttet {email}, er der blevet genereret et link til nulstilling af din adgangskode.</p>
                    <a href="#" onClick={() => window.location.hash = ''} className="inline-block mt-4 text-emerald-600 dark:text-emerald-400 hover:underline">Tilbage til login</a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold text-center text-emerald-600 dark:text-emerald-400">Glemt Adgangskode?</h1>
                    <p className="mt-2 text-sm text-center text-slate-600 dark:text-slate-300">Indtast din email, så sender vi dig et link til at nulstille din adgangskode.</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-sm text-center text-rose-500 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-md">{error}</p>}
                    <div>
                        <label htmlFor="email-address-forgot" className="sr-only">Email address</label>
                        <input
                            id="email-address-forgot"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                            placeholder="Email"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-800 transition-colors"
                        >
                            Send Nulstillingslink
                        </button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <a href="#" onClick={() => window.location.hash = ''} className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-500">
                        Tilbage til login
                    </a>
                </div>
            </div>
        </div>
    );
};
