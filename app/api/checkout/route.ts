// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
        const { formData } = await req.json();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Job Post: ${formData.title}`,
                        description: `Hiring at ${formData.company}`,
                    },
                    unit_amount: 9900,
                },
                quantity: 1,
            }],
            mode: 'payment',
            // ВАЖНО: передаем данные в metadata (только строки!)
            metadata: {
                title: formData.title,
                company: formData.company,
                salary: formData.salary,
                location: formData.location,
                description: formData.description,
                link: formData.link || '',
            },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/post?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/post?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}