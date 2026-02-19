import React from 'react';
import { WeatherData } from '../../../../types';
import { getWeatherIcon } from '../../../../utils/iconMap';


interface ForecastRowProps {
  forecast: WeatherData['forecast'];
}

export const ForecastRow: React.FC<ForecastRowProps> = ({ forecast }) => {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">5-Day Outlook</h3>
      <div className="flex-1 flex flex-col justify-between gap-3">
        {forecast.map((day, index) => (
          <div
            key={index}
            className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <span className="text-slate-700 text-sm font-semibold w-24 truncate">{day.day}</span>
              <div className="scale-90 origin-left opacity-80 group-hover:opacity-100 transition-opacity">
                {getWeatherIcon(day.condition)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-400 font-medium capitalize hidden sm:block tracking-wider">{day.condition}</span>
              <span className="text-lg font-bold text-slate-900 font-display tabular-nums">{Math.round(day.temp)}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};