"use client";
import React, {useEffect, useState} from 'react';
import { ChevronLeft, Globe, DollarSign, Zap, Building2, Briefcase, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {useSearchParams} from "next/dist/client/components/navigation";

export default function PostJobPage() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        title: '', company: '', salary: '', location: '', description: '', link: ''
    });

    // Если вернулись со Stripe с успехом
    useEffect(() => {
        if (searchParams.get('success')) {
            setSubmitted(true);
            // Тут в идеале данные в базу должен писать Webhook от Stripe,
            // но для MVP можно сделать проверку и вставку здесь.
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData }),
            });

            const data = await response.json();
            if (data.url) {
                // Сохраняем черновик в localStorage, чтобы не потерять при редиректе
                localStorage.setItem('pending_job', JSON.stringify(formData));
                window.location.href = data.url; // Улетаем на оплату
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            alert('Payment Error: ' + err.message);
            setLoading(false);
        }
    };

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
                            {/* Инпут Title */}
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                                <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Role Title</p>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    className="bg-transparent border-none outline-none w-full text-white text-lg font-bold placeholder:text-gray-700"
                                    placeholder="e.g. Senior Fullstack"
                                />
                            </div>

                            {/* Инпут Company */}
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                                <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Company Name</p>
                                <input
                                    required
                                    value={formData.company}
                                    onChange={e => setFormData({...formData, company: e.target.value})}
                                    className="bg-transparent border-none outline-none w-full text-white text-lg font-bold placeholder:text-gray-700"
                                    placeholder="e.g. RemoteHub"
                                />
                            </div>

                            {/* Инпут Salary */}
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                                <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Salary Range</p>
                                <input
                                    required
                                    value={formData.salary}
                                    onChange={e => setFormData({...formData, salary: e.target.value})}
                                    className="bg-transparent border-none outline-none w-full text-green-400 text-lg font-bold placeholder:text-gray-700"
                                    placeholder="$100k – $150k"
                                />
                            </div>

                            {/* Инпут Location */}
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                                <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Location</p>
                                <input
                                    required
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                    className="bg-transparent border-none outline-none w-full text-white text-lg font-bold placeholder:text-gray-700"
                                    placeholder="Remote (Worldwide)"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <h3 className="text-white text-xl font-bold">Job Description</h3>
                            <textarea
                                required
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                rows={5}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white text-lg placeholder:text-gray-700"
                                placeholder="What's the stack? What's the mission?"
                            />
                        </div>

                        {/* Кнопка с лоадером */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-center py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Publish Listing — $99'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}