"use client";
import React, { useState, useEffect, Suspense } from 'react'; // Добавили Suspense
import { ChevronLeft, Globe, DollarSign, Zap, Building2, Briefcase, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from "next/navigation"; // Используем стандартный импорт

// 1. Выносим всю логику и верстку формы в отдельный внутренний компонент
function PostJobForm() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        title: '', company: '', salary: '', location: '', description: '', link: ''
    });

    useEffect(() => {
        if (searchParams.get('success')) {
            setSubmitted(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Создаем черновик в базе через твой API или напрямую
            // Для безопасности лучше создать отдельный route /api/jobs/create-draft
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData }), // Передаем всё
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
            setLoading(false);
        }
    };

    // Весь твой JSX, который был в return
    if (submitted) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
                <div className="max-w-sm">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                        <Zap className="fill-current w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Live on Board!</h1>
                    <p className="text-gray-400 mb-8">Your job listing has been published and is now visible to developers.</p>
                    <Link href="/" className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-all">
                        View Job Board
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-6">
            <div className="max-w-3xl mx-auto pt-8 md:pt-12">
                <Link href="/" className="flex items-center text-gray-400 hover:text-white mb-6 md:mb-8 transition-colors font-medium">
                    <ChevronLeft className="w-5 h-5" /> Back to jobs
                </Link>

                <div className="bg-[#1c1c1e] border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-4 md:mb-8">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <Building2 className="w-8 h-8 md:w-10 md:h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Post a Job</h1>
                                <p className="text-lg text-gray-400">Hire the world's best developers</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                                <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Role Title</p>
                                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-transparent border-none outline-none w-full text-white text-lg font-bold placeholder:text-gray-700" placeholder="e.g. Senior Fullstack" />
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                                <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Company Name</p>
                                <input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="bg-transparent border-none outline-none w-full text-white text-lg font-bold placeholder:text-gray-700" placeholder="e.g. RemoteHub" />
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                                <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Salary Range</p>
                                <input required value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="bg-transparent border-none outline-none w-full text-green-400 text-lg font-bold placeholder:text-gray-700" placeholder="$100k – $150k" />
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                                <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Location</p>
                                <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-transparent border-none outline-none w-full text-white text-lg font-bold placeholder:text-gray-700" placeholder="Remote (Worldwide)" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white text-xl font-bold">Job Description</h3>
                            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={5} className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white text-lg placeholder:text-gray-700" placeholder="What's the stack? What's the mission?" />
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Application Link / URL</p>
                            <input
                                required
                                type="url"
                                value={formData.link}
                                onChange={e => setFormData({...formData, link: e.target.value})}
                                className="bg-transparent border-none outline-none w-full text-blue-400 text-lg font-bold placeholder:text-gray-700"
                                placeholder="https://company.com/jobs/123"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-center py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 active:scale-[0.98]">
                            {loading ? <Loader2 className="animate-spin" /> : 'Publish Listing — $99'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// 2. Основной компонент страницы, который Next.js будет рендерить
export default function PostJobPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            </div>
        }>
            <PostJobForm />
        </Suspense>
    );
}