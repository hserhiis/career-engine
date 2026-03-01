"use client";
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function JobBoard({ initialJobs, searchQuery, activeSize, activeCategory, remoteOnly, loading }: any) {

    const getCompanySize = (company: string) => {
        const big = ['STRIPE', 'AIRBNB', 'UBER', 'OPENAI', 'ATLASSIAN', 'DISCORD', 'GITHUB', 'SHOPIFY'];
        const unicorn = ['VERCEL', 'FIGMA', 'LINEAR', 'ANTHROPIC', 'NOTION', 'SUPABASE'];
        const comp = company?.toUpperCase();
        if (big.includes(comp)) return 'Enterprise';
        if (unicorn.includes(comp)) return 'Unicorn';
        return 'Mid-Size';
    };

    const filteredJobs = useMemo(() => {
        if (!initialJobs) return [];
        return initialJobs.filter((job: any) => {
            const title = (job.title || "").toLowerCase();
            const company = (job.company || "").toLowerCase();
            const location = (job.location || "").toLowerCase();

            const searchMatch = `${title} ${company}`.includes(searchQuery.toLowerCase());
            const companyTier = getCompanySize(job.company);
            const sizeMatch = activeSize === 'All' || companyTier === activeSize;

            let categoryMatch = activeCategory === 'All';
            if (!categoryMatch) {
                categoryMatch = title.includes(activeCategory.toLowerCase()) || (job.category || "").toLowerCase().includes(activeCategory.toLowerCase());
            }

            const isRemote = title.includes('remote') || location.includes('remote');
            const remoteMatch = remoteOnly ? isRemote : true;

            return searchMatch && sizeMatch && categoryMatch && remoteMatch;
        }).sort((a: any, b: any) => (b.is_hot ? 1 : 0) - (a.is_hot ? 1 : 0));
    }, [initialJobs, searchQuery, activeSize, activeCategory, remoteOnly]);

    const formatSalary = (val: string) => {
        if (!val || val === "Competitive" || val === "Competitive Pay") return "Competitive Pay";
        let clean = val.replace(/[\s\-—/|]+$/, '').trim();
        return clean.replace(/(?:\$|USD)\s?(\d{2,3})(?![.,\d]|k)/gi, (match) => {
            return match.toLowerCase().includes('k') ? match : `${match}k`;
        });
    };

    if (loading) return (
        <div className="flex flex-col gap-4 mt-8">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#1C1C1E]/50 border border-white/5 rounded-[2.5rem] animate-pulse" />)}
        </div>
    );

    return (
        <div className="grid gap-3 relative z-20 mt-8">
            {filteredJobs.length === 0 ? (
                <div className="text-center py-20 border border-white/5 rounded-[2.5rem] bg-[#1C1C1E]/20">
                    <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">No opportunities found in this sector</p>
                </div>
            ) : (
                filteredJobs.map((job: any) => {
                    const isManual = job.job_id?.toString().startsWith('manual-');
                    const commonClasses = `group block p-6 rounded-[2.5rem] transition-all duration-500 border relative overflow-hidden ${
                        job.is_hot ? 'bg-blue-600/[0.07] border-blue-500/40' : 'bg-[#1C1C1E]/40 border-white/5 hover:border-blue-500/30'
                    }`;

                    const content = (
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-white p-2.5 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <img src={job.logo_url} alt={job.company} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {job.is_hot && (
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500 text-white flex items-center gap-1">
                                                <Zap className="w-2 h-2 fill-current" /> Priority
                                            </span>
                                        )}
                                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-white/5 text-gray-500 border border-white/5">
                                            {job.category || 'Software'}
                                        </span>
                                        <span className="text-[10px] font-black uppercase text-gray-600">• {getCompanySize(job.company)}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">
                                        {job.title}
                                    </h3>
                                    <p className="text-sm font-medium text-gray-500 italic">at {job.company}</p>
                                </div>
                            </div>
                            <div className="hidden md:flex flex-col items-end gap-3">
                                <span className="text-base font-bold text-white tracking-tight">
                                    {formatSalary(job.salary)}
                                </span>
                                <div className="flex gap-2">
                                    {job.tags?.slice(0, 2).map((t: string) => (
                                        <span key={t} className="text-[9px] font-bold text-gray-500 border border-white/5 bg-white/[0.02] px-3 py-1 rounded-full uppercase tracking-tighter">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );

                    // Если рефералка - кидаем напрямую в новое окно
                    if (isManual) {
                        return (
                            <a
                                key={job.job_id}
                                href={job.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={commonClasses}
                            >
                                {content}
                            </a>
                        );
                    }

                    // Обычная вакансия - открываем страницу описания
                    return (
                        <Link
                            key={job.job_id}
                            href={`/jobs/${encodeURIComponent(job.job_id)}`}
                            className={commonClasses}
                        >
                            {content}
                        </Link>
                    );
                })
            )}
        </div>
    );
}