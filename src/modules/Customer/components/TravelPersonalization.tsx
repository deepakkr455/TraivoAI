import React, { useState, useMemo } from 'react';
import {
    ChevronRight, ChevronLeft, MapPin, Sparkles,
    Search, Check, Share2, Compass, Heart,
    Wallet, Rocket, Footprints, Globe
} from 'lucide-react';
import { INDIA_LOCATIONS } from '../data/india_locations';

export interface PersonalizationData {
    referral_source: string;
    city: string;
    state: string;
    interests: string[];
    travel_frequency: string;
    budget: string;
}

interface TravelPersonalizationProps {
    initialData?: PersonalizationData;
    onComplete: (data: PersonalizationData) => void;
    onCancel: () => void;
}

export const TravelPersonalization: React.FC<TravelPersonalizationProps> = ({ initialData, onComplete, onCancel }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<PersonalizationData>(initialData || {
        referral_source: '',
        city: '',
        state: '',
        interests: [],
        travel_frequency: '',
        budget: ''
    });

    const [citySearch, setCitySearch] = useState('');

    const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSelect = (key: keyof PersonalizationData, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));

        // Auto-advance for single-select steps and city
        if (key !== 'interests' && key !== 'state') {
            setTimeout(nextStep, 400);
        }
    };

    const toggleInterest = (interest: string) => {
        setData(prev => {
            const interests = prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest];
            return { ...prev, interests };
        });
    };

    const isStepValid = () => {
        switch (step) {
            case 1: return !!data.referral_source;
            case 2: return !!data.state && !!data.city;
            case 3: return data.interests.length > 0;
            case 4: return !!data.travel_frequency;
            case 5: return !!data.budget;
            default: return false;
        }
    };

    const filteredCities = useMemo(() => {
        if (!data.state) return [];
        const cities = (INDIA_LOCATIONS as any)[data.state] || [];
        if (!citySearch) return cities;
        return cities.filter((city: string) =>
            city.toLowerCase().includes(citySearch.toLowerCase())
        );
    }, [data.state, citySearch]);

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 mb-4 ring-1 ring-teal-500/10">
                                <Share2 className="w-8 h-8 text-teal-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">How did you find us?</h2>
                            <p className="text-slate-600 mt-2">Help us understand our community better</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'Instagram', icon: '📸' },
                                { id: 'Facebook', icon: '💙' },
                                { id: 'Google Search', icon: '🔍' },
                                { id: 'Word of Mouth', icon: '🗣️' },
                                { id: 'YouTube', icon: '📺' },
                                { id: 'LinkedIn', icon: '💼' }
                            ].map(source => (
                                <button
                                    key={source.id}
                                    onClick={() => handleSelect('referral_source', source.id)}
                                    className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 group
                                        ${data.referral_source === source.id
                                            ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/5 shadow-lg shadow-teal-500/10'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-teal-500/50 hover:bg-slate-50'}`}
                                >
                                    <span className="text-2xl group-hover:scale-110 transition-transform">{source.icon}</span>
                                    <span className={`text-xs font-bold uppercase tracking-tighter ${data.referral_source === source.id ? 'text-teal-700' : 'text-slate-500'}`}>{source.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4 ring-1 ring-blue-500/10">
                                <MapPin className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">Where are you from?</h2>
                            <p className="text-slate-600 mt-2">Setting up your home base for better deals</p>
                        </div>

                        <div className="space-y-4">
                            {!data.state ? (
                                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {Object.keys(INDIA_LOCATIONS).sort().map(state => (
                                        <button
                                            key={state}
                                            onClick={() => setData(prev => ({ ...prev, state }))}
                                            className="p-3 text-sm font-bold text-left rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:bg-slate-50 transition-all capitalize"
                                        >
                                            {state}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <button
                                            onClick={() => setData(prev => ({ ...prev, state: '', city: '' }))}
                                            className="text-blue-600 font-bold flex items-center gap-1 hover:underline"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> {data.state}
                                        </button>
                                        <span className="text-slate-500 font-medium">Select City</span>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search city..."
                                            value={citySearch}
                                            onChange={(e) => setCitySearch(e.target.value)}
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredCities.map((city: string) => (
                                            <button
                                                key={city}
                                                onClick={() => handleSelect('city', city)}
                                                className={`p-3 text-xs font-bold text-left rounded-xl transition-all border
                                                    ${data.city === city
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md shadow-blue-500/5'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 mb-4 ring-1 ring-purple-500/10">
                                <Sparkles className="w-8 h-8 text-purple-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">Personalize Passions</h2>
                            <p className="text-slate-500 mt-2 text-sm uppercase font-bold tracking-widest">Select one or more</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'Adventure', icon: '🧗' },
                                { id: 'Beach', icon: '🏖️' },
                                { id: 'Culture', icon: '🏛️' },
                                { id: 'Foodie', icon: '🍜' },
                                { id: 'Wellness', icon: '🧖' },
                                { id: 'Nature', icon: '🏔️' },
                                { id: 'Shopping', icon: '🛍️' },
                                { id: 'Nightlife', icon: '🎉' },
                                { id: 'History', icon: '📜' }
                            ].map(interest => (
                                <button
                                    key={interest.id}
                                    onClick={() => toggleInterest(interest.id)}
                                    className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 relative group
                                        ${data.interests.includes(interest.id)
                                            ? 'bg-purple-50 border-purple-500 ring-4 ring-purple-500/5 shadow-lg shadow-purple-500/10'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-purple-500/50 hover:bg-slate-50'}`}
                                >
                                    {data.interests.includes(interest.id) && (
                                        <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-0.5 animate-in zoom-in">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    <span className="text-2xl group-hover:scale-110 transition-transform">{interest.icon}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${data.interests.includes(interest.id) ? 'text-purple-700' : 'text-slate-500'}`}>{interest.id}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={nextStep}
                            disabled={data.interests.length === 0}
                            className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all
                                ${data.interests.length > 0
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                        >
                            Continue
                        </button>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 mb-4 ring-1 ring-orange-500/10">
                                <Rocket className="w-8 h-8 text-orange-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">Travel Habits</h2>
                            <p className="text-slate-600 mt-2">How often do you hit the road?</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'very_often', label: 'Very Often', desc: 'More than 5 times a year', icon: '✈️' },
                                { id: 'regularly', label: 'Regularly', desc: '2-4 times a year', icon: '🎒' },
                                { id: 'occasionally', label: 'Occasionally', desc: 'Once a year', icon: '🚗' },
                                { id: 'rarely', label: 'Rarely', desc: 'Once in two years', icon: '🚶' }
                            ].map(freq => (
                                <button
                                    key={freq.id}
                                    onClick={() => handleSelect('travel_frequency', freq.id)}
                                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 text-left group
                                        ${data.travel_frequency === freq.id
                                            ? 'bg-orange-50 border-orange-500 ring-4 ring-orange-500/5 shadow-lg shadow-orange-500/10'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-orange-500/50 hover:bg-slate-50'}`}
                                >
                                    <span className="text-3xl group-hover:rotate-12 transition-transform">{freq.icon}</span>
                                    <div>
                                        <p className={`font-bold uppercase text-sm tracking-tight ${data.travel_frequency === freq.id ? 'text-orange-900' : 'text-slate-900'}`}>{freq.label}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{freq.desc}</p>
                                    </div>
                                    <ChevronRight className={`ml-auto w-5 h-5 transition-all ${data.travel_frequency === freq.id ? 'translate-x-1 text-orange-500' : 'text-slate-400'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-12 duration-700 ease-out">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-4 ring-1 ring-emerald-500/10">
                                <Wallet className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tighter">Preferred Style</h2>
                            <p className="text-slate-600 mt-2 font-medium">Your comfort is our priority</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'Budget', label: 'Backpacker', desc: 'Focus on experiences, save on stays', icon: '⛺' },
                                { id: 'Mid', label: 'Mid-Range', desc: 'Balance of comfort and value', icon: '🏨' },
                                { id: 'Luxury', label: 'Premium', desc: 'Top tier stays and exclusive access', icon: '🎩' }
                            ].map(budget => (
                                <button
                                    key={budget.id}
                                    onClick={() => handleSelect('budget', budget.id)}
                                    className={`p-5 rounded-2xl border transition-all duration-500 flex items-center gap-5 text-left group
                                        ${data.budget === budget.id
                                            ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/5 shadow-lg shadow-emerald-500/10'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-500 ${data.budget === budget.id ? 'bg-emerald-500 text-white scale-110' : 'bg-slate-100 text-slate-400'}`}>
                                        {budget.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-bold uppercase text-xs tracking-widest ${data.budget === budget.id ? 'text-emerald-900' : 'text-slate-900'}`}>{budget.label}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{budget.desc}</p>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-all duration-500 ${data.budget === budget.id ? 'translate-x-1 text-emerald-600' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => onComplete(data)}
                            disabled={!isStepValid()}
                            className="w-full mt-6 bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-600 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-xs shadow-2xl shadow-emerald-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-500 group"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Forge My DNA <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            </span>
                        </button>
                    </div>
                );
        }
    };

    return (
        <div
            className="w-full max-w-md mx-auto bg-white/90 shadow-2xl md:rounded-[3.5rem] overflow-hidden border border-white/40 backdrop-blur-3xl flex flex-col h-full md:h-auto min-h-[680px] animate-in fade-in zoom-in duration-1000"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', 'Inter', sans-serif" }}
        >
            {/* Immersive Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100 flex">
                {[1, 2, 3, 4, 5].map(s => (
                    <div
                        key={s}
                        className={`h-full flex-1 transition-all duration-700 ${s <= step ? 'bg-teal-500' : ''}`}
                        style={{
                            opacity: s <= step ? 1 : 0.1,
                            transform: s <= step ? 'scaleX(1)' : 'scaleX(0)',
                            boxShadow: s === step ? '0 0 15px rgba(20,184,166,0.2)' : 'none'
                        }}
                    />
                ))}
            </div>

            {/* Content Sidebar / Header area */}
            <div className="p-8 pb-12 flex-1 relative overflow-y-auto custom-scrollbar">
                <div className="absolute top-8 left-8 z-50">
                    {step > 1 && (
                        <button
                            onClick={prevStep}
                            className="p-3 rounded-2xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all border border-slate-200 hover:scale-110 active:scale-90"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="mt-8">
                    {renderStep()}
                </div>
            </div>

            {/* Footer Branding */}
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.5em]">Traivo • Travel Personalization</p>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap');
                
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }
            `}</style>
        </div>
    );
};
