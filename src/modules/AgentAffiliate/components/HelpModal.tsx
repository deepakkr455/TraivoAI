import React from 'react';
import { XIcon, MessageSquareIcon, GlobeIcon, LayoutIcon } from './Icons';

interface HelpModalProps {
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Help & Support</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Need assistance with your affiliate account? We're here to help you succeed.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <HelpOption
                            icon={<LayoutIcon className="w-6 h-6 text-blue-500" />}
                            title="Documentation"
                            description="Read our guides on how to maximize your earnings."
                        />
                        <HelpOption
                            icon={<MessageSquareIcon className="w-6 h-6 text-green-500" />}
                            title="Contact Support"
                            description="Get in touch with our dedicated affiliate support team."
                        />
                        <HelpOption
                            icon={<GlobeIcon className="w-6 h-6 text-purple-500" />}
                            title="Community Forum"
                            description="Connect with other affiliates and share tips."
                        />
                        <HelpOption
                            icon={<LayoutIcon className="w-6 h-6 text-orange-500" />} // Reusing icon for tutorial
                            title="Video Tutorials"
                            description="Watch step-by-step tutorials on using the platform."
                        />
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-center text-gray-500">
                        For urgent issues, email us directly at <a href="mailto:support@triplister.com" className="text-teal-600 hover:underline">support@triplister.com</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

const HelpOption = ({ icon, title, description }: any) => (
    <button className="flex flex-col items-start p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all text-left group">
        <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
            {icon}
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </button>
);
