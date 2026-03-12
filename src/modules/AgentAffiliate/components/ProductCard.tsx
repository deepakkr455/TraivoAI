import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { messageService } from '../../Customer/services/messageService';
import { Product } from '../types';
import { ClockIcon, LightningIcon, StarIcon, HeartIcon } from './Icons';
import { incrementProductView, incrementProductClick, saveDeal, unsaveDeal, supabase } from '../services/supabaseService';
import { useVisibilityTracker } from '../../../hooks/useVisibilityTracker';

interface ProductCardProps {
    product: Product;
    onClick: () => void;
    isLiked?: boolean;
    showChat?: boolean; // Optional prop to control visibility
    tripId?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, isLiked, showChat = true, tripId }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [localLiked, setLocalLiked] = React.useState(isLiked);

    React.useEffect(() => {
        setLocalLiked(isLiked);
    }, [isLiked]);

    const toggleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }

        const newStatus = !localLiked;
        setLocalLiked(newStatus); // Optimistic update

        try {
            if (newStatus) {
                console.log(`💾 Saving deal ${product.id} for user ${user.id}...`);
                localStorage.setItem(`like_${product.id}`, 'true');
                await saveDeal(user.id, product.id);
                console.log(`✅ Deal ${product.id} saved successfully.`);
            } else {
                console.log(`🗑️ Unsaving deal ${product.id} for user ${user.id}...`);
                localStorage.removeItem(`like_${product.id}`);
                await unsaveDeal(user.id, product.id);
                console.log(`✅ Deal ${product.id} unsaved successfully.`);
            }
        } catch (error) {
            console.error("❌ Failed to sync liked status with database:", error);
            // Optionally revert local state if it fails, but keeping it for now to avoid flickering
        }
    };


    const cardRef = useVisibilityTracker<HTMLDivElement>({
        onVisibleThreshold: () => {
            if (product?.id) {
                incrementProductView(product.id, { context: 'card_impression' });
            }
        },
        thresholdMs: 10000,
        intersectionThreshold: 0.5
    });

    // Helper to format the location to be bold and uppercase like the design
    const formatLocation = (location: string) => {
        return (location || '').split(',')[0].trim().toUpperCase();
    }

    // Find the minimum price to display as "from Rs. XXX"
    const startingPrice = product.pricing?.length > 0
        ? Math.min(...product.pricing.map(p => p.cost))
        : 0;

    const handleChatClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // Track click
        if (product?.id) {
            incrementProductClick(product.id);
        } else {
            console.warn("ProductCard: Missing product ID for tracking click");
        }

        if (!user) {
            // Redirect to login if not authenticated, redirect back to current page?
            // For now just go to login
            navigate('/login');
            return;
        }

        // Use business_id from Product type. Fallback only for absolute safety.
        const agentId = product.business_id || '29605330-80a2-4752-9b2f-2267f565f3f3';

        const customerName = (user as any)?.user_metadata?.full_name || user.email || 'Traveler';
        const avatarUrl = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || null;

        // Navigate immediately to messages with loading state handling there via ID, or create first.
        const inquiryId = await messageService.checkOrCreateInquiry(product.id, agentId, user.id, customerName, avatarUrl, tripId);

        if (inquiryId) {
            navigate(`/user/messages?inquiry_id=${inquiryId}`);
        } else {
            console.error("Failed to start chat");
        }
    };

    const resolveImageUrl = (url: string) => {
        if (!url) return 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1887&auto=format&fit=crop';

        // If it's already a full URL (http, https, blob, data), return as is
        if (/^(http|https|blob|data):/i.test(url)) return url;

        // If it looks like a Supabase storage path (no scheme), try to get public URL
        // Assuming 'media' bucket as default for listings
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(url);
        return publicUrl;
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Track click
        if (product?.id) incrementProductClick(product.id);
        onClick();
    };

    return (
        <div ref={cardRef} onClick={handleCardClick} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 w-full cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
            <div className="relative">
                <img
                    src={resolveImageUrl(product.media_urls?.[0])}
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-t-lg"></div>

                <div className="absolute top-3 right-3 z-10" onClick={toggleLike}>
                    <HeartIcon filled={localLiked} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h2 className="text-3xl font-bold tracking-[0.2em]">{formatLocation(product.location)}</h2>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-80">{(product.theme_tags || '').toUpperCase().split(',').join(' - ')}</p>
                        <button className="bg-yellow-400 text-black text-[10px] font-bold px-3 py-1.5 rounded hover:bg-yellow-300 transition-colors shadow-sm tracking-[0.2em]">
                            BOOK NOW
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-tight text-blue-900 dark:text-blue-300 mb-2">{product.title}</h3>

                <div className="flex items-center my-2">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} />
                    ))}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 mt-auto">
                    <div className="flex items-center gap-2">
                        <ClockIcon /> <span>{product.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                        <LightningIcon /> <span>from Rs. {startingPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
