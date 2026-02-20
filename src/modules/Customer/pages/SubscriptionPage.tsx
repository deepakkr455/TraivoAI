import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { useSubscription } from '../../../hooks/useSubscription';
import { useAuth } from '../../../hooks/useAuth';
import PayUForm from '../../../components/PayUForm';

type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

interface PendingPayment {
    amount: number;
    planName: string;
    billingCycle: string;
    txnid: string;
}

const SubscriptionPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { userSubscription, availablePlans, featureControls, loading, updatePlan } = useSubscription();
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [successPlan, setSuccessPlan] = useState<string | null>(null);
    const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

    const getPrice = (plan: any) => {
        if (billingCycle === 'monthly') return plan.monthly_price;
        if (billingCycle === 'quarterly') return plan.quarterly_price;
        // Yearly: Monthly * 12 * 0.85 (15% discount)
        return Math.round((plan.monthly_price || 0) * 12 * 0.85);
    };

    const getDurationLabel = () => {
        if (billingCycle === 'monthly') return '/ month';
        if (billingCycle === 'quarterly') return '/ quarter';
        return '/ year';
    };

    const sortedPlans = useMemo(() => {
        return [...availablePlans].sort((a, b) => {
            if (a.name === 'custom') return 1;
            if (b.name === 'custom') return -1;
            return (a.monthly_price || 0) - (b.monthly_price || 0);
        });
    }, [availablePlans]);

    const getFeaturesForPlan = (planName: string) => {
        return featureControls.filter(c => c.plan_name === planName);
    };

    const handleUpgrade = async (plan: any) => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (plan.name === 'custom') {
            window.location.href = '#/user/contact';
            return;
        }

        if (userSubscription?.plan_name === plan.name) return;

        // For FREE plan or simulation, update directly
        if (plan.monthly_price === 0 || plan.name === 'free') {
            await updatePlan(plan.name);
            setSuccessPlan(plan.name);
            return;
        }

        // For Paid plans, initiate PayU transaction
        const amount = getPrice(plan);
        const txnid = `txn_${Date.now()}`;

        setPendingPayment({
            amount,
            planName: plan.name,
            billingCycle,
            txnid
        });
    };

    if (loading && availablePlans.length === 0) {
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
                    Your account has been updated with the {successPlan} tier. Enjoy your premium travel features!
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.href = '#/'}
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
            <Header showBackground={true} />

            {/* Hidden PayU Form triggered when payment is pending */}
            {pendingPayment && user && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <PayUForm
                        amount={pendingPayment.amount}
                        productInfo={`Subscription for ${pendingPayment.planName} (${billingCycle})`}
                        firstName={user.name.split(' ')[0] || 'User'}
                        email={user.email}
                        phone={'9999999999'} // Default as we don't store phone yet
                        txnid={pendingPayment.txnid}
                        surl={`${window.location.origin}/#/payment-status`}
                        furl={`${window.location.origin}/#/payment-status`}
                        udf2={user.id}
                        udf3={pendingPayment.planName}
                        udf5={pendingPayment.billingCycle}
                    />
                    <button
                        onClick={() => setPendingPayment(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                    >
                        ✕ Cancel
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto w-full">

                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Centered Page Header */}
                    <div className="flex flex-col items-center justify-center mb-12 text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Adventure Level</span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Unlock the full potential of your journeys with our premium AI-powered planning tools.
                        </p>
                    </div>

                    {/* Billing Cycle Toggles */}
                    <div className="mt-8 md:mt-12 flex justify-center">
                        <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-center gap-1 max-w-full">
                            {(['monthly', 'quarterly', 'yearly'] as BillingCycle[]).map((cycle) => (
                                <button
                                    key={cycle}
                                    onClick={() => setBillingCycle(cycle)}
                                    className={`relative py-2 px-6 md:px-8 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap focus:outline-none transition-all duration-300 ${billingCycle === cycle
                                        ? 'bg-gray-900 text-white shadow-xl scale-105'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                                    {cycle === 'quarterly' && <span className="text-[9px] md:text-[10px] ml-1 text-teal-400 font-black">SAVE 10%</span>}
                                    {cycle === 'yearly' && <span className="text-[9px] md:text-[10px] ml-1 text-teal-400 font-black">SAVE 15%</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1600px] mx-auto">
                        {sortedPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`group relative p-6 bg-white border rounded-3xl shadow-sm flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${userSubscription?.plan_name === plan.name ? 'border-teal-500 ring-4 ring-teal-500/10' : 'border-gray-200'
                                    }`}
                            >
                                {plan.name === 'pro' && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 w-full text-center">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 px-4 py-1.5 text-[10px] font-black tracking-widest uppercase text-white shadow-xl ring-4 ring-white">
                                            <Sparkles className="w-3 h-3" /> Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="flex-1">
                                    <div className="mb-6">
                                        <h3 className="text-base font-black text-gray-500 uppercase tracking-widest mb-1">{plan.name}</h3>
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tight">
                                            {plan.name === 'free' ? 'Casual Exploration' : plan.name === 'custom' ? 'Enterprise Travel' : 'Premium Adventure'}
                                        </p>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-gray-900 tracking-tight">
                                                {plan.name === 'custom' ? 'Talk' : plan.name === 'free' ? '₹0' : `₹${getPrice(plan)}`}
                                            </span>
                                            {plan.name !== 'custom' && plan.name !== 'free' && (
                                                <span className="text-base font-bold text-gray-400">{getDurationLabel()}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Feature List */}
                                    <div className="space-y-3 border-t border-gray-100 pt-6">
                                        {plan.name === 'custom' ? (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                                    Unlock enterprise-grade features tailored to your large-scale requirements.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Features based on controls */}
                                                {getFeaturesForPlan(plan.name).map((control) => (
                                                    <div key={control.id} className="flex items-start gap-2">
                                                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${control.control_value === 'No' ? 'bg-gray-50 text-gray-300' : 'bg-teal-50 text-teal-600'}`}>
                                                            {control.control_value === 'No' ? <span className="text-[10px]">✕</span> : <CheckCircle2 className="h-3 w-3" />}
                                                        </div>
                                                        <p className={`text-xs font-bold text-left ${control.control_value === 'No' ? 'text-gray-300 line-through' : 'text-gray-600'}`}>
                                                            {control.feature_label} {control.control_value !== 'Yes' && control.control_value !== 'No' && control.control_value !== 'Unlimited' && `(${control.control_value})`}
                                                        </p>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <button
                                    className={`mt-8 block w-full py-3 px-4 rounded-2xl text-center font-black uppercase tracking-wider text-xs transition-all transform active:scale-95 ${userSubscription?.plan_name === plan.name
                                        ? 'bg-gray-100 text-gray-400 cursor-default'
                                        : plan.name === 'pro'
                                            ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/30'
                                            : 'bg-gray-900 text-white hover:bg-black'
                                        }`}
                                    onClick={() => handleUpgrade(plan)}
                                    disabled={userSubscription?.plan_name === plan.name}
                                >
                                    {userSubscription?.plan_name === plan.name ? 'Active' : plan.name === 'custom' ? 'Contact Us' : plan.name === 'free' ? 'Stay Free' : 'Upgrade Now'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SubscriptionPage;
