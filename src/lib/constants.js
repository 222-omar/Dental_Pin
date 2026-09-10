// ===== Dental Pin — Constants =====

// حالات المواعيد
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ARRIVED: 'arrived',
  IN_TREATMENT: 'in_treatment',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

// ترجمة حالات المواعيد
export const STATUS_LABELS = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  arrived: 'حضر',
  in_treatment: 'قيد الكشف',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  no_show: 'لم يحضر',
};

// ألوان حالات المواعيد
export const STATUS_COLORS = {
  pending: { bg: '#FFF7ED', text: '#EA580C', border: '#FDBA74' },
  confirmed: { bg: '#EFF6FF', text: '#2563EB', border: '#93C5FD' },
  arrived: { bg: '#F0FDF4', text: '#16A34A', border: '#86EFAC' },
  in_treatment: { bg: '#FDF4FF', text: '#9333EA', border: '#D8B4FE' },
  completed: { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' },
  no_show: { bg: '#F9FAFB', text: '#6B7280', border: '#D1D5DB' },
};

// أنواع الإشعارات
export const NOTIFICATION_TYPES = {
  NEW_BOOKING: 'new_booking',
  UPCOMING: 'upcoming',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
};

// ترجمة أنواع الإشعارات
export const NOTIFICATION_TYPE_LABELS = {
  new_booking: 'حجز جديد',
  upcoming: 'موعد قريب',
  cancelled: 'إلغاء موعد',
  rescheduled: 'إعادة جدولة',
};

// ألوان الإشعارات
export const NOTIFICATION_COLORS = {
  new_booking: '#2563EB',
  upcoming: '#EA580C',
  cancelled: '#DC2626',
  rescheduled: '#9333EA',
};

// الخدمات الافتراضية
export const DEFAULT_SERVICES = [
  { id: '1', name: 'كشف', description: 'فحص وتشخيص أولي', duration: 30, price: 200, active: true },
  { id: '2', name: 'تنظيف أسنان', description: 'تنظيف وتلميع الأسنان', duration: 45, price: 350, active: true },
  { id: '3', name: 'حشو', description: 'حشو الأسنان المتضررة', duration: 60, price: 500, active: true },
  { id: '4', name: 'خلع', description: 'خلع الأسنان', duration: 30, price: 400, active: true },
  { id: '5', name: 'علاج عصب', description: 'علاج عصب الأسنان', duration: 90, price: 1500, active: true },
  { id: '6', name: 'تركيبات', description: 'تركيبات ثابتة ومتحركة', duration: 60, price: 2000, active: true },
  { id: '7', name: 'تقويم أسنان', description: 'تقويم وتعديل الأسنان', duration: 45, price: 800, active: true },
  { id: '8', name: 'تبييض أسنان', description: 'تبييض وتجميل الأسنان', duration: 60, price: 1200, active: true },
];

// بيانات الطبيب الافتراضي والعيادة
export const CLINIC_WHATSAPP = '01143912497';

export const DEFAULT_DOCTOR = {
  id: '1',
  name: 'د. أحمد محمد',
  specialization: 'طبيب أسنان',
  phone: '01143912497',
  whatsapp: '01143912497',
  workingHours: { start: '09:00', end: '21:00' },
  workingDays: [0, 1, 2, 3, 4, 5], // السبت إلى الخميس
};

// ساعات العمل (فترات 30 دقيقة)
export const generateTimeSlots = (start = '09:00', end = '21:00', intervalMinutes = 30) => {
  const slots = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let currentH = startH;
  let currentM = startM;

  while (currentH < endH || (currentH === endH && currentM < endM)) {
    const hour = currentH.toString().padStart(2, '0');
    const minute = currentM.toString().padStart(2, '0');
    const period = currentH >= 12 ? 'م' : 'ص';
    const displayHour = currentH > 12 ? currentH - 12 : currentH === 0 ? 12 : currentH;
    slots.push({
      value: `${hour}:${minute}`,
      label: `${displayHour}:${minute} ${period}`,
    });
    currentM += intervalMinutes;
    if (currentM >= 60) {
      currentH += Math.floor(currentM / 60);
      currentM = currentM % 60;
    }
  }
  return slots;
};

// أيام الأسبوع بالعربية
export const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// أشهر السنة بالعربية
export const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// النوع
export const GENDER_OPTIONS = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
];

// عناصر القائمة الجانبية
export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'الرئيسية', icon: 'LayoutDashboard', path: '/dashboard' },
  { id: 'patients', label: 'المرضى', icon: 'Users', path: '/dashboard/patients' },
  { id: 'appointments', label: 'الحجوزات', icon: 'CalendarDays', path: '/dashboard/appointments' },
  { id: 'reports', label: 'التقارير', icon: 'BarChart3', path: '/dashboard/reports' },
];

export const SIDEBAR_BOTTOM_ITEMS = [
  { id: 'notifications', label: 'الإشعارات', icon: 'Bell', path: '/dashboard/notifications' },
  { id: 'settings', label: 'الإعدادات', icon: 'Settings', path: '/dashboard/settings' },
];
