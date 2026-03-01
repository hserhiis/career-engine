"use client";
import React from 'react';

type FilterProps = {
    activeSize: string;
    setActiveSize: (size: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    companies: string[];
};

export default function FilterBar({ activeSize, setActiveSize, searchQuery, setSearchQuery, companies }: FilterProps) {
    const sizes = ['All', 'Big Tech', 'Unicorn', 'Mid-Size'];

    return (
        <div className="space-y-8 mb-12">
            {/* Поиск по компаниям (Apple Style Search) */}
            <div className="relative group">
                <input
                    type="text"
                    placeholder="Search by company or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#121212] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600 italic"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-700 uppercase tracking-widest pointer-events-none">
                    Quick Search
                </div>
            </div>

            {/* Выбор размера компании (Segmented Control) */}
            <div className="flex flex-wrap gap-3">
                {sizes.map((size) => (
                    <button
                        key={size}
                        onClick={() => setActiveSize(size)}
                        className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${
                            activeSize === size
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>
        </div>
    );
}