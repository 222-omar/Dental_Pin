// ===== Dental Pin — Utility Functions =====

import { MONTHS_AR, WEEKDAYS_AR } from './constants';

// تنسيق التاريخ بالعربية
export function formatDateAr(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate();
  const month = MONTHS_AR[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// تنسيق التاريخ مع يوم الأسبوع
export function formatDateWithDay(date) {
  if (!date) return '';
  const d = new Date(date);
  const dayName = WEEKDAYS_AR[d.getDay()];
  const day = d.getDate();
  const month = MONTHS_AR[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName} ${day} ${month} ${year}`;
}

// تنسيق التاريخ المختصر
export function formatDateShort(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}

// تنسيق الوقت بالعربية
export function formatTimeAr(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'م' : 'ص';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

// حساب الزمن المنقضي
export function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسبوع`;
  return formatDateAr(date);
}

// حساب العمر
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// إنشاء الأحرف الأولى من الاسم
export function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

// لون عشوائي ثابت بناءً على الاسم
export function getAvatarColor(name) {
  if (!name) return '#6B7280';
  const colors = [
    '#2563EB', '#7C3AED', '#DB2777', '#EA580C',
    '#16A34A', '#0891B2', '#4F46E5', '#C026D3',
    '#059669', '#D97706', '#DC2626', '#7C2D12',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// إنشاء رقم حجز فريد
export function generateBookingNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DP-${datePart}-${randomPart}`;
}

// التحقق من رقم الهاتف المصري
export function isValidEgyptianPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(01[0125]\d{8}|(\+?20)1[0125]\d{8})$/.test(cleaned);
}

// تنسيق رقم الهاتف
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

// تنسيق المبلغ بالجنيه المصري
export function formatCurrency(amount) {
  if (amount == null) return '٠ ج.م';
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}

// هل التاريخ هو اليوم
export function isToday(date) {
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

// الحصول على بداية ونهاية الأسبوع
export function getWeekRange(date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  // الأسبوع يبدأ من السبت (6) في مصر
  const saturdayOffset = (dayOfWeek + 1) % 7;
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - saturdayOffset);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return { start: startOfWeek, end: endOfWeek };
}

// تأخير
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// cn - class names combiner
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
