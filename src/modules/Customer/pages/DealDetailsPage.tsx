
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Product } from '../../AgentAffiliate/types';
import { getListedProducts, getPublicProfile, getSavedDeals, saveDeal, unsaveDeal, trackProductTimeSpent, incrementProductView } from '../../AgentAffiliate/services/supabaseService';
import { XIcon, StarIcon, ClockIcon, TourTypeIcon, GroupSizeIcon, LanguagesIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, MapIcon, HeartIcon } from '../../AgentAffiliate/components/Icons';
import { ItineraryTimeline } from '../../AgentAffiliate/components/ItineraryTimeline';
import { useAuth } from '../../../hooks/useAuth';
import { messageService } from '../services/messageService';
import Header from '../components/Header';
import { ArrowLeft, MessageCircle, Share2 } from 'lucide-react';
import { AffiliateBanner } from '../../AgentAffiliate/components/AffiliateBanner';
import { FloatingChatIcon } from '../components/FloatingChatIcon';

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <span className="scale-90">{icon}</span>
            <p className="text-[10px] md:text-[11px] uppercase font-bold tracking-widest">{label}</p>
        </div>
        <p className="font-bold text-base md:text-lg text-gray-900 dark:text-white truncate" title={value}>{value}</p>
    </div>
);

const DealDetailsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('id');
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'policies'>('overview');
    const [isLiked, setIsLiked] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [agentProfile, setAgentProfile] = useState<any>(null);

    // Robust Time spent & Scroll tracking
    const maxScrollDepth = React.useRef(0);

    useEffect(() => {
        const updateScrollDepth = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollTop = window.scrollY;
            const depth = Math.round((scrollTop / scrollHeight) * 100);
            if (depth > maxScrollDepth.current) {
                maxScrollDepth.current = depth;
            }
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', updateScrollDepth);
        return () => window.removeEventListener('scroll', updateScrollDepth);
    }, []);

    useEffect(() => {
        if (!productId) return;

        let startTime = Date.now();
        const searchParamsObj = Object.fromEntries([...searchParams]);

        const trackTime = () => {
            const endTime = Date.now();
            const durationSeconds = Math.floor((endTime - startTime) / 1000);

            // Only track if time spent is meaningful (> 1 sec)
            if (durationSeconds > 1) {
                trackProductTimeSpent(productId, durationSeconds, user?.id, {
                    scroll_depth: maxScrollDepth.current,
                    source: searchParamsObj.ref || searchParamsObj.source || 'direct',
                    ...searchParamsObj // Capture all UTMS
                });
            }
            // Reset startTime for next interval/visibility cycle
            startTime = Date.now();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                trackTime();
            } else {
                startTime = Date.now();
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', trackTime);

        return () => {
            trackTime();
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', trackTime);
        };
    }, [productId, user]);

    // Track View with Metadata on Mount
    useEffect(() => {
        if (!productId) return;
        const searchParamsObj = Object.fromEntries([...searchParams]);

        // Track the view event explicitly with metadata
        incrementProductView(productId, {
            context: 'detail_page',
            source: searchParamsObj.ref || searchParamsObj.source || 'direct',
            ...searchParamsObj
        });

    }, [productId]);

    const loadProduct = async () => {
        if (!productId) {
            setError("No deal ID provided.");
            setLoading(false);
            return;
        }

        console.log("🔄 Loading deal details for:", productId);

        try {
            // In a real app, we'd have a getProductById(id) for efficiency.
            // Reusing getListedProducts() and filtering is okay for prototype/MVP of this scale.
            const allProducts = await getListedProducts();
            console.log(`📦 Fetched ${allProducts.length} active products`);

            const found = allProducts.find(p => p.id === productId);
            console.log("🔎 Found product:", found ? "Yes" : "No", found?.title);

            if (found) {
                setProduct(found);

                // Fetch Agent Profile
                if (found.business_id) {
                    getPublicProfile(found.business_id).then(profile => setAgentProfile(profile));
                }

                // check internal localStorage like
                const localLike = localStorage.getItem(`like_${found.id}`);

                // check database saved status if user is logged in
                if (user) {
                    const savedIds = await getSavedDeals(user.id);
                    if (savedIds.includes(found.id)) {
                        setIsLiked(true);
                        // Sync local storage just in case
                        localStorage.setItem(`like_${found.id}`, 'true');
                    } else {
                        setIsLiked(!!localLike);
                    }
                } else {
                    setIsLiked(!!localLike);
                }

            } else {
                setError("Deal not found.");
            }
        } catch (err) {
            console.error("Error loading deal:", err);
            setError("Failed to load deal details.");
        } finally {
            setLoading(false);
        }
    };

    // Trigger data loading
    useEffect(() => {
        loadProduct();
    }, [productId]);

    const handlePrevImage = () => {
        if (!product) return;
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? product.media_urls.length - 1 : prevIndex - 1
        );
    };

    const handleNextImage = () => {
        if (!product) return;
        setCurrentImageIndex((prevIndex) =>
            prevIndex === product.media_urls.length - 1 ? 0 : prevIndex + 1
        );
    };

    const toggleLike = async () => {
        if (!product) return;

        const newState = !isLiked;
        setIsLiked(newState);

        if (newState) {
            localStorage.setItem(`like_${product.id}`, 'true');
            if (user) {
                try {
                    await saveDeal(user.id, product.id);
                } catch (e) {
                    console.error("Failed to save deal to DB", e);
                }
            }
        } else {
            localStorage.removeItem(`like_${product.id}`);
            if (user) {
                try {
                    await unsaveDeal(user.id, product.id);
                } catch (e) {
                    console.error("Failed to unsave deal from DB", e);
                }
            }
        }
    }

    const handleShare = async () => {
        const shareUrl = window.location.href;
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const handleChatRedirect = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!product) return;

        const agentId = product.business_id || '29605330-80a2-4752-9b2f-2267f565f3f3';
        const customerName = (user as any)?.user_metadata?.full_name || user.email || 'Traveler';
        const avatarUrl = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || null;

        const inquiryId = await messageService.checkOrCreateInquiry(product.id, agentId, user.id, customerName, avatarUrl);

        if (inquiryId) {
            navigate(`/user/messages?inquiry_id=${inquiryId}`);
        } else {
            alert("Failed to start conversation. Please try again.");
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header showBackground={true} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header showBackground={true} />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
                    <p className="text-gray-500 mb-6">{error || "Something went wrong."}</p>
                    <button
                        onClick={() => navigate('/user/best-deals')}
                        className="px-6 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors"
                    >
                        Browse All Deals
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            {/* Back & Share Buttons - Fixed at Corner */}
            <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 bg-white hover:bg-gray-50 hover:text-teal-700 border border-gray-200 shadow-sm hover:shadow-md transition-all font-medium px-4 py-2 rounded-lg"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium text-sm">Back</span>
                </button>
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-gray-600 bg-white hover:bg-gray-50 hover:text-teal-700 border border-gray-200 shadow-sm hover:shadow-md transition-all font-medium px-4 py-2 rounded-lg"
                    title="Share Deal"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>

            <main className="pt-4 pb-24 max-w-7xl mx-auto px-4 md:px-8">

                {/* Image Gallery Hero */}
                <div className="relative w-full aspect-video lg:aspect-[2.5/1] bg-gray-200 rounded-3xl overflow-hidden shadow-xl mb-8 group">
                    <img
                        src={product.media_urls?.[currentImageIndex] || 'https://placehold.co/800x400?text=No+Image'}
                        alt={product.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                    {/* Like Button */}
                    <button
                        onClick={toggleLike}
                        className="absolute top-6 right-6 p-4 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md transition-all shadow-lg group-hover:scale-105 border border-white/30"
                    >
                        {isLiked ? (
                            <HeartIcon className="text-red-500 fill-red-500 w-8 h-8" />
                        ) : (
                            <HeartIcon className="text-white w-8 h-8" />
                        )}
                    </button>

                    {/* Navigation Arrows */}
                    {product.media_urls.length > 1 && (
                        <>
                            <button onClick={handlePrevImage} className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-black hover:text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hidden md:block">
                                <ChevronLeftIcon />
                            </button>
                            <button onClick={handleNextImage} className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-black hover:text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hidden md:block">
                                <ChevronRightIcon />
                            </button>
                        </>
                    )}

                    {/* Image Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {product.media_urls.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Left Content Column */}
                    <div className="flex-1 space-y-10">

                        {/* Title & Key Info */}
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-teal-700 bg-teal-50 rounded-full border border-teal-100">
                                    {product.duration}
                                </span>
                                <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-100">
                                    <StarIcon /><span className="text-gray-900">{product.reviews?.count || 0} Reviews</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500 text-sm font-medium px-3 py-1.5 bg-gray-100 rounded-full">
                                    <MapIcon /><span>{product.location}</span>
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
                                {product.title}
                            </h1>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 shadow-sm">
                                <InfoItem icon={<ClockIcon />} label="Duration" value={product.duration} />
                                <InfoItem icon={<TourTypeIcon />} label="Type" value={product.package_type} />
                                <InfoItem icon={<GroupSizeIcon />} label="Group Size" value={product.group_size} />
                                <InfoItem icon={<LanguagesIcon />} label="Language" value={product.languages.join(', ')} />
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex gap-8 whitespace-nowrap overflow-x-auto no-scrollbar" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`py-4 px-1 border-b-2 font-bold text-lg transition-colors ${activeTab === 'overview' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('itinerary')}
                                    className={`py-4 px-1 border-b-2 font-bold text-lg transition-colors ${activeTab === 'itinerary' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Itinerary
                                </button>
                                <button
                                    onClick={() => setActiveTab('policies')}
                                    className={`py-4 px-1 border-b-2 font-bold text-lg transition-colors ${activeTab === 'policies' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Policies
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[400px]">
                            {activeTab === 'overview' && (
                                <div className="space-y-10 animate-fade-in">
                                    <section>
                                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-8 text-justify">
                                            {product.description}
                                        </p>
                                    </section>
                                    <section>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Trip Highlights</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {product.things_to_do?.map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                    <div className="text-teal-600 bg-teal-50 p-2 rounded-full shrink-0"><CheckCircleIcon /></div>
                                                    <span className="text-gray-800 font-medium">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'itinerary' && (
                                <div className="animate-fade-in">
                                    <ItineraryTimeline itinerary={product.itinerary} />
                                </div>
                            )}

                            {activeTab === 'policies' && (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-green-50/50 border border-green-100 p-8 rounded-2xl">
                                            <h4 className="font-bold text-green-800 mb-4 text-xl flex items-center gap-2">Included</h4>
                                            <ul className="space-y-3">
                                                {product.inclusions?.map((inc, i) => (
                                                    <li key={i} className="flex gap-3 text-gray-700"><span className="text-green-500 font-bold">✓</span> {inc}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-red-50/50 border border-red-100 p-8 rounded-2xl">
                                            <h4 className="font-bold text-red-800 mb-4 text-xl flex items-center gap-2">Excluded</h4>
                                            <ul className="space-y-3">
                                                {product.exclusions?.map((exc, i) => (
                                                    <li key={i} className="flex gap-3 text-gray-700"><span className="text-red-400 font-bold">✕</span> {exc}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-900 text-xl mb-4">Cancellation Policy</h4>
                                        <div className="bg-white border border-gray-200 p-6 rounded-2xl">
                                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                                {product.cancellation_policy?.map((p, i) => <li key={i}>{p}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Right Sticky Booking Card */}
                    <div className="lg:w-[380px] shrink-0">
                        <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex justify-between items-end border-b border-gray-100 pb-6">
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Total Price</p>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-3xl font-bold text-teal-600">
                                                Rs. {Math.min(...(product.pricing?.map(p => p.cost) || [0])).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">per person (approx)</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Listed By</label>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                            {agentProfile?.avatar_url ? (
                                                <img src={agentProfile.avatar_url} alt="Agent" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                agentProfile?.full_name ? agentProfile.full_name.charAt(0).toUpperCase() : (product.business_id ? 'A' : 'T')
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

                                <div className="space-y-4">
                                    <button
                                        onClick={handleChatRedirect}
                                        className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg shadow-lg shadow-teal-500/20 transition-transform active:scale-95"
                                    >
                                        Send Enquiry
                                    </button>
                                    <button
                                        onClick={toggleLike}
                                        className={`w-full py-3 rounded-xl border-2 font-bold transition-colors ${isLiked
                                            ? 'border-red-500 text-red-600 bg-red-50 hover:bg-red-100'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {isLiked ? 'Saved to Wishlist' : 'Save this Deal'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-center gap-4 pt-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">🛡️ Secure</span>
                                    <span className="flex items-center gap-1">⚡ Fast</span>
                                    <span className="flex items-center gap-1">💬 Direct</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center w-full">
                    <AffiliateBanner bannerType="horizontal-banner" className="w-full max-w-4xl" />
                </div>
            </main>

            <FloatingChatIcon />


            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default DealDetailsPage;
