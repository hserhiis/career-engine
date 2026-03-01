"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Создаем клиент прямо здесь
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message.toUpperCase());
            setLoading(false);
        } else {
            router.push('/admin/sync');
            router.refresh(); // Обновляем сессию для Middleware
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 font-sans italic">
            <div className="max-w-sm w-full bg-[#121212] border border-white/[0.05] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px]" />

                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                    <Lock className="w-6 h-6 text-blue-500" />
                </div>

                <h1 className="text-2xl font-black text-center uppercase tracking-tighter mb-8 text-white/90">
                    Admin Terminal
                </h1>

                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ADMIN_EMAIL"
                        className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-blue-400 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm italic"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="ACCESS_KEY"
                        className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-blue-400 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm italic"
                        required
                    />

                    <button
                        disabled={loading}
                        className="w-full bg-white text-black hover:bg-blue-600 hover:text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Execute Authorization
                    </button>
                </form>

                {error && (
                    <p className="text-red-500 text-[9px] font-black text-center mt-6 uppercase tracking-widest animate-pulse">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}