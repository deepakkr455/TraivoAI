import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getAffiliateListings } from '../../AgentAffiliate/services/supabaseService';
import { AffiliateListing } from '../../AgentAffiliate/types';
import { AffiliateCard } from '../../AgentAffiliate/components/AffiliateCard';
import { ChevronLeft } from 'lucide-react';

const AffiliatesPage: React.FC = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState<AffiliateListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const data = await getAffiliateListings();
                setListings(data);
            } catch (error) {
                console.error("Failed to fetch listings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('All');
    const [selectedSource, setSelectedSource] = useState('All');
    const [selectedTag, setSelectedTag] = useState('All');

    // Derived unique values for filters
    const locations = Array.from(new Set(listings.map(l => l.city ? `${l.city}, ${l.country}` : l.country).filter(Boolean))).sort();
    const sources = Array.from(new Set(listings.map(l => l.affiliate_source).filter(Boolean))).sort();
    const tags = Array.from(new Set(listings.flatMap(l => l.tags || []).filter(Boolean))).sort();

    const filteredListings = listings.filter(l => {
        const matchesSearch = !searchTerm ||
            l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

        const locString = l.city ? `${l.city}, ${l.country}` : l.country;
        const matchesLocation = selectedLocation === 'All' || locString === selectedLocation;
        const matchesSource = selectedSource === 'All' || l.affiliate_source === selectedSource;
        const matchesTag = selectedTag === 'All' || l.tags?.includes(selectedTag);

        return matchesSearch && matchesLocation && matchesSource && matchesTag;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            <Header showBackground={true} />

            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col items-center justify-center mb-8 text-center relative">
                    {/* <button
                        onClick={() => navigate(-1)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition-colors hidden md:block"
                        title="Go Back"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </button> */}

                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                        Partner <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Activities</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        Discover experiences from our trusted partners
                    </p>
                </div>

                {/* Filters Section */}
                <div className="mb-12 mx-auto w-full max-w-full">
                    <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                        <div className="relative w-full lg:w-1/3">
                            <input
                                type="text"
                                placeholder="Search experiences..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                            />
                            <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        <div className="flex flex-wrap gap-4 w-full lg:w-auto justify-end">
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                            >
                                <option value="All">All Locations</option>
                                {locations.map(loc => <option key={loc} value={loc as string}>{loc}</option>)}
                            </select>

                            <select
                                value={selectedSource}
                                onChange={(e) => setSelectedSource(e.target.value)}
                                className="px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer capitalize hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                            >
                                <option value="All">All Partners</option>
                                {sources.map(src => <option key={src} value={src as string}>{src}</option>)}
                            </select>

                            <select
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                                className="px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer capitalize hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                            >
                                <option value="All">All Tags</option>
                                {tags.map(tag => <option key={tag} value={tag as string}>{tag}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
                    </div>
                ) : filteredListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredListings.map(listing => (
                            <div key={listing.id} className="h-full">
                                <AffiliateCard
                                    listing={listing}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        <p>No listings match your search.</p>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedLocation('All'); setSelectedSource('All'); }}
                            className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AffiliatesPage;
