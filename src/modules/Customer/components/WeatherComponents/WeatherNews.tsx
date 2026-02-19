import React, { useState } from 'react';
import { ExternalLink, Radio, ChevronDown, ChevronUp } from 'lucide-react';
import { WeatherData } from '../../../../types';


interface WeatherNewsProps {
  news: WeatherData['news'];
}

export const WeatherNews: React.FC<WeatherNewsProps> = ({ news }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!news || news.length === 0) return null;

  return (
    <div className="w-full mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      {/* Main Container - Matching CurrentWeather Style */}
      <div className="rounded-[3rem] bg-white/95 backdrop-blur-3xl border border-white/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden">

        {/* Header with Toggle */}
        <div
          className="p-4 sm:p-6 md:p-8 lg:p-10 border-b border-slate-100/80 cursor-pointer flex justify-between items-center group hover:bg-slate-50/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 font-display tracking-tight">
                Weather News
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Latest weather updates and alerts
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
            } `}
        >
          <div className="p-4 sm:p-6 md:p-8 lg:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {news.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block relative p-6 rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-amber-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-block px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                      {item.source || 'News'}
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                  </div>

                  <h4 className="text-slate-900 text-base font-bold leading-snug font-display mb-3 group-hover:text-amber-700 transition-colors line-clamp-3 min-h-[4.5rem]">
                    {item.title}
                  </h4>

                  {/* Hover bar effect */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-amber-400 to-orange-500 group-hover:w-full transition-all duration-700 rounded-b-3xl"></div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
