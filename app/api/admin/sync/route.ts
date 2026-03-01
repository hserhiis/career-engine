import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TARGETS } from '@/lib/targets';
import {cookies} from "next/headers";
import {createServerClient} from "@supabase/ssr";

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function formatMarkdown(html: string): string {
    if (!html) return "";

    let text = html;

    // 1. Убиваем блоки стилей и скриптов целиком вместе с содержимым
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // 2. Агрессивно вырезаем любые CSS-инъекции, которые прикинулись текстом
    // Это уберет те самые "font-family: arial..."
    const cssGarbage = [
        /font-family:[^;<>]+;?/gi,
        /font-size:[^;<>]+;?/gi,
        /line-height:[^;<>]+;?/gi,
        /color:[^;<>]+;?/gi,
        /margin:[^;<>]+;?/gi,
        /padding:[^;<>]+;?/gi,
        /text-align:[^;<>]+;?/gi,
        /background-color:[^;<>]+;?/gi,
        /\{[^}]*\}/g // Удаляет всё в фигурных скобках, если пролез чистый CSS
    ];

    cssGarbage.forEach(pattern => {
        text = text.replace(pattern, '');
    });

    // 3. Стандартная конвертация тегов в Markdown
    text = text
        .replace(/<h[1-6][^>]*>/gi, '### ')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<strong>|<\/strong>|<b>|<\/b>/gi, '**')
        .replace(/<li>/gi, '\n* ')
        .replace(/<\/li>|<ul>|<\/ul>|<ol>|<\/ol>/gi, '')
        .replace(/<p[^>]*>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ''); // Удаляем все остальные теги

    // 4. Финальная полировка спецсимволов и пустых строк
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n\s*\n/g, '\n\n') // Убираем лишние пустые строки
        .replace(/^\s*[\r\n]/gm, '') // Убираем совсем пустые строки в начале/конце
        .trim();
}

function extractCategory(title: string): string {
    const t = title.toLowerCase();
    if (/frontend|react|vue|angular|web|ui developer/i.test(t)) return 'Frontend Developer';
    if (/backend|node|python|go|rust|java|ruby|golang|scala/i.test(t)) return 'Backend Developer';
    if (/fullstack|full-stack/i.test(t)) return 'Fullstack Developer';
    if (/qa automation|test automation|automation engineer/i.test(t)) return 'QA Automation';
    if (/qa|test|quality assurance|manual tester/i.test(t)) return 'QA Engineer';
    if (/mobile|ios|android|swift|kotlin|flutter|react native/i.test(t)) return 'Mobile Developer';
    if (/data scientist|research scientist/i.test(t)) return 'Data Scientist';
    if (/ml|machine learning|nlp|computer vision/i.test(t)) return 'ML Engineer';
    if (/data analyst|business analyst|analytics/i.test(t)) return 'Data Analyst';
    if (/devops|infrastructure|sre|site reliability/i.test(t)) return 'DevOps Engineer';
    if (/system administrator|sysadmin|it support/i.test(t)) return 'System Administrator';
    if (/security|cyber|infosec|pentest|compliance/i.test(t)) return 'Cybersecurity Specialist';
    if (/ux|ui|designer|visual designer/i.test(t)) return 'UX/UI Designer';
    if (/project manager|pm/i.test(t) && !/product/i.test(t)) return 'Project Manager';
    if (/product manager|product lead/i.test(t)) return 'Product Manager';
    if (/system analyst|technical analyst/i.test(t)) return 'System Analyst';
    if (/game|unity|unreal|gameplay/i.test(t)) return 'Game Developer';
    if (/embedded|firmware|hardware|microcontroller|c\b/i.test(t)) return 'Embedded Developer';
    if (/cloud engineer|aws engineer|azure engineer/i.test(t)) return 'Cloud Engineer';
    if (/prompt engineer|ai specialist|generative ai/i.test(t)) return 'AI Prompt Engineer';
    if (/engineer|developer/i.test(t)) return 'Software Engineer';
    return 'Other';
}

function extractSalary(text: string): string {
    const salaryRegex = /(?:\$\s?|USD\s?)\d{2,3}(?:[.,]\d{3})?[\s-]*k?|(?:\d{2,3}k?[\s-]*){1,2}\s?(?:\$|USD)/gi;
    const matches = text.match(salaryRegex);
    if (matches && matches.length > 0) {
        return matches.reduce((a, b) => a.length > b.length ? a : b).trim();
    }
    return "Competitive";
}

function extractTags(text: string): string[] {
    const techStack = [
        'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Rust', 'Java', 'Scala', 'Kotlin', 'Swift', 'PHP', 'Ruby', 'C\\+\\+', 'C#',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Cloudflare',
        'PostgreSQL', 'MongoDB', 'Redis', 'Kafka', 'Spark', 'PyTorch', 'TensorFlow', 'OpenAI', 'LLM',
        'Figma', 'Unity', 'Unreal', 'Jenkins', 'CI/CD', 'GraphQL', 'Tailwind'
    ];
    return techStack.filter(tech => {
        const escapedTech = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(\\s|^)${escapedTech}(\\s|,|\\.|;|$)`, 'i');
        return regex.test(text);
    });
}

// --- СПИСОК КОМПАНИЙ (БЕЗ ДУБЛИКАТОВ) ---


// --- API HANDLER ---

export async function GET(req: Request) {
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
    const { searchParams } = new URL(req.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '15');
    const batch = TARGETS.slice(offset, offset + limit);

    if (batch.length === 0) {
        return NextResponse.json({ success: true, finished: true });
    }

    const allScrapedJobs = [];

    // МЕНЯЕМ Promise.all НА ЦИКЛ for...of, чтобы не триггерить защиту API
    for (const target of batch) {
        let syncStatus = {
            company_id: target.id,
            status: 'success',
            jobs_found: 0,
            error_message: null as string | null,
            last_sync: new Date().toISOString()
        };

        try {
            const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${target.id}/jobs?content=true`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                },
                next: { revalidate: 0 },
                signal: AbortSignal.timeout(10000)
            });

            if (!res.ok) {
                if (res.status === 404) {
                    console.warn(`⚠️ ${target.id}: Not found (404). Skipping...`);
                    syncStatus.status = 'not_found';
                    syncStatus.error_message = "Board not found or private";
                    await supabase.from('sync_logs').upsert(syncStatus);
                    continue; // ПЕРЕХОДИМ К СЛЕДУЮЩЕЙ КОМПАНИИ, А НЕ ПАДАЕМ
                }
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            const jobs = data.jobs || [];

            // ... внутри data.jobs.map
            const filtered = jobs
                .filter((j: any) => {
                    // 1. Проверка на инженера (твоя текущая)
                    const isIT = /engineer|developer|frontend|backend|fullstack|software|designer|manager|analyst|qa|tester|security|devops|data|ml|ai|game|unity|embedded|firmware|cyber|sysadmin|support|cloud|prompt/i.test(j.title);

                    // 2. Проверка на Remote (ищем в локации или в заголовке)
                    const locationName = j.location?.name || "";
                    const isRemote = /remote|anywhere|distributed|telecommute/i.test(locationName + j.title);

                    return isIT && isRemote;
                })
                .map((job: any) => {
                    const markdown = formatMarkdown(job.content);
                    const category = extractCategory(job.title);
                    if (category === 'Other') return null;

                    return {
                        job_id: `gh-${target.id}-${job.id}`,
                        title: job.title,
                        category,
                        company: target.id.toUpperCase(),
                        location: job.location?.name || "Remote", // Если мы тут, значит это точно Remote
                        salary: extractSalary(markdown),
                        description: markdown,
                        link: job.absolute_url,
                        logo_url: `https://www.google.com/s2/favicons?domain=${target.domain}&sz=128`,
                        tags: extractTags(markdown + " " + job.title),
                        employment_type: "Full-time",
                        created_at: new Date().toISOString()
                    };
                })
                .filter(Boolean);

            syncStatus.jobs_found = filtered.length;
            allScrapedJobs.push(...filtered);

        } catch (err: any) {
            syncStatus.status = 'error';
            syncStatus.error_message = err.message;
            console.error(`❌ ${target.id}: ${err.message}`);
        }

        // Логируем в Supabase прогресс по этой компании
        await supabase.from('sync_logs').upsert(syncStatus);

        // Маленькая пауза между запросами (50ms), чтобы не злить API
        await new Promise(r => setTimeout(r, 50));
    }

    try {
        if (allScrapedJobs.length > 0) {
            const { error: upsertError } = await supabase
                .from('jobs')
                .upsert(allScrapedJobs, { onConflict: 'job_id' });

            if (upsertError) throw upsertError;
        }

        return NextResponse.json({
            success: true,
            processed: batch.length,
            jobsFound: allScrapedJobs.length,
            nextOffset: offset + limit,
            finished: (offset + limit) >= TARGETS.length
        });

    } catch (error: any) {
        console.error("Master Sync Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}