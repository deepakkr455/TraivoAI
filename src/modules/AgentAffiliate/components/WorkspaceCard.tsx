
import React from 'react';
import { Product } from '../types';
import { CheckCircleIcon, TrashIcon } from './Icons';

interface WorkspaceCardProps {
    product: Product;
    onViewDetails: () => void;
    onConfirm: () => void;
    onDelete: () => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ product, onViewDetails, onConfirm, onDelete }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-md">
            <div className="flex items-start gap-3">
                <img
                    src={product.media_urls?.[0] || 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1887&auto=format&fit=crop'}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100 dark:bg-gray-700"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{product.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.location} • {product.duration}</p>

                    {/* Debug/Verification: Trip Data Preview */}
                    <div className="mt-2 flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/50 rounded text-[10px] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            {product.package_type}
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/50 rounded text-[10px] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            {product.group_size} Guests
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <button
                    onClick={onViewDetails}
                    className="flex-1 text-xs font-bold text-center text-teal-700 dark:text-white bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 px-3 py-2 rounded-lg transition-colors"
                >
                    Review Details
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={onConfirm}
                        className="p-2 text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors shadow-sm"
                        title="Confirm & List"
                    >
                        <CheckCircleIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Listing"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
