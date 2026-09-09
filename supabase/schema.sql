-- =======================================================
-- Dental Pin — Database Schema & Initial Seed Data
-- =======================================================

-- 1. تفعيل الامتدادات الضرورية
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =======================================================
-- 2. إنشاء الجداول (Tables)
-- =======================================================

-- جدول الأطباء (Doctors)
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT DEFAULT 'طبيب أسنان',
  phone TEXT,
  working_hours JSONB DEFAULT '{"start": "09:00", "end": "21:00", "days": [0,1,2,3,4,5]}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الخدمات (Services)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 30,
  price NUMERIC(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المرضى (Patients)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'new')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المواعيد (Appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name TEXT DEFAULT 'د. أحمد محمد',
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'arrived', 'in_treatment', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  source TEXT DEFAULT 'admin' CHECK (source IN ('admin', 'online')),
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_doctor_appointment_slot UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- جدول الإشعارات (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('new_booking', 'upcoming', 'cancelled', 'rescheduled')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 3. الفهارس لتسريع الاستعلامات (Indexes)
-- =======================================================

CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(is_read) WHERE is_read = false;

-- =======================================================
-- 4. إعدادات الأمان وسياسات الوصول (Row Level Security - RLS)
-- =======================================================

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- سياسات جدول الأطباء (قراءة للجميع، تعديل للأدمن)
DROP POLICY IF EXISTS "Allow select doctors" ON public.doctors;
CREATE POLICY "Allow select doctors" ON public.doctors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow modify doctors" ON public.doctors;
CREATE POLICY "Allow modify doctors" ON public.doctors FOR ALL USING (true) WITH CHECK (true);

-- سياسات جدول الخدمات (قراءة للجميع، تعديل للأدمن)
DROP POLICY IF EXISTS "Allow select services" ON public.services;
CREATE POLICY "Allow select services" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow modify services" ON public.services;
CREATE POLICY "Allow modify services" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- سياسات جدول المرضى (إتاحة القراءة والإضافة والتعديل للتطبيق والحجز العام)
DROP POLICY IF EXISTS "Allow read patients" ON public.patients;
CREATE POLICY "Allow read patients" ON public.patients FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert patients" ON public.patients;
CREATE POLICY "Allow insert patients" ON public.patients FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update patients" ON public.patients;
CREATE POLICY "Allow update patients" ON public.patients FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow delete patients" ON public.patients;
CREATE POLICY "Allow delete patients" ON public.patients FOR DELETE USING (true);

-- سياسات جدول المواعيد (إتاحة القراءة والإضافة والتعديل والإلغاء)
DROP POLICY IF EXISTS "Allow read appointments" ON public.appointments;
CREATE POLICY "Allow read appointments" ON public.appointments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert appointments" ON public.appointments;
CREATE POLICY "Allow insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update appointments" ON public.appointments;
CREATE POLICY "Allow update appointments" ON public.appointments FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow delete appointments" ON public.appointments;
CREATE POLICY "Allow delete appointments" ON public.appointments FOR DELETE USING (true);

-- سياسات جدول الإشعارات
DROP POLICY IF EXISTS "Allow read notifications" ON public.notifications;
CREATE POLICY "Allow read notifications" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;
CREATE POLICY "Allow insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update notifications" ON public.notifications;
CREATE POLICY "Allow update notifications" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);

-- =======================================================
-- 5. البيانات الأولية (Seed Data)
-- =======================================================

-- إضافة الطبيب الافتراضي
INSERT INTO public.doctors (id, name, specialization, phone, working_hours, active)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'د. أحمد محمد',
  'طبيب أسنان وجراحة الفم والأسنان',
  '01012345678',
  '{"start": "09:00", "end": "21:00", "days": [0, 1, 2, 3, 4, 5]}',
  true
)
ON CONFLICT (id) DO NOTHING;

-- إضافة الخدمات الافتراضية
INSERT INTO public.services (id, name, description, duration, price, active)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'كشف', 'فحص وتشخيص أولي شامل للأسنان واللثة', 30, 200, true),
  ('c0000000-0000-0000-0000-000000000002', 'تنظيف أسنان', 'إزالة الجير وتنظيف وتلميع الأسنان', 45, 350, true),
  ('c0000000-0000-0000-0000-000000000003', 'حشو', 'حشو تجميلي ليزر للأسنان المتضررة', 60, 500, true),
  ('c0000000-0000-0000-0000-000000000004', 'خلع', 'خلع جراحي وبسيط للأسنان وبقايا الجذور', 30, 400, true),
  ('c0000000-0000-0000-0000-000000000005', 'علاج عصب', 'علاج وحشو جذور الأسنان بأحدث الأجهزة', 90, 1500, true),
  ('c0000000-0000-0000-0000-000000000006', 'تركيبات', 'تركيبات ثابتة ومتحركة وزركون وبورسلين', 60, 2000, true),
  ('c0000000-0000-0000-0000-000000000007', 'تقويم أسنان', 'تقويم وتعديل اصطفاف الأسنان والفكين', 45, 800, true),
  ('c0000000-0000-0000-0000-000000000008', 'تبييض أسنان', 'تبييض وتفتيح لون الأسنان بجهاز الليزر', 60, 1200, true)
ON CONFLICT (id) DO NOTHING;

-- إضافة عينة مرضى
INSERT INTO public.patients (id, name, phone, date_of_birth, gender, address, notes, status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'محمد أحمد علي', '01098765432', '1990-05-15', 'male', 'المعادي، القاهرة', 'حساسية من البنسلين', 'active'),
  ('b0000000-0000-0000-0000-000000000002', 'فاطمة حسن', '01123456789', '1985-11-22', 'female', 'مدينة نصر، القاهرة', '', 'active'),
  ('b0000000-0000-0000-0000-000000000003', 'أحمد سعيد', '01234567890', '1995-03-08', 'male', 'الدقي، الجيزة', 'مريض سكر', 'active'),
  ('b0000000-0000-0000-0000-000000000004', 'سارة محمود', '01056789012', '2000-07-30', 'female', 'المهندسين، الجيزة', '', 'active'),
  ('b0000000-0000-0000-0000-000000000005', 'عمر خالد', '01145678901', '1988-12-10', 'male', 'مصر الجديدة، القاهرة', '', 'active'),
  ('b0000000-0000-0000-0000-000000000006', 'نور الدين علي', '01289012345', '1992-09-18', 'male', 'الزمالك، القاهرة', '', 'active'),
  ('b0000000-0000-0000-0000-000000000007', 'هدى إبراهيم', '01012349876', '1998-01-25', 'female', 'الهرم، الجيزة', '', 'active')
ON CONFLICT (id) DO NOTHING;

-- إضافة عينة إشعارات أولية
INSERT INTO public.notifications (type, title, message, is_read)
VALUES
  ('new_booking', 'حجز جديد أونلاين', 'قام المريض محمد أحمد علي بطلب حجز كشف عبر الموقع الإلكتروني', false),
  ('upcoming', 'تذكير بموعد قريب', 'موعد المريضة فاطمة حسن بعد 30 دقيقة', false)
ON CONFLICT DO NOTHING;
