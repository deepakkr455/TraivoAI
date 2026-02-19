import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Product } from '../../AgentAffiliate/types';
import { getListedProducts, getSavedDeals } from '../../AgentAffiliate/services/supabaseService';
import { ProductCard } from '../../AgentAffiliate/components/ProductCard';
import { Heart, ArrowLeft, Search } from 'lucide-react';
import { FloatingChatIcon } from '../components/FloatingChatIcon';
import { useAuth } from '../../../hooks/useAuth';

const SavedDealsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const loadSavedDeals = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // Fetch saved deal IDs
                const savedIds = await getSavedDeals(user.id);

                if (savedIds.length === 0) {
                    setProducts([]);
                    setIsLoading(false);
                    return;
                }

                // Fetch all products to filter (Optimization: In future, fetch only specific IDs if API supports)
                const allDeals = await getListedProducts();

                // Filter
                const savedProducts = allDeals.filter(p => savedIds.includes(p.id));
                setProducts(savedProducts);

            } catch (error) {
                console.error("Failed to load saved deals", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSavedDeals();
    }, [user]);

    return (
        <div className="h-screen bg-gray-50 text-gray-900 flex flex-col font-sans overflow-hidden">
            <Header showBackground={true} />

            <div className="flex-1 overflow-y-auto w-full">
                <div className="container mx-auto px-4 py-8">

                    <button
                        onClick={() => navigate(-1)}
                        className="mb-8 flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Deals
                    </button>

                    {/* Page Header */}
                    <div className="flex flex-col items-center justify-center mb-12 text-center">
                        {/* <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                            <Heart className="w-8 h-8 fill-current" />
                        </div> */}
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-600">Saved Collection</span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            The adventures you're dreaming about, all in one place.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-64 gap-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
                            <p className="text-gray-500 text-sm animate-pulse">Loading your favorites...</p>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto px-6 pb-12">
                            {products.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {products.map((product) => (
                                        <div key={product.id} className="group cursor-pointer">
                                            <ProductCard
                                                product={product}
                                                onClick={() => navigate(`/user/deals?id=${product.id}`)}
                                                isLiked={true} // It's the saved page, so it's liked
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm max-w-2xl mx-auto">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Heart className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No saved deals yet</h3>
                                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                        Found something you love? Tap the heart icon to save it here for later!
                                    </p>
                                    <button
                                        onClick={() => navigate('/user/best-deals')}
                                        className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-500/20"
                                    >
                                        Explore Deals
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <FloatingChatIcon />
        </div>
    );
};

export default SavedDealsPage;
