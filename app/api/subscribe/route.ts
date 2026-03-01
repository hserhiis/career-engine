import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Используй Service Role для обхода RLS
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, categories } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 1. СНАЧАЛА СОХРАНЯЕМ В БАЗУ. Это критический шаг.
        const { error: dbError } = await supabase
            .from('subscribers')
            .upsert({
                email,
                categories: categories || []
            }, { onConflict: 'email' });

        if (dbError) {
            console.error("Supabase Error:", dbError);
            return NextResponse.json({ error: "Database save failed" }, { status: 500 });
        }

        // 2. ОТПРАВЛЯЕМ ПИСЬМО. Оборачиваем в try/catch, чтобы ошибка Resend не ломала ответ.
        try {
            const categoryBadges = (categories || []).map((cat: string) =>
                `<span style="background: #f5f5f7; border-radius: 8px; padding: 4px 10px; margin-right: 6px; color: #1d1d1f; font-size: 12px; font-weight: 600; display: inline-block; border: 1px solid #d2d2d7;">${cat}</span>`
            ).join('');

            await resend.emails.send({
                from: 'Terminal <onboarding@resend.dev>',
                to: email,
                subject: 'System Access Granted',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
                        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                        .logo { font-weight: 800; font-size: 24px; letter-spacing: -0.5px; color: #1d1d1f; margin-bottom: 60px; text-align: center; }
                        .content { background: #ffffff; }
                        .title { font-size: 48px; font-weight: 700; color: #1d1d1f; line-height: 1.1; letter-spacing: -1.5px; margin-bottom: 24px; }
                        .subtitle { font-size: 21px; color: #86868b; line-height: 1.4; font-weight: 400; margin-bottom: 32px; }
                        .badge-container { margin-bottom: 40px; }
                        .button { background-color: #0071e3; color: #ffffff !important; padding: 12px 24px; border-radius: 980px; text-decoration: none; font-weight: 600; font-size: 17px; display: inline-block; }
                        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #d2d2d7; font-size: 12px; color: #86868b; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">TERMINAL</div>
                        <div class="content">
                            <h1 class="title">Your stream is now <span style="color: #0071e3;">live.</span></h1>
                            <p class="subtitle">Access granted. You are now subscribed to elite opportunities.</p>
                            <div class="badge-container">${categoryBadges}</div>
                            <p class="subtitle" style="font-size: 17px;">We will notify you the moment a position matching your profile enters the pipeline.</p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}" class="button">Return to Terminal</a>
                        </div>
                        <div class="footer">
                            <p>© 2024 Terminal Operations. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                `
            });
        } catch (resendErr) {
            // Если домен не подтвержден — просто логируем, но юзеру шлем SUCCESS
            console.warn("Resend could not send email (likely domain verification):", resendErr);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("General API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}