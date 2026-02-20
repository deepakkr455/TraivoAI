import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Product } from '../../AgentAffiliate/types';
import { getListedProducts } from '../../AgentAffiliate/services/supabaseService';
import { ProductCard } from '../../AgentAffiliate/components/ProductCard';
import {
    ArrowLeft,
    Sparkles,
    Search,
    X,
    RefreshCw,
    Compass,
    ChevronRight,
    Star,
    Zap,
    Tag,
    Heart
} from 'lucide-react';
import { FloatingChatIcon } from '../components/FloatingChatIcon';
import { useAuth } from '../../../hooks/useAuth';
import { AffiliateBanner } from '../../AgentAffiliate/components/AffiliateBanner';
import { ChevronLeft as ChevronLeftPagination, ChevronRight as ChevronRightPagination } from 'lucide-react';

const ITEMS_PER_PAGE = 12; // 3 rows in 4-column layout


const BestDealsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const gridRef = React.useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadDeals();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, showSavedOnly]);

    const loadDeals = async () => {
        setIsLoading(true);
        try {
            const allDeals = await getListedProducts();
            const activeDeals = allDeals.filter(p => p.is_active !== false);
            const sortedDeals = activeDeals.sort((a, b) => (b.is_boosted ? 1 : 0) - (a.is_boosted ? 1 : 0));
            setProducts(sortedDeals);
        } catch (error) {
            console.error("Failed to load deals", error);
        } finally {
            setIsLoading(false);
        }
    };

    // First, apply saved filter if needed
    let displayProducts = products;
    if (showSavedOnly) {
        const likedIds = Object.keys(localStorage).filter(k => k.startsWith('like_') && localStorage.getItem(k) === 'true').map(k => k.replace('like_', ''));
        displayProducts = products.filter(p => likedIds.includes(p.id));
    }

    // Then apply search filter
    const filteredProducts = displayProducts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.package_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const heroDeal = filteredProducts.find(p => p.is_boosted) || filteredProducts[0];
    const gridDeals = filteredProducts.filter(p => p.id !== heroDeal?.id);

    // Pagination calculations
    const finalGridDeals = searchTerm ? filteredProducts : gridDeals;
    const totalPages = Math.ceil(finalGridDeals.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedDeals = finalGridDeals.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        if (gridRef.current) {
            gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Get saved count for badge
    const savedCount = Object.keys(localStorage).filter(k => k.startsWith('like_') && localStorage.getItem(k) === 'true').length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            <Header showBackground={true} />

            <main className="flex-1 overflow-y-auto w-full pb-24">
                <div className="container mx-auto px-4 py-8 md:py-12">

                    {/* Centered Editorial Title */}
                    <div className="flex flex-col items-center justify-center mb-10 md:mb-16 text-center">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
                            Exclusive <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Travel Deals</span>
                        </h1>
                        <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
                            Hand-picked adventures and luxury escapes, curated by world-class travel architects just for your story.
                        </p>
                    </div>

                    {/* Centered Search Bar (Aligned with MyBlogsPage design) */}
                    {/* Centered Search Bar & Controls */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12 w-full max-w-4xl mx-auto px-2">
                        <div className="w-full md:flex-1 relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search destinations, styles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-12 pr-12 py-3.5 md:py-4 bg-white border border-gray-200 rounded-[2rem] leading-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-base md:text-lg shadow-sm hover:shadow-md transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                            {user && (
                                <button
                                    onClick={() => setShowSavedOnly(!showSavedOnly)}
                                    className={`flex-1 md:flex-none px-6 py-3.5 md:py-4 rounded-full border shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 ${showSavedOnly ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-gray-200 text-gray-400 hover:text-pink-600'}`}
                                    title={showSavedOnly ? 'Show All Deals' : 'Show Saved Only'}
                                >
                                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${showSavedOnly ? 'fill-pink-600' : ''}`} />
                                    <span className="text-sm font-medium whitespace-nowrap">Saved Deals</span>
                                </button>
                            )}

                            <button
                                onClick={loadDeals}
                                className="p-3.5 md:p-4 bg-white text-gray-400 hover:text-teal-600 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all active:rotate-180 flex items-center justify-center shrink-0"
                                title="Refresh Deals"
                            >
                                <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Curating the best experiences...</p>
                        </div>
                    ) : (
                        <div className="max-w-[1440px] mx-auto space-y-12 md:space-y-20">

                            {/* Hero Deal Section */}
                            {heroDeal && !searchTerm && !showSavedOnly && (
                                <div className="space-y-5 md:space-y-8">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-teal-600">Deal of the Week</h2>
                                        <div className="h-px flex-1 bg-teal-100" />
                                    </div>
                                    <div
                                        onClick={() => navigate(`/user/deals?id=${heroDeal.id}`)}
                                        className="group relative w-full aspect-[4/5] sm:aspect-[21/9] lg:aspect-[3/1] rounded-[2rem] md:rounded-[3rem] overflow-hidden cursor-pointer shadow-xl transition-all duration-700 border border-gray-100"
                                    >
                                        <img
                                            src={heroDeal.media_urls?.[0] || 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1887&auto=format&fit=crop'}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                            alt={heroDeal.title}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/20 to-transparent" />

                                        <div className="absolute top-4 md:top-8 left-4 md:left-8">
                                            <div className="bg-white/20 backdrop-blur-md text-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-2">
                                                <Zap className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                Boosted Deal
                                            </div>
                                        </div>

                                        <div className="absolute bottom-6 md:bottom-12 left-6 md:left-12 right-6 md:right-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                                            <div className="max-w-3xl">
                                                <div className="flex items-center gap-2 text-teal-400 mb-2 md:mb-4">
                                                    <Tag className="w-3.5 h-3.5 md:w-5 md:h-5" />
                                                    <span className="font-bold uppercase tracking-widest text-[10px] md:text-xs">{heroDeal.package_type} • {heroDeal.duration}</span>
                                                </div>
                                                <h3 className="text-3xl md:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">{heroDeal.title}</h3>
                                                <div className="flex items-center gap-1 mt-2 text-yellow-400">
                                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                                    <span className="text-white ml-2 text-sm font-bold">Recommended</span>
                                                </div>
                                            </div>
                                            <button className="w-full sm:w-auto bg-white text-teal-600 px-8 py-4 rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-3 hover:bg-teal-50 transition-all shadow-xl active:scale-95 group/btn">
                                                View Deal Details
                                                <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Grid of Deals */}
                            <div className="space-y-8 md:space-y-12" ref={gridRef}>
                                <div className="flex items-center gap-4">
                                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-gray-400">
                                        {searchTerm ? `Search Results for "${searchTerm}"` : 'Hand-Picked Adventures'}
                                    </h2>
                                    <div className="h-px flex-1 bg-gray-100" />
                                </div>

                                {paginatedDeals.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
                                            {paginatedDeals.map((product) => (
                                                <div key={product.id} className="group cursor-pointer">
                                                    <ProductCard
                                                        product={product}
                                                        onClick={() => navigate(`/user/deals?id=${product.id}`)}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination UI */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center gap-2 mt-12">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="p-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-teal-600 hover:border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                                >
                                                    <ChevronLeftPagination className="w-5 h-5" />
                                                </button>

                                                <div className="flex items-center gap-2">
                                                    {[...Array(totalPages)].map((_, i) => {
                                                        const pageNum = i + 1;
                                                        // Simple pagination logic: show all for few pages, or current and neighbors for many
                                                        if (totalPages <= 7 || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2) || pageNum === 1 || pageNum === totalPages) {
                                                            return (
                                                                <button
                                                                    key={pageNum}
                                                                    onClick={() => handlePageChange(pageNum)}
                                                                    className={`w-12 h-12 rounded-xl border font-bold transition-all shadow-sm ${currentPage === pageNum
                                                                        ? 'bg-teal-600 border-teal-600 text-white'
                                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-teal-200 hover:text-teal-600'
                                                                        }`}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            );
                                                        } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                                                            return <span key={pageNum} className="text-gray-400">...</span>;
                                                        }
                                                        return null;
                                                    })}
                                                </div>

                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="p-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-teal-600 hover:border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                                >
                                                    <ChevronRightPagination className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm max-w-3xl mx-auto">
                                        <div className="bg-gray-50 rounded-full p-8 mb-6">
                                            <Compass className="w-16 h-16 text-gray-300" />
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-black mb-3 text-gray-900">No deals found</h2>
                                        <p className="text-gray-500 max-w-md mb-8 text-base md:text-lg">
                                            We couldn't find any adventures matching your search. Try a different destination or style!
                                        </p>
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-full font-black text-lg transition-all shadow-xl"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <FloatingChatIcon />

            <style>{`
                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 20px; }
                ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}</style>
        </div>
    );
};

export default BestDealsPage;
