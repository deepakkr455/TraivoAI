
import React, { useState } from 'react';
import { Product } from '../types';
import { SearchIcon, FilterIcon, TrashIcon, CheckCircleIcon, EyeOffIcon, MapIcon, ClockIcon, UserCircleIcon, CalendarIcon } from './Icons';

interface ListingGalleryProps {
    products: Product[];
    onViewDetails: (product: Product) => void;
    onToggleStatus: (productId: string) => void;
    onDelete: (productId: string) => void;
}

export const ListingGallery: React.FC<ListingGalleryProps> = ({ products, onViewDetails, onToggleStatus, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all'
            ? true
            : filterStatus === 'active' ? product.is_active : !product.is_active;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-4 lg:p-8 font-sans overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Listing Gallery</h1>
                    <p className="text-base text-gray-500 mt-1">Manage all your travel packages in one place.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <input
                            type="text"
                            placeholder="Search listings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm shadow-sm"
                        />
                        <div className="absolute left-3 top-3 text-gray-400">
                            <SearchIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === 'all' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === 'active' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilterStatus('inactive')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === 'inactive' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Inactive
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
                                {/* Image Area */}
                                <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => onViewDetails(product)}>
                                    <img
                                        src={product.media_urls[0]}
                                        alt={product.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${product.is_active ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3 text-white">
                                        <div className="flex items-center gap-1 text-xs mb-1 opacity-90">
                                            <MapIcon className="w-3 h-3" /> {product.location}
                                        </div>
                                        <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-teal-400 transition-colors">{product.title}</h3>
                                    </div>

                                    {/* Hover Overlay with View Action */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-full text-sm font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            View Details
                                        </span>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Price</span>
                                            <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                                                Rs. {product.pricing && product.pricing.length > 0 ? Math.min(...product.pricing.map(p => p.cost)).toLocaleString() : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Duration</span>
                                            <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <ClockIcon className="w-4 h-4 text-gray-400" /> {product.duration}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-5">
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg text-center">
                                            <span className="block text-[9px] text-gray-400 uppercase tracking-tight">Visitors</span>
                                            <span className="block font-bold text-gray-700 dark:text-gray-200 text-sm">{product.unique_visitors || 0}</span>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg text-center">
                                            <span className="block text-[9px] text-gray-400 uppercase tracking-tight">Views</span>
                                            <span className="block font-bold text-gray-700 dark:text-gray-200 text-sm">{product.views || 0}</span>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg text-center">
                                            <span className="block text-[9px] text-gray-400 uppercase tracking-tight">Avg Views</span>
                                            <span className="block font-bold text-gray-700 dark:text-gray-200 text-sm">{product.avg_views || 0}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => onToggleStatus(product.id)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2
                                                ${product.is_active
                                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}
                                        >
                                            {product.is_active ? (
                                                <><EyeOffIcon className="w-3 h-3" /> Deactivate</>
                                            ) : (
                                                <><CheckCircleIcon className="w-3 h-3" /> Activate</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => onDelete(product.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Listing"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <SearchIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No listings found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            {searchTerm || filterStatus !== 'all'
                                ? "Try adjusting your search or filters to find what you're looking for."
                                : "You haven't created any listings yet. Go to the AI Creator to get started!"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
