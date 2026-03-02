import React, { useState } from 'react';

interface TandCModalProps {
    onAccept: () => void;
}

export const TandCModal: React.FC<TandCModalProps> = ({ onAccept }) => {
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [acceptedItems, setAcceptedItems] = useState({
        authorized: false,
        marketplace: false,
        responsibility: false,
        terms: false
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            setScrolledToBottom(true);
        }
    };

    const allChecked = Object.values(acceptedItems).every(item => item);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agent Terms & Conditions</h2>
                    <span className="text-xs text-gray-500 font-medium">Effective Date: January 2026</span>
                </div>

                <div
                    className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
                    onScroll={handleScroll}
                >
                    <div className="space-y-4">
                        <section>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide text-xs">1. Platform Role & Relationship</h3>
                            <p>1.1 Traivo AI operates as a Software-as-a-Service (SaaS) marketplace platform connecting travel customers with independent travel agents.</p>
                            <p>1.2 The Agent acknowledges that Traivo AI: Is not a travel agency, tour operator, or contracting party in customer transactions. Does not hold customer payments by default. Does not guarantee bookings, conversions, or revenue.</p>
                            <p>1.3 All contracts, payments, refunds, disputes, and service obligations are solely between the Agent and the Customer.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide text-xs">2. Eligibility & Authenticity</h3>
                            <p>By onboarding, the Agent confirms: All business information submitted is true and accurate. They are legally authorized to sell travel-related services. They maintain minimum digital presence. They possess valid business registration. They will promptly update any changes in business status.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide text-xs">3. Agent Responsibilities</h3>
                            <p>The Agent agrees to: Provide accurate, lawful, and transparent package details. Clearly disclose inclusions, exclusions, cancellation terms, and fees. Honor advertised pricing. Respond to customer inquiries promptly. Comply with all applicable travel laws.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide text-xs">4. Prohibited Conduct</h3>
                            <p>The Agent must NOT: Provide false, misleading, or fraudulent listings. Misrepresent availability or pricing. Use customer data for spam. Attempt to bypass platform safeguards. Misuse Traivo AI branding.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide text-xs">5. Payments & Financial Responsibility</h3>
                            <p>Traivo AI does not guarantee customer payments. All payment collection is the Agent’s responsibility. Traivo AI is not liable for payment disputes, chargebacks, fraud, or non-payment.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide text-xs">11. Limitation of Liability</h3>
                            <p>To the maximum extent permitted by law: Traivo AI shall not be liable for indirect, incidental, consequential, or reputational damages. Traivo AI does not guarantee platform uptime or uninterrupted access.</p>
                        </section>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={acceptedItems.authorized}
                                onChange={(e) => setAcceptedItems({ ...acceptedItems, authorized: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 transition-all"
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">I confirm that I am legally authorized to provide travel services.</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={acceptedItems.marketplace}
                                onChange={(e) => setAcceptedItems({ ...acceptedItems, marketplace: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 transition-all"
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">I understand that Traivo AI is a marketplace platform and not a contracting party.</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={acceptedItems.responsibility}
                                onChange={(e) => setAcceptedItems({ ...acceptedItems, responsibility: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 transition-all"
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">I accept full responsibility for my listings, services, and payments.</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={acceptedItems.terms}
                                onChange={(e) => setAcceptedItems({ ...acceptedItems, terms: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 transition-all"
                            />
                            <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">I agree to comply with Traivo AI’s Agent Terms & Conditions.</span>
                        </label>
                    </div>

                    <button
                        onClick={onAccept}
                        disabled={!allChecked}
                        className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:cursor-not-allowed"
                    >
                        Accept & Continue
                    </button>
                    {!scrolledToBottom && !allChecked && (
                        <p className="text-[10px] text-center text-teal-600 font-bold uppercase tracking-widest animate-pulse">Please read the full terms to proceed</p>
                    )}
                </div>
            </div>
        </div>
    );
};
