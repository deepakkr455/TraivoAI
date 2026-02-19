import React, { useState, useEffect } from 'react';

const AdminPage: React.FC = () => {
    const [apiKeyStatus, setApiKeyStatus] = useState<'Configured' | 'Not Configured'>('Not Configured');
    const [dbStatus, setDbStatus] = useState<'Configured' | 'Not Configured'>('Not Configured');
    const [tavilyStatus, setTavilyStatus] = useState<'Configured' | 'Not Configured'>('Not Configured');

    useEffect(() => {
        // In a Vite project, env vars are accessed via `import.meta.env`.
        // In a Vite project, env vars are accessed via `import.meta.env`.
        // API Key is now managed by Supabase Edge Functions, so we assume it's configured on the server.
        setApiKeyStatus('Configured');

        // Check for the Supabase URL
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.length > 5) {
            setDbStatus('Configured');
        } else {
            setDbStatus('Not Configured');
        }

        // Tavily is handled by wanderchat-api
        setTavilyStatus('Configured');
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto max-w-4xl px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Control Panel</h1>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">System Configuration</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-700">Gemini API Key</p>
                                <p className="text-sm text-gray-500">
                                    The key for all AI features. Managed securely via Supabase Edge Function `gemini-api`.
                                </p>
                            </div>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${apiKeyStatus === 'Configured'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {apiKeyStatus}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-700">Database Connection</p>
                                <p className="text-sm text-gray-500">
                                    Connection to the Supabase database for the Group Planner feature.
                                </p>
                            </div>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${dbStatus === 'Configured'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {dbStatus}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-700">Tavily Search API</p>
                                <p className="text-sm text-gray-500">
                                    Enables real-time internet search for up-to-date travel info. Managed securely via Supabase Edge Function `wanderchat-api`.
                                </p>
                            </div>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${tavilyStatus === 'Configured'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {tavilyStatus}
                            </span>
                        </div>

                        <div className="p-4 border-l-4 border-yellow-400 bg-yellow-50">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        For security reasons, API keys and database credentials cannot be viewed or changed from this interface. They must be configured in your local .env file.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;