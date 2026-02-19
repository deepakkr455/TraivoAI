import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { messageService } from '../../Customer/services/messageService';
import { Product } from '../types';
import { ClockIcon, LightningIcon, StarIcon, HeartIcon } from './Icons';
import { incrementProductView, incrementProductClick } from '../services/supabaseService';

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

    const toggleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }

        const newStatus = !localLiked;
        setLocalLiked(newStatus);

        if (newStatus) {
            localStorage.setItem(`like_${product.id}`, 'true');
        } else {
            localStorage.removeItem(`like_${product.id}`);
        }
    };


    const cardRef = React.useRef<HTMLDivElement>(null);
    const hasViewed = React.useRef(false);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Track view when visible for 2 seconds
    React.useEffect(() => {
        if (hasViewed.current || !product?.id) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    // Element is visible (50%), start timer
                    timerRef.current = setTimeout(() => {
                        if (!hasViewed.current && product?.id) {
                            incrementProductView(product.id, { context: 'card_impression' });
                            hasViewed.current = true;
                            observer.disconnect();
                        }
                    }, 2000); // 2 seconds threshold
                } else {
                    // Element left visibility, clear timer
                    if (timerRef.current) {
                        clearTimeout(timerRef.current);
                        timerRef.current = null;
                    }
                }
            },
            { threshold: 0.5 } // 50% of the card must be visible
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            observer.disconnect();
        };
    }, [product?.id]);

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

    const handleCardClick = (e: React.MouseEvent) => {
        // Track click
        if (product?.id) incrementProductClick(product.id);
        onClick();
    };

    return (
        <div ref={cardRef} onClick={handleCardClick} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 w-full cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
            <div className="relative">
                <img
                    src={product.media_urls?.[0] || 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1887&auto=format&fit=crop'}
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-t-lg"></div>

                <div className="absolute top-3 right-3 z-10" onClick={toggleLike}>
                    <HeartIcon filled={localLiked} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h2 className="text-3xl font-extrabold tracking-wider">{formatLocation(product.location)}</h2>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs font-semibold tracking-widest opacity-80">{(product.theme_tags || '').toUpperCase().split(',').join(' - ')}</p>
                        <button className="bg-yellow-400 text-black text-[10px] font-bold px-3 py-1.5 rounded hover:bg-yellow-300 transition-colors shadow-sm">
                            BOOK NOW
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 leading-tight text-blue-900 dark:text-blue-300 mb-2">{product.title}</h3>

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
