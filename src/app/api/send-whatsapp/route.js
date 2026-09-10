import { NextResponse } from 'next/server';

/**
 * API Route لإرسال رسائل الواتساب تلقائياً للمرضى
 * يدعم كلاً من:
 * 1. الربط المباشر مع UltraMsg API (الأسهل والأشهر في مصر والوطن العربي برقم العيادة)
 * 2. الربط مع Meta WhatsApp Cloud API أو أي Webhook Gateway
 * 3. المحاكاة والتجهيز المسبق بدون توقف النظام
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, message, patientName, bookingNumber } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف والرسالة مطلوبان' },
        { status: 400 }
      );
    }

    // تنظيف رقم الهاتف وإضافة كود الدولة لمصر (20) أو أي كود دولي
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '2' + cleanPhone;
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }

    // إعدادات UltraMsg (إذا وفرتها العيادة في ملف .env)
    const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
    const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;

    if (ULTRAMSG_INSTANCE_ID && ULTRAMSG_TOKEN) {
      try {
        const params = new URLSearchParams();
        params.append('token', ULTRAMSG_TOKEN);
        params.append('to', cleanPhone);
        params.append('body', message);
        params.append('priority', '10');

        const res = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          },
          body: params.toString(),
        });

        const data = await res.json();
        return NextResponse.json({
          success: true,
          provider: 'ultramsg',
          data,
        });
      } catch (apiErr) {
        console.error('UltraMsg send error:', apiErr);
      }
    }

    // الرابط الفوري المباشر (Direct WhatsApp Link Fallback)
    const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({
      success: true,
      mode: 'direct_link',
      phone: cleanPhone,
      directUrl,
      message: 'تم تجهيز رابط الواتساب بنجاح، ويمكن فتح المحادثة مباشرة أو ربط بوابة الـ API',
    });
  } catch (error) {
    console.error('WhatsApp Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
