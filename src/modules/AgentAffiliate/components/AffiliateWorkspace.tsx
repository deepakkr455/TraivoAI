import React from 'react';
import { AffiliateListing } from '../types';
import { WorkspaceCard } from './WorkspaceCard';
import { CheckCircleIcon, TrashIcon, LinkIcon } from './Icons';

interface AffiliateWorkspaceProps {
    listings: AffiliateListing[];
    onConfirm: (id: string) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
}


export const AffiliateWorkspace: React.FC<AffiliateWorkspaceProps> = ({ listings, onConfirm, onDelete }) => {
    // Filter for pending listings (assuming is_active=false means pending in this context for workspace flow)
    // Or we might need a specific 'status' field if we want to distinguish between 'inactive' and 'pending approval'
    // For now, let's assume listings created via chat start as is_active=false (pending)
    const pendingListings = listings.filter(l => !l.is_active);

    return (
        <div className="h-full flex flex-col">
            <header className="p-4 border-b border-black/10 dark:border-white/10 flex-shrink-0 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white text-center flex items-center justify-center gap-2">
                    <LinkIcon className="w-5 h-5 text-purple-600" />
                    Affiliate Workspace
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                    Review and activate your generated affiliate links.
                </p>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {pendingListings.length > 0 ? (
                    pendingListings.map(listing => (
                        <div key={listing.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 uppercase tracking-wider">
                                        {listing.affiliate_source}
                                    </span>
                                    <h3 className="font-bold text-gray-900 dark:text-white mt-1 line-clamp-1">{listing.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{listing.description}</p>

                                    {/* Debug/Verification: Show extracted code */}
                                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-mono text-gray-400 mb-1 uppercase">Embed Code Preview:</p>
                                        <code className="block text-[10px] text-gray-600 dark:text-gray-300 font-mono break-all line-clamp-3 bg-white dark:bg-gray-800 p-1 rounded border border-gray-200 dark:border-gray-700">
                                            {listing.embed_code || 'No code detected'}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <button
                                    onClick={() => onConfirm(listing.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                    Confirm & List
                                </button>
                                <button
                                    onClick={() => onDelete(listing.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <LinkIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">No Pending Links</p>
                        <p className="text-sm mt-1">Paste a URL in the chat to generate a new affiliate card.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
