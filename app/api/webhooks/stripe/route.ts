import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Создаем админ-клиент прямо здесь
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret!);
    } catch (err: any) {
        console.error(`❌ Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata) {
            console.log("🔔 Payment successful, inserting job:", metadata.title);

            const { error } = await supabaseAdmin
                .from('jobs')
                .insert([{
                    title: metadata.title,
                    company: metadata.company,
                    salary: metadata.salary,
                    location: metadata.location,
                    description: metadata.description,
                    link: metadata.link || '',
                    // Добавь is_paid если есть такая колонка в базе
                    created_at: new Date().toISOString()
                }]);

            if (error) {
                console.error("❌ Database error:", error.message);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            console.log("✅ Job successfully saved to Supabase");
        }
    }

    return NextResponse.json({ received: true });
}