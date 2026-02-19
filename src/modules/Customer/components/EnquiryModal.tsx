
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EnquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (message: string) => Promise<void>;
    productTitle: string;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({ isOpen, onClose, onSubmit, productTitle }) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState(''); // Email or Phone
    const [query, setQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !contact.trim()) return;

        setIsSubmitting(true);
        try {
            // Combine fields into a structured message
            const fullMessage = `
**New Enquiry for: ${productTitle}**
------------------------------------------------
**Name:** ${name}
**Contact:** ${contact}
------------------------------------------------
**Message:**
${query}
            `.trim();

            await onSubmit(fullMessage);
            setQuery('');
            setName('');
            setContact('');
            onClose();
        } catch (error) {
            console.error('Error submitting enquiry:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 transform transition-all">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Enquire about this trip</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="mb-2">
                        <p className="text-sm text-gray-500">You are enquiring about:</p>
                        <p className="font-semibold text-teal-600 line-clamp-1">{productTitle}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Contact Details (Email or Phone)
                        </label>
                        <input
                            type="text"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            placeholder="john@example.com / +1234567890"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Your Query
                        </label>
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none h-32"
                            placeholder="How flexible is this itinerary?..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg shadow-teal-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-4"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Send Enquiry'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
