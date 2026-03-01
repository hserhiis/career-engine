import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {cookies} from "next/headers";
import {createServerClient} from "@supabase/ssr";

export async function POST() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new Response("UNAUTHORIZED ACCESS", { status: 401 })
    }
    try {
        // Удаляем все записи из таблицы jobs
        const { error } = await supabase
            .from('jobs')
            .delete()
            .neq('job_id', '0'); // Условие, которое затронет все строки

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}