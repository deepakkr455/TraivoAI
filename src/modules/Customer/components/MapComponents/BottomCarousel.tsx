
import React, { useRef, useEffect } from 'react';
import type { ActivityEvent } from '../../../../types';

import { ClockIcon } from './icons';

interface CarouselCardProps {
    place: ActivityEvent;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
}

const CarouselCard: React.FC<CarouselCardProps> = ({ place, index, isSelected, onSelect }) => {

    // Using a more consistent and premium color palette for gradients
    const gradients = [
        'from-blue-600 to-indigo-700',
        'from-emerald-500 to-teal-600',
        'from-orange-500 to-red-600',
        'from-violet-600 to-purple-700',
        'from-pink-500 to-rose-600',
        'from-cyan-500 to-blue-600'
    ];
    const gradientClass = gradients[index % gradients.length];

    return (
        <div
            onClick={onSelect}
            className={`flex-shrink-0 w-72 h-40 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-300 relative overflow-hidden shadow-xl transform hover:-translate-y-1 hover:shadow-2xl group ${isSelected ? 'ring-4 ring-offset-2 ring-white ring-blue-500 scale-105' : 'ring-1 ring-white/20'}`}
        >
            {/* Background Image with Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-90 transition-opacity duration-300 group-hover:opacity-100`}></div>
            <img
                src={`https://picsum.photos/seed/${place.latitude}/400/300`}
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 group-hover:opacity-20 transition-opacity duration-300"
                alt={place.name}
                loading="lazy"
            />

            {/* Content */}
            <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold text-white border border-white/30">
                        {index + 1}
                    </span>
                    <span className="text-xs font-medium text-white/90 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {place.time}
                    </span>
                </div>

                <div>
                    <h3 className="font-bold text-base text-white leading-tight mb-1 line-clamp-1 group-hover:line-clamp-none transition-all duration-300">{place.name}</h3>
                    <p className="text-xs text-blue-50 line-clamp-2 opacity-90 mb-2">{place.description}</p>

                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/80 bg-white/10 px-1.5 py-0.5 rounded backdrop-blur-sm">
                            <ClockIcon className="w-3 h-3" />
                            {place.duration}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface BottomCarouselProps {
    activities: ActivityEvent[];
    onSelectPlace: (place: ActivityEvent) => void;
    selectedPlace: ActivityEvent | null;
}

export const BottomCarousel: React.FC<BottomCarouselProps> = ({ activities, onSelectPlace, selectedPlace }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initial scroll to start
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = 0;
        }
    }, [activities]);

    if (!activities.length) return null;

    return (
        <div className="w-full h-full flex flex-col justify-end pl-6">
            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 pt-4 px-4 scroll-smooth no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Inline style fallback
            >
                {activities.map((place, index) => (
                    <CarouselCard
                        key={`${place.name}-${index}`}
                        place={place}
                        index={index}
                        onSelect={() => onSelectPlace(place)}
                        isSelected={selectedPlace?.name === place.name && selectedPlace?.time === place.time}
                    />
                ))}
            </div>
            {/* Inline style for hiding scrollbar webkit */}
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};
