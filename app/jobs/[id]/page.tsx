"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft, Loader2, Code2, Layers, Wallet,
    BarChart3, X, Lock, ArrowRight, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { notFound, useParams } from 'next/navigation';
import { SignedIn, SignedOut, SignUpButton, SignInButton, useUser } from "@clerk/nextjs";

const CATEGORY_OPTIONS = ["Frontend", "Backend", "Fullstack", "Mobile", "Data & AI", "DevOps", "QA", "Design", "Management", "Hardware", "Security"];

export default function JobPage() {
    const params = useParams();
    const { user, isLoaded, isSignedIn } = useUser();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const decodedId = decodeURIComponent(params.id as string);
                const { data, error } = await supabase.from('jobs').select('*').eq('job_id', decodedId).maybeSingle();
                if (error) throw error;
                setJob(data);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        if (params.id) fetchJob();
    }, [params.id]);

    const extractedInfo = useMemo(() => {
        if (!job?.description) return null;

        // ТВОЯ ЦЕПОЧКА ОЧИСТКИ
        const cleanText = job.description
            .replace(/font-family:[^;<>]+;?/gi, '')
            .replace(/font-size:[^;<>]+;?/gi, '')
            .replace(/line-height:[^;<>]+;?/gi, '')
            .replace(/\{[^}]*\}/g, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const levels = ["Senior", "Junior", "Middle", "Lead", "Principal", "Staff", "Entry"];
        const level = levels.find(l => new RegExp(`\\b${l}\\b`, 'i').test(job.title + " " + cleanText)) || "Professional";

        // ПАРСИНГ ЗАРПЛАТЫ
        const fullRangeRegex = /(?:\$|USD)\s?\d{2,3}(?:[.,]\d{3})?[\s\w]*k?[\s\W]{1,15}(?:\$|USD)?\s?\d{2,3}(?:[.,]\d{3})?[\s\w]*k?/gi;
        const singleValueRegex = /(?:\$|USD)\s?\d{2,3}(?:[.,]\d{3})?[\s-]*k?/gi;

        const rangeMatch = cleanText.match(fullRangeRegex);
        const singleMatch = cleanText.match(singleValueRegex);

        let salary = "Competitive Pay";
        let rawSalary = "";

        if (job.salary && job.salary.length > 4 && job.salary !== "Competitive") {
            rawSalary = job.salary;
        } else if (rangeMatch) {
            // Добавляем (a: string, b: string) чтобы TS понял, что это массив строк
            rawSalary = rangeMatch.sort((a: string, b: string) => b.length - a.length)[0].replace(/\s+/g, ' ').trim();
        } else if (singleMatch) {
            rawSalary = singleMatch[0].trim();
        }

        if (rawSalary) {
            // 1. УДАЛЯЕМ МИНУСЫ И МУСОР С КОНЦА (то, что тебя бесило)
            let fixed = rawSalary.replace(/[\s\-—/|]+$/, '').trim();

            // 2. ДОБАВЛЯЕМ 'k' если это просто число типа $120
            salary = fixed.replace(/(?:\$|USD)\s?(\d{2,3})(?![.,\d]|k)/gi, (match) => {
                return match.toLowerCase().includes('k') ? match : `${match}k`;
            });
        }

        const techDict = ["AI", "LLM", "GraphQL", "Databricks", "Snowflake", "Kafka", "Python", "Go", "Rust", "TypeScript", "React", "Next.js", "AWS", "Docker", "Kubernetes", "PostgreSQL", "Redis"];
        const stack = techDict.filter(t => new RegExp(`(\\s|^)${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|,|\\.|;|$)`, 'i').test(cleanText));

        const bulletPoints = cleanText.split(/[.!?;•]/)
            // Указываем (s: string) в каждом методе
            .map((s: string) => s.trim().replace(/^[-•]\s*/, ''))
            .filter((s: string) => s.length > 40 && s.length < 250)
            .filter((s: string) => !/(pursuant|fair chance|equal opportunity|diversity|discrimination)/i.test(s))
            .slice(0, 6);

        return { level, salary, stack, bulletPoints };
    }, [job]);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => {
            const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
            localStorage.setItem('pending_categories', JSON.stringify(next));
            return next;
        });
    };

    if (loading || !isLoaded) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#0071E3] w-10 h-10" /></div>;
    if (!job || !extractedInfo) return notFound();

    return (
        <div className="min-h-screen bg-black text-[#F5F5F7] font-sans antialiased overflow-x-hidden">
            <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1c1c1e,black)] pointer-events-none" />
            <div className="max-w-[800px] mx-auto px-6 pt-16 pb-32 relative z-10">
                <Link href={isSignedIn ? "/dashboard" : "/"} className="inline-flex items-center text-[#86868B] hover:text-white mb-12 text-sm font-medium group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors"><ChevronLeft className="w-4 h-4" /></div>
                    {isSignedIn ? 'Back to Dashboard' : 'Back to Opportunities'}
                </Link>

                <div className="space-y-20">
                    <header>
                        <div className="w-20 h-20 rounded-[22px] bg-white p-4 mb-10 shadow-2xl flex items-center justify-center overflow-hidden">
                            <img src={job.logo_url} className="w-full h-full object-contain" alt={job.company} />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">{job.title}</h1>
                        <p className="text-2xl text-[#86868B] mt-4 font-medium">at <span className="text-white/90">{job.company}</span></p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#1c1c1e]/40 border border-white/5 p-8 rounded-[32px] backdrop-blur-xl">
                            <div className="flex items-center gap-3 text-[#0071E3] mb-4"><Wallet className="w-5 h-5" /><span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Compensation</span></div>
                            <p className="text-2xl font-semibold text-white tracking-tight">{extractedInfo.salary}</p>
                        </div>
                        <div className="bg-[#1c1c1e]/40 border border-white/5 p-8 rounded-[32px] backdrop-blur-xl">
                            <div className="flex items-center gap-3 text-purple-500 mb-4"><BarChart3 className="w-5 h-5" /><span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Experience</span></div>
                            <p className="text-2xl font-semibold text-white tracking-tight">{extractedInfo.level}</p>
                        </div>
                    </div>

                    {extractedInfo.stack.length > 0 && (
                        <section className="space-y-8">
                            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-white/5" /><div className="flex items-center gap-2 text-[#86868B] text-[16px] uppercase font-black tracking-widest"><Code2 className="w-7 h-7" /> Stack</div><div className="h-px flex-1 bg-white/5" /></div>
                            <div className="flex flex-wrap justify-center gap-3">{extractedInfo.stack.map(t => <span key={t} className="px-5 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-medium text-[#F5F5F7]">{t}</span>)}</div>
                        </section>
                    )}

                    {extractedInfo.bulletPoints.length > 0 && (
                        <section className="bg-[#1c1c1e]/20 border border-white/5 p-10 rounded-[40px] backdrop-blur-sm">
                            <div className="flex items-center gap-3 text-[#86868B] mb-8"><Layers className="w-7 h-7" /><span className="text-[16px] uppercase font-bold tracking-widest">Core Mission</span></div>
                            <div className="grid gap-6">{extractedInfo.bulletPoints.map((p, i) => <div key={i} className="flex items-start gap-4 group"><div className="w-1.5 h-1.5 rounded-full bg-[#0071E3] mt-2.5 shrink-0 shadow-[0_0_10px_rgba(0,113,227,0.5)]" /><p className="text-[#A1A1A6] text-lg leading-relaxed group-hover:text-white transition-colors">{p}</p></div>)}</div>
                        </section>
                    )}

                    <footer className="pt-10">
                        <SignedIn><button onClick={() => window.open(job.link, '_blank')} className="w-full text-center py-6 rounded-3xl font-bold text-xl transition-all bg-blue-600 text-white hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-xl">Proceed to Application <ExternalLink className="w-5 h-5" /></button></SignedIn>
                        <SignedOut><button onClick={() => setIsModalOpen(true)} className="w-full text-center py-6 rounded-3xl font-bold text-xl transition-all bg-white text-black hover:scale-[1.02] active:scale-95">Unlock & Apply</button></SignedOut>
                    </footer>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-[#111] border border-white/10 w-full max-w-[480px] rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-300">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                        <div className="w-14 h-14 bg-[#0071E3]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#0071E3]/20"><Lock className="text-[#0071E3] w-6 h-6" /></div>
                        <h2 className="text-3xl font-bold text-white mb-8 uppercase italic tracking-tight">Initialize <span className="text-[#0071E3]">Talent ID</span></h2>
                        <div className="flex flex-wrap gap-2 mb-8">{CATEGORY_OPTIONS.map(cat => <button key={cat} onClick={() => toggleCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${selectedCategories.includes(cat) ? 'bg-[#0071E3] border-[#0071E3] text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>{cat}</button>)}</div>
                        <SignUpButton mode="modal" fallbackRedirectUrl={`/jobs/${params.id}`}><button className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#0071E3] hover:text-white transition-all">Continue to apply <ArrowRight className="w-4 h-4" /></button></SignUpButton>
                        <div className="text-center mt-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">Already a member? <SignInButton mode="modal" fallbackRedirectUrl={`/jobs/${params.id}`}><button className="text-[#0071E3] hover:underline">Sign In</button></SignInButton></div>
                    </div>
                </div>
            )}
        </div>
    );
}