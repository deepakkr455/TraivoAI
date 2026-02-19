import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Product, MediaUpload, Booking, CustomerInquiry } from '../types';
import { CheckCircleIcon, UsersIcon, WalletIcon, ChartBarIcon, SearchIcon, DownloadIcon, AlertCircleIcon, SendIcon, PaperclipIcon, MessageSquareIcon, FilterIcon, StarIcon, LightningIcon, RocketIcon, EyeOffIcon, BellIcon, LockIcon, MapIcon, CalendarIcon, ChevronDownIcon, ClockIcon } from './Icons';
import { messageService } from '../../Customer/services/messageService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../../services/supabaseClient';
import { getProductAnalytics, trackProductInteraction } from '../services/supabaseService';

interface DashboardProps {
    currentView: 'dashboard' | 'bookings' | 'messages' | 'gallery';
    products: Product[];
    bookings: Booking[];
    inquiries: CustomerInquiry[];
    setInquiries?: (inquiries: CustomerInquiry[]) => void;
    onBoostClick?: () => void;
    onToggleStatus?: (productId: string) => void;
}

// Helper for Sparkline
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const height = 40;
    const width = 100;
    const step = width / (data.length - 1);

    const points = data.map((d, i) => {
        const x = i * step;
        const y = height - ((d - min) / range) * height;
        return `${x},${y} `;
    }).join(' ');

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
            <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" className={color} vectorEffect="non-scaling-stroke" />
        </svg>
    );
};

// Helper for Mini Bar Chart
const MiniBarChart: React.FC<{ data: { label: string; value: number }[]; color: string; unit?: string }> = ({ data, color, unit = '' }) => {
    const maxVal = Math.max(...data.map(d => d.value)) || 1;
    return (
        <div className="space-y-3">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                        <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{d.label}</span>
                        <span className="font-bold text-gray-900 dark:text-white">{unit}{d.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${color}`}
                            style={{ width: `${(d.value / maxVal) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

// Reusable Components
const KPICard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend: string; trendUp: boolean, color: string, sparklineData?: number[] }> = ({ title, value, icon, trend, trendUp, color, sparklineData }) => {
    const colorClasses: { [key: string]: string } = {
        teal: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
        purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
        pink: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20',
        green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl transition-colors ${colorClasses[color] || 'bg-gray-100'}`}>{icon}</div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trend}
                </div>
            </div>
            <div className="relative z-10">
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{title}</p>
            </div>
            {sparklineData && (
                <div className="absolute bottom-0 right-0 w-24 h-12 opacity-30">
                    <Sparkline data={sparklineData} color={colorClasses[color]?.split(' ')[0] || 'text-gray-400'} />
                </div>
            )}
        </div>
    );
};

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string; hasAlert?: boolean }> = ({ active, onClick, label, hasAlert }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border whitespace-nowrap ${active
            ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white shadow-md'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
            }`}
    >
        {hasAlert && <span className="text-red-500"><AlertCircleIcon /></span>}
        {label}
    </button>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = {
        confirmed: 'bg-green-100 text-green-700 border-green-200',
        pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        cancelled: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    const style = styles[status as keyof typeof styles] || styles.cancelled;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${style}`}>
            {status}
        </span>
    );
};

// Helper for Expandable Item List
const ExpandableList: React.FC<{
    title: string;
    icon: React.ReactNode;
    data: { label: string; value: number }[];
    color: string;
    unit?: string;
    isPercentage?: boolean;
}> = ({ title, icon, data, color, unit = '', isPercentage = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const displayData = isExpanded ? data : data.slice(0, 5);

    const maxVal = Math.max(...data.map(d => d.value)) || 1;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">{icon} {title}</span>
                {data.length > 5 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-[10px] text-teal-600 font-bold hover:underline uppercase tracking-wider"
                    >
                        {isExpanded ? 'Show Less' : `View All (${data.length})`}
                    </button>
                )}
            </h3>
            <div className="space-y-4 flex-1">
                {displayData.map((d, i) => (
                    <div key={i} className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{d.label}</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {isPercentage ? `${d.value.toFixed(1)}%` : `${unit}${d.value.toLocaleString()}`}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${color}`}
                                style={{ width: `${(d.value / (isPercentage ? 100 : maxVal)) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Helper for Visit View Heatmap
const VisitHeatmap: React.FC<{ data: { title: string; views: number; relative_size: number }[] }> = ({ data }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <RocketIcon className="w-4 h-4 text-orange-500" /> Visit View (Listing Heatmap)
            </h3>
            {data.length > 0 ? (
                <div className="flex-1 flex flex-wrap gap-2 content-start overflow-hidden">
                    {data.map((d, i) => {
                        const size = Math.max(15, d.relative_size);
                        let intensity = 'bg-teal-500';
                        if (d.relative_size > 40) intensity = 'bg-teal-600';
                        if (d.relative_size > 70) intensity = 'bg-teal-700';
                        if (d.relative_size < 20) intensity = 'bg-teal-400';

                        return (
                            <div
                                key={i}
                                className={`${intensity} rounded-lg p-3 text-white transition-all hover:scale-[1.02] cursor-default flex flex-col justify-end group min-h-[80px]`}
                                style={{
                                    width: `calc(${size}% - 0.5rem)`,
                                    minWidth: '120px',
                                    flexGrow: size > 50 ? 2 : 1
                                }}
                                title={`${d.title}: ${d.views} views`}
                            >
                                <span className="text-[10px] font-bold opacity-80 uppercase truncate">{d.views} views</span>
                                <span className="text-xs font-black leading-tight line-clamp-2">{d.title}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-xs italic border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    No listing engagement detected yet.
                </div>
            )}
        </div>
    );
};

// Helper for Activity Heatmap (Day vs Hour)
const ActivityHeatmap: React.FC<{ data: { day: string; hours: number[] }[] }> = ({ data }) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Find max value for normalization
    const allValues = data.flatMap(d => d.hours);
    const maxVal = Math.max(...allValues) || 1;

    const getColor = (val: number) => {
        if (val === 0) return 'bg-gray-100 dark:bg-gray-700/30';
        const intensity = val / maxVal;
        if (intensity < 0.2) return 'bg-teal-100 dark:bg-teal-900/20';
        if (intensity < 0.4) return 'bg-teal-200 dark:bg-teal-800/40';
        if (intensity < 0.6) return 'bg-teal-300 dark:bg-teal-700/60';
        if (intensity < 0.8) return 'bg-teal-400 dark:bg-teal-600/80';
        return 'bg-teal-500 dark:bg-teal-500';
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-teal-500" /> Customer Activity Heatmap
            </h3>
            <div className="flex-1 flex flex-col min-h-[220px]">
                <div className="flex mb-2">
                    <div className="w-10" /> {/* Spacer for labels */}
                    <div className="flex-1 flex justify-between text-[10px] text-gray-400 px-1">
                        <span>12am</span>
                        <span>6am</span>
                        <span>12pm</span>
                        <span>6pm</span>
                        <span>11pm</span>
                    </div>
                </div>
                <div className="flex-1 space-y-1">
                    {data.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="w-8 text-[10px] font-bold text-gray-500 text-right">{d.day}</span>
                            <div className="flex-1 h-4 flex gap-0.5">
                                {d.hours.map((val, hIdx) => (
                                    <div
                                        key={hIdx}
                                        className={`flex-1 h-full rounded-sm ${getColor(val)} transition-colors group relative`}
                                        title={`${d.day} ${hIdx}:00 - ${val} interactions`}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                            {d.day} {hIdx}:00: {val} interactions
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Overview: React.FC<{ products: Product[], inquiries: CustomerInquiry[], onBoostClick?: () => void, onToggleStatus?: (id: string) => void }> = ({ products, inquiries, onBoostClick, onToggleStatus }) => {
    const { session, subscription } = useAuth();
    const isActuallyPremium = subscription?.tier_name === 'pro' || subscription?.tier_name === 'custom';
    const [isPremium, setIsPremium] = useState(isActuallyPremium);
    const [spotlightId, setSpotlightId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

    useEffect(() => {
        const fetchRealAnalytics = async () => {
            if (session?.user.id) {
                setIsLoadingAnalytics(true);
                const data = await getProductAnalytics(session.user.id);
                console.log('📊 Dashboard Analytics Loaded:', data);
                setAnalytics(data);
                setIsLoadingAnalytics(false);
            }
        };
        fetchRealAnalytics();
    }, [session?.user.id, products.length]);

    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - 30);

    const periodInquiries = inquiries.filter(inq => {
        const inqDate = new Date(inq.timestamp);
        return inqDate >= filterDate;
    });

    // Core Metrics
    // Total Inquiries: total unique inqueries of customers (Customer-Trip pairs)
    const totalInquiriesCount = periodInquiries.length;
    // Total Leads: total unique customers
    const totalLeadsCount = new Set(periodInquiries.map(inq => inq.customer_id)).size;
    const activeListingsCount = products.filter(p => p.is_active).length;
    const inactiveListingsCount = products.length - activeListingsCount;

    const totalViews = products.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalClicks = products.reduce((acc, p) => acc + (p.clicks || 0), 0);
    const avgCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0';

    const totalEngagement = totalViews + (totalClicks * 5) + (totalInquiriesCount * 50);

    // Real Analytics Data handled with loading states
    const locationData = analytics?.locationData || [];
    const deviceData = analytics?.deviceBreakdown || [];

    const timeStats = analytics?.timeStats || { avg_minutes: 0, total_minutes: 0 };
    // Drive Heatmap data directly from products prop for better responsiveness
    const visitStats = products.map(p => ({
        title: p.title,
        views: p.views || 0,
        relative_size: totalViews > 0 ? ((p.views || 0) / totalViews * 100) : 0
    })).sort((a, b) => b.views - a.views);

    const customerRetentionData = analytics?.retentionData || [];
    const mappingData = analytics?.mappingData || [];
    const activityHeatmapData = analytics?.activityHeatmap || [];

    let actionableInsights: any[] = [];

    if (analytics?.actionableInsights && analytics.actionableInsights.length > 0) {
        actionableInsights = analytics.actionableInsights.map((insight: any) => {
            let icon = <StarIcon className="text-purple-500" />;
            if (insight.iconType === 'rocket') icon = <RocketIcon className="text-orange-500" />;
            if (insight.iconType === 'lightning') icon = <LightningIcon className="text-yellow-500" />;
            return { ...insight, icon };
        });
    }

    const productMetricsEnriched = products.map(p => {
        const productLeads = periodInquiries.filter(inq => inq.product === p.title).length;
        const productViews = p.views || 0;
        const productClicks = p.clicks || 0;

        const totalTimeSpentSeconds = (p as any).total_time_spent || 0;
        const avgTimeSpent = productViews > 0 ? (totalTimeSpentSeconds / 60 / productViews).toFixed(1) : '0';

        // Engagement Score as a Percentage (Leads, Clicks, and Time Spent weight)
        const engagementScore = productViews > 0
            ? Math.min(100, ((productLeads * 10 + productClicks * 2 + (totalTimeSpentSeconds / 60) * 5) / productViews) * 100)
            : 0;

        return {
            ...p,
            leadCount: productLeads,
            views: productViews,
            engagementScore,
            avgTimeSpent
        };
    });

    const topLeadsList = [...productMetricsEnriched].sort((a, b) => b.leadCount - a.leadCount).map(p => ({ label: p.title, value: p.leadCount }));
    const topViewsList = [...productMetricsEnriched].sort((a, b) => b.views - a.views).map(p => ({ label: p.title, value: p.views }));
    const topEngagementList = [...productMetricsEnriched].sort((a, b) => b.engagementScore - a.engagementScore).map(p => ({ label: p.title, value: p.engagementScore }));

    const totalViewsAll = productMetricsEnriched.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalTimeAll = productMetricsEnriched.reduce((acc, p) => acc + ((p as any).total_time_spent || 0), 0);
    const avgTimeAll = totalViewsAll > 0 ? (totalTimeAll / 60 / totalViewsAll).toFixed(1) : '0';

    const trendingProduct = [...productMetricsEnriched].sort((a, b) => {
        const scoreA = a.views + (periodInquiries.filter(inq => inq.product === a.title).length * 100);
        const scoreB = b.views + (periodInquiries.filter(inq => inq.product === b.title).length * 100);
        return scoreB - scoreA;
    })[0];

    const spotlightProduct = spotlightId ? productMetricsEnriched.find(p => p.id === spotlightId) : trendingProduct;

    // Use real trend data if available
    const leadTrend = analytics?.trends?.map((t: any) => t.total_inquiries) || [5, 5, 5, 5, 5, 5, 5, 5, 5, 10];
    const impressionTrend = analytics?.trends?.map((t: any) => t.total_views) || [100, 100, 100, 100, 100, 100, 100, 100, 100, 150];
    const listingTrend = [5, 5, 6, 6, 7, 7, 8, 8, 9, 9];

    const healthScore = 88;

    return (
        <div className="h-full overflow-y-auto p-4 lg:p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Lead Analytics</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-base text-gray-500 dark:text-gray-400">Track customer engagement and inventory health.</p>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                            <CalendarIcon className="w-3 h-3" /> Last 30 Days <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 mr-4 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
                        <span className="text-xs font-bold text-yellow-800 uppercase tracking-wider">Simulate Premium</span>
                        <button
                            onClick={() => setIsPremium(!isPremium)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${isPremium ? 'bg-teal-600' : 'bg-gray-300'}`}
                        >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isPremium ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lead Generation & Inventory</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-600 uppercase tracking-wider">
                            {subscription?.tier_name || 'Free'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-green-600">
                            <div className="w-2 h-2 rounded-full bg-green-500" /> {activeListingsCount} Active
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-gray-300" /> {inactiveListingsCount} Inactive
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Inquiries" value={totalInquiriesCount.toString()} icon={<MessageSquareIcon />} trend="+18.5%" trendUp={true} color="teal" sparklineData={leadTrend} />
                    <KPICard title="Total Leads" value={totalLeadsCount.toString()} icon={<UsersIcon />} trend="+12.2%" trendUp={true} color="blue" sparklineData={leadTrend} />
                    <KPICard title="Avg. Time Spent" value={`${avgTimeAll}m`} icon={<ClockIcon />} trend="+5.4s" trendUp={true} color="purple" sparklineData={impressionTrend} />
                    <KPICard title="Active Listings" value={activeListingsCount.toString()} icon={<MapIcon />} trend="Stable" trendUp={true} color="indigo" sparklineData={listingTrend} />
                </div>
            </div>

            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Engagement Analysis</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-600 uppercase tracking-wider">
                        {subscription?.tier_name || 'Free'}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ExpandableList title="Inquiries by Listing" icon={<MessageSquareIcon className="w-4 h-4 text-teal-500" />} data={topLeadsList} color="bg-teal-500" />
                    <ExpandableList title="Views by Listing" icon={<UsersIcon className="w-4 h-4 text-blue-500" />} data={topViewsList} color="bg-blue-500" />
                    <ExpandableList title="Engagement Score" isPercentage icon={<LightningIcon className="w-4 h-4 text-indigo-500" />} data={topEngagementList} color="bg-indigo-500" />
                </div>
            </div>

            <div className="mb-10 relative">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Advanced Customer Analytics</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-teal-500 to-blue-500 text-white uppercase tracking-wider shadow-sm">Exclusive</span>
                </div>

                <div className={`transition-all duration-500 ${!isPremium ? 'blur-sm opacity-60 select-none pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                        <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <MapIcon className="w-4 h-4 text-purple-500" /> Customer Location Distribution
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    {locationData.length > 0 ? locationData.slice(0, 5).map((loc: any, i: number) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-24 text-xs font-medium text-gray-500 truncate">{loc.label}</div>
                                            <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(loc.value / (locationData[0]?.value || 1)) * 100}%` }} />
                                            </div>
                                            <div className="text-xs font-bold text-gray-900 dark:text-white">{loc.value}</div>
                                        </div>
                                    )) : (
                                        <div className="text-gray-400 text-xs italic py-10 text-center">No location data detected from interactions yet.</div>
                                    )}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl flex flex-col h-full">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Top 3 Market Mapping</h4>
                                    <div className="space-y-4 flex-1">
                                        {mappingData.length > 0 ? mappingData.map((map, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 dark:text-white">{map.customerLoc}</span>
                                                    <span className="text-gray-400">Inquiring for</span>
                                                    <span className="font-bold text-teal-600">{map.tripLoc}</span>
                                                </div>
                                                <div className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 font-bold">
                                                    {map.leads} Leads
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-[10px] italic text-center py-6">
                                                No inquiry mapping available yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                                    <span>Visit Trending</span>
                                    <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                                        <LightningIcon className="w-3 h-3" /> +14% Up
                                    </span>
                                </h3>
                                <div className="h-24 w-full">
                                    <Sparkline data={impressionTrend} color="text-teal-500" />
                                </div>
                                <div className="mt-4 flex justify-between items-center text-xs">
                                    <div className="text-gray-500">Avg. Time spent / Session</div>
                                    <div className="font-bold text-gray-900 dark:text-white">{timeStats.avg_minutes}m</div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm flex-1">
                                <ActivityHeatmap data={activityHeatmapData} />
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm flex-1">
                                <VisitHeatmap data={visitStats} />
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Device Breakdown</h3>
                                <div className="space-y-4">
                                    {deviceData.length > 0 ? deviceData.map((dev, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>{dev.label}</span>
                                                <span className="font-bold">{dev.value}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${dev.value}%` }} />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-gray-400 text-[10px] italic py-4 text-center">No device data available.</div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Retention vs. New Acquisition</h3>
                                {customerRetentionData.length > 0 ? (
                                    <>
                                        <div className="flex items-center gap-1 h-8 rounded-lg overflow-hidden mb-4">
                                            {customerRetentionData.map((ret, i) => (
                                                <div key={i} className={`${ret.color} h-full transition-all`} style={{ width: `${ret.value}%` }} title={`${ret.label}: ${ret.value}%`} />
                                            ))}
                                        </div>
                                        <div className="space-y-2">
                                            {customerRetentionData.map((ret, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${ret.color}`} />
                                                        <span className="text-gray-500">{ret.label}</span>
                                                    </div>
                                                    <span className="font-bold">{ret.value}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-gray-400 text-[10px] italic py-4 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                        Insufficient data to calculate retention.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black p-8 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <StarIcon className="w-32 h-32 text-amber-400 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-amber-500/20 p-2 rounded-lg">
                                    <StarIcon className="w-6 h-6 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Actionable Insights</h3>
                                <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Premium Exclusive</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {isLoadingAnalytics ? (
                                    // Skeleton Loader
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl animate-pulse">
                                            <div className="w-10 h-10 bg-white/10 rounded-lg mb-4"></div>
                                            <div className="h-5 bg-white/10 rounded w-3/4 mb-3"></div>
                                            <div className="h-4 bg-white/5 rounded w-full mb-1"></div>
                                            <div className="h-4 bg-white/5 rounded w-2/3"></div>
                                        </div>
                                    ))
                                ) : (
                                    actionableInsights.map((insight, i) => (
                                        <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                                            <div className="mb-4 transform group-hover:scale-110 transition-transform">{insight.icon}</div>
                                            <h4 className="text-white font-bold mb-2">{insight.title}</h4>
                                            <p className="text-gray-400 text-sm leading-relaxed">{insight.description}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {!isPremium && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6">
                        <div className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md transform transition-all hover:scale-105">
                            <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <LockIcon className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Unlock Pro Analytics</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">Gain deep insights into customer behavior and listing health source metrics.</p>
                            <button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                                <LightningIcon className="text-yellow-400" /> Upgrade Now - $29/mo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Listing Performance</h3>
                        <p className="text-xs text-gray-500">Select a listing to view detailed metrics.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Listing</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Inquiries</th>
                                    <th className="px-6 py-4 text-right">Avg. Time</th>
                                    <th className="px-6 py-4 text-right">Engagement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                {productMetricsEnriched.map((product) => (
                                    <tr key={product.id} onClick={() => setSpotlightId(product.id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={product.media_urls[0]} alt="" className="w-10 h-10 rounded object-cover" />
                                                <div className="font-bold text-gray-900 dark:text-white">{product.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold">{product.leadCount}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-500">{product.avgTimeSpent}m</td>
                                        <td className="px-6 py-4 text-right font-bold text-teal-600">{product.engagementScore.toFixed(0)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="xl:col-span-4">
                    {spotlightProduct ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden flex flex-col">
                            <div className="relative h-48 w-full bg-gray-200 cursor-pointer" onClick={() => setShowPreview(true)}>
                                <img src={spotlightProduct.media_urls[0]} className="w-full h-full object-cover" alt="Spotlight" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="text-xl font-bold leading-tight">{spotlightProduct.title}</h3>
                                    <p className="text-xs opacity-80">{spotlightProduct.location}</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-gray-500 uppercase">Total Inquiries</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{inquiries.filter(i => i.product === spotlightProduct.title).length}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-gray-500 uppercase">Avg. Time Spent</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{spotlightProduct.avgTimeSpent} min</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-gray-500 uppercase">Engagement</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{spotlightProduct.engagementScore.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <button onClick={onBoostClick} className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md">
                                    <RocketIcon /> Boost Listing
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 p-8 text-center border-dashed">
                            <p>Select a listing from the table to view detailed performance.</p>
                        </div>
                    )}
                </div>
            </div>

            {showPreview && spotlightProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="relative h-64">
                            <img src={spotlightProduct.media_urls[0]} className="w-full h-full object-cover" alt={spotlightProduct.title} />
                            <button onClick={() => setShowPreview(false)} className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full backdrop-blur-md">✕</button>
                            <div className="absolute bottom-6 left-6 text-white">
                                <h2 className="text-3xl font-bold">{spotlightProduct.title}</h2>
                                <p className="opacity-80 flex items-center gap-2 mt-1"><MapIcon className="w-4 h-4" /> {spotlightProduct.location}</p>
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Performance Metrics</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                        <p className="text-xs text-gray-500">Engagement</p>
                                        <p className="text-xl font-bold text-teal-600">{spotlightProduct.engagementScore.toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                        <p className="text-xs text-gray-500">Total Inquiries</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{inquiries.filter(i => i.product === spotlightProduct.title).length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Listing Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Group Size</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{spotlightProduct.group_size || 'N/A'} Guests</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Views</span>
                                        <span className="font-medium text-green-600">{spotlightProduct.views} Total</span>
                                    </div>
                                </div>
                                <button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-bold">Edit Listing</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MessagesView: React.FC<{ inquiries: CustomerInquiry[]; setInquiries?: (inquiries: CustomerInquiry[]) => void }> = ({ inquiries, setInquiries }) => {
    const { session } = useAuth();
    const [selectedId, setSelectedId] = useState<string>('');
    const [replyText, setReplyText] = useState('');
    const selectedInquiry = inquiries.find((i) => i.id === selectedId);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedInquiry?.messages, selectedId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !selectedId || !session?.user.id) return;
        const file = e.target.files[0];
        setIsUploading(true);
        const media = await messageService.uploadMedia(file);
        if (media) {
            await handleSendMessage(undefined, media.url, media.type);
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendMessage = async (text?: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'pdf') => {
        const messageText = text || replyText;
        if ((!messageText.trim() && !mediaUrl) || !selectedId || !session?.user.id) return;

        const newMsg = {
            id: Date.now().toString(),
            sender: 'agent' as const,
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            media_url: mediaUrl,
            media_type: mediaType,
            created_at: new Date().toISOString(),
        } as any;

        if (setInquiries) {
            (setInquiries as any)((prev: any) =>
                prev.map((iq: any) =>
                    iq.id === selectedId
                        ? {
                            ...iq,
                            messages: [...(iq.messages || []), newMsg],
                            last_message: messageText || 'Sent a file',
                            timestamp: new Date().toLocaleDateString(),
                        }
                        : iq
                )
            );
        }

        setReplyText('');

        try {
            await messageService.sendMessage(selectedId, messageText, 'agent', session.user.id, mediaUrl, mediaType);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    React.useEffect(() => {
        if (!selectedId) return;
        const channel = supabase
            .channel(`inquiry_messages_${selectedId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'inquiry_messages', filter: `inquiry_id=eq.${selectedId}` },
                (payload: any) => {
                    if (payload.new && payload.new.sender_role === 'customer') {
                        const incomingMsg = {
                            id: payload.new.id,
                            sender: 'customer' as const,
                            text: payload.new.message_text,
                            time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            media_url: payload.new.media_url,
                            media_type: payload.new.media_type,
                            created_at: payload.new.created_at,
                        };
                        if (setInquiries) {
                            (setInquiries as any)((prev: any) =>
                                prev.map((iq: any) =>
                                    iq.id === selectedId
                                        ? {
                                            ...iq,
                                            messages: [...(iq.messages || []), incomingMsg],
                                            unread: true,
                                            last_message: payload.new.message_text || 'Sent a file',
                                        }
                                        : iq
                                )
                            );
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedId, setInquiries]);

    if (!inquiries || inquiries.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8 text-center font-sans">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-md">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <MessageSquareIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Inquiries Yet</h2>
                    <p className="text-gray-500 dark:text-gray-400">When travel seekers inquire about your listings, they will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 p-4 lg:p-8 bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
            <div className={`w-full md:w-80 flex flex-col gap-4 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-900 dark:text-white">Messages</h2>
                        <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {inquiries.filter((i) => i.unread).length} New
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {inquiries.map((inquiry) => (
                        <div
                            key={inquiry.id}
                            onClick={() => setSelectedId(inquiry.id)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedId === inquiry.id
                                ? 'bg-white dark:bg-gray-800 border-teal-500 shadow-md'
                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-teal-200 shadow-sm'
                                }`}
                        >
                            <div className="flex justify-between mb-1">
                                <h4 className={`text-sm ${inquiry.unread ? 'font-bold' : 'font-medium'}`}>{inquiry.customer_name}</h4>
                                <span className="text-[10px] text-gray-400">{inquiry.timestamp}</span>
                            </div>
                            <p className="text-xs text-teal-600 font-medium mb-1 truncate">{inquiry.product}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{inquiry.last_message}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden shadow-sm ${selectedId ? 'flex' : 'hidden md:flex'}`}>
                {selectedInquiry ? (
                    <>
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                    {selectedInquiry.customer_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedInquiry.customer_name}</h3>
                                    <p className="text-xs text-teal-600 font-medium">Inquiry about: {selectedInquiry.product}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50">
                            {selectedInquiry.messages?.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] lg:max-w-md shadow-sm text-sm px-5 py-3 rounded-2xl ${msg.sender === 'agent' ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-100 dark:border-gray-600'}`}>
                                        {msg.media_url && (
                                            <div className="rounded-xl overflow-hidden mb-2">
                                                {msg.media_type === 'image' ? (
                                                    <img src={msg.media_url} alt="Shared" className="w-full h-auto max-h-72 object-cover" onClick={() => window.open(msg.media_url, '_blank')} />
                                                ) : (
                                                    <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs opacity-80 underline underline-offset-2">Download Attachment</a>
                                                )}
                                            </div>
                                        )}
                                        <p>{msg.text}</p>
                                        <p className={`text-[10px] mt-1 text-right ${msg.sender === 'agent' ? 'text-teal-100' : 'text-gray-400'}`}>{msg.time}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,application/pdf" />
                            <div className="flex items-center gap-3">
                                <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={isUploading}>
                                    {isUploading ? <div className="animate-spin h-5 w-5 border-2 border-teal-500 border-t-transparent rounded-full" /> : <PaperclipIcon />}
                                </button>
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(replyText)}
                                    placeholder={isUploading ? 'Uploading attachment...' : 'Type your message...'}
                                    className="flex-1 bg-gray-100 dark:bg-gray-900 border-none rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                    disabled={isUploading}
                                />
                                <button onClick={() => handleSendMessage(replyText)} disabled={!replyText.trim() && !isUploading} className="p-3 rounded-full bg-teal-600 text-white hover:bg-teal-700 shadow-md">
                                    <SendIcon />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageSquareIcon className="w-12 h-12 opacity-20 mb-4" />
                        <p className="text-sm font-medium">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ currentView, products, inquiries, setInquiries, onBoostClick, onToggleStatus }) => {
    switch (currentView) {
        case 'dashboard':
            return <Overview inquiries={inquiries} products={products} onBoostClick={onBoostClick} onToggleStatus={onToggleStatus} />;
        case 'messages':
            return <MessagesView inquiries={inquiries} setInquiries={setInquiries} />;
        default:
            return <Overview inquiries={inquiries} products={products} onBoostClick={onBoostClick} onToggleStatus={onToggleStatus} />;
    }
};
