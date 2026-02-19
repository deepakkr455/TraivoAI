import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';
import { WeatherData } from '../../../../types';


interface ForecastChartProps {
  data: WeatherData['forecast'];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm italic">
        Forecast data unavailable
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Temperature Trend</h3>
        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">Next 5 Days</div>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="transparent"
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              tickMargin={15}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Space Grotesk' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                color: '#1e293b',
                fontFamily: 'Space Grotesk',
                padding: '12px'
              }}
              itemStyle={{ color: '#d97706', fontWeight: 600 }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              formatter={(value: number) => [`${value}°`, '']}
            />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#fbbf24"
              fillOpacity={1}
              fill="url(#colorTemp)"
              strokeWidth={3}
              activeDot={{ r: 6, fill: '#fff', stroke: '#fbbf24', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};