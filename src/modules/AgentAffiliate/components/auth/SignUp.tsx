
import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { supabase } from '../../services/supabaseService';

import { LoadingIcon } from '../Icons';

interface SignUpProps {
    onNavigateToSignIn: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onNavigateToSignIn }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        userType: 'agent',
        companyName: '',
        companySize: '1-10',
        companyWebsite: '',
        instagramPageId: '',
        facebookId: '',
        phoneNumber: '',
        alternativeNumber: '',
        city: '',
        state: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const signUpOptions = {
                emailRedirectTo: window.location.origin,
                data: {
                    full_name: formData.fullName,
                    user_type: formData.userType,
                    company_name: formData.companyName,
                    company_size: formData.companySize,
                    company_website: formData.companyWebsite,
                    instagram_page_id: formData.instagramPageId,
                    facebook_id: formData.facebookId,
                    phone_number: formData.phoneNumber,
                    alternative_number: formData.alternativeNumber,
                    city: formData.city,
                    state: formData.state
                }
            };

            console.log('🚀 Sending Sign Up Request to Supabase:', {
                email: formData.email,
                options: signUpOptions
            });

            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: signUpOptions
            });

            console.log('✅ Supabase Sign Up Response:', { data, error });

            if (error) throw error;

            // If signup is successful, check if session is established
            if (data.session) {
                // User is logged in immediately (Email confirmation disabled)
                // Trigger handles profile creation
            } else if (data.user) {
                // User created but email confirmation required
                setSuccess(true);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Start listing your travel packages with AI assistance."
        >
            <div className="mt-8">
                {/* Social Auth */}
                <div>
                    <button
                        onClick={handleGoogleSignUp}
                        className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                        </svg>
                        <span className="ml-2">Sign up with Google</span>
                    </button>
                </div>

                <div className="mt-6 relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with email</span>
                    </div>
                </div>

                {success ? (
                    <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Account Created!</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            We've sent a confirmation link to <strong>{formData.email}</strong>.<br />
                            Please check your email to activate your account.
                        </p>
                        <button
                            onClick={onNavigateToSignIn}
                            className="text-teal-600 hover:text-teal-500 font-medium"
                        >
                            Return to Sign In
                        </button>
                    </div>
                ) : (
                    <form className="mt-8 space-y-8" onSubmit={handleSignUp}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Personal Details</h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input id="fullName" name="fullName" type="text" required value={formData.fullName} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                                    <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                    <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Company Information</h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="userType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a</label>
                                    <select id="userType" name="userType" value={formData.userType} onChange={handleChange} className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow">
                                        <option value="agent">Travel Agent</option>
                                        <option value="agency">Travel Agency</option>
                                        <option value="affiliate_partner">Affiliate Partner</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Size</label>
                                    <select id="companySize" name="companySize" value={formData.companySize} onChange={handleChange} className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow">
                                        <option value="1-10">1-10 Employees</option>
                                        <option value="11-50">11-50 Employees</option>
                                        <option value="51-200">51-200 Employees</option>
                                        <option value="200+">200+ Employees</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                                    <input id="companyName" name="companyName" type="text" value={formData.companyName} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Website</label>
                                    <input id="companyWebsite" name="companyWebsite" type="url" placeholder="https://example.com" value={formData.companyWebsite} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Social & Contact</h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="instagramPageId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instagram Page ID</label>
                                    <input id="instagramPageId" name="instagramPageId" type="text" placeholder="@username" value={formData.instagramPageId} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>
                                <div>
                                    <label htmlFor="facebookId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook ID</label>
                                    <input id="facebookId" name="facebookId" type="text" placeholder="username" value={formData.facebookId} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>

                                <div>
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                    <input id="phoneNumber" name="phoneNumber" type="tel" required value={formData.phoneNumber} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>
                                <div>
                                    <label htmlFor="alternativeNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alternative Number</label>
                                    <input id="alternativeNumber" name="alternativeNumber" type="tel" value={formData.alternativeNumber} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>

                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                    <input id="city" name="city" type="text" required value={formData.city} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                                    <input id="state" name="state" type="text" required value={formData.state} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm dark:bg-gray-800 dark:text-white transition-shadow" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01]"
                            >
                                {loading ? <LoadingIcon className="w-5 h-5 text-white" /> : 'Create Account'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <button onClick={onNavigateToSignIn} className="font-medium text-teal-600 hover:text-teal-500">
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};
