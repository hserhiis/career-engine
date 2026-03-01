import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 1. Укажи свой email здесь
const ADMIN_EMAILS = ['serhiiswr11994@gmail.com']; // Замени на свой реальный email

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 2. Инициализация клиента Supabase
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // 3. Получаем юзера
    const { data: { user } } = await supabase.auth.getUser()

    const url = new URL(request.url)
    const isAdminPath = url.pathname.startsWith('/admin/sync')
    const isLoginPage = url.pathname === '/admin/login'

    // 4. ЛОГИКА ЗАЩИТЫ
    if (isAdminPath) {
        // Если лезем в админку и мы не на странице логина
        if (!isLoginPage) {
            // Если не залогинен — на вход
            if (!user) {
                return NextResponse.redirect(new URL('/admin/login', request.url))
            }
            // Если залогинен, но email не в списке админов — на главную
            if (!ADMIN_EMAILS.includes(user.email || '')) {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }

        // Если залогинен как админ и пытаешься зайти на страницу логина — в панель
        if (user && isLoginPage && ADMIN_EMAILS.includes(user.email || '')) {
            return NextResponse.redirect(new URL('/admin/sync', request.url))
        }
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*'],
}