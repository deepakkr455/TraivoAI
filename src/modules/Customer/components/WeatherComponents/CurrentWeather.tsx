import React from 'react';
import { WeatherData } from '../../../../types';
import { getWeatherIcon, getConditionColorClass } from '../../../../utils/iconMap';

import {
  ArrowUp,
  ArrowDown,
  Droplets,
  Wind,
  Eye,
  Gauge,
  Sun,
  Sparkles,
  Thermometer,
  CloudRain,
  Activity,
  Zap,
  MapPin
} from 'lucide-react';

interface CurrentWeatherProps {
  data: WeatherData;
}

export const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data }) => {
  const { current = {} as any, location = 'Unknown Location', projection = '' } = data || {};

  const humidityVal = parseInt(current?.humidity || '0') || 0;
  const precipVal = parseInt(current?.precipitation || '0') || 0;
  const uvVal = parseInt(current?.uvIndex || '0') || 0;

  // Title Color based on Weather
  const titleColor = getConditionColorClass(current?.condition || 'Sunny');

  // Helper logic for conditional background styling for KPIs
  // The entire tile background changes to reflect status
  const getAqiStyle = (aqiStr: string) => {
    const aqi = parseInt(aqiStr) || 0;
    // Good
    if (aqi <= 50 || aqiStr.toLowerCase().includes('good')) {
      return { bg: 'bg-emerald-100/50', border: 'border-emerald-200', text: 'text-emerald-900', icon: 'text-emerald-700' };
    }
    // Moderate
    if (aqi <= 100 || aqiStr.toLowerCase().includes('moderate')) {
      return { bg: 'bg-amber-100/50', border: 'border-amber-200', text: 'text-amber-900', icon: 'text-amber-700' };
    }
    // Unhealthy/Hazardous
    return { bg: 'bg-rose-100/80', border: 'border-rose-300', text: 'text-rose-900', icon: 'text-rose-700' };
  };

  const getUvStyle = (uv: number) => {
    if (uv <= 2) return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-slate-900', icon: 'text-emerald-600' };
    if (uv <= 5) return { bg: 'bg-yellow-100/60', border: 'border-yellow-200', text: 'text-yellow-900', icon: 'text-yellow-700' };
    if (uv <= 7) return { bg: 'bg-orange-100/60', border: 'border-orange-200', text: 'text-orange-900', icon: 'text-orange-700' };
    return { bg: 'bg-red-100/80', border: 'border-red-300', text: 'text-red-900', icon: 'text-red-700' };
  };

  const getPrecipStyle = (precip: number) => {
    if (precip === 0) return { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-900', icon: 'text-slate-500' };
    if (precip < 30) return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-900', icon: 'text-blue-600' };
    return { bg: 'bg-blue-100/80', border: 'border-blue-300', text: 'text-blue-950', icon: 'text-blue-700' };
  };

  const aqiStyle = getAqiStyle(current?.airQuality || '0 (Good)');
  const uvStyle = getUvStyle(uvVal);
  const precipStyle = getPrecipStyle(precipVal);

  return (
    <div className="w-full mb-8 animate-fade-in-up">
      {/* Main Container - The "Ceramic Slab" */}
      <div className="rounded-[3rem] bg-white/95 backdrop-blur-3xl border border-white/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden relative group">

        <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-12">

          {/* Header Section: Location & Time */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 sm:mb-8 md:mb-12 border-b border-slate-100/80 pb-4 sm:pb-6 md:pb-8 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MapPin className={`w-6 h-6 ${titleColor} animate-bounce`} />
                <h2 className={`text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-display transition-colors duration-500 ${titleColor} break-words`}>
                  {location}
                </h2>
              </div>

              <div className="flex items-center gap-3 mt-3 text-slate-500 font-medium text-sm md:text-base tracking-wide uppercase pl-1">
                <span className="text-amber-600 font-bold tracking-widest">{current.localTime}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span>Live Data</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-500 text-[11px] uppercase font-bold tracking-widest flex items-center gap-2 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                Real-time
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10">

            {/* Left Column: Hero Weather */}
            <div className="lg:col-span-6 flex flex-col relative">

              <div className="flex items-center gap-6 mb-4">
                {/* Temperature */}
                <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 leading-none tracking-tighter font-display -ml-1 sm:-ml-2 transition-all duration-300">
                  {Math.round(current.temp)}°
                </div>
                {/* Icon Card */}
                <div className="p-4 sm:p-5 md:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                  {getWeatherIcon(current.condition, "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24")}
                </div>
              </div>

              <div className="text-xl sm:text-2xl md:text-3xl font-medium text-amber-600 mb-4 sm:mb-6 md:mb-8 font-display tracking-tight pl-1 sm:pl-2">
                {current.condition}
              </div>

              {/* High/Low/Feels Like Pill */}
              <div className="inline-flex flex-wrap items-center gap-5 text-sm font-semibold p-5 bg-slate-50/80 rounded-3xl border border-slate-200/60 w-full md:w-auto text-slate-600">
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 text-rose-500" />
                  <span className="font-display">H: {Math.round(current.high)}°</span>
                </div>
                <div className="w-px h-5 bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 text-cyan-600" />
                  <span className="font-display">L: {Math.round(current.low)}°</span>
                </div>
                <div className="w-px h-5 bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-amber-500" />
                  <span className="font-display">Feels: {current.feelsLike}°</span>
                </div>
              </div>
            </div>

            {/* Right Column: AI Projection & Metrics */}
            <div className="lg:col-span-6 flex flex-col gap-8">

              {/* AI Projection - Dark Contrast */}
              <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-8 shadow-2xl ring-1 ring-white/10 group-hover:scale-[1.01] transition-transform duration-500">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform rotate-12">
                  <Zap className="w-32 h-32 text-white" />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-display">AI Synthesis</span>
                </div>

                <p className="text-sm md:text-base text-slate-200 font-light leading-relaxed font-display border-l-2 border-amber-500 pl-6 italic relative z-10">
                  "{projection}"
                </p>
              </div>


            </div>
          </div>

          {/* Detailed Metrics Grid with Conditional Backgrounds */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">

            <MetricTile
              label="Air Quality"
              value={current.airQuality.split(' ')[0]}
              subValue={current.airQuality.split(' ').slice(1).join(' ').replace(/[()]/g, '')}
              icon={<Activity className={`w-5 h-5 ${aqiStyle.icon}`} />}
              bgClass={aqiStyle.bg}
              borderClass={aqiStyle.border}
              textColor={aqiStyle.text}
            />

            <MetricTile
              label="Precipitation"
              value={current.precipitation}
              icon={<CloudRain className={`w-5 h-5 ${precipStyle.icon}`} />}
              bgClass={precipStyle.bg}
              borderClass={precipStyle.border}
              textColor={precipStyle.text}
              footer={
                <div className="w-full h-1.5 bg-white/50 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-current opacity-70 transition-all duration-1000" style={{ width: `${precipVal}%` }}></div>
                </div>
              }
            />

            <MetricTile
              label="Humidity"
              value={current.humidity}
              icon={<Droplets className="w-5 h-5 text-cyan-600" />}
              bgClass="bg-slate-50"
              borderClass="border-slate-100"
              footer={
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${humidityVal}%` }}></div>
                </div>
              }
            />

            <MetricTile
              label="UV Index"
              value={current.uvIndex}
              icon={<Sun className={`w-5 h-5 ${uvStyle.icon}`} />}
              bgClass={uvStyle.bg}
              borderClass={uvStyle.border}
              textColor={uvStyle.text}
            />

            <MetricTile
              label="Wind"
              value={current.wind}
              icon={<Wind className="w-5 h-5 text-slate-500" />}
              bgClass="bg-slate-50"
              borderClass="border-slate-100"
            />

            <MetricTile
              label="Pressure"
              value={current.pressure}
              icon={<Gauge className="w-5 h-5 text-indigo-500" />}
              bgClass="bg-slate-50"
              borderClass="border-slate-100"
            />

            <MetricTile
              label="Visibility"
              value={current.visibility}
              icon={<Eye className="w-5 h-5 text-purple-500" />}
              bgClass="bg-slate-50"
              borderClass="border-slate-100"
            />

            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col justify-center items-center opacity-60">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Lumina AI</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const MetricTile: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  footer?: React.ReactNode;
  bgClass?: string;
  borderClass?: string;
  textColor?: string;
}> = ({ label, value, subValue, icon, footer, bgClass = 'bg-slate-50', borderClass = 'border-slate-100', textColor = 'text-slate-900' }) => (
  <div className={`${bgClass} ${borderClass} transition-colors duration-500 rounded-3xl p-5 border flex flex-col justify-between shadow-sm min-h-[140px]`}>
    <div>
      <div className="flex justify-between items-start mb-3">
        <span className="text-slate-500/80 text-[10px] font-bold uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      {/* Ensure text wraps if needed */}
      <div className={`text-lg leading-tight font-bold ${textColor} font-display tracking-tight break-words`}>{value}</div>
      {subValue && <div className="text-xs text-slate-600 font-medium mt-1 leading-snug">{subValue}</div>}
    </div>
    {footer && <div className="mt-auto pt-3">{footer}</div>}
  </div>
);
