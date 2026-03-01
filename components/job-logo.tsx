"use client";
import { useState } from 'react';

export default function JobLogo({ src, company }: { src: string | null, company: string }) {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className="w-12 h-12 rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center">
                <span className="text-white/40 text-lg font-bold italic">
                    {company.charAt(0).toUpperCase()}
                </span>
            </div>
        );
    }

    return (
        <div className="w-12 h-12 rounded-2xl bg-white p-[2px] overflow-hidden border border-white/5">
            <img
                src={src}
                alt={company}
                onError={() => setError(true)}
                className="w-full h-full object-contain rounded-[14px]"
            />
        </div>
    );
}