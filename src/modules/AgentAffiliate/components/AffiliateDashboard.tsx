import React, { useState, useEffect } from 'react';
import { AffiliateListing, CustomerInquiry } from '../types';

import { ChartBarIcon, LockIcon, CalendarIcon, GlobeIcon, DeviceMobileIcon, TrendingUpIcon, EyeIcon, CursorClickIcon, LinkIcon, LightningIcon } from './Icons';
import { getAffiliateAnalytics } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';

interface AffiliateDashboardProps {
    listings: AffiliateListing[];
    inquiries: CustomerInquiry[];
    onUnlockPro: () => void;
}

export const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({ listings, inquiries, onUnlockPro }) => {
    const { user, subscription } = useAuth();
    const [dateRange, setDateRange] = useState('7d');
    const [analyticsData, setAnalyticsData] = useState({
        impressions: 0,
        clicks: 0,
        unique_visitors: 0,
        top_links: [] as { id: string, title: string, impressions: number, clicks: number }[],
        chart_data: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (user?.id) {
                setIsLoading(true);
                try {
                    const data = await getAffiliateAnalytics(user.id, dateRange);
                    setAnalyticsData(data);
                } catch (error) {
                    console.error("Failed to fetch analytics", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchAnalytics();
    }, [user?.id, dateRange]);

    const ctr = analyticsData.impressions > 0
        ? ((analyticsData.clicks / analyticsData.impressions) * 100).toFixed(1)
        : '0.0';
    const activeLinks = listings.filter(l => l.is_active).length;

    // Calculate Leads and Inquiries based on the provided logic
    // Total Inquiries: total unique inqueries of customers (Customer-Trip pairs)
    const totalInquiriesCount = inquiries.length;

    // Total Leads: total unique customers
    const totalLeadsCount = new Set(inquiries.map(inq => inq.customer_id)).size;

    const isPro = subscription?.tier_name === 'pro';

    return (
        <div className="h-full w-full p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Affiliate Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Track your performance and optimize earnings</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Range Filter */}
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 3 Months</option>
                            <option value="1y">Last Year</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Current Plan Overview */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 text-[10px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded uppercase">
                        {subscription?.tier_name ? `${subscription.tier_name} Plan` : 'Basic Plan'}
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Overview</h2>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <MetricCard
                        title="Total Inquiries"
                        value={isLoading ? '...' : totalInquiriesCount.toString()}
                        trend={totalInquiriesCount > 0 ? "+3" : "0"}
                        icon={<LightningIcon className="w-5 h-5 text-yellow-500" />}
                        subtext="Total unique inquiries"
                    />
                    <MetricCard
                        title="Total Leads"
                        value={isLoading ? '...' : totalLeadsCount.toString()}
                        trend={totalLeadsCount > 0 ? "+2" : "0"}
                        icon={<TrendingUpIcon className="w-5 h-5 text-blue-500" />}
                        subtext="Unique Customers"
                    />
                    <MetricCard
                        title="Active Links"
                        value={activeLinks.toString()}
                        subtext={`${listings.length - activeLinks} inactive`}
                        icon={<LinkIcon className="w-5 h-5 text-teal-500" />}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <MetricCard
                        title="Total Impressions"
                        value={isLoading ? '...' : analyticsData.impressions.toLocaleString()}
                        trend={analyticsData.impressions > 0 ? "+12%" : "0%"}
                        icon={<EyeIcon className="w-5 h-5 text-blue-500" />}
                    />
                    <MetricCard
                        title="Total Clicks"
                        value={isLoading ? '...' : analyticsData.clicks.toLocaleString()}
                        trend={analyticsData.clicks > 0 ? "+5%" : "0%"}
                        icon={<CursorClickIcon className="w-5 h-5 text-green-500" />}
                    />
                    <MetricCard
                        title="Click-Through Rate"
                        value={isLoading ? '...' : `${ctr}%`}
                        trend="-1%"
                        trendDown
                        icon={<TrendingUpIcon className="w-5 h-5 text-purple-500" />}
                    />
                </div>

                {/* Top Performing Links Section */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <TrendingUpIcon className="w-4 h-4 text-green-500" /> Top Performing Links
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Listing Title</th>
                                    <th scope="col" className="px-4 py-3">ID</th>
                                    <th scope="col" className="px-4 py-3 text-right">Impressions</th>
                                    <th scope="col" className="px-4 py-3 text-right">Clicks</th>
                                    <th scope="col" className="px-4 py-3 text-right">CTR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.top_links.length > 0 ? (
                                    analyticsData.top_links.map((link) => (
                                        <tr key={link.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                {link.title}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{link.id.substring(0, 8)}...</td>
                                            <td className="px-4 py-3 text-right">{link.impressions}</td>
                                            <td className="px-4 py-3 text-right">{link.clicks}</td>
                                            <td className="px-4 py-3 text-right">
                                                {link.impressions > 0 ? ((link.clicks / link.impressions) * 100).toFixed(1) : '0.0'}%
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                            No data available for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Basic Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <DeviceMobileIcon className="w-4 h-4" /> Device Split
                        </h3>
                        <div className="h-48 flex items-center justify-center text-gray-400 text-sm bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            [Pie Chart: Mobile 65% / Desktop 35%]
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <GlobeIcon className="w-4 h-4" /> Top Locations
                        </h3>
                        <div className="h-48 flex items-center justify-center text-gray-400 text-sm bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            [Bar Chart: US, IN, UK, DE]
                        </div>
                    </div>
                </div>
            </div>

            {/* ADVANCED TIER (Locked/Pro) */}
            <div className="relative mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded uppercase">Pro Plan</span>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Advanced Insights</h2>
                </div>

                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-500 ${!isPro ? 'filter blur-sm opacity-60 pointer-events-none select-none' : ''}`}>
                    {/* Heatmaps */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">User Heatmaps</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Scroll Depth</span>
                                <span className="font-bold text-gray-900 dark:text-white">75% Avg</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <div className="flex justify-between text-xs mt-2">
                                <span className="text-gray-500">Hover Focus</span>
                                <span className="font-bold text-gray-900 dark:text-white">High</span>
                            </div>
                            <div className="h-24 bg-gradient-to-b from-red-500/20 to-blue-500/20 rounded border border-gray-100 dark:border-gray-700 mt-2 flex items-center justify-center text-[10px] text-gray-400">
                                [Heatmap Visual]
                            </div>
                        </div>
                    </div>

                    {/* Engagement */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Engagement Metrics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-center">
                                <div className="text-xs text-gray-500 mb-1">Avg Time</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">45s</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-center">
                                <div className="text-xs text-gray-500 mb-1">Return Rate</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">18%</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h4 className="text-xs font-bold text-gray-500 mb-2">User Intent</h4>
                            <div className="flex gap-2 flex-wrap">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] rounded-full">Booking Ready</span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-[10px] rounded-full">Comparing</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                        <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                            ✨ AI Optimization
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex gap-2 text-xs text-gray-700 dark:text-gray-300">
                                <span className="text-green-500">●</span>
                                <span>Add "Book Now" button to "Bali" listing to increase CTR by ~5%.</span>
                            </li>
                            <li className="flex gap-2 text-xs text-gray-700 dark:text-gray-300">
                                <span className="text-orange-500">●</span>
                                <span>"Paris Tour" link is broken. Fix immediately.</span>
                            </li>
                            <li className="flex gap-2 text-xs text-gray-700 dark:text-gray-300">
                                <span className="text-blue-500">●</span>
                                <span>Best posting time for your audience: Tue 10 AM.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Lock Overlay */}
                {!isPro && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-center max-w-md">
                            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LockIcon className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unlock Advanced Insights</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                                Get heatmaps, engagement metrics, and AI-powered optimization suggestions to skyrocket your affiliate earnings.
                            </p>
                            <button
                                onClick={onUnlockPro}
                                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                            >
                                Upgrade to Pro
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* News & Updates Section (Hidden for Pro) */}
            {
                !isPro && (
                    <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center gap-2 mb-4">
                            <LightningIcon className="w-5 h-5 text-yellow-500" />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Industry News & Updates</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-2 inline-block">GetYourGuide</span>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Top Summer Destinations 2024</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Discover the trending locations for the upcoming season and optimize your listings accordingly.</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded mb-2 inline-block">TripAdvisor</span>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">New Commission Structure</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Learn about the updated commission rates for tours and activities starting next month.</p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

const MetricCard = ({ title, value, trend, trendDown, icon, subtext }: any) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">{icon}</div>
            {trend && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trendDown ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {trend}
                </span>
            )}
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{subtext || title}</div>
    </div>
);
