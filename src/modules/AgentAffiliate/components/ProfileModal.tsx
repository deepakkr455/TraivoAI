import React, { useState, useEffect } from 'react';
import { XIcon, UserCircleIcon, CheckCircleIcon, ClockIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { affiliateSubscriptionService } from '../services/subscriptionService';
import { AgentTier } from '../types';


interface ProfileModalProps {
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
    const { user, profile, subscription } = useAuth();
    const navigate = useNavigate();
    const [dailyUsage, setDailyUsage] = useState(0);
    const [tiers, setTiers] = useState<AgentTier[]>([]);
    const [loading, setLoading] = useState(true);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="relative h-32 bg-gradient-to-r from-teal-500 to-blue-600">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircleIcon className="w-20 h-20 text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="pt-16 pb-8 px-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {profile?.company_name || user?.email}
                    </p>

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
                                    <CheckCircleIcon className="w-3 h-3 text-teal-500" />
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
        </div>
    );
};
