import React, { useState } from 'react';
import { WeatherData } from '../../../../types';

import { Plane, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface TravelRecommendationsProps {
   recommendations: WeatherData['travelRecommendations'];
}

export const TravelRecommendations: React.FC<TravelRecommendationsProps> = ({ recommendations }) => {
   const [isExpanded, setIsExpanded] = useState(true);

   if (!recommendations || recommendations.length === 0) return null;

   return (
      <div className="w-full mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
         {/* Main Container - Matching CurrentWeather Style */}
         <div className="rounded-[3rem] bg-white/95 backdrop-blur-3xl border border-white/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden">

            {/* Header with Toggle */}
            <div
               className="p-4 sm:p-6 md:p-8 lg:p-10 border-b border-slate-100/80 cursor-pointer flex justify-between items-center group hover:bg-slate-50/50 transition-colors"
               onClick={() => setIsExpanded(!isExpanded)}
            >
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg">
                     <Plane className="w-6 h-6 text-white" />
                  </div>
                  <div>
                     <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 font-display tracking-tight">
                        Travel Recommendations
                     </h3>
                     <p className="text-sm text-slate-500 mt-1">
                        Best places to visit based on current weather
                     </p>
                  </div>
               </div>
               <button className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  {isExpanded ? (
                     <ChevronUp className="w-6 h-6 text-slate-600" />
                  ) : (
                     <ChevronDown className="w-6 h-6 text-slate-600" />
                  )}
               </button>
            </div>

            {/* Collapsible Content */}
            <div
               className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
            >
               <div className="p-4 sm:p-6 md:p-8 lg:p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                     {recommendations.map((rec, idx) => (
                        <div
                           key={idx}
                           className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-6 border border-slate-200 hover:border-rose-300 hover:shadow-xl transition-all duration-300 group"
                        >
                           <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                              <h4 className="text-xl font-bold text-slate-900 font-display">{rec.place}</h4>
                           </div>

                           <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                              {rec.description}
                           </p>

                           <div className="mt-auto pt-4 border-t border-slate-200/50">
                              <div className="flex items-start gap-2">
                                 <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Why?</span>
                                 <p className="text-xs text-rose-600 font-medium italic leading-relaxed flex-1">
                                    {rec.reason}
                                 </p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};
