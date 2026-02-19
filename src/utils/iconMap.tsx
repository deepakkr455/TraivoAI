import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning,
  CloudDrizzle, Wind, Moon, CloudFog
} from 'lucide-react';

export const getWeatherIcon = (condition: string, className: string = "w-12 h-12") => {
  const c = condition.toLowerCase();

  if (c.includes('sunny') || c.includes('clear')) return <Sun className={className} />;
  if (c.includes('rain')) return <CloudRain className={className} />;
  if (c.includes('snow')) return <CloudSnow className={className} />;
  if (c.includes('storm')) return <CloudLightning className={className} />;
  if (c.includes('drizzle')) return <CloudDrizzle className={className} />;
  if (c.includes('wind')) return <Wind className={className} />;
  if (c.includes('fog') || c.includes('mist')) return <CloudFog className={className} />;
  if (c.includes('cloud')) return <Cloud className={className} />;
  if (c.includes('night')) return <Moon className={className} />;

  return <Sun className={className} />;
};

export const getConditionColorClass = (condition: string): string => {
  const c = condition.toLowerCase();

  if (c.includes('sunny') || c.includes('clear')) return 'text-amber-500';
  if (c.includes('rain') || c.includes('drizzle')) return 'text-blue-500';
  if (c.includes('cloud')) return 'text-slate-500';
  if (c.includes('snow') || c.includes('ice')) return 'text-cyan-400';
  if (c.includes('thunder') || c.includes('storm')) return 'text-indigo-600';
  if (c.includes('fog') || c.includes('mist')) return 'text-gray-400';

  return 'text-slate-700';
};
