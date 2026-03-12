import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, Send, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SubscriptionRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: string;
    billingCycle: string;
    amount: number;
    userId: string;
    userType: 'customer' | 'affiliate';
}

const SubscriptionRequestModal: React.FC<SubscriptionRequestModalProps> = ({
    isOpen,
    onClose,
    planName,
    billingCycle,
    amount,
    userId,
    userType
}) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSendRequest = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: functionError } = await supabase.functions.invoke('subscription-request', {
                body: {
                    user_id: userId,
                    plan_name: planName,
                    billing_cycle: billingCycle,
                    amount: amount,
                    user_type: userType
                }
            });

            if (functionError) throw functionError;
            if (data?.error) throw new Error(data.error);

            setSuccess(true);
        } catch (err: any) {
            console.error('Error sending subscription request:', err);
            setError(err.message || 'Failed to send request. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 md:p-10">
                    {!success ? (
                        <>
                            <div className="mb-8">
                                <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
                                    <Send className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                                    Request Activation
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Our automated payment gateway is currently undergoing maintenance. You can request manual activation for the <span className="font-bold text-teal-600">{planName.toUpperCase()}</span> plan.
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 mb-8 border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-gray-500 font-medium">Selected Plan</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white uppercase">{planName}</span>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-gray-500 font-medium">Billing Cycle</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">{billingCycle}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-gray-500 font-medium">Total Amount</span>
                                    <span className="text-lg font-extrabold text-teal-600">₹{amount}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 text-sm font-medium">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSendRequest}
                                disabled={loading}
                                className="w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-black dark:hover:bg-gray-100 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Send Request
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <p className="mt-6 text-center text-xs text-gray-400 font-medium">
                                Once submitted, our team will verify your request and activate your subscription within 2-4 hours.
                            </p>
                        </>
                    ) : (
                        <div className="py-10 text-center animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/40 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                                Request Sent!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                                Your request for the <span className="font-bold text-teal-600">{planName.toUpperCase()}</span> plan has been successfully sent to our administration team. You will be notified via email once your account is activated.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all transform active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionRequestModal;
