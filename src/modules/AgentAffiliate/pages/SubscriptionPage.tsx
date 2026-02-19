import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { affiliateSubscriptionService } from '../services/subscriptionService';
import { AgentTier, AgentFeature } from '../types';
import PayUForm from '../../../components/PayUForm';

interface PendingPayment {
    amount: number;
    planName: string;
    billingCycle: string;
    txnid: string;
}

type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

const AffiliateSubscriptionPage: React.FC = () => {
    const { user, profile, subscription } = useAuth();
    const navigate = useNavigate();
    const [tiers, setTiers] = useState<AgentTier[]>([]);
    const [features, setFeatures] = useState<AgentFeature[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [updating, setUpdating] = useState(false);
    const [successPlan, setSuccessPlan] = useState<string | null>(null);
    const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [availableTiers, availableFeatures] = await Promise.all([
                    affiliateSubscriptionService.fetchTiers(),
                    affiliateSubscriptionService.fetchFeatures()
                ]);

                // Default tiers if DB is empty
                const defaultTiers: AgentTier[] = [
                    {
                        id: 'base-default',
                        name: 'base',
                        daily_quota: 0,
                        query_daily_quota: 20,
                        listings_quota: 30,
                        leads_quota: 3,
                        monthly_price: 0,
                        quarterly_price: 0,
                        yearly_price: 0,
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'standard-default',
                        name: 'standard',
                        daily_quota: 0,
                        query_daily_quota: 100,
                        listings_quota: 60,
                        leads_quota: 50,
                        monthly_price: 499,
                        quarterly_price: 1347.3,
                        yearly_price: 4790,
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'pro-default',
                        name: 'pro',
                        daily_quota: 0,
                        query_daily_quota: 200,
                        listings_quota: -1,
                        leads_quota: -1,
                        monthly_price: 999,
                        quarterly_price: 2697.3,
                        yearly_price: 9590,
                        created_at: new Date().toISOString()
                    }
                ];

                const finalTiers = availableTiers.length > 0 ? availableTiers : defaultTiers;
                setTiers(finalTiers);
                setFeatures(availableFeatures);

                console.log('--- Affiliate Subscription Data ---');
                console.log('Tiers:', finalTiers);
                console.log('Features:', availableFeatures);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getPrice = (tier: AgentTier) => {
        if (billingCycle === 'monthly') return tier.monthly_price;
        if (billingCycle === 'quarterly') return tier.quarterly_price || 0;
        return tier.yearly_price;
    };

    const getDurationLabel = () => {
        if (billingCycle === 'monthly') return '/ month';
        if (billingCycle === 'quarterly') return '/ quarter';
        return '/ year';
    };

    const sortedTiers = useMemo(() => {
        const standardTiers = tiers.filter(t => t.name !== 'custom').sort((a, b) => a.monthly_price - b.monthly_price);
        const customTier = tiers.find(t => t.name === 'custom');
        return customTier ? [...standardTiers, customTier] : standardTiers;
    }, [tiers]);

    const getTierFeatures = (tier: AgentTier) => {
        // Filter out features handled manually or derived from tier quotas
        const tierFeatures = features.filter(f =>
            f.tier_name === tier.name &&
            f.feature_key !== 'query' &&
            f.feature_key !== 'customer_inquiries' &&
            f.feature_key !== 'listings'
        );

        const mapped = tierFeatures.map(f => ({
            label: f.feature_label,
            value: f.control_value
        }));

        // Add Listings derived from quota if not already in mapped
        const listingsValue = tier.listings_quota === -1 ? 'Unlimited' : `${tier.listings_quota}`;
        mapped.unshift({
            label: 'Listings',
            value: listingsValue
        });

        // Add Customer Inquiries (Leads) derived from quota
        let leadsDisplay = '';
        if (tier.leads_quota === -1) {
            leadsDisplay = 'Unlimited';
        } else {
            leadsDisplay = `${tier.leads_quota} Leads (${tier.leads_quota} Customers)`;
        }

        mapped.push({
            label: 'Customer Inquiries',
            value: leadsDisplay
        });

        return mapped;
    };

    const handleUpgrade = async (tier: AgentTier) => {
        if (!user) return;
        if (subscription?.tier_name === tier.name) return;

        const price = getPrice(tier);

        // For FREE plan, update directly
        if (price === 0 || tier.name === 'base') {
            setUpdating(true);
            try {
                const updated = await affiliateSubscriptionService.updateUserSubscription(user.id, tier.name);
                if (updated) {
                    setSuccessPlan(tier.name);
                }
            } catch (error) {
                console.error('Failed to upgrade subscription:', error);
            } finally {
                setUpdating(false);
            }
            return;
        }

        // For Paid plans, initiate PayU transaction
        const txnid = `txn_${Date.now()}`;
        setPendingPayment({
            amount: price,
            planName: tier.name,
            billingCycle,
            txnid
        });
    };

    if (loading) {
        return (
            <div className="h-screen bg-white flex items-center justify-center">
                <Loader2 className="animate-spin h-12 w-12 text-teal-600" />
            </div>
        );
    }

    if (successPlan) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-8 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Active Plan: {successPlan.toUpperCase()}</h1>
                <p className="text-xl text-gray-600 max-w-md mb-10">
                    Your affiliate account has been updated to the {successPlan} tier. Enjoy your enhanced features!
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/affiliate/dashboard')}
                        className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all transform hover:scale-105"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => setSuccessPlan(null)}
                        className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                        Review Plans
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            {/* PayU Form Overlay triggered when payment is pending */}
            {pendingPayment && user && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <PayUForm
                        amount={pendingPayment.amount}
                        productInfo={`Affiliate Subscription: ${pendingPayment.planName} (${billingCycle})`}
                        firstName={(profile?.full_name || user?.email || 'Agent').split(' ')[0]}
                        email={user.email || ''}
                        phone={'9999999999'}
                        txnid={pendingPayment.txnid}
                        surl={`${window.location.origin}/#/payment-status`}
                        furl={`${window.location.origin}/#/payment-status`}
                        udf2={user.id}
                        udf3={pendingPayment.planName}
                        udf4="affiliate"
                        udf5={pendingPayment.billingCycle}
                    />
                    <button
                        onClick={() => setPendingPayment(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 font-bold"
                    >
                        ✕ Cancel
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Centered Page Header */}
                    <div className="flex flex-col items-center justify-center mb-12 text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600"> Earnings</span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Scale your reach with advanced analytics, higher quotas, and premium support. Choose the plan that fits your growth.
                        </p>
                    </div>

                    {/* Billing Cycle Toggles */}
                    <div className="mt-12 flex justify-center">
                        <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm flex gap-1">
                            {(['monthly', 'quarterly', 'yearly'] as BillingCycle[]).map((cycle) => (
                                <button
                                    key={cycle}
                                    onClick={() => setBillingCycle(cycle)}
                                    className={`relative py-2.5 px-8 rounded-xl text-sm font-bold whitespace-nowrap focus:outline-none transition-all duration-300 ${billingCycle === cycle
                                        ? 'bg-gray-900 text-white shadow-xl scale-105'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                                    {cycle === 'quarterly' && <span className="text-[10px] ml-1 text-teal-400 font-black">SAVE 10%</span>}
                                    {cycle === 'yearly' && <span className="text-[10px] ml-1 text-teal-400 font-black">SAVE 20%</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-full mx-auto">
                        {sortedTiers.map((tier) => {
                            const isActive = subscription?.tier_name === tier.name;

                            if (tier.name === 'custom') {
                                return (
                                    <div
                                        key={tier.id}
                                        className="relative p-8 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col items-start justify-between min-h-[500px] hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                                    >
                                        <div className="w-full">
                                            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">CUSTOM</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-8">ENTERPRISE TRAVEL</p>

                                            <h2 className="text-5xl font-black text-gray-900 tracking-tight mb-8">Talk</h2>

                                            <div className="w-full h-px bg-gray-100 mb-8"></div>

                                            <p className="text-sm text-gray-600 font-medium leading-relaxed text-center">
                                                Unlock enterprise-grade features tailored to your large-scale requirements.
                                            </p>
                                        </div>

                                        <button
                                            className="mt-8 block w-full py-4 px-6 bg-gray-900 text-white rounded-2xl text-center font-black uppercase tracking-wider text-xs hover:bg-black transition-all transform active:scale-95"
                                            onClick={() => window.location.href = 'mailto:sales@traivoai.com'}
                                        >
                                            CONTACT US
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={tier.id}
                                    className={`group relative p-6 bg-white border rounded-3xl shadow-sm flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${isActive
                                        ? 'border-2 border-teal-500 ring-4 ring-teal-500/20 shadow-2xl scale-[1.03] z-20 bg-teal-50/10'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    {tier.name === 'pro' && !isActive && (
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 w-full text-center">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 px-4 py-1.5 text-[10px] font-black tracking-widest uppercase text-white shadow-xl ring-4 ring-white">
                                                <Sparkles className="w-3 h-3" /> Most Popular
                                            </span>
                                        </div>
                                    )}

                                    {isActive && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-full text-center">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-6 py-1.5 text-[10px] font-black tracking-widest uppercase text-white shadow-xl ring-4 ring-white">
                                                Current Plan
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <div className="mb-6">
                                            <h3 className="text-base font-black text-gray-500 uppercase tracking-widest mb-1">{tier.name}</h3>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tight">
                                                {tier.name === 'base' ? 'Casual Exploration' : 'Premium Growth'}
                                            </p>
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-gray-900 tracking-tight">
                                                    ₹{getPrice(tier)}
                                                </span>
                                                <span className="text-base font-bold text-gray-400">{getDurationLabel()}</span>
                                            </div>
                                        </div>

                                        {/* Feature List */}
                                        <div className="space-y-3 border-t border-gray-100 pt-6">
                                            {/* Daily Quota Always Shown */}
                                            <div className="flex items-start gap-2">
                                                <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-teal-50 text-teal-600 shrink-0">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                </div>
                                                <p className="text-xs text-gray-600 font-bold">{tier.query_daily_quota} Queries / Day</p>
                                            </div>

                                            {getTierFeatures(tier).map((feat, idx) => (
                                                <div key={idx} className="flex items-start gap-2">
                                                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${feat.value === 'No' ? 'bg-gray-50 text-gray-300' : 'bg-teal-50 text-teal-600'}`}>
                                                        {feat.value === 'No' ? <span className="text-[10px]">✕</span> : <CheckCircle2 className="h-3 w-3" />}
                                                    </div>
                                                    <p className={`text-xs font-bold text-left ${feat.value === 'No' ? 'text-gray-300 line-through' : 'text-gray-600'}`}>
                                                        {feat.label}: {feat.value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        className={`mt-8 block w-full py-3 px-4 rounded-2xl text-center font-black uppercase tracking-wider text-xs transition-all transform active:scale-95 ${isActive
                                            ? 'bg-gray-100 text-gray-400 cursor-default shadow-none pointer-events-none'
                                            : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/20'
                                            } ${updating ? 'opacity-50 cursor-wait' : ''}`}
                                        onClick={() => handleUpgrade(tier)}
                                        disabled={isActive || updating}
                                    >
                                        {updating ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Processing
                                            </span>
                                        ) : (
                                            isActive
                                                ? 'ACTIVE'
                                                : tier.name === 'base'
                                                    ? 'GET STARTED'
                                                    : 'UPGRADE NOW'
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* FAQ/Support Section */}
                    <div className="mt-24 text-center">
                        <p className="text-gray-500 text-sm font-medium">
                            Need a custom plan for a large agency? <button className="text-teal-600 font-bold hover:underline">Contact Support</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AffiliateSubscriptionPage;
