import React from 'react';
import { Map, MapPin, Navigation } from 'lucide-react';
import { DayPlan } from '../../../types';


interface MapPreviewCardProps {
    dayPlan: DayPlan;
    onViewMap: () => void;
}

export const MapPreviewCard: React.FC<MapPreviewCardProps> = ({ dayPlan, onViewMap }) => {
    const { locationName, weather, itinerary } = dayPlan;
    const activityCount = itinerary.filter(item => item.type === 'activity').length;

    return (
        <div className="bg-gray-800/60 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-600/50 w-80 mt-2 hover:bg-gray-800/70 transition-all group flex-shrink-0">
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <MapPin className="w-4 h-4 text-teal-400" />
                            <h3 className="text-lg font-bold text-white leading-tight">{locationName}</h3>
                        </div>
                        <p className="text-xs text-teal-200/80 ml-5.5">Day Trip Itinerary</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-2xl filter drop-shadow-md">{weather.icon === 'sunny' ? '☀️' : weather.icon === 'cloudy' ? '☁️' : '🌤️'}</span>
                        <span className="text-[10px] font-medium text-teal-100">{weather.temperature}</span>
                    </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-2.5 mb-3 border border-gray-600/30">
                    <p className="text-xs text-gray-200 line-clamp-2 italic">
                        "{weather.description}"
                    </p>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Navigation className="w-3.5 h-3.5 text-blue-400" />
                        <span>{activityCount} stops planned</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Map className="w-3.5 h-3.5 text-purple-400" />
                        <span>Interactive Map View</span>
                    </div>
                </div>

                <button
                    onClick={onViewMap}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white text-sm font-bold rounded-lg shadow-lg border border-teal-500/30 transition-all flex items-center justify-center gap-2 group-hover:shadow-teal-500/20 transform group-hover:-translate-y-0.5"
                >
                    <Map className="w-4 h-4" />
                    View Day Map
                </button>
            </div>
        </div>
    );
};
