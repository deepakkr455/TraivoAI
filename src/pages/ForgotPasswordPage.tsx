import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Logo from '../components/Logo';
import LoadingSpinner from '../components/LoadingSpinner';

type ResetStep = 'request' | 'verify';

const ForgotPasswordPage: React.FC = () => {
    const [step, setStep] = useState<ResetStep>('request');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { requestPasswordResetOTP, verifyOTPAndResetPassword } = useAuth();
    const navigate = useNavigate();

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await requestPasswordResetOTP(email);
            setStep('verify');
            setLoading(false);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset code. Please try again.');
            setLoading(false);
        }
    };

    const handleVerifyAndReset = async (e: React.FormEvent) => {
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
            await verifyOTPAndResetPassword(email, otp, password);
            setLoading(false);
            navigate('/login', {
                replace: true,
                state: { message: 'Your password has been successfully reset. Please log in with your new password.' }
            });
        } catch (err: any) {
            setError(err.message || 'Failed to update password. Please check your code and try again.');
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
                        <h1 className="text-2xl font-bold text-gray-800">
                            {step === 'request' ? 'Forgot Password' : 'Verify Code'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-2">
                            {step === 'request'
                                ? 'Enter your email to receive a 6-digit reset code.'
                                : `Enter the code sent to ${email}`}
                        </p>
                    </div>

                    {step === 'request' ? (
                        <form onSubmit={handleRequestOTP} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all sm:text-sm"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 transition-all active:scale-95"
                            >
                                {loading ? <LoadingSpinner /> : 'Send Reset Code'}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-sm font-medium text-teal-600 hover:text-teal-500">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyAndReset} className="space-y-5">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-semibold text-gray-700">Reset Code</label>
                                <input
                                    id="otp"
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-center text-2xl font-bold tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                    placeholder="000000"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">New Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all sm:text-sm"
                                    placeholder="New password (min. 6 chars)"
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
                                    placeholder="Confirm new password"
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

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep('request')}
                                    className="text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors"
                                >
                                    Didn't get a code? Try again
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
