import React, { useState } from 'react';
import { AffiliateListing } from '../types';
import { SearchIcon, MapPinIcon, TagIcon, TrashIcon, EyeIcon, EyeOffIcon, ChartBarIcon, RocketIcon } from './Icons';

interface AffiliateGalleryProps {
    listings: AffiliateListing[];
    onToggleStatus: (id: string) => void;
    onDelete: (id: string) => void;
    onBoost: () => void;
}

export const AffiliateGallery: React.FC<AffiliateGalleryProps> = ({ listings, onToggleStatus, onDelete, onBoost }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterTag, setFilterTag] = useState('');

    // Extract unique locations and tags for filters
    const uniqueLocations = Array.from(new Set(listings.map(l => l.city || l.country).filter(Boolean)));
    const uniqueTags = Array.from(new Set(listings.flatMap(l => l.tags || [])));

    // Filter listings
    const filteredListings = listings.filter(listing => {
        const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = !filterLocation ||
            listing.city === filterLocation ||
            listing.country === filterLocation;
        const matchesTag = !filterTag || listing.tags?.includes(filterTag);

        return matchesSearch && matchesLocation && matchesTag;
    });

    return (
        <div className="h-full w-full p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Affiliate Gallery</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage your affiliate travel listings</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search */}
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search listings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                </div>

                {/* Location Filter */}
                <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                        <option value="">All Locations</option>
                        {uniqueLocations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>

                {/* Tag Filter */}
                <div className="relative">
                    <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                        <option value="">All Tags</option>
                        {uniqueTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Listings Grid */}
            {filteredListings.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No affiliate listings found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Start by adding your first affiliate link in the chat!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredListings.map((listing) => (
                        <div
                            key={listing.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row h-[280px]"
                        >
                            {/* Embed Widget - Left Side */}
                            <div className="w-full sm:w-5/12 bg-gray-50 dark:bg-gray-900/50 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 p-2 flex items-center justify-center overflow-hidden">
                                <div
                                    className="w-full transform scale-75 origin-center"
                                    dangerouslySetInnerHTML={{ __html: listing.embed_code }}
                                />
                            </div>

                            {/* Listing Info - Right Side */}
                            <div className="w-full sm:w-7/12 p-3 flex flex-col h-full relative">
                                {/* Header: Title & Status */}
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex-1 mr-2 leading-tight line-clamp-1" title={listing.title}>
                                        {listing.title}
                                    </h3>
                                    <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${listing.is_active
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {listing.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Listing ID */}
                                <div className="text-[10px] text-gray-400 font-mono mb-2">
                                    ID: {listing.id.substring(0, 8)}...
                                </div>

                                {listing.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                                        {listing.description}
                                    </p>
                                )}

                                {/* Location & Tags */}
                                <div className="space-y-1 mb-2">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        <MapPinIcon className="w-3 h-3 text-teal-500 flex-shrink-0" />
                                        <span className="truncate">{[listing.city, listing.state, listing.country].filter(Boolean).join(', ')}</span>
                                    </div>
                                    {listing.tags && listing.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {listing.tags.slice(0, 3).map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-1.5 py-0.5 text-[10px] font-medium bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 rounded border border-teal-100 dark:border-teal-900/30"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto">
                                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />

                                    {/* Performance & Actions */}
                                    <div className="flex items-end justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1" title="Platform Ranking">
                                                    <ChartBarIcon className="w-3 h-3 text-blue-500" />
                                                    <span>Rank #{listing.platform_ranking || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1" title="My Listings Ranking">
                                                    <span className="text-purple-500 font-bold">#</span>
                                                    <span>My #{listing.personal_ranking || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                <span>{listing.views || 0} views</span>
                                                <span>•</span>
                                                <span>{listing.clicks || 0} clicks</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5 items-end">
                                            <button
                                                onClick={onBoost}
                                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded hover:from-orange-600 hover:to-pink-600 transition-all shadow-sm"
                                            >
                                                <RocketIcon className="w-3 h-3" />
                                                Boost
                                            </button>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => onToggleStatus(listing.id)}
                                                    className="p-1 text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                                    title={listing.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {listing.is_active ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={() => onDelete(listing.id)}
                                                    className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                    title="Delete Listing"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
