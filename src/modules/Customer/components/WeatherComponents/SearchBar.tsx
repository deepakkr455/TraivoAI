import React, { useState } from 'react';
import { Search, MapPin, Command } from 'lucide-react';

interface SearchBarProps {
  onSearch: (location: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="w-full flex justify-center z-50 relative mb-8">
      <form onSubmit={handleSubmit} className={`relative w-full max-w-lg transition-all duration-500 ease-out ${isFocused ? 'scale-105' : 'scale-100'}`}>
        
        {/* Input Container */}
        <div className={`relative flex items-center bg-[#0B1121] bg-opacity-80 backdrop-blur-md border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 ${isFocused ? 'border-white/20 ring-1 ring-white/10' : ''}`}>
          
          <div className="pl-6 text-slate-500">
            <Search className={`w-4 h-4 transition-colors duration-300 ${isFocused ? 'text-cyan-400' : 'text-slate-600'}`} />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search city or coordinates..."
            disabled={isLoading}
            className="w-full bg-transparent text-white placeholder-slate-600 px-4 py-4 text-base font-light focus:outline-none focus:ring-0 tracking-wide font-display"
          />

          <div className="pr-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`p-2.5 rounded-full transition-all duration-300 ${
                query.trim() 
                  ? 'bg-white text-black hover:bg-cyan-50' 
                  : 'bg-white/5 text-slate-500 hover:bg-white/10'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="w-4 h-4 flex items-center justify-center">
                  <span className="sr-only">Go</span>
                  →
                </div>
              )}
            </button>
          </div>
        </div>
        
        {/* Subtle Bottom Glow on Focus */}
        <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-cyan-500/50 blur-xl transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`}></div>
      </form>
    </div>
  );
};