import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

        // Достаем ID вакансии, который мы передали как client_reference_id
        const jobId = session.client_reference_id;

        if (jobId) {
            console.log("🔔 Payment successful for Job ID:", jobId);

            // ОБНОВЛЯЕМ статус вакансии на "оплачено"
            const { error } = await supabaseAdmin
                .from('jobs')
                .update({
                    is_paid: true,
                    // Можно также обновить дату публикации на дату оплаты
                    created_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (error) {
                console.error("❌ Supabase Update Error:", error.message);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            console.log("✅ Job activated successfully!");
        } else {
            console.error("❌ No jobId (client_reference_id) found in session");
        }
    }

    return NextResponse.json({ received: true });
}