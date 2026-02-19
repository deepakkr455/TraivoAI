
import React, { useEffect, useState } from 'react';
import { Product } from '../../AgentAffiliate/types';
import { getListedProducts } from '../../AgentAffiliate/services/supabaseService';
import { ProductCard } from '../../AgentAffiliate/components/ProductCard';
import { X, ChevronUp } from 'lucide-react';

interface RecommendationsSlideUpProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RecommendationsSlideUp: React.FC<RecommendationsSlideUpProps> = ({ isOpen, onClose }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && products.length === 0) {
            loadProducts();
        }
    }, [isOpen]);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const data = await getListedProducts();
            setProducts(data);
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center justify-end pointer-events-none">
             {/* Overlay - optional, maybe just allow interaction with back? 
                 Let's make it modal-like for focus but allow clicking out if we add a backdrop.
                 For this 'slide up' feel, usually it overlays content.
             */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] pointer-events-auto transform transition-transform duration-500 ease-in-out border-t border-white/10 max-h-[80vh] flex flex-col">
                
                {/* Handle bar for dragging visual */}
                <div className="w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={onClose}>
                    <div className="w-16 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>

                <div className="px-6 pb-4 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recommended Trips</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Curated packages just for you</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-gray-50 dark:bg-slate-950/50">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map(product => (
                                <div key={product.id} className="w-full">
                                    <ProductCard 
                                        product={product} 
                                        onClick={() => console.log('Product clicked', product.id)} 
                                    />
                                </div>
                            ))}
                            {products.length === 0 && (
                                <div className="col-span-full text-center py-10 text-gray-500">
                                    No recommendations available at the moment.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
