import React from 'react';
import { Product, ItineraryItem } from '../types';
import { MapIcon } from './Icons';

interface ItineraryTimelineProps {
    itinerary: ItineraryItem[];
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ itinerary }) => {
    if (!itinerary) return null;

    return (
        <div className="relative pl-8">
            {/* Vertical Line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-8">
                {itinerary.map((item, index) => (
                    <div key={item.day || index} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-5 top-1.5 h-6 w-6 rounded-full bg-white dark:bg-gray-600 border-2 border-gray-300 dark:border-gray-500 flex items-center justify-center">
                            <MapIcon />
                        </div>

                        <div className="ml-6 bg-white dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h4 className="font-bold text-md text-gray-900 dark:text-gray-100">
                                Day {item.day}: {item.title}
                            </h4>
                            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                                {(item.description || '').split('. ').filter(s => s.length > 0).map((point, i) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                            {item.day === 1 && (
                                <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-400 text-xs text-yellow-800 dark:text-yellow-200">
                                    <strong>Note:</strong> Exact pickup details will be shared 24 hours before departure.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {/* End Dot */}
                <div className="relative">
                    <div className="absolute -left-5 top-1.5 h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-500 border-2 border-gray-300 dark:border-gray-500" />
                </div>
            </div>
        </div>
    );
};
