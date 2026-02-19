import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface VerifiedSourcesProps {
  urls: string[] | undefined;
}

export const VerifiedSources: React.FC<VerifiedSourcesProps> = ({ urls }) => {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed by default

  if (!urls || urls.length === 0) return null;

  return (
    <div className="w-full mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      {/* Main Container - Matching CurrentWeather Style */}
      <div className="rounded-[3rem] bg-white/95 backdrop-blur-3xl border border-white/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden">

        {/* Header with Toggle */}
        <div
          className="p-4 sm:p-6 md:p-8 lg:p-10 cursor-pointer flex justify-between items-center group hover:bg-slate-50/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 font-display tracking-tight">
                Verified Data Sources
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {urls.length} trusted sources used for this forecast
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
          className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="p-4 sm:p-6 md:p-8 lg:p-10 border-t border-slate-100/80">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {urls.map((url, i) => {
                let hostname = "Source";
                try { hostname = new URL(url).hostname.replace('www.', ''); } catch (e) { }
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all text-sm text-slate-700 hover:text-emerald-700 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="truncate max-w-[200px] font-mono text-xs">{hostname}</span>
                  </a>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60">
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900">Data Accuracy:</span> Information synthesized from real-time semantic analysis of the above verified sources using Google Gemini AI. Accuracy may vary based on source availability and update frequency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
