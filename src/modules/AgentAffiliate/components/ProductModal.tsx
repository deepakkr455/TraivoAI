
import React, { useState } from 'react';
import { Product } from '../types';
import { XIcon, StarIcon, ClockIcon, TourTypeIcon, GroupSizeIcon, LanguagesIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, CheckCircleIcon, MapIcon, UserCircleIcon, PlusIcon, MinusIcon } from './Icons';
import { ItineraryTimeline } from './ItineraryTimeline';
import { BookingPanel } from './BookingPanel';
import { useAuth } from '../context/AuthContext';

interface ProductModalProps {
    product: Product;
    onClose: () => void;
    onConfirm: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onConfirm, onEdit, onDelete }) => {
    const { profile } = useAuth();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'policies'>('overview');

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? product.media_urls.length - 1 : prevIndex - 1
        );
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) =>
            prevIndex === product.media_urls.length - 1 ? 0 : prevIndex + 1
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-0 md:p-6 z-[100] backdrop-blur-xl font-sans animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-950 rounded-none md:rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] h-full md:h-[94vh] flex flex-col overflow-hidden border border-white/20 ring-1 ring-black/5">
                {/* Header */}
                <header className="flex justify-between items-center px-6 md:px-12 py-2 md:py-3 border-b border-gray-100 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-30 shrink-0">
                    <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 bg-teal-50 dark:bg-teal-900/20 rounded-full border border-teal-100/50 dark:border-teal-800/50">
                                {product.package_type}
                            </span>
                            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-100/50 dark:border-indigo-800/50">
                                {product.duration}
                            </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-950 dark:text-white leading-tight tracking-tight truncate">
                            {product.title}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2 font-bold tracking-tight">
                            <span className="flex items-center gap-1.5 text-amber-500">
                                <StarIcon className="w-4 h-4 fill-current" />
                                <span className="text-gray-900 dark:text-gray-200">{product.reviews?.count || 0}</span>
                                <span className="font-medium text-gray-400">Reviews</span>
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800"></span>
                            <span className="flex items-center gap-1.5"><MapIcon className="w-4 h-4" /> {product.location}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="group flex-shrink-0 p-2 md:p-3 text-gray-400 hover:text-gray-950 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-300"
                    >
                        <XIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </header>

                <main className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-gray-50/30 dark:bg-black/20">
                    {/* Left Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">

                        {/* Immersive Gallery */}
                        <div className="relative w-full aspect-[21/9] lg:aspect-[2.4/1] bg-gray-100 dark:bg-gray-900 overflow-hidden group">
                            <img
                                src={product.media_urls?.[currentImageIndex] || 'https://placehold.co/1200x500?text=Premium+Tour+View'}
                                alt="Trip view"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                            {product.media_urls.length > 1 && (
                                <>
                                    <button
                                        onClick={handlePrevImage}
                                        className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/90 backdrop-blur-md text-white hover:text-gray-950 p-4 rounded-3xl shadow-2xl transition-all opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 border border-white/20"
                                    >
                                        <ChevronLeftIcon className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={handleNextImage}
                                        className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/90 backdrop-blur-md text-white hover:text-gray-950 p-4 rounded-3xl shadow-2xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 border border-white/20"
                                    >
                                        <ChevronRightIcon className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Improved Pagination Dots */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 px-4 py-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                {product.media_urls.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`h-2 transition-all duration-300 rounded-full ${idx === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Premium Tab Navigation */}
                        <div className="sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50 z-20 px-6 md:px-12 flex space-x-12">
                            {(['overview', 'itinerary', 'policies'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative py-6 text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === tab ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-full animate-in slide-in-from-bottom-1" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 md:p-12 space-y-16 max-w-6xl mx-auto">
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="space-y-16 animate-fade-in">
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/20 dark:shadow-none">
                                        <InfoItem icon={<ClockIcon />} label="Duration" value={product.duration} />
                                        <InfoItem icon={<TourTypeIcon />} label="Type" value={product.package_type} />
                                        <InfoItem icon={<GroupSizeIcon />} label="Group Size" value={product.group_size} />
                                        <InfoItem icon={<LanguagesIcon />} label="Language" value={product.languages.join(', ')} />
                                    </div>

                                    <section className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <h3 className="text-2xl font-black text-gray-950 dark:text-white mb-8 tracking-tight">Package Overview</h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg font-medium">
                                            {product.description}
                                        </p>
                                    </section>

                                    <section>
                                        <h3 className="text-2xl font-black text-gray-950 dark:text-white mb-8 tracking-tight px-2">Trip Highlights</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {(product.things_to_do && product.things_to_do.length > 0) ? (
                                                product.things_to_do.map((item, i) => (
                                                    <div key={i} className="flex items-center gap-5 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                                                        <div className="flex-shrink-0 text-teal-600 bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl">
                                                            <CheckCircleIcon className="w-6 h-6" />
                                                        </div>
                                                        <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">{item}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full p-10 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800 text-center text-gray-400 font-bold">
                                                    Detailed highlights available upon request.
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* ITINERARY TAB */}
                            {activeTab === 'itinerary' && (
                                <div className="animate-fade-in space-y-12">
                                    <h3 className="text-3xl font-black text-gray-950 dark:text-white mb-10 tracking-tight">Curated Journey</h3>
                                    <div className="bg-white dark:bg-gray-900 p-8 md:p-12 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px]" />
                                        <ItineraryTimeline itinerary={product.itinerary} />
                                    </div>
                                </div>
                            )}

                            {/* POLICIES TAB */}
                            {activeTab === 'policies' && (
                                <div className="space-y-12 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-emerald-50/30 dark:bg-emerald-950/20 p-8 md:p-10 rounded-[2.5rem] border border-emerald-100/50 dark:border-emerald-900/30">
                                            <h4 className="font-black text-emerald-800 dark:text-emerald-400 mb-8 flex items-center gap-3 text-2xl tracking-tight">
                                                What's Included
                                            </h4>
                                            <ul className="space-y-5">
                                                {product.inclusions?.map((inc, i) => (
                                                    <li key={i} className="flex items-start gap-4 text-gray-700 dark:text-gray-300 text-lg font-medium leading-snug">
                                                        <CheckCircleIcon className="text-emerald-500 w-5 h-5 mt-1 shrink-0" /> {inc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-rose-50/30 dark:bg-rose-950/20 p-8 md:p-10 rounded-[2.5rem] border border-rose-100/50 dark:border-rose-900/30">
                                            <h4 className="font-black text-rose-800 dark:text-rose-400 mb-8 flex items-center gap-3 text-2xl tracking-tight">
                                                What's Excluded
                                            </h4>
                                            <ul className="space-y-5">
                                                {product.exclusions?.map((exc, i) => (
                                                    <li key={i} className="flex items-start gap-4 text-gray-700 dark:text-gray-300 text-lg font-medium leading-snug">
                                                        <div className="w-5 h-5 flex items-center justify-center bg-rose-500 text-white rounded-full text-[10px] mt-1 shrink-0">✕</div> {exc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-[2.5rem] p-8 md:p-10">
                                            <h4 className="font-black text-gray-950 dark:text-white mb-6 text-2xl tracking-tight">Cancellation Policy</h4>
                                            <ul className="space-y-4">
                                                {product.cancellation_policy?.map((p, i) => (
                                                    <li key={i} className="text-gray-500 dark:text-gray-400 flex gap-3 text-base font-medium">
                                                        <span className="text-teal-500 mt-1.5">•</span> {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-[2.5rem] p-8 md:p-10">
                                            <h4 className="font-black text-gray-950 dark:text-white mb-6 text-2xl tracking-tight">Important Terms</h4>
                                            <ul className="space-y-4">
                                                {product.terms_conditions?.map((t, i) => (
                                                    <li key={i} className="text-gray-500 dark:text-gray-400 flex gap-3 text-base font-medium">
                                                        <span className="text-teal-500 mt-1.5">•</span> {t}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Branding Footer */}
                            <div className="mt-20 pt-16 border-t border-gray-100 dark:border-gray-800/50">
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-10 text-center">Book with Total Confidence</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                                    <div className="flex flex-col items-center text-center gap-4 group">
                                        <div className="w-16 h-16 rounded-[2rem] bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform duration-500">🛡️</div>
                                        <div>
                                            <p className="font-black text-gray-950 dark:text-white text-base tracking-tight mb-1">Identity Verified</p>
                                            <p className="text-xs font-bold text-gray-400 tracking-wide">Government ID Checked</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-4 group">
                                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform duration-500">💳</div>
                                        <div>
                                            <p className="font-black text-gray-950 dark:text-white text-base tracking-tight mb-1">Fortified Payments</p>
                                            <p className="text-xs font-bold text-gray-400 tracking-wide">256-bit AES Encryption</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-4 group">
                                        <div className="w-16 h-16 rounded-[2rem] bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform duration-500">📞</div>
                                        <div>
                                            <p className="font-black text-gray-950 dark:text-white text-base tracking-tight mb-1">Elite Support</p>
                                            <p className="text-xs font-bold text-gray-400 tracking-wide">Concierge Service 24/7</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Booking Panel - Sticky on Desktop */}
                    <div className="w-full lg:w-[400px] bg-white dark:bg-gray-950 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800/50 flex-shrink-0 flex flex-col z-20 shadow-[-20px_0_50px_-15px_rgba(0,0,0,0.05)]">
                        <div className="flex-1 p-3 md:p-4 min-h-0">
                            <BookingPanel
                                product={product}
                                agentName={profile?.full_name}
                                memberSince={profile?.created_at}
                            />
                        </div>

                        {/* Premium Action Buttons for Agent */}
                        <div className="p-4 md:p-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Admin Controls</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-500/10 rounded-full">
                                    <div className="w-1 h-1 rounded-full bg-teal-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase text-teal-600 tracking-widest">Live</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={onConfirm} className="flex-1 px-6 py-3 rounded-2xl text-base font-black bg-gray-950 text-white hover:bg-teal-600 transition-all duration-300 shadow-xl shadow-gray-900/10 flex justify-center items-center gap-2 active:scale-[0.98]">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    <span className="tracking-tight">Publish Listing</span>
                                </button>
                                <button onClick={onDelete} className="p-3 rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all shadow-sm active:scale-95">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.05); border-radius: 20px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.05); }
                .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); filter: blur(10px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
            `}</style>
        </div>
    );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => (
    <div className="flex flex-col gap-3 p-5 bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-teal-500/10 hover:bg-white dark:hover:bg-gray-800 rounded-3xl transition-all duration-300 group">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm rounded-xl group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all duration-500">
                <span className="scale-110">{icon}</span>
            </div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 group-hover:text-teal-600 transition-colors">{label}</p>
        </div>
        <p className="font-black text-lg text-gray-950 dark:text-white truncate pl-1" title={value}>{value}</p>
    </div>
);

export default ProductModal;
