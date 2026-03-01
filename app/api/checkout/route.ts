import { NextResponse } from 'next/server';
import Stripe from 'stripe'; // Импортируем как класс
import { createClient } from '@supabase/supabase-js';

// Инициализируем экземпляр Stripe с твоим секретным ключом
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { formData } = await req.json();

        // Логика логотипа
        const domain = new URL(formData.link).hostname;
        const logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

        // 1. Сохраняем черновик
        const { data: job, error: dbError } = await supabaseAdmin
            .from('jobs')
            .insert([{
                job_id: `user-${Date.now()}`,
                title: formData.title,
                company: formData.company,
                category: formData.category || "Software",
                link: formData.link,
                description: formData.description,
                logo_url: logo_url,
                salary: formData.salary || "Competitive",
                location: formData.location || "Remote",
                tags: formData.tags || [],
                is_hot: true,
                is_paid: false,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (dbError) throw new Error(dbError.message);

        // 2. Stripe сессия (теперь stripe.checkout будет работать)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Premium Job Post: ${formData.title}`,
                        images: [logo_url]
                    },
                    unit_amount: 9900,
                },
                quantity: 1,
            }],
            mode: 'payment',
            client_reference_id: job.id,
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/post?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/post?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error("Checkout Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}