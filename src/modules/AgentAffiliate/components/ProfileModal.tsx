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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-hidden">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="relative h-32 bg-gradient-to-r from-teal-500 to-blue-600">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all hover:rotate-90"
                    >
                        <XIcon className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden shadow-lg relative group">
                            {(profile?.avatar_url || user?.user_metadata?.avatar_url) && !imgError ? (
                                <img
                                    src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <DefaultAvatarIcon className="w-20 h-20 text-gray-300" />
                            )}

                            {/* Status Badge Overlay - Small and positioned correctly bottom-right */}
                            <div className="absolute bottom-1 right-1 z-10 transition-transform group-hover:scale-110">
                                <Badge
                                    state={
                                        profile?.onboarding_status === 'id_verified' ? 'blue' :
                                            profile?.onboarding_status === 'basic_verified' ? 'mustard' :
                                                'grey'
                                    }
                                    className="!p-1 shadow-lg ring-2 ring-white dark:ring-gray-800"
                                    showLabel={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="pt-16 pb-8 px-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {profile?.company_name || user?.email}
                    </p>

                    {/* Verification Status & Profile Edit Section - Clean horizontal layout */}
                    <div className="mb-6 px-6 py-5 bg-teal-50/20 dark:bg-teal-900/10 rounded-3xl border border-teal-100/50 dark:border-teal-900/30 text-left">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-teal-600" />
                            <h3 className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Verification Status</h3>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex-shrink-0">
                                <Badge
                                    state={
                                        profile?.onboarding_status === 'id_verified' ? 'blue' :
                                            profile?.onboarding_status === 'basic_verified' ? 'mustard' :
                                                'grey'
                                    }
                                    showLabel={true}
                                />
                            </div>
                            <button
                                onClick={() => setIsOnboardingOpen(true)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white text-xs font-black rounded-xl hover:bg-teal-700 shadow-md transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Settings className="w-4 h-4" />
                                Edit Onboarding
                            </button>
                        </div>
                        <p className="mt-3 text-[10px] text-gray-500 font-medium italic text-center leading-normal px-4">
                            Keep your profile verified to build high trust and gain 2x platform priority.
                        </p>
                    </div>

                    {/* Subscription Details */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-left">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Subscription</h3>
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${subscription?.tier_name === 'pro' || subscription?.tier_name === 'custom' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'}`}>
                                {subInfo.status}
                            </span>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Current Plan</span>
                                <span className="font-medium text-gray-900 dark:text-white">{subInfo.plan}</span>
                            </div>
                            {subscription?.current_period_end && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Renews On</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{subInfo.renewalDate}</span>
                                </div>
                            )}
                        </div>

                        {/* Usage Stats - Show for all tiers except maybe custom/unlimited */}
                        {quotaLimit > 0 && (
                            <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-gray-500">Daily Messages via Agent</span>
                                    <span className="font-bold text-gray-700 dark:text-gray-300">
                                        {dailyUsage} / {quotaLimit}
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${dailyUsage >= quotaLimit ? 'bg-red-500' : 'bg-teal-500'}`}
                                        style={{ width: `${Math.min((dailyUsage / quotaLimit) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-bold text-gray-500 mb-1">Included Features:</p>
                            {subInfo.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <CheckCircle className="w-3 h-3 text-teal-500" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Generic Upgrade/Manage Button */}
                    <button
                        onClick={() => {
                            onClose();
                            navigate('/agent-portal/subscription');
                        }}
                        className="mt-6 w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform"
                    >
                        {subscription?.tier_name === 'custom' || subscription?.tier_name === 'pro' ? 'Manage Subscription' : 'Upgrade Plan'}
                    </button>
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
