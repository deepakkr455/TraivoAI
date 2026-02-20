import React from 'react';
import { WeatherData } from '../../../../types';
import { getWeatherIcon } from '../../../../utils/iconMap';

import { ArrowRight } from 'lucide-react';

interface WeatherPreviewCardProps {
  data: WeatherData;
  onViewClick?: () => void;
}

export const WeatherPreviewCard: React.FC<WeatherPreviewCardProps> = ({ data, onViewClick }) => {
  const Icon = getWeatherIcon(data?.current?.condition || 'Sunny', "w-10 h-10");

  return (
    <div className="bg-gray-800/60 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-600/50 w-full max-w-[320px] mx-auto flex-shrink-0">
      <div
        className="block hover:opacity-90 transition-opacity cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          onViewClick?.();
        }}
      >
        <div className="p-4">
          <p className="text-xs text-teal-300 font-semibold">WEATHER FORECAST IS READY</p>
          <h3 className="text-lg font-bold text-white mt-1">{data.location}</h3>
          <div className="flex items-center justify-between mt-3 mb-2">
            <div className="flex items-center gap-3">
              {Icon}
              <div>
                <p className="text-3xl font-bold text-white">{Math.round(data.current.temp)}°</p>
                <p className="text-xs text-gray-400">{data.current.condition}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">H/L</p>
              <p className="text-sm font-semibold text-white">
                {Math.round(data.current.high)}° / {Math.round(data.current.low)}°
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-600/50 text-sm font-medium text-teal-200">
            <span>View Full Forecast</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
