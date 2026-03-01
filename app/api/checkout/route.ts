import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { formData } = await req.json();

        // 1. Сохраняем вакансию как черновик (is_paid: false)
        const { data: job, error: dbError } = await supabaseAdmin
            .from('jobs')
            .insert([{
                ...formData,
                is_paid: false
            }])
            .select()
            .single();

        if (dbError) throw new Error(dbError.message);

        // 2. Создаем сессию Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: `Job Post: ${formData.title}` },
                    unit_amount: 9900,
                },
                quantity: 1,
            }],
            mode: 'payment',
            // ПЕРЕДАЕМ ID ВАКАНСИИ
            client_reference_id: job.id,
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/post?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/post?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}