
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { TopHeader } from '../components/TopHeader';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AgentDataProvider } from '../context/AgentDataContext';
import { LoadingIcon } from '../components/Icons';
import { SignIn } from '../components/auth/SignIn';
import { SignUp } from '../components/auth/SignUp';

const AuthenticatedLayout: React.FC = () => {
    const { session, loading } = useAuth();
    const [authView, setAuthView] = React.useState<'signin' | 'signup'>('signin');

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <LoadingIcon className="w-10 h-10 text-teal-600" />
            </div>
        );
    }

    if (!session) {
        return authView === 'signin' ? (
            <SignIn onNavigateToSignUp={() => setAuthView('signup')} />
        ) : (
            <SignUp onNavigateToSignIn={() => setAuthView('signin')} />
        );
    }

    return (
        <AgentDataProvider>
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-white overflow-hidden">
                <TopHeader />
                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </div>
        </AgentDataProvider>
    );
};

export const AgentLayout: React.FC = () => {
    return (
        <AuthProvider>
            <AuthenticatedLayout />
        </AuthProvider>
    );
};
