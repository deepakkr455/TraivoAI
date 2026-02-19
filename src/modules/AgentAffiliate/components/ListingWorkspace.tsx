
import React from 'react';
import { Product } from '../types';
import { WorkspaceCard } from './WorkspaceCard';

interface ListingWorkspaceProps {
    products: Product[];
    onViewDetails: (product: Product) => void;
    onConfirm: (productId: string) => void;
    onDelete: (productId: string) => void;
}

const ListingWorkspace: React.FC<ListingWorkspaceProps> = ({ products, onViewDetails, onConfirm, onDelete }) => {

    const pendingProducts = products
        .filter(p => p.status === 'pending')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="h-full flex flex-col">
            <header className="p-4 border-b border-black/10 dark:border-white/10 flex-shrink-0 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white text-center flex items-center justify-center gap-2">
                    Trip Workspace
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Review and manage your pending listings.</p>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {pendingProducts.length > 0 ? (
                    pendingProducts.map(product => (
                        <WorkspaceCard
                            key={product.id}
                            product={product}
                            onViewDetails={() => onViewDetails(product)}
                            onConfirm={() => onConfirm(product.id)}
                            onDelete={() => onDelete(product.id)}
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p className="font-semibold">No Pending Trips</p>
                        <p className="text-sm">Trips you create will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListingWorkspace;
