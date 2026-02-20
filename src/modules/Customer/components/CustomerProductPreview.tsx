
import React, { useState } from 'react';
import { Product } from '../../AgentAffiliate/types';
import { XIcon, StarIcon, ClockIcon, TourTypeIcon, GroupSizeIcon, LanguagesIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, MapIcon, HeartIcon } from '../../AgentAffiliate/components/Icons';
import { ItineraryTimeline } from '../../AgentAffiliate/components/ItineraryTimeline';
import { useAuth } from '../../../hooks/useAuth';
import { messageService } from '../services/messageService';
import { getPublicProfile } from '../../AgentAffiliate/services/supabaseService';
import { useNavigate } from 'react-router-dom';

interface CustomerProductPreviewProps {
    product: Product;
    onClose: () => void;
    onLikeToggle?: (isLiked: boolean) => void;
    tripId?: string;
}

export const CustomerProductPreview: React.FC<CustomerProductPreviewProps> = ({ product, onClose, onLikeToggle, tripId }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'policies'>('overview');
    const [agentProfile, setAgentProfile] = useState<any>(null);

    React.useEffect(() => {
        const fetchAgent = async () => {
            if (product.business_id) {
                const profile = await getPublicProfile(product.business_id);
                setAgentProfile(profile);
            }
        };
        fetchAgent();
    }, [product.business_id]);

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/user/deals?id=${product.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    // Mock Like State (using localStorage in a real implementation this would trigger a backend call)
    // For now we just use React state to show the UI interaction
    const [isLiked, setIsLiked] = useState(() => {
        const liked = localStorage.getItem(`like_${product.id}`);
        return !!liked;
    });

    const handlePrevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? product.media_urls.length - 1 : prevIndex - 1
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === product.media_urls.length - 1 ? 0 : prevIndex + 1
        );
    };

    const toggleLike = () => {
        const newState = !isLiked;
        setIsLiked(newState);
        if (newState) {
            localStorage.setItem(`like_${product.id}`, 'true');
        } else {
            localStorage.removeItem(`like_${product.id}`);
        }
        if (onLikeToggle) onLikeToggle(newState);
    };

    const handleChatRedirect = async () => {
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
        } else {
            alert("Failed to start conversation. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-0 md:p-4 z-50 backdrop-blur-sm font-sans">
            <div className="bg-white dark:bg-gray-900 rounded-none md:rounded-2xl shadow-2xl w-full max-w-[96vw] h-full md:h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
                {/* Header */}
                <header className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shrink-0">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 truncate">
                            {product.title}
                            <span className="hidden md:inline-block px-3 py-1 text-sm font-bold uppercase tracking-wide text-teal-700 bg-teal-50 rounded-full border border-teal-100 whitespace-nowrap">
                                {product.duration}
                            </span>
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            <span className="flex items-center gap-1 text-yellow-500"><StarIcon /> <strong className="text-gray-900 dark:text-gray-200">{product.reviews?.count || 0}</strong> Reviews</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="flex items-center gap-1 truncate"><MapIcon /> {product.location}</span>
                        </div>
                    </div>
                    <button onClick={handleShare} className="p-2 md:p-3 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-gray-50 dark:bg-gray-800/50 shrink-0 mr-2" title="Share">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                    <button onClick={onClose} className="p-2 md:p-3 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-gray-50 dark:bg-gray-800/50 shrink-0">
                        <XIcon />
                    </button>
                </header>

                <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">

                        {/* Gallery */}
                        <div className="relative w-full aspect-video lg:aspect-[21/9] bg-gray-100 group">
                            <img
                                src={product.media_urls?.[currentImageIndex] || 'https://placehold.co/800x400?text=No+Image'}
                                alt="Trip view"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                            {/* Like Button Overlay */}
                            <button
                                onClick={toggleLike}
                                className="absolute top-4 right-4 p-3 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-all shadow-lg group-hover:scale-105"
                            >
                                {isLiked ? (
                                    <HeartIcon className="text-red-500 fill-red-500" />
                                ) : (
                                    <HeartIcon className="text-white" />
                                )}
                            </button>

                            {product.media_urls.length > 1 && (
                                <>
                                    <button onClick={handlePrevImage} className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2 md:p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 hidden md:block">
                                        <ChevronLeftIcon />
                                    </button>
                                    <button onClick={handleNextImage} className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2 md:p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 hidden md:block">
                                        <ChevronRightIcon />
                                    </button>
                                </>
                            )}
                            <div className="absolute bottom-6 left-6 flex gap-2 overflow-x-auto max-w-full pr-4">
                                {product.media_urls.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`w-2 md:w-3 h-2 md:h-3 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/60 hover:bg-white/80'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-10 px-4 md:px-8 flex gap-4 md:gap-8 text-sm md:text-base font-bold tracking-wide overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-4 md:py-5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-teal-600 text-teal-700 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('itinerary')}
                                className={`py-4 md:py-5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'itinerary' ? 'border-teal-600 text-teal-700 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            >
                                Itinerary
                            </button>
                            <button
                                onClick={() => setActiveTab('policies')}
                                className={`py-4 md:py-5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'policies' ? 'border-teal-600 text-teal-700 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            >
                                Inclusions & Policies
                            </button>
                        </div>

                        <div className="p-4 md:p-8 space-y-8 md:space-y-12 max-w-5xl mx-auto pb-32 lg:pb-8">

                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-fade-in">
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-4 md:p-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                        <InfoItem icon={<ClockIcon />} label="Duration" value={product.duration} />
                                        <InfoItem icon={<TourTypeIcon />} label="Type" value={product.package_type} />
                                        <InfoItem icon={<GroupSizeIcon />} label="Group Size" value={product.group_size} />
                                        <InfoItem icon={<LanguagesIcon />} label="Language" value={product.languages.join(', ')} />
                                    </div>

                                    <section>
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">Package Overview</h3>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed md:leading-9 text-base md:text-lg font-light text-justify">
                                            {product.description}
                                        </p>
                                    </section>

                                    <section>
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">Trip Highlights</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                            {product.things_to_do && product.things_to_do.length > 0 ? (
                                                product.things_to_do.map((item, i) => (
                                                    <div key={i} className="flex items-center gap-4 p-4 md:p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="text-teal-600 bg-teal-50 p-2 rounded-full shrink-0"><CheckCircleIcon /></div>
                                                        <span className="text-gray-800 dark:text-gray-200 font-medium text-base md:text-lg">{item}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 text-base italic">Detailed highlights available upon request.</p>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* ITINERARY TAB */}
                            {activeTab === 'itinerary' && (
                                <div className="animate-fade-in">
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 md:mb-10">Day-wise Itinerary</h3>
                                    <ItineraryTimeline itinerary={product.itinerary} />
                                </div>
                            )}

                            {/* POLICIES TAB */}
                            {activeTab === 'policies' && (
                                <div className="space-y-8 md:space-y-12 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                        <div className="border border-green-200 bg-green-50/50 dark:bg-green-900/10 p-6 md:p-8 rounded-2xl">
                                            <h4 className="font-bold text-green-800 dark:text-green-400 mb-4 md:mb-6 flex items-center gap-3 text-lg md:text-xl">
                                                Inclusions
                                            </h4>
                                            <ul className="space-y-3 md:space-y-4">
                                                {product.inclusions?.map((inc, i) => (
                                                    <li key={i} className="flex items-start gap-3 md:gap-4 text-gray-700 dark:text-gray-300 text-base md:text-lg">
                                                        <span className="text-green-500 mt-1 text-lg md:text-xl">✔</span> {inc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="border border-red-200 bg-red-50/50 dark:bg-red-900/10 p-6 md:p-8 rounded-2xl">
                                            <h4 className="font-bold text-red-800 dark:text-red-400 mb-4 md:mb-6 flex items-center gap-3 text-lg md:text-xl">
                                                Exclusions
                                            </h4>
                                            <ul className="space-y-3 md:space-y-4">
                                                {product.exclusions?.map((exc, i) => (
                                                    <li key={i} className="flex items-start gap-3 md:gap-4 text-gray-700 dark:text-gray-300 text-base md:text-lg">
                                                        <span className="text-red-400 mt-1 text-lg md:text-xl">✖</span> {exc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Cancellation & Terms blocks same as original... removed for brevity if no changes, but including for completeness */}
                                    <div className="space-y-8">
                                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8">
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-xl">Cancellation Policy</h4>
                                            <ul className="space-y-3 text-gray-600 dark:text-gray-400 list-disc list-inside text-base">
                                                {product.cancellation_policy?.map((p, i) => <li key={i}>{p}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Branding Footer */}
                            <div className="mt-12 md:mt-20 pt-10 border-t border-gray-100 dark:border-gray-800">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-6">Book with Confidence</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xl md:text-2xl">🛡️</div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm md:text-base">Verified Agent</p>
                                            <p className="text-xs md:text-sm text-gray-500">Identity checked</p>
                                        </div>
                                    </div>
                                    {/* ... other footer items ... */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Action Panel - Sticky on Desktop, Fixed bottom on Mobile */}
                    <div className="w-full lg:w-[400px] bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 flex-shrink-0 flex flex-col z-20 shadow-[0_-5px_30px_rgba(0,0,0,0.1)] lg:shadow-2xl fixed bottom-0 left-0 lg:relative lg:bottom-auto lg:left-auto">
                        <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs md:text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Starting from</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl md:text-3xl font-bold text-teal-600">
                                            Rs. {Math.min(...(product.pricing?.map(p => p.cost) || [0])).toLocaleString()}
                                        </span>
                                        <span className="text-gray-400 font-medium text-sm">/ person</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Listed By</label>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg overflow-hidden">
                                            {/* Ideally use agent avatar if available */}
                                            {agentProfile?.avatar_url ? (
                                                <img src={agentProfile.avatar_url} alt="Agent" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{agentProfile?.full_name ? agentProfile.full_name.charAt(0).toUpperCase() : (product.business_id ? 'A' : 'T')}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {agentProfile?.full_name || (product.business_id ? 'Verified Traivo Agent' : 'Travel Agent')}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Member Since {agentProfile?.created_at ? new Date(agentProfile.created_at).getFullYear() : '2024'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleChatRedirect}
                                    className="w-full py-3 md:py-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base md:text-lg shadow-lg shadow-teal-500/30 transition-all transform hover:-translate-y-1 block"
                                >
                                    Enquire Now
                                </button>
                                <p className="text-center text-[10px] md:text-xs text-gray-400">
                                    No booking fees • Direct contact with agent
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>


            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <span className="scale-90">{icon}</span>
            <p className="text-[10px] md:text-[11px] uppercase font-bold tracking-widest">{label}</p>
        </div>
        <p className="font-bold text-base md:text-lg text-gray-900 dark:text-white truncate" title={value}>{value}</p>
    </div>
);
