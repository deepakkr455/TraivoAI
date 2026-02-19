import React, { useState } from 'react';
import { LayoutIcon, ChartBarIcon, MessageSquareIcon, GlobeIcon, WalletIcon, MapIcon, MenuIcon, XIcon, UserIcon } from './Icons';
import { useAuth } from '../context/AuthContext';

import { NavLink, useNavigate, useLocation } from 'react-router-dom';

export const TopHeader: React.FC = () => {
    const { user, profile, subscription, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const planDisplayName = subscription?.tier_name
        ? subscription.tier_name.charAt(0).toUpperCase() + subscription.tier_name.slice(1) + ' Plan'
        : 'Free Plan';

    const menuItems = [
        { id: 'creator', label: 'AI Creator', icon: <LayoutIcon />, path: '/agent-portal/creator' },
        { id: 'dashboard', label: 'Dashboard', icon: <ChartBarIcon />, path: '/agent-portal/dashboard' },
        ...(profile?.user_type === 'affiliate_partner'
            ? [{ id: 'affiliate-gallery', label: 'Affiliate Gallery', icon: <MapIcon />, path: '/agent-portal/affiliate-gallery' }]
            : [
                { id: 'gallery', label: 'Listing Gallery', icon: <MapIcon />, path: '/agent-portal/gallery' },
                // { id: 'bookings', label: 'Bookings', icon: <WalletIcon />, path: '/agent-portal/bookings' },
                { id: 'messages', label: 'Messages', icon: <MessageSquareIcon />, path: '/agent-portal/messages' }
            ]
        ),
    ];

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40 h-16 flex-shrink-0 relative">
            <div className="max-w-screen-2xl mx-auto px-4 h-full flex items-center justify-between">

                {/* Logo Area */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/agent-portal/creator')}>
                    <div className="text-teal-500 w-8 h-8">
                        <GlobeIcon />
                    </div>
                    <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                        TripLister
                    </span>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                    {menuItems.map((item) => {
                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                    ${isActive
                                        ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                                    }
                                `}
                            >
                                <span className="w-4 h-4">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>


                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-full transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center font-bold text-sm text-white shadow-md">
                                {user?.email?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="hidden md:block text-left mr-1">
                                <p className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 leading-tight">
                                    {profile?.full_name?.split(' ')[0] || 'User'}
                                </p>
                                <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                    {planDisplayName}
                                </p>
                            </div>
                        </button>

                        {/* Profile Dropdown Menu */}
                        {isProfileOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-40 transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile?.full_name || user?.email}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                                    </div>

                                    <button
                                        onClick={() => { navigate('/agent-portal/profile'); setIsProfileOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                                    >
                                        <UserIcon className="w-4 h-4" /> Profile Settings
                                    </button>

                                    {profile?.user_type === 'affiliate_partner' && (
                                        <button
                                            onClick={() => { navigate('/agent-portal/help'); setIsProfileOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                                        >
                                            <span className="w-4 h-4">?</span> Help & Support
                                        </button>
                                    )}

                                    <div className="my-2 border-t border-gray-100 dark:border-gray-800" />

                                    <button
                                        onClick={() => signOut()}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMenuOpen && (
                <div className="lg:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl overflow-y-auto max-h-[calc(100vh-4rem)]">
                    <div className="p-4 space-y-2">


                        {menuItems.map((item) => (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                                    ${isActive
                                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-medium'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }
                                `}
                            >
                                <div className="w-5 h-5">{item.icon}</div>
                                <span className="text-base font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};
