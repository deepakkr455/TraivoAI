
import React from 'react';
import { GlobeIcon } from '../Icons';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen flex bg-white dark:bg-gray-900 font-sans">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2 bg-white dark:bg-gray-900 z-10">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="text-teal-600 dark:text-teal-400">
                            <GlobeIcon className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-2xl tracking-wide text-gray-900 dark:text-white">TripLister</span>
                    </div>

                    <div>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                            {title}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {subtitle}
                        </p>
                    </div>

                    <div className="mt-8">
                        {children}
                    </div>
                </div>
            </div>

            {/* Right Side - Hero Image */}
            <div className="hidden lg:block relative w-0 flex-1">
                <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2021&q=80"
                    alt="Travel Background"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent flex flex-col justify-end p-16 text-white">
                    <blockquote className="max-w-lg">
                        <p className="text-2xl font-medium leading-relaxed mb-4">
                            "TripLister has revolutionized how we manage our travel packages. The AI assistance is a game-changer."
                        </p>
                        <footer className="text-base font-semibold text-teal-300">
                            — Sarah Jenkins, CEO of Wanderlust Travels
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    );
};
