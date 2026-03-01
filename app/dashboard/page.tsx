"use client";
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import JobBoard from '@/components/job-board';
import { Loader2, Zap, ChevronLeft, Settings2, Check, LogOut } from 'lucide-react';
import { useUser, RedirectToSignIn, UserButton, useClerk } from "@clerk/nextjs";
import Link from 'next/link';

const CATEGORIES_MAP = [
    { name: 'Frontend', roles: ['Frontend Developer'] },
    { name: 'Backend', roles: ['Backend Developer', 'Cloud Engineer'] },
    { name: 'Fullstack', roles: ['Fullstack Developer'] },
    { name: 'Mobile', roles: ['Mobile Developer'] },
    { name: 'Data & AI', roles: ['Data Scientist', 'Data Analyst', 'ML Engineer', 'AI Prompt Engineer'] },
    { name: 'DevOps', roles: ['DevOps Engineer', 'System Administrator'] },
    { name: 'QA', roles: ['QA Engineer', 'QA Automation'] },
    { name: 'Design', roles: ['UX/UI Designer'] },
    { name: 'Management', roles: ['Project Manager', 'Product Manager', 'System Analyst'] },
    { name: 'Hardware', roles: ['Embedded Developer', 'Game Developer'] },
    { name: 'Security', roles: ['Cybersecurity Specialist'] },
];

export default function UserDashboard() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { signOut } = useClerk();
    const [allJobs, setAllJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCats, setSelectedCats] = useState<string[]>([]);

    // 1. Инициализация категорий из Clerk
    useEffect(() => {
        if (isLoaded && user) {
            setSelectedCats((user.unsafeMetadata?.categories as string[]) || []);
        }
    }, [isLoaded, user]);

    // 2. СИНХРОНИЗАЦИЯ С SUPABASE
    // Срабатывает при первом входе и при каждом изменении выбранных секторов
    useEffect(() => {
        const syncProfile = async () => {
            if (isLoaded && isSignedIn && user) {
                const userEmail = user.primaryEmailAddress?.emailAddress;
                if (!userEmail) return;

                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id, // Обновит ID на новый, если он изменился
                        email: userEmail,
                        subscribed_categories: selectedCats,
                        last_active: new Date().toISOString()
                    }, {
                        onConflict: 'email' // МЕНЯЕМ 'id' НА 'email'
                    });

                if (error) console.error("SYNC ERROR:", error.message);
                else console.log("Profile synced for:", userEmail);
            }
        };
        syncProfile();
    }, [isLoaded, isSignedIn, user, selectedCats]);

    // 3. ЗАГРУЗКА ВАКАНСИЙ
    useEffect(() => {
        const fetchJobs = async () => {
            if (!isLoaded || !isSignedIn) return;
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('jobs')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setAllJobs(data || []);
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [isLoaded, isSignedIn]);

    const toggleCategory = async (catName: string) => {
        const newCats = selectedCats.includes(catName)
            ? selectedCats.filter(c => c !== catName)
            : [...selectedCats, catName];

        setSelectedCats(newCats);

        // Обновляем метаданные в Clerk (это триггернет useEffect синхронизации выше)
        if (user) {
            await user.update({
                unsafeMetadata: { ...user.unsafeMetadata, categories: newCats }
            });
        }
    };

    const personalJobs = useMemo(() => {
        if (selectedCats.length === 0) return allJobs;
        const allowedRoles = CATEGORIES_MAP
            .filter(cat => selectedCats.includes(cat.name))
            .flatMap(cat => cat.roles.map(role => role.toLowerCase()));

        return allJobs.filter((job: any) => {
            const jobCat = (job.category || "").toLowerCase().trim();
            return allowedRoles.includes(jobCat);
        });
    }, [allJobs, selectedCats]);

    if (!isLoaded) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
    if (!isSignedIn) return <RedirectToSignIn />;

    return (
        <div className="min-h-screen bg-black text-white font-sans antialiased">
            <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1c1c1e,black)] pointer-events-none" />

            <div className="max-w-5xl mx-auto px-6 relative z-10 pt-10">
                <Link href="/" className="inline-flex items-center text-[#86868B] hover:text-white mb-12 text-[11px] font-black uppercase tracking-[0.2em] group transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                    Back to Terminal
                </Link>

                <header className="mb-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Intelligence Stream</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                                    My <span className="text-blue-600">Sectors</span>
                                </h1>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`p-3 rounded-2xl border transition-all ${isEditing ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                >
                                    <Settings2 className="w-5 h-5" />
                                </button>
                            </div>

                            {isEditing ? (
                                <div className="bg-[#111] border border-white/10 p-6 rounded-[2rem] mt-6 animate-in slide-in-from-top-4 duration-300">
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES_MAP.map(cat => (
                                            <button
                                                key={cat.name}
                                                onClick={() => toggleCategory(cat.name)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border flex items-center gap-2 ${selectedCats.includes(cat.name) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                                            >
                                                {selectedCats.includes(cat.name) && <Check className="w-3 h-3" />}
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {selectedCats.length > 0 ? selectedCats.map(cat => (
                                        <span key={cat} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] uppercase font-bold text-blue-400">{cat}</span>
                                    )) : <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Global access active</span>}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-2 pr-4 rounded-2xl">
                                <UserButton afterSignOutUrl="/" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest leading-none">Active Operator</span>
                                    <span className="text-[11px] font-bold text-white/80 lowercase mt-1 leading-none">
                                        {user?.primaryEmailAddress?.emailAddress?.split('@')[0]}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => signOut({ redirectUrl: '/' })} className="p-3 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="pb-32">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Decrypting Feed...</span>
                        </div>
                    ) : (
                        <JobBoard initialJobs={personalJobs} searchQuery="" activeSize="All" activeCategory="All" remoteOnly={false} loading={false} />
                    )}
                </main>
            </div>
        </div>
    );
}