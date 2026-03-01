"use client";
import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    Zap,
    Loader2,
    Database,
    CheckCircle2,
    AlertCircle,
    Trash2,
    LogOut,
    Plus,
    X,
    Users,
    Mail,
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const CATEGORIES = [
    'Frontend Developer', 'Backend Developer', 'Fullstack Developer',
    'QA Engineer', 'QA Automation', 'Mobile Developer',
    'Data Scientist', 'ML Engineer', 'Data Analyst',
    'DevOps Engineer', 'System Administrator', 'Cybersecurity Specialist',
    'UX/UI Designer', 'Project Manager', 'Product Manager',
    'System Analyst', 'Game Developer', 'Embedded Developer',
    'Cloud Engineer', 'AI Prompt Engineer', 'Software Engineer'
];

export default function AdminSyncPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [currentOffset, setCurrentOffset] = useState(0);
    const [showManualForm, setShowManualForm] = useState(false);

    // Состояние для пользователей
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        company: '',
        category: 'Software Engineer',
        link: '',
        salary: '',
        is_hot: false,
        description: ''
    });

    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Загрузка пользователей
    useEffect(() => {
        async function fetchProfiles() {
            setLoadingProfiles(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) setProfiles(data);
            setLoadingProfiles(false);
        }
        fetchProfiles();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
        router.refresh();
    };

    // --- ФУНКЦИИ ENGINE (Твои текущие) ---
    const handleSync = async () => {
        setStatus('loading');
        setMessage('INITIALIZING ENGINE...');
        let offset = 0;
        let totalJobsFound = 0;
        try {
            let finished = false;
            while (!finished) {
                const res = await fetch(`/api/admin/sync?offset=${offset}&limit=15`);
                const data = await res.json();
                if (!data.success) throw new Error(data.message || 'Batch sync failed');
                totalJobsFound += (data.jobsFound || 0);
                offset = data.nextOffset;
                setCurrentOffset(offset);
                setMessage(`INJECTING: ${offset} COMPANIES...`);
                if (data.finished) finished = true;
            }
            setStatus('success');
            setMessage(`SUCCESS: ${totalJobsFound} ROLES INJECTED`);
        } catch (e: any) {
            setStatus('error');
            setMessage(e.message || 'CRITICAL FAILURE');
        }
    };

    const handleClear = async () => {
        if (!confirm('PURGE ALL JOBS?')) return;
        setStatus('loading');
        try {
            const res = await fetch('/api/admin/clear', { method: 'POST' });
            if (res.ok) { setStatus('idle'); alert('Wiped.'); }
        } catch (e) { setStatus('error'); }
    };

    const handleManualAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await fetch('/api/admin/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) { setShowManualForm(false); setStatus('success'); setMessage("INJECTED"); }
        } catch (e) { setStatus('error'); }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-sans italic">
            <div className="max-w-6xl mx-auto">
                {/* TOP NAV */}
                <div className="flex items-center justify-between mb-12">
                    <Link href="/" className="flex items-center text-gray-500 hover:text-white transition-all group uppercase text-[10px] tracking-[0.2em] font-black">
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Terminal
                    </Link>
                    <button onClick={handleLogout} className="text-red-500/50 hover:text-red-500 uppercase text-[10px] tracking-[0.2em] font-black flex items-center gap-2">
                        Terminate Session <LogOut className="w-3 h-3" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT: ENGINE CONTROLS (33%) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#121212] border border-white/[0.05] rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
                            <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-600/10 blur-[40px]" />

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                    <Database className={`w-6 h-6 ${status === 'loading' ? 'text-blue-400 animate-pulse' : 'text-blue-500'}`} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Data Engine</h1>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">v3.0 Streaming</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleSync}
                                    disabled={status === 'loading'}
                                    className="w-full bg-white text-black hover:bg-blue-600 hover:text-white py-5 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {status === 'loading' ? <Loader2 className="animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                                    Execute Sync
                                </button>

                                <button onClick={() => setShowManualForm(true)} className="w-full bg-white/5 border border-white/5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <Plus className="w-3 h-3" /> Add Manual Role
                                </button>

                                <button onClick={handleClear} className="w-full text-red-500/40 hover:text-red-500 text-[9px] font-black uppercase tracking-widest pt-2 transition-colors">
                                    Wipe Data Cache
                                </button>
                            </div>

                            {message && (
                                <div className={`mt-6 p-4 rounded-xl text-[10px] font-bold uppercase text-center border ${status === 'error' ? 'border-red-500/20 text-red-500 bg-red-500/5' : 'border-blue-500/20 text-blue-400 bg-blue-500/5'}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: USER DATABASE (66%) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-[#121212] border border-white/[0.05] rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-gray-500" />
                                    <h2 className="text-xl font-black uppercase italic tracking-tighter">Active Operators</h2>
                                </div>
                                <span className="text-[10px] font-black px-3 py-1 bg-white/5 rounded-full text-gray-500">
                                    {profiles.length} Total
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 border-b border-white/5">
                                        <th className="p-6">Operator Info</th>
                                        <th className="p-6">Sectors</th>
                                        <th className="p-6">Tier</th>
                                        <th className="p-6 text-right">Registered</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                    {loadingProfiles ? (
                                        <tr><td colSpan={4} className="p-10 text-center text-gray-600 animate-pulse font-black uppercase text-xs">Awaiting Data...</td></tr>
                                    ) : profiles.map(profile => (
                                        <tr key={profile.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center font-black text-[10px] text-blue-500">
                                                        {profile.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black uppercase text-white tracking-tight">{profile.first_name || 'Anonymous'}</div>
                                                        <div className="text-[10px] text-gray-600 lowercase font-medium">{profile.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {profile.subscribed_categories?.slice(0, 3).map((cat: string) => (
                                                        <span key={cat} className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/10">
                                                                {cat.split(' ')[0]}
                                                            </span>
                                                    )) || <span className="text-[8px] text-gray-700 font-black italic">GLOBAL ACCESS</span>}
                                                    {profile.subscribed_categories?.length > 3 && <span className="text-[8px] text-gray-700 font-black">+{profile.subscribed_categories.length - 3}</span>}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                {profile.is_subscribed ? (
                                                    <div className="flex items-center gap-1.5 text-blue-500">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Premium</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">Free Tier</span>
                                                )}
                                            </td>
                                            <td className="p-6 text-right text-[10px] font-mono text-gray-600 uppercase">
                                                {new Date(profile.created_at).toLocaleDateString('en-GB')}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL MANUAL ADD (Твой код без изменений) */}
                {/* MODAL MANUAL ADD */}
                {showManualForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-y-auto">
                        <div className="max-w-xl w-full bg-[#121212] border border-white/10 rounded-[3rem] p-10 relative my-auto shadow-2xl">
                            <button onClick={() => setShowManualForm(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white">
                                <X size={24} />
                            </button>

                            <h2 className="text-3xl font-black italic uppercase mb-8 tracking-tighter text-white">Manual Injection</h2>

                            <form onSubmit={handleManualAdd} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-2">Job Title</label>
                                        <input
                                            required
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-blue-500 transition-all italic text-white"
                                            placeholder="Senior AI Engineer"
                                            onChange={e => setFormData({...formData, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-2">Company Name</label>
                                        <input
                                            required
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-blue-500 transition-all italic text-white"
                                            placeholder="OpenAI"
                                            onChange={e => setFormData({...formData, company: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-2">Category</label>
                                    <select
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-blue-500 transition-all appearance-none italic text-white"
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                    >
                                        {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#121212]">{cat}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-2">Application Link (URL)</label>
                                    <input
                                        required
                                        type="url"
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-blue-500 transition-all italic text-white"
                                        placeholder="https://referral.link/..."
                                        onChange={e => setFormData({...formData, link: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-2">Salary (optional)</label>
                                        <input
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-blue-500 transition-all italic text-white"
                                            placeholder="$150k - $200k"
                                            onChange={e => setFormData({...formData, salary: e.target.value})}
                                        />
                                    </div>

                                    {/* ВОТ ОНА — КНОПКА HOT */}
                                    <div className="flex items-center justify-center pt-6">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.is_hot}
                                                onChange={e => setFormData({...formData, is_hot: e.target.checked})}
                                            />
                                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${formData.is_hot ? 'bg-blue-600 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-white/5 border-white/10'}`}>
                                                <Zap size={14} className={formData.is_hot ? 'fill-white text-white' : 'text-gray-600'} />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${formData.is_hot ? 'text-blue-500' : 'text-gray-500'}`}>Priority (HOT)</span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all mt-4 active:scale-95"
                                >
                                    Confirm Injection
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}