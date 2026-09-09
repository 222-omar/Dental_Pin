import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: services, error: sErr } = await supabase.from('services').select('*').limit(1);
    const { data: patients, error: pErr } = await supabase.from('patients').select('*').limit(1);
    const { data: appointments, error: aErr } = await supabase.from('appointments').select('*').limit(1);

    const tablesMissing = [];
    if (sErr) tablesMissing.push({ table: 'services', error: sErr.message, code: sErr.code });
    if (pErr) tablesMissing.push({ table: 'patients', error: pErr.message, code: pErr.code });
    if (aErr) tablesMissing.push({ table: 'appointments', error: aErr.message, code: aErr.code });

    if (tablesMissing.length > 0) {
      return NextResponse.json({
        connected: true,
        ready: false,
        tablesMissing,
        message: 'تم الاتصال بـ Supabase بنجاح ولكن الجداول غير منشأة بعد في قاعدة البيانات.',
        instructions: 'يرجى فتح Supabase Dashboard -> SQL Editor وتشغيل محتوى ملف supabase/schema.sql',
      });
    }

    return NextResponse.json({
      connected: true,
      ready: true,
      message: 'قاعدة البيانات متصلة وجاهزة بالكامل!',
    });
  } catch (err) {
    return NextResponse.json({
      connected: false,
      ready: false,
      error: err.message,
    }, { status: 500 });
  }
}
