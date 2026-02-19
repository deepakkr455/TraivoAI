
import React from 'react';
import type { WeatherInfo } from '../../../../types';

import { SunnyIcon, PartlyCloudyIcon, CloudyIcon, RainyIcon } from './icons';

const weatherIcons: { [key in WeatherInfo['icon']]: React.ReactNode } = {
    sunny: <SunnyIcon className="w-8 h-8 text-yellow-400" />,
    'partly-cloudy': <PartlyCloudyIcon className="w-8 h-8 text-gray-400" />,
    cloudy: <CloudyIcon className="w-8 h-8 text-gray-500" />,
    rainy: <RainyIcon className="w-8 h-8 text-blue-400" />,
    snowy: <PartlyCloudyIcon className="w-8 h-8 text-white" />,
    windy: <PartlyCloudyIcon className="w-8 h-8 text-gray-400" />,
};

export const WeatherWidget: React.FC<{ weather: WeatherInfo }> = ({ weather }) => {
    return (
        <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="transform scale-75 origin-left">
                    {weatherIcons[weather.icon] || <CloudyIcon className="w-8 h-8 text-gray-400" />}
                </div>
                <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 leading-tight">{weather.description}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Weather for today</p>
                </div>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{weather.temperature}</p>
        </div>
    );
};
