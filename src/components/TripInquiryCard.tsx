import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, CreditCard, ExternalLink, Ticket, Eye, Copy, Check } from 'lucide-react';
import { Badge, BadgeState } from '../modules/AgentAffiliate/components/Badge';

interface TripInquiryCardProps {
    data: {
        tripId: string;
        title: string;
        location: string;
        duration: string;
        price: string;
        views?: number | string;
        agentStatus?: BadgeState;
    };
    isUser: boolean;
}

export const TripInquiryCard: React.FC<TripInquiryCardProps> = ({ data, isUser }) => {
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(data.tripId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleViewDetails = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/user/deals?id=${data.tripId}`);
    };

    return (
        <div className={`mt-3 mb-5 w-full max-w-[350px] aspect-square overflow-hidden rounded-[2rem] border bg-white shadow-2xl transition-all hover:shadow-[0_20px_60px_-15px_rgba(20,184,166,0.3)] dark:bg-gray-900 ${isUser ? 'border-teal-400/20 ring-1 ring-teal-400/10' : 'border-gray-200 dark:border-gray-800'} flex flex-col`}>
            {/* Header: Brand-aligned Gradient - Reversed to Teal-Indigo */}
            <div className="bg-gradient-to-br from-teal-400 via-teal-600 to-indigo-700 px-5 py-4 text-white shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-lg border border-white/30 shadow-sm">
                            <Ticket className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Trip Inquiry</span>
                        </div>
                    </div>
                    {data.agentStatus ? (
                        <Badge
                            state={data.agentStatus}
                            showLabel={false}
                            className="!p-1 bg-white ring-2 ring-white/20 shadow-lg scale-90"
                        />
                    ) : (
                        <div className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-1 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">Verified</span>
                        </div>
                    )}
                </div>

                {/* ID Section: Compact */}
                <div
                    onClick={handleCopy}
                    className="flex items-center justify-between bg-black/20 hover:bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 cursor-pointer transition-all active:scale-95 group backdrop-blur-sm"
                >
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[7px] font-black text-white/50 uppercase tracking-widest leading-none mb-0.5">Reference ID</span>
                        <code className="text-[10px] font-mono text-teal-100 font-bold tracking-tight truncate">{data.tripId}</code>
                    </div>
                    <div className="bg-white/10 p-1.5 rounded-lg group-hover:bg-white/20 transition-all border border-white/5 shadow-inner shrink-0">
                        {copied ? <Check className="h-3 w-3 text-teal-300" /> : <Copy className="h-3 w-3 text-white/60" />}
                    </div>
                </div>
            </div>

            <div className="px-5 py-4 flex-1 flex flex-col justify-between overflow-hidden">
                <div className="space-y-2">
                    <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight tracking-tight line-clamp-2">
                        {data.title}
                    </h4>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full border border-teal-500/20 font-black text-[9px] uppercase tracking-wide w-fit truncate">
                        <MapPin className="h-2.5 w-2.5" />
                        {data.location}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Duration</span>
                            <Clock className="h-3 w-3 text-teal-500/50" />
                        </div>
                        <span className="text-[11px] font-black text-gray-900 dark:text-white truncate">{data.duration}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-gradient-to-br from-teal-50/50 to-indigo-50/50 dark:from-teal-900/10 dark:to-indigo-900/10 rounded-xl border border-teal-100/50 dark:border-teal-900/40">
                        <div className="flex items-center justify-between">
                            <span className="text-[7px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Pricing</span>
                            <CreditCard className="h-3 w-3 text-indigo-500/50" />
                        </div>
                        <span className="text-[11px] font-black text-teal-700 dark:text-teal-400 tracking-tight truncate">{data.price}</span>
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-teal-500/10 p-1.5 rounded-lg border border-teal-500/20">
                            <Eye className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-900 dark:text-white font-black leading-none">{data.views ?? 0}</span>
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Live Views</span>
                        </div>
                    </div>
                    <button
                        onClick={handleViewDetails}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-teal-600 dark:hover:bg-teal-400 transition-all shadow-md active:scale-95 group"
                    >
                        View Details <ExternalLink className="h-3 w-3 group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};
