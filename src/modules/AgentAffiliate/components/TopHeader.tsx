import React, { useState } from 'react';
import { LayoutIcon, ChartBarIcon, MessageSquareIcon, GlobeIcon, WalletIcon, MapIcon, MenuIcon, XIcon, UserIcon, DefaultAvatarIcon, ClockIcon } from './Icons';
import { useAgentData } from '../context/AgentDataContext';
import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

export const TopHeader: React.FC = () => {
    const { user, profile, subscription, signOut } = useAuth();
    const { isMobileHistoryOpen, setIsMobileHistoryOpen } = useAgentData();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [imgError, setImgError] = useState(false);

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
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-[70] h-16 flex-shrink-0 relative">
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
                <div className="flex items-center gap-4 relative">
                    {/* User Profile & Status Section */}
                    <div className="flex items-center gap-6">
                        {/* Premium Status Badge Pill */}
                        {profile?.onboarding_status === 'id_verified' && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-full">
                                <span className="material-symbols-outlined text-primary !text-[18px] fill-1">verified</span>
                                <span className="text-primary text-xs font-bold uppercase tracking-wider">
                                    Premium Trusted
                                </span>
                            </div>
                        )}
                        {(profile?.onboarding_status === 'basic_verified' || profile?.onboarding_status === 'id_submitted') && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 rounded-full">
                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 !text-[18px] fill-1">verified</span>
                                <span className="text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                                    Basic Verified
                                </span>
                            </div>
                        )}

                        {/* User Profile Section */}
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col items-end hidden md:flex">
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">
                                    {profile?.full_name || user?.user_metadata?.full_name || 'User'}
                                </span>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tight">
                                    {planDisplayName}
                                </span>
                            </div>

                            {/* Profile Picture with Overlapping Badge */}
                            <div className="relative group cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                <div className="size-11 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden bg-slate-200">
                                    {(profile?.avatar_url || user?.user_metadata?.avatar_url) ? (
                                        <img
                                            src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <UserIcon className="w-6 h-6 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                                {/* Small Elegant Status Badge Overlay */}
                                {profile?.onboarding_status === 'id_verified' && (
                                    <div className="absolute -bottom-0.5 -right-0.5 size-4 bg-primary rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined !text-[10px] text-white font-bold fill-1">check</span>
                                    </div>
                                )}
                                {(profile?.onboarding_status === 'basic_verified' || profile?.onboarding_status === 'id_submitted') && (
                                    <div className="absolute -bottom-0.5 -right-0.5 size-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined !text-[10px] text-white font-bold fill-1">check</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="ml-1 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">expand_more</span>
                            </button>
                        </div>
                    </div>

                    {/* Profile Dropdown Menu */}
                    {isProfileOpen && (
                        <>
                            <div className="fixed inset-0 z-[80]" onClick={() => setIsProfileOpen(false)} />
                            <div className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-[90] transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile?.full_name || user?.email || 'User'}</p>
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
                                        <span className="w-4 h-4 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold">?</span> Help & Support
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

                {/* Mobile History Toggle (Only on Creator Page) */}
                {location.pathname === '/agent-portal/creator' && (
                    <button
                        onClick={() => setIsMobileHistoryOpen(!isMobileHistoryOpen)}
                        className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        title="View Chat History"
                    >
                        <ClockIcon className="w-6 h-6" />
                    </button>
                )}

                {/* Mobile Menu Toggle */}
                <button
                    className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
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
