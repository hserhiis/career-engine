"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import JobBoard from '@/components/job-board';
import { CATEGORIES } from "@/lib/categories";
import Link from 'next/link';
import { Terminal, Search, Plus, Globe, LayoutDashboard } from 'lucide-react';
// Импорты Clerk
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function HomePage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSize, setActiveSize] = useState('All');
    const [activeCategory, setActiveCategory] = useState('All');
    const [remoteOnly, setRemoteOnly] = useState(true);
    const [showAdminLink, setShowAdminLink] = useState(false);

    useEffect(() => {
        async function check() {
            const { data } = await supabase.auth.getUser();
            if (data?.user?.email === 'твой-email@example.com') {
                setShowAdminLink(true);
            }
        }
        check();
    }, []);

    useEffect(() => {
        async function fetchJobs() {
            setLoading(true);
            const { data } = await supabase
                .from('jobs')
                .select('*')
                .eq('is_paid', true) // Только оплаченные
                .order('is_hot', { ascending: false }) // Сначала HOT
                .order('created_at', { ascending: false });

            if (data) {
                setJobs(data);
            }
            setLoading(false);
        }
        fetchJobs();
    }, []);

    return (
        <div className="min-h-screen bg-black text-[#F5F5F7]">
            {/* Background Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none -z-10" />

            {/* NAVIGATION */}
            <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:scale-110 transition-transform">
                            <Terminal className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tighter italic text-white uppercase">
                Career <span className="text-blue-500">Engine</span>
            </span>
                    </Link>

                    <div className="flex items-center gap-6">
                        {/* Состояние: Пользователь вошел */}
                        <SignedIn>
                            {/* Если хочешь хардкорно скрыть, можно добавить проверку роли:
                   user?.publicMetadata?.role === 'admin' && (...)
                */}{
                                showAdminLink && (
                                <Link
                                    href="/admin/dashboard"
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    Admin Area
                                </Link>
                            )
                        }


                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-white transition-colors"
                            >
                                <LayoutDashboard className="w-3.5 h-3.5" />
                                My Dashboard
                            </Link>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>

                        {/* Состояние: Пользователь НЕ вошел */}
                        <SignedOut>
                            <Link
                                href="/post"
                                className="bg-white text-black px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-lg active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Post a Job
                            </Link>
                            {/* Можно оставить скрытую микро-ссылку на логин, если очень нужно, но лучше просто заходить по прямому URL /admin */}
                        </SignedOut>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 pt-16 pb-20">
                <div className="mb-12">
                    <h1 className="text-6xl font-black tracking-tight text-white mb-4 italic uppercase leading-[0.9]">
                        The next <span className="text-blue-500">chapter</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-xl mb-12 font-medium">
                        Access exclusive engineering roles from top-tier tech companies globally.
                    </p>

                    {/* CATEGORY SELECTOR */}
                    <div className="flex flex-wrap gap-2 mb-12 overflow-x-auto pb-4 no-scrollbar">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border italic whitespace-nowrap ${
                                    activeCategory === cat.name
                                        ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                        : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20'
                                }`}
                            >
                                {cat.icon}
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* FILTERS & SEARCH SECTION */}
                    <div className="border-t border-white/5 pt-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

                            {/* LEFT COLUMN: Search & Remote */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 italic flex items-center gap-2">
                                        <div className="w-1 h-1 bg-blue-500 rounded-full" />
                                        Terminal Search
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            type="text"
                                            placeholder="Company, title or tech..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-[#111111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setRemoteOnly(!remoteOnly)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all group ${
                                        remoteOnly
                                            ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                            : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                                    }`}
                                >
                                    <div className={`w-2 h-2 rounded-full transition-all ${remoteOnly ? 'bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-gray-700'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">Remote Everywhere</span>
                                    <Globe className={`w-3.5 h-3.5 ml-1 transition-transform ${remoteOnly ? 'rotate-12' : 'grayscale opacity-50'}`} />
                                </button>
                            </div>

                            {/* RIGHT COLUMN: Company Tier */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 italic flex items-center gap-2">
                                    <div className="w-1 h-1 bg-gray-600 rounded-full" />
                                    Company Tier
                                </label>
                                <div className="flex bg-[#111111] p-1.5 rounded-2xl border border-white/5 h-[58px] items-center">
                                    {['All', 'Enterprise', 'Unicorn', 'Mid-Size'].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setActiveSize(size)}
                                            className={`flex-1 h-full rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic ${
                                                activeSize === size
                                                    ? 'bg-[#222222] text-white shadow-inner border border-white/5'
                                                    : 'text-gray-600 hover:text-gray-300'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* JOB BOARD */}
                <div className="mt-16">
                    <JobBoard
                        initialJobs={jobs}
                        searchQuery={searchQuery}
                        activeSize={activeSize}
                        activeCategory={activeCategory}
                        remoteOnly={remoteOnly}
                        loading={loading}
                    />
                </div>
            </main>
        </div>
    );
}