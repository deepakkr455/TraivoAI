import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Logo from '../components/Logo';
import LoadingSpinner from '../components/LoadingSpinner';

const ResetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { updatePassword, loading: authLoading, user } = useAuth();
    const navigate = useNavigate();

    // Redirect to login if not authenticated after loading
    useEffect(() => {
        // Double check the hash in case App.tsx didn't catch it or for direct landing
        const hash = window.location.hash;
        if (hash.includes('access_token') && hash.includes('type=recovery')) {
            console.log('Recovery session detected in hash');
        }
    }, [authLoading, user]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 text-teal-600">
                <LoadingSpinner />
                <span className="ml-2">Verifying session...</span>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await updatePassword(password);
            setLoading(false);
            navigate('/login', {
                replace: true,
                state: { message: 'Your password has been successfully reset. Please log in with your new password.' }
            });
        } catch (err: any) {
            setError(err.message || 'Failed to update password. Session might have expired.');
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-white px-4">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
                    <div className="text-center mb-8">
                        <div className="inline-block mb-4 transform hover:scale-105 transition-transform">
                            <Logo />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">New Password</h1>
                        <p className="mt-2 text-gray-600">Secure your account with a new password</p>
                    </div>

                    {!user && !authLoading && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                            <p className="font-semibold mb-1">Session Not Detected</p>
                            <p>If you just clicked a reset link, please wait a moment. If this persists, the link may have expired.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">New Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all sm:text-sm"
                                placeholder="Min. 6 characters"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all sm:text-sm"
                                placeholder="Repeat your password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100 flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 transition-all active:scale-95"
                        >
                            {loading ? <LoadingSpinner /> : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
