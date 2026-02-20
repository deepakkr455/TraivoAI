import React, { useState, useMemo, useEffect } from 'react';
import { MapComponent } from './MapComponents/MapComponent';
import { Sidebar } from './MapComponents/Sidebar';
import { BottomCarousel } from './MapComponents/BottomCarousel';
import type { DayPlan, ActivityEvent } from '../../../types';

import { X, Maximize2, Minimize2 } from 'lucide-react';

interface MapPanelProps {
    dayPlan: DayPlan | null;
    onClose: () => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export const MapPanel: React.FC<MapPanelProps> = ({ dayPlan, onClose, isExpanded, onToggleExpand }) => {
    const [selectedPlace, setSelectedPlace] = useState<ActivityEvent | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Local state for sidebar visibility within panel

    // Sync sidebar state with panel expansion
    useEffect(() => {
        setIsSidebarOpen(!!isExpanded);
    }, [isExpanded]);

    const activities = useMemo(() => {
        if (!dayPlan) return [];
        return dayPlan.itinerary.filter(
            (event): event is ActivityEvent =>
                event.type === 'activity' &&
                typeof event.latitude === 'number' &&
                !isNaN(event.latitude) &&
                typeof event.longitude === 'number' &&
                !isNaN(event.longitude)
        );
    }, [dayPlan]);

    if (!dayPlan) return null;

    return (
        <div className="relative h-full w-full flex flex-col bg-gray-50 overflow-hidden">
            {/* Header/Controls - ABSOLUTE positioned to float over map */}
            <div className={`absolute top-4 z-[1100] flex flex-col gap-2 transition-all duration-300 ${isSidebarOpen ? 'md:right-[21rem] right-4' : 'right-4'}`}>
                <button
                    onClick={onClose}
                    className="bg-white hover:bg-gray-100 rounded-full p-3 shadow-lg transition-colors text-gray-700 border border-gray-100 flex items-center justify-center"
                    aria-label="Close map view"
                >
                    <X className="w-5 h-5" />
                </button>
                {onToggleExpand && (
                    <button
                        onClick={onToggleExpand}
                        className="hidden md:flex bg-white hover:bg-gray-100 rounded-full p-3 shadow-lg transition-colors text-gray-700 border border-gray-100 items-center justify-center"
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? (
                            <Minimize2 className="w-5 h-5" />
                        ) : (
                            <Maximize2 className="w-5 h-5" />
                        )}
                    </button>
                )}
            </div>

            {/* Map Layer - Full screen background */}
            <div className="absolute inset-0 z-0">
                <MapComponent activities={activities} selectedPlace={selectedPlace} />
            </div>

            {/* Sidebar - Floats on the right side if open */}
            <div
                className={`absolute top-0 bottom-0 right-0 z-[1050] shadow-2xl transition-transform duration-300 ease-in-out bg-white w-full md:w-80 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <Sidebar
                    dayPlan={dayPlan}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>

            {/* Sidebar Toggle Button (Visible when Sidebar is CLOSED) */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-1/2 right-0 -translate-y-1/2 z-[999] bg-white/90 backdrop-blur text-blue-600 p-3 rounded-l-xl shadow-lg hover:bg-white hover:pr-4 transition-all group border border-r-0 border-gray-200"
                    title="See Details"
                >
                    <div className="flex flex-col items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-wider vertical-rl writing-mode-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Details</span>
                    </div>
                </button>
            )}


            {/* Bottom Carousel Layer */}
            <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none">
                <div className="pointer-events-auto">
                    <BottomCarousel activities={activities} onSelectPlace={setSelectedPlace} selectedPlace={selectedPlace} />
                </div>
            </div>
        </div>
    );
};
