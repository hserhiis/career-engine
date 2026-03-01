// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase'; // проверь путь до своего клиента supabase

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret!);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Когда оплата прошла успешно
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata) {
            // Записываем в Supabase напрямую с сервера
            const { error } = await supabase
                .from('jobs')
                .insert([{
                    title: metadata.title,
                    company: metadata.company,
                    salary: metadata.salary,
                    location: metadata.location,
                    description: metadata.description,
                    link: metadata.link,
                    is_paid: true,
                    created_at: new Date().toISOString()
                }]);

            if (error) {
                console.error("Database error after payment:", error.message);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}