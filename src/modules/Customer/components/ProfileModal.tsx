import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, MapPin, Sparkles, Edit2, LogOut, CheckCircle, Clock, CreditCard, ChevronRight, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../../hooks/useSubscription';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEditPersonalization?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onEditPersonalization }) => {
    const auth = useAuth() as any;
    const { user, signOut, personalization } = auth;
    const { userSubscription, availablePlans, subscriptionHistory, loading } = useSubscription();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'subscription' | 'personalization'>('subscription');

    if (!isOpen || !user) return null;

    const handleEdit = () => {
        onClose();
        if (onEditPersonalization) {
            onEditPersonalization();
        } else {
            navigate('/personalize');
        }
    };

    const handleLogout = () => {
        signOut();
        onClose();
        navigate('/');
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getPlanPrice = (planName: string) => {
        const plan = availablePlans.find(p => p.name === planName);
        return plan?.monthly_price ? `$${plan.monthly_price}` : 'Free';
    };

    const currentPlan = availablePlans.find(p => p.name === userSubscription?.plan_name);
    const planNameDisplay = currentPlan?.name ? (currentPlan.name.charAt(0).toUpperCase() + currentPlan.name.slice(1)) : 'Free Tier';

    const SubscriptionTab = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest">Subscription</h3>
                            <span className={`bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold capitalize`}>
                                {userSubscription?.status || 'Active'}
                            </span>
                        </div>

                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Current Plan</p>
                                <p className="text-2xl font-black text-gray-900">{planNameDisplay}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-sm mb-1">Renews On</p>
                                <p className="text-gray-900 font-bold">{formatDate(userSubscription?.current_period_end || null)}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <p className="text-gray-500 text-xs font-bold uppercase">Included Features:</p>
                            <ul className="space-y-2">
                                {[
                                    'AI Trip Creator',
                                    'Unlimited Listings Access',
                                    'Priority Support',
                                    'Advanced Analytics'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                        <div className="bg-teal-500 rounded-full p-0.5">
                                            <CheckCircle className="w-3 h-3 text-white" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => { onClose(); navigate('/user/subscription'); }}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                        >
                            Manage Subscription
                        </button>
                    </div>

                    {/* Subscription History (Real Data) */}
                    <div className="space-y-3">
                        <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest">Subscription History</h3>
                        {subscriptionHistory && subscriptionHistory.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                {subscriptionHistory.map((sub, i) => (
                                    <div key={sub.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded-lg border border-gray-200">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 capitalize">{sub.plan_name} Plan</p>
                                                <p className="text-xs text-gray-500">{formatDate(sub.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900">{getPlanPrice(sub.plan_name)}</span>
                                            <p className="text-[10px] text-gray-400 capitalize">{sub.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-xs text-center p-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                                No history available.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );

    const PersonalizationTab = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <h3 className="text-gray-900 font-black text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-500" /> Your Travel DNA
                </h3>
                <button
                    onClick={handleEdit}
                    className="text-teal-600 hover:text-teal-700 font-bold text-sm flex items-center gap-1 transition-colors bg-teal-50 px-3 py-1.5 rounded-lg"
                >
                    <Edit2 className="w-4 h-4" /> Edit
                </button>
            </div>

            {personalization ? (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                        <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Origin</p>
                        <p className="text-gray-800 font-bold flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-teal-500" /> {personalization.city}, {personalization.state}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                        <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Frequency</p>
                        <p className="text-gray-800 font-bold capitalize text-sm">{personalization.travel_frequency?.replace('_', ' ') || 'Occasional'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50 col-span-2">
                        <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Interests</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {personalization.interests?.map((interest: string) => (
                                <span key={interest} className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 capitalize">
                                    {interest}
                                </span>
                            )) || <span className="text-gray-400 text-[10px]">No interests selected</span>}
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                        <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Source</p>
                        <p className="text-gray-800 font-bold capitalize text-sm">{personalization.referral_source || 'Search'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                        <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Budget</p>
                        <p className="text-teal-600 font-black uppercase text-[10px] tracking-widest">{personalization.budget || 'Mid'}</p>
                    </div>
                </div>
            ) : (
                <div className="bg-teal-50 border-2 border-dashed border-teal-200 p-8 rounded-[2rem] text-center">
                    <p className="text-teal-800 font-bold mb-4">You haven't personalized your experience yet!</p>
                    <button
                        onClick={handleEdit}
                        className="bg-teal-500 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-teal-500/30 hover:scale-105 transition-all text-sm"
                    >
                        Personalize Now
                    </button>
                </div>
            )}
        </div>
    );

    // Use createPortal to render outside of the parent hierarchy (likely Header)
    // This fixes the "stucked in URL bar" issue by attaching to document.body
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 isolate font-sans">
            {/* Backdrop with high blur */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div className="relative z-50 bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] flex flex-col my-auto mx-auto border border-white/20 ring-1 ring-black/5">
                {/* Header with Gradient and Avatar */}
                <div className="bg-gradient-to-r from-teal-400 to-blue-600 pt-10 pb-16 px-6 text-center relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Avatar positioned absolutely to overlap */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-xl">
                            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                {user.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-black text-gray-400 uppercase">
                                        {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 pt-12 pb-6 flex-1 overflow-y-auto custom-scrollbar bg-white">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{user.user_metadata?.full_name || 'Traveler'}</h2>
                        <p className="text-gray-500 font-medium text-sm">{user.email}</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
                        <button
                            onClick={() => setActiveTab('subscription')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'subscription'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Subscription
                        </button>
                        <button
                            onClick={() => setActiveTab('personalization')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'personalization'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Personalization
                        </button>
                    </div>

                    {activeTab === 'subscription' ? <SubscriptionTab /> : <PersonalizationTab />}

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 font-bold py-3 hover:bg-red-50 rounded-xl transition-colors text-sm"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProfileModal;
