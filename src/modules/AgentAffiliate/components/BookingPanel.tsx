import React, { useState, useEffect } from 'react';
import { Product, PricingOption } from '../types';
import { PlusIcon, MinusIcon, UserCircleIcon, CheckCircleIcon } from './Icons';

interface BookingPanelProps {
    product: Product;
    agentName?: string;
    memberSince?: string;
}

type TravelerCounts = {
    [key: string]: number;
};

export const BookingPanel: React.FC<BookingPanelProps> = ({ product, agentName, memberSince }) => {
    const initialTravelerCounts = (product.pricing || []).reduce((acc, option) => {
        acc[option.type] = 0;
        return acc;
    }, {} as TravelerCounts);

    const [travelerCounts, setTravelerCounts] = useState<TravelerCounts>(initialTravelerCounts);
    const [totalAmount, setTotalAmount] = useState(0);

    const startingPrice = product.pricing?.length > 0
        ? Math.min(...product.pricing.map(p => p.cost))
        : 0;

    useEffect(() => {
        const newTotal = (product.pricing || []).reduce((acc, option) => {
            return acc + ((travelerCounts[option.type] || 0) * option.cost);
        }, 0);
        setTotalAmount(newTotal);
    }, [travelerCounts, product.pricing]);

    const handleTravelerChange = (type: string, delta: number) => {
        setTravelerCounts(prev => ({
            ...prev,
            [type]: Math.max(0, (prev[type] || 0) + delta)
        }));
    };

    const totalTravelers = Object.values(travelerCounts).reduce((sum: number, count: any) => sum + (count as number), 0);

    return (
        <div className="bg-white dark:bg-gray-950 rounded-[1.5rem] border border-gray-100 dark:border-gray-800/50 overflow-hidden ring-1 ring-black/5">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">Starting at</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-xs font-black text-gray-500">Rs.</span>
                    <span className="text-2xl font-black text-gray-950 dark:text-white tracking-tighter">
                        {startingPrice.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Departure Date</label>
                    <div className="relative group">
                        <select className="w-full pl-3 pr-8 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-teal-500/30 rounded-xl text-gray-950 dark:text-white font-bold appearance-none transition-all outline-none text-xs">
                            <option>{new Date(product.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Travelers</label>
                    {product.pricing.map(option => (
                        <div key={option.type} className="flex justify-between items-center p-2.5 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-transparent active:scale-[0.98] transition-all">
                            <div>
                                <p className="font-black text-gray-950 dark:text-white text-[11px] tracking-tight">{option.type}</p>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rs. {option.cost.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleTravelerChange(option.type, -1)}
                                    className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-gray-500 hover:text-teal-600 shadow-sm disabled:opacity-30"
                                    disabled={travelerCounts[option.type] === 0}
                                >
                                    <MinusIcon className="w-3 h-3" />
                                </button>
                                <span className="w-4 text-center text-sm font-black text-gray-950 dark:text-white">{travelerCounts[option.type]}</span>
                                <button
                                    onClick={() => handleTravelerChange(option.type, 1)}
                                    className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-gray-500 hover:text-teal-600 shadow-sm"
                                >
                                    <PlusIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center gap-3 p-2 bg-teal-50/20 dark:bg-teal-900/10 rounded-xl border border-teal-100/30">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-indigo-500 p-[1px] shrink-0">
                            <div className="w-full h-full rounded-[7px] bg-white dark:bg-gray-950 flex items-center justify-center font-black text-[10px] text-transparent bg-clip-text bg-gradient-to-br from-teal-500 to-indigo-600">
                                {agentName ? agentName.charAt(0).toUpperCase() : 'T'}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="font-black text-gray-950 dark:text-white text-[10px] tracking-tight truncate leading-tight">{agentName || 'Traivo Expert'}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Expert Agent</p>
                        </div>
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-end">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Total Price</p>
                        <p className="font-black text-lg text-gray-950 dark:text-white tracking-tighter">
                            <span className="text-[10px] font-bold text-gray-400 mr-0.5">Rs.</span>
                            {totalAmount.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-[8px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded-md">
                        {totalTravelers} PAX
                    </div>
                </div>
            </div>
        </div>
    );
};
