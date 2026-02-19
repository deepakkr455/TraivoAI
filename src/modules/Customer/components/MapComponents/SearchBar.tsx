
import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    loading: boolean;
    isPlannerMode: boolean;
    setIsPlannerMode: (value: boolean) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading, isPlannerMode, setIsPlannerMode }) => {
    const [query, setQuery] = useState('Spiti valley, Himachal Pradesh');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <div className="flex flex-col items-center gap-2 w-full max-w-xl px-4 pointer-events-auto transition-all duration-300">
            {/* Planner Mode Toggle Removed */}

            {/* Search Input */}
            <form onSubmit={handleSubmit} className="w-full relative shadow-lg rounded-3xl group bg-white">
                <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full py-4 pl-14 pr-14 text-base text-gray-900 placeholder-gray-500 bg-transparent border-0 rounded-3xl focus:ring-0 focus:outline-none"
                    placeholder="Search for a destination..."
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-black hover:bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors disabled:bg-gray-400"
                    disabled={loading}
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    )}
                </button>
            </form>

            {/* Smart Filters */}
            <div className="flex flex-wrap justify-center gap-2 mt-1">
                {['Nature', 'Historic', 'Adventure', 'Food & Drink', 'Relaxation'].map((filter) => (
                    <button
                        key={filter}
                        className="px-3 py-1 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-blue-600 rounded-full text-xs font-semibold shadow-sm border border-transparent hover:border-blue-100 transition-all"
                        onClick={() => {
                            // In v2, this would toggle filter state and pass to App.tsx
                            // For visual polish:
                            setQuery((prev) => prev.includes(filter) ? prev : `${prev} + ${filter}`);
                        }}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>
    );
};
