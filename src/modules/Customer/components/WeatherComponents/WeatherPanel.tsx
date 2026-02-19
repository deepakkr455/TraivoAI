import React from 'react';
import { WeatherData } from '../../../../types';
import { CurrentWeather } from './CurrentWeather';
import { ForecastChart } from './ForecastChart';
import { ForecastRow } from './ForecastRow';
import { TravelRecommendations } from './TravelRecommendations';
import { WeatherNews } from './WeatherNews';
import { VerifiedSources } from './VerifiedSources';

import { X, Share2, MapPin, Maximize2, Minimize2 } from 'lucide-react';

interface WeatherPanelProps {
  data: WeatherData | null;
  onClose: () => void;
  isLoading?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({
  data,
  onClose,
  isLoading = false,
  isExpanded = false,
  onToggleExpand
}) => {
  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 text-gray-800 flex flex-col relative overflow-hidden">

      {/* Action Buttons (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={onClose}
          className="bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-colors border border-gray-200"
          aria-label="Close weather view"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="hidden md:block bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-colors border border-gray-200"
            aria-label={isExpanded ? "Collapse view" : "Expand view"}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="w-5 h-5 text-gray-600" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
        <button
          className="bg-teal-500 hover:bg-teal-600 text-white rounded-full p-2 shadow-lg transition-colors border border-teal-400"
          title="Share Forecast"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 relative z-10 scrollbar-hide">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 py-6">

          {!isLoading && data && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* 1. Current Weather */}
              <CurrentWeather data={data} />

              {/* 2. Forecast Chart */}
              <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">5-Day Forecast</h3>
                <div className="h-[280px]">
                  <ForecastChart data={data.forecast} />
                </div>
              </div>

              {/* 3. Forecast Row */}
              <ForecastRow forecast={data.forecast} />

              {/* 4. Travel Recommendations */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Travel Recommendations</h3>
                <TravelRecommendations recommendations={data.travelRecommendations} />
              </div>

              {/* 5. Weather News */}
              <WeatherNews news={data.news} />

              {/* 6. Sources */}
              <VerifiedSources urls={data.groundingUrls} />
            </div>
          )}

          {isLoading && (
            <div className="w-full animate-pulse space-y-4">
              <div className="h-[300px] bg-white rounded-[2rem] border border-gray-200 shadow-lg"></div>
              <div className="h-24 bg-white rounded-[1rem] shadow-lg"></div>
              <div className="h-24 bg-white rounded-[1rem] shadow-lg"></div>
            </div>
          )}

          {!isLoading && !data && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-gray-300" />
              </div>
              <p>Ask TraivoAI to see weather details.</p>
            </div>
          )}
        </div>

        {/* <div className="mt-8 pb-8 text-center text-gray-400 text-[10px] font-medium tracking-widest uppercase">
          Powered by Google Gemini 2.5 Flash
        </div> */}
      </div>

    </div>
  );
};
