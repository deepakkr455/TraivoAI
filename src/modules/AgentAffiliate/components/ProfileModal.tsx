import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { affiliateSubscriptionService } from '../services/subscriptionService';
import { XIcon, DefaultAvatarIcon } from './Icons';
import { AgentTier } from '../types';
import { updateOnboardingStatus } from '../services/supabaseService';
import { Badge } from './Badge';
import { OnboardingModal } from './onboarding/OnboardingModal';
import { Shield, Settings, CheckCircle } from 'lucide-react';


interface ProfileModalProps {
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
    const { user, profile, subscription } = useAuth();
    const navigate = useNavigate();
    const [dailyUsage, setDailyUsage] = useState(0);
    const [tiers, setTiers] = useState<AgentTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const { refreshSession } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (user?.id) {
                const [usage, availableTiers] = await Promise.all([
                    affiliateSubscriptionService.getDailyMessageCount(user.id),
                    affiliateSubscriptionService.fetchTiers()
                ]);
                setDailyUsage(usage);
                setTiers(availableTiers);
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id]);

    const currentTier = tiers.find(t => t.name === subscription?.tier_name) || tiers.find(t => t.name === 'base');

    const subInfo = {
        plan: (subscription?.tier_name || 'base').charAt(0).toUpperCase() + (subscription?.tier_name || 'base').slice(1),
        status: subscription?.status || 'Active',
        renewalDate: subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'Never',
        features: currentTier?.name === 'pro'
            ? ['Advanced Analytics', 'Unlimited Listings', 'Priority Support', 'AI Content Generation']
            : currentTier?.name === 'standard'
                ? ['Standard Analytics', '60 Listings', 'Priority Inquiries', 'Weekly Recommendations']
                : ['Basic Analytics', '30 Listings', 'Queued Inquiries']
    };

    const quotaLimit = currentTier?.daily_quota || 20; // Default to base if not found

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Modal Content Card */}
            <div className="relative w-full max-w-[520px] bg-white dark:bg-background-dark shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-300">

                {/* Header Section */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-background-dark">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-teal-500/20 border border-teal-500/30">
                            <span className="material-symbols-outlined text-lg">travel_explore</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold">TripLister Profile</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
                    >
                        <span className="material-symbols-outlined text-slate-500 group-hover:rotate-90 transition-transform">close</span>
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar">

                    {/* Profile Identity */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="size-24 rounded-full border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                {(profile?.avatar_url || user?.user_metadata?.avatar_url) && !imgError ? (
                                    <img
                                        src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                        <DefaultAvatarIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                                    </div>
                                )}
                            </div>

                            {/* Verification Badge Overlay - Dynamic Color */}
                            {(profile?.onboarding_status === 'id_verified' || profile?.onboarding_status === 'basic_verified' || profile?.onboarding_status === 'id_submitted') && (
                                <div className={`absolute bottom-0 right-0 size-7 ${profile?.onboarding_status === 'id_verified' ? 'bg-teal-600' : 'bg-amber-500'} rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-md`}>
                                    <span className="material-symbols-outlined text-white text-[16px] font-bold fill-1">
                                        {profile?.onboarding_status === 'id_verified' ? 'verified' : 'check_circle'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="text-center">
                            <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">
                                {profile?.full_name || user?.email?.split('@')[0] || 'Agent'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">
                                {profile?.company_name || 'Individual Creator'}
                            </p>
                        </div>
                    </div>

                    {/* Verification Status Card - Redesigned based on code.html */}
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${profile?.onboarding_status === 'id_verified'
                        ? 'border-teal-500/20 bg-teal-500/5'
                        : (profile?.onboarding_status === 'basic_verified' || profile?.onboarding_status === 'id_submitted')
                            ? 'border-amber-400/20 bg-amber-400/5'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30'
                        }`}>
                        <div className="flex gap-3">
                            <div className={`p-2 rounded-lg shrink-0 shadow-inner ${profile?.onboarding_status === 'id_verified' ? 'bg-teal-500/10' :
                                (profile?.onboarding_status === 'basic_verified' || profile?.onboarding_status === 'id_submitted') ? 'bg-amber-500/10' : 'bg-slate-200 dark:bg-slate-800'
                                }`}>
                                <span className={`material-symbols-outlined fill-1 ${profile?.onboarding_status === 'id_verified' ? 'text-teal-600' :
                                    (profile?.onboarding_status === 'basic_verified' || profile?.onboarding_status === 'id_submitted') ? 'text-amber-500' : 'text-slate-400'
                                    }`}>
                                    {profile?.onboarding_status === 'id_verified' ? 'verified_user' : 'shield_person'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${profile?.onboarding_status === 'id_verified' ? 'text-teal-600' :
                                    (profile?.onboarding_status === 'basic_verified' || profile?.onboarding_status === 'id_submitted') ? 'text-amber-600 dark:text-amber-500' : 'text-slate-500'
                                    }`}>
                                    {profile?.onboarding_status === 'id_verified' ? 'Identity Verified' :
                                        (profile?.onboarding_status === 'basic_verified' || profile?.onboarding_status === 'id_submitted') ? 'Basic Verified' : 'Unverified Agent'}
                                </p>
                                <p className="text-slate-700 dark:text-slate-200 text-sm font-bold">
                                    {profile?.onboarding_status === 'id_verified' ? 'Premium Trusted Partner' :
                                        (profile?.onboarding_status === 'basic_verified' || profile?.onboarding_status === 'id_submitted') ? 'Verified Business' : 'Complete Onboarding'}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-tight">
                                    {profile?.onboarding_status === 'id_verified' ? 'Maximum trust signal for all listing interactions.' :
                                        (profile?.onboarding_status === 'basic_verified' || profile?.onboarding_status === 'id_submitted') ? 'Community trust level achieved.' : 'Verify to build trust and gain priority support.'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOnboardingOpen(true)}
                            className={`shrink-0 text-xs font-bold px-4 py-2 rounded-lg transition-all border shadow-sm active:scale-95 ${profile?.onboarding_status === 'id_verified'
                                ? 'text-teal-600 bg-white dark:bg-slate-900 border-teal-500/20 hover:bg-teal-50/50'
                                : 'text-white bg-teal-600 border-transparent hover:bg-teal-700'
                                }`}
                        >
                            {profile?.onboarding_status === 'id_verified' ? 'Review Verification' : 'Edit Onboarding'}
                        </button>
                    </div>

                    {/* Subscription Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-slate-900 dark:text-slate-100 font-bold text-base">Subscription Details</h4>
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                {subInfo.plan}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* Usage Limit Card */}
                            {quotaLimit > 0 && (
                                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 shadow-sm">
                                    <div className="flex justify-between items-end mb-2.5">
                                        <div className="flex flex-col">
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Daily Message Limit</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Refreshes every 24 hours</p>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-slate-900 dark:text-slate-100 text-xl font-bold">{dailyUsage}</span>
                                            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">/ {quotaLimit}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full transition-all duration-1000 ease-out ${dailyUsage >= quotaLimit ? 'bg-red-500' : 'bg-teal-500'
                                                }`}
                                            style={{ width: `${Math.min((dailyUsage / quotaLimit) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    {dailyUsage >= quotaLimit && (
                                        <p className="text-[10px] text-red-500 font-medium mt-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">info</span>
                                            Daily limit reached. Upgrade for more.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Included Features Card */}
                            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 space-y-4 shadow-sm">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Included in your plan</p>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                                    {subInfo.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                            <div className="size-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-green-500 text-[14px] font-bold">check</span>
                                            </div>
                                            <span className="font-medium">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Section */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-background-dark">
                    <button
                        onClick={() => {
                            onClose();
                            navigate('/agent-portal/subscription');
                        }}
                        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-[0.98] transform hover:translate-y-[-1px]"
                    >
                        <span className="material-symbols-outlined text-[20px] font-bold">
                            {subscription?.tier_name === 'pro' || subscription?.tier_name === 'custom' ? 'settings' : 'upgrade'}
                        </span>
                        {subscription?.tier_name === 'pro' || subscription?.tier_name === 'custom' ? 'Manage Subscription' : 'Upgrade Your Plan'}
                    </button>
                    <p className="text-center text-slate-400 dark:text-slate-500 text-[11px] mt-4 font-medium italic">
                        Unlock higher limits and advanced marketplace features with a Premium plan.
                    </p>
                </div>
            </div>

            {/* Full Onboarding Form Modal Overlay */}
            {isOnboardingOpen && user?.id && (
                <OnboardingModal
                    businessId={user.id}
                    profile={profile}
                    onClose={() => setIsOnboardingOpen(false)}
                    onComplete={async () => {
                        await refreshSession();
                        setIsOnboardingOpen(false);
                    }}
                />
            )}
        </div>
    );
};

