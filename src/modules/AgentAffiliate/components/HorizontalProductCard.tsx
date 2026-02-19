import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { messageService } from '../../Customer/services/messageService';
import { Product } from '../types';
import { ClockIcon, LightningIcon, StarIcon } from './Icons';

interface HorizontalProductCardProps {
    product: Product;
    onClick: () => void;
    tripId?: string;
}

export const HorizontalProductCard: React.FC<HorizontalProductCardProps> = ({ product, onClick, tripId }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const formatLocation = (location: string) => {
        return (location || '').split(',')[0].trim().toUpperCase();
    }

    const startingPrice = product.pricing?.length > 0
        ? Math.min(...product.pricing.map(p => p.cost))
        : 0;

    const handleChatClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            navigate('/login');
            return;
        }

        const agentId = product.business_id || '29605330-80a2-4752-9b2f-2267f565f3f3';
        const customerName = (user as any)?.user_metadata?.full_name || user.email || 'Traveler';
        const avatarUrl = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || null;

        const inquiryId = await messageService.checkOrCreateInquiry(product.id, agentId, user.id, customerName, avatarUrl, tripId);

        if (inquiryId) {
            navigate(`/user/messages?inquiry_id=${inquiryId}`);
        }
    };

    return (
        <div
            onClick={onClick}
            className="flex bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer h-32"
        >
            <div className="relative w-1/3 min-w-[120px]">
                <img
                    src={product.media_urls?.[0] || 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1887&auto=format&fit=crop'}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            </div>

            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest truncate">
                            {formatLocation(product.location)}
                        </span>
                        <div className="flex items-center">
                            <StarIcon />
                            <span className="text-[10px] ml-0.5 text-gray-400 font-bold">{product.reviews?.count || 4}</span>
                        </div>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight truncate-2-lines">
                        {product.title}
                    </h3>
                </div>

                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2 text-[10px] text-gray-400">
                        <div className="flex items-center">
                            <ClockIcon />
                            <span className="ml-1 truncate">{product.duration}</span>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                        <button
                            onClick={handleChatClick}
                            className="p-2 text-gray-400 hover:text-white hover:bg-teal-500 rounded-full transition-all duration-300 border border-gray-100 hover:border-teal-500 shadow-sm group/chat"
                            title="Chat with Agent"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover/chat:scale-110 transition-transform"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                        </button>
                        <div>
                            <div className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Starts at</div>
                            <div className="text-teal-600 font-black text-sm">₹{startingPrice.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
