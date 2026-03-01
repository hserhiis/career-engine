import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, company, category, link, description, logo_url, salary, tags, is_hot } = body;

        const newJob = {
            job_id: `manual-${Date.now()}`, // Генерируем уникальный ID
            title,
            company,
            category,
            link,
            description,
            logo_url: logo_url || `https://www.google.com/s2/favicons?domain=${new URL(link).hostname}&sz=128`,
            salary: salary || "Competitive",
            tags: tags || [],
            is_hot: is_hot || false,
            location: "Remote",
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('jobs').insert([newJob]);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}