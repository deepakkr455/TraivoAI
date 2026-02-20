
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import type { DayPlan, ItineraryEvent } from '../../../../types';

import { CarIcon, ExportIcon } from './icons';
import { WeatherWidget } from './WeatherWidget';
import { X, Maximize2, Minimize2, ChevronRight } from 'lucide-react';

const TimelineItem: React.FC<{ event: ItineraryEvent; isLast: boolean }> = ({ event, isLast }) => {
    const isActivity = event.type === 'activity';

    return (
        <li className="relative flex gap-x-4">
            <div className={`absolute left-[1.125rem] top-5 -bottom-5 w-px ${isLast ? '' : 'bg-gray-200'}`}></div>
            <div className="relative flex-none">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center ring-4 ring-gray-50 z-10 relative">
                    {isActivity ? (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    ) : (
                        <CarIcon className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </div>
            <div className="flex-grow pt-1.5 pb-8">
                <p className="text-xs text-gray-500 font-semibold mb-1">{event.time}</p>
                <div className={`p-4 rounded-xl border ${isActivity ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="font-bold text-gray-900 text-sm">
                        {isActivity ? (event.name || 'Activity') : `Driving to ${event.to || 'Next Stop'}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                        {isActivity ? (event.description || 'No description available.') : `From ${event.from || 'Previous Stop'}`}
                    </p>
                    <span className="mt-3 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-700/10">
                        {event.duration}
                    </span>
                </div>
            </div>
        </li>
    );
};


export const Sidebar: React.FC<{ dayPlan: DayPlan | null; onClose: () => void }> = ({ dayPlan, onClose }) => {

    const handleExport = () => {
        if (!dayPlan) return;

        const doc = new jsPDF();

        // Title
        doc.setFontSize(22);
        doc.text(`One Day in ${dayPlan.locationName}`, 20, 20);

        // Weather
        doc.setFontSize(12);
        doc.setTextColor(100);
        if (dayPlan.weather) {
            doc.text(`${dayPlan.weather.temperature} | ${dayPlan.weather.description}`, 20, 30);
        }

        // Itinerary
        doc.setTextColor(0);
        doc.setFontSize(14);
        doc.text("Itinerary", 20, 45);

        let yPos = 55;
        dayPlan.itinerary.forEach((event, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            const time = event.time;
            const title = event.type === 'activity' ? event.name : `Travel to ${event.to}`;
            const details = event.type === 'activity' ? event.description : `Mode: ${event.mode} | Duration: ${event.duration}`;

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${time} - ${title}`, 20, yPos);

            yPos += 6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            const splitDetails = doc.splitTextToSize(details, 170);
            doc.text(splitDetails, 20, yPos);

            yPos += (splitDetails.length * 5) + 8;
        });

        doc.save(`${dayPlan.locationName.split(',')[0].replace(/\\s+/g, '_')}_Itinerary.pdf`);
    };

    return (
        <aside className="w-full h-full bg-white border-l border-gray-200 flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors bg-white/50"
                            title="Collapse Sidebar"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-none">Your Day Plan</h2>
                            {dayPlan?.locationName && <p className="text-xs text-gray-500 mt-1">{dayPlan.locationName}</p>}
                        </div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={!dayPlan}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ExportIcon className="w-4 h-4" />
                        Export
                    </button>
                </div>
                {dayPlan?.weather && (
                    <div className="mt-2">
                        <WeatherWidget weather={dayPlan.weather} />
                    </div>
                )}
            </div>

            <div className="flex-grow overflow-y-auto px-6 pt-6 pb-20 no-scrollbar">
                {dayPlan ? (
                    <ul>
                        {dayPlan.itinerary.map((event, index) => (
                            <TimelineItem
                                key={`${event.type}-${index}`}
                                event={event}
                                isLast={index === dayPlan.itinerary.length - 1}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg mb-2">Ready to explore?</h3>
                        <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">Search for a location or try one of these trending destinations:</p>

                        <div className="flex flex-wrap justify-center gap-2 w-full">
                            {['Kyoto, Japan', 'Reykjavik, Iceland', 'Banff, Canada', 'Santorini, Greece'].map((city) => (
                                <button
                                    key={city}
                                    // In a real app, this would trigger a search. For now, it's visual.
                                    className="px-4 py-2 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full text-sm font-medium border border-gray-200 hover:border-blue-200 transition-all shadow-sm"
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};
