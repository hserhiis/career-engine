import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        // В идеале вынеси пароль в .env (ADMIN_PASSWORD)
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "your-secret-key-123";

        if (password === ADMIN_PASSWORD) {
            // Устанавливаем защищенную куку на 24 часа
            (await cookies()).set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24, // 1 день
                path: '/',
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}