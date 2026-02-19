
import React, { useState, useEffect, useMemo } from 'react';
import { XIcon, CheckCircleIcon, RocketIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { affiliateSubscriptionService } from '../services/subscriptionService';
import { AgentTier, AgentFeature } from '../types';
import PayUForm from '../../../components/PayUForm';
import { Loader2, Sparkles } from 'lucide-react';

interface SubscriptionModalProps {
    onClose: () => void;
}

interface PendingPayment {
    amount: number;
    planName: string;
    billingCycle: string;
    txnid: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose }) => {
    const { user, profile, subscription } = useAuth();
    const [tiers, setTiers] = useState<AgentTier[]>([]);
    const [features, setFeatures] = useState<AgentFeature[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [availableTiers, availableFeatures] = await Promise.all([
                    affiliateSubscriptionService.fetchTiers(),
                    affiliateSubscriptionService.fetchFeatures()
                ]);

                // Default tiers if DB is empty (matching SubscriptionPage.tsx)
                const defaultTiers: AgentTier[] = [
                    { id: 'base-default', name: 'base', daily_quota: 0, query_daily_quota: 20, listings_quota: 30, leads_quota: 3, monthly_price: 0, quarterly_price: 0, yearly_price: 0, created_at: new Date().toISOString() },
                    { id: 'standard-default', name: 'standard', daily_quota: 0, query_daily_quota: 100, listings_quota: 60, leads_quota: 50, monthly_price: 499, quarterly_price: 1347.3, yearly_price: 4790, created_at: new Date().toISOString() },
                    { id: 'pro-default', name: 'pro', daily_quota: 0, query_daily_quota: 200, listings_quota: -1, leads_quota: -1, monthly_price: 999, quarterly_price: 2697.3, yearly_price: 9590, created_at: new Date().toISOString() }
                ];

                setTiers(availableTiers.length > 0 ? availableTiers : defaultTiers);
                setFeatures(availableFeatures);
            } catch (error) {
                console.error('Error fetching tiers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const sortedTiers = useMemo(() => {
        return tiers.filter(t => t.name !== 'custom').sort((a, b) => a.monthly_price - b.monthly_price);
    }, [tiers]);

    const getTierFeatures = (tier: AgentTier) => {
        const tierFeatures = features.filter(f =>
            f.tier_name === tier.name &&
            !['query', 'customer_inquiries', 'listings'].includes(f.feature_key)
        );

        const mapped = tierFeatures.map(f => `${f.feature_label}: ${f.control_value}`);

        const listingsValue = tier.listings_quota === -1 ? 'Unlimited' : `${tier.listings_quota}`;
        mapped.unshift(`Listings: ${listingsValue}`);

        const leadsDisplay = tier.leads_quota === -1 ? 'Unlimited' : `${tier.leads_quota} Leads`;
        mapped.push(`Customer Inquiries: ${leadsDisplay}`);

        return mapped;
    };

    const handleUpgrade = async (tier: AgentTier) => {
        if (!user) return;
        if (subscription?.tier_name === tier.name) return;

        const price = tier.monthly_price;

        if (price === 0 || tier.name === 'base') {
            setUpdating(true);
            try {
                await affiliateSubscriptionService.updateUserSubscription(user.id, tier.name);
                onClose();
                window.location.reload(); // Refresh to update context
            } catch (error) {
                console.error('Failed to upgrade:', error);
            } finally {
                setUpdating(false);
            }
            return;
        }

        const txnid = `txn_${Date.now()}`;
        setPendingPayment({
            amount: price,
            planName: tier.name,
            billingCycle: 'monthly',
            txnid
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm font-sans">
            {pendingPayment && user && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <PayUForm
                        amount={pendingPayment.amount}
                        productInfo={`Affiliate Subscription: ${pendingPayment.planName} (monthly)`}
                        firstName={(profile?.full_name || user?.email || 'Agent').split(' ')[0]}
                        email={user.email || ''}
                        phone={'9999999999'}
                        txnid={pendingPayment.txnid}
                        surl={`${window.location.origin}/#/payment-status`}
                        furl={`${window.location.origin}/#/payment-status`}
                        udf2={user.id}
                        udf3={pendingPayment.planName}
                        udf4="affiliate"
                        udf5="monthly"
                    />
                    <button onClick={() => setPendingPayment(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 font-bold">✕ Cancel</button>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col border border-gray-200 dark:border-gray-800">
                <header className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 dark:bg-teal-900 p-2 rounded-lg text-teal-600">
                            <RocketIcon />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Boost Your Listings</h2>
                            <p className="text-sm text-gray-500">Unlock premium features and reach more travelers.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <XIcon />
                    </button>
                </header>

                <div className="p-8">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {sortedTiers.map((tier, idx) => {
                                const isActive = subscription?.tier_name === tier.name;
                                const isPro = tier.name === 'pro';

                                return (
                                    <div key={idx} className={`relative p-6 rounded-2xl border transition-all duration-300 ${isActive ? 'border-2 border-teal-500 ring-4 ring-teal-500/10 shadow-xl scale-105 z-10' : 'border-gray-200 dark:border-gray-700 shadow-sm'} ${isPro && !isActive ? 'bg-teal-50/10' : 'bg-white dark:bg-gray-800'} flex flex-col`}>
                                        {isPro && !isActive && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" /> Recommended
                                            </div>
                                        )}
                                        {isActive && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                                Current Plan
                                            </div>
                                        )}
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">{tier.name}</h3>
                                        <div className="my-4">
                                            <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">₹{tier.monthly_price}</span>
                                            <span className="text-gray-500 text-sm ml-1">/mo</span>
                                        </div>
                                        <ul className="space-y-3 mb-8 flex-1">
                                            {getTierFeatures(tier).map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    <span className="text-teal-500 mt-0.5"><CheckCircleIcon className="w-4 h-4" /></span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => handleUpgrade(tier)}
                                            disabled={isActive || updating}
                                            className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${isActive ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 shadow-lg active:scale-95'} ${updating ? 'opacity-50' : ''}`}
                                        >
                                            {updating ? 'Processing...' : (isActive ? 'Active' : 'Upgrade Now')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
