'use client';

import { useState } from 'react';
import {
  CalendarDays, Clock, CheckCircle, UserPlus, CalendarPlus,
  ArrowLeft, Phone, LogOut as LogOutIcon,
  Ban, UserCheck, Stethoscope, XCircle, CircleDollarSign, BarChart3
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { STATUS_LABELS } from '@/lib/constants';
import { formatTimeAr, getInitials, getAvatarColor } from '@/lib/utils';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Link from 'next/link';

export default function DashboardPage() {
  const {
    appointments, checkInAppointment, startTreatment, checkOutAppointment,
    confirmAppointment, cancelAppointment, markNoShow,
    todayRevenue, getAppointmentPrice
  } = useApp();
  const { addToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, action: null });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const todayAppointments = appointments
    .filter(a => a.appointment_date === todayStr)
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

  const completedToday = todayAppointments.filter(a => a.status === 'completed').length;
  const waitingToday = todayAppointments.filter(a => ['pending', 'confirmed', 'arrived'].includes(a.status)).length;

  // بطاقات الإحصائيات الأربعة الأساسية بما فيها إيرادات اليوم
  const stats = [
    { label: 'مواعيد اليوم', value: todayAppointments.length, icon: CalendarDays, color: 'primary' },
    { label: 'في الانتظار', value: waitingToday, icon: Clock, color: 'warning' },
    { label: 'حالات مكتملة', value: completedToday, icon: CheckCircle, color: 'info' },
    { label: 'إيرادات اليوم', value: `${todayRevenue.toLocaleString()} ج.م`, icon: CircleDollarSign, color: 'success' },
  ];

  const handleAction = async (id, action) => {
    switch (action) {
      case 'confirm':
        await confirmAppointment(id);
        addToast('تم تأكيد الموعد بنجاح', 'success');
        break;
      case 'checkin':
        await checkInAppointment(id);
        addToast('تم تسجيل حضور المريض بالعيادة', 'success');
        break;
      case 'start':
        await startTreatment(id);
        addToast('بدأ الكشف مع الطبيب', 'success');
        break;
      case 'checkout': {
        const amount = await checkOutAppointment(id);
        addToast(`تم إنهاء الزيارة بنجاح وتسجيل تحصيل ${amount} ج.م`, 'success');
        break;
      }
      case 'noshow':
        await markNoShow(id);
        addToast('تم تسجيل عدم حضور المريض', 'warning');
        break;
      case 'cancel':
        setConfirmDialog({ open: true, id, action: 'cancel' });
        return;
    }
  };

  const handleConfirmCancel = async () => {
    await cancelAppointment(confirmDialog.id);
    addToast('تم إلغاء الموعد', 'warning');
    setConfirmDialog({ open: false, id: null, action: null });
  };

  const getActionButtons = (appointment) => {
    const btns = [];
    switch (appointment.status) {
      case 'pending':
        btns.push({ label: 'تأكيد', action: 'confirm', icon: CheckCircle, cls: 'btn-primary' });
        btns.push({ label: 'إلغاء', action: 'cancel', icon: XCircle, cls: 'btn-ghost' });
        break;
      case 'confirmed':
        btns.push({ label: 'تسجيل حضور', action: 'checkin', icon: UserCheck, cls: 'btn-success' });
        btns.push({ label: 'لم يحضر', action: 'noshow', icon: Ban, cls: 'btn-ghost' });
        break;
      case 'arrived':
        btns.push({ label: 'بدء الكشف', action: 'start', icon: Stethoscope, cls: 'btn-primary' });
        break;
      case 'in_treatment':
        btns.push({ label: 'إنهاء ودفع', action: 'checkout', icon: LogOutIcon, cls: 'btn-success' });
        break;
    }
    return btns;
  };

  return (
    <>
      {/* 1. بطاقات الإحصائيات الأربعة السريعة */}
      <div className="stat-cards-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-card-icon ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-info">
              <div className="stat-card-label">{stat.label}</div>
              <div className="stat-card-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. الإجراءات السريعة المركزة */}
      <div className="quick-actions-grid" style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/appointments?action=add" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: '#F0FDFA', color: '#0D9488' }}>
            <CalendarPlus size={22} />
          </div>
          <span className="quick-action-label">حجز موعد جديد</span>
        </Link>
        <Link href="/dashboard/patients?action=add" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <UserPlus size={22} />
          </div>
          <span className="quick-action-label">إضافة مريض جديد</span>
        </Link>
        <Link href="/dashboard/reports" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: '#FDF4FF', color: '#9333EA' }}>
            <BarChart3 size={22} />
          </div>
          <span className="quick-action-label">التقرير المالي والإحصائيات</span>
        </Link>
      </div>

      {/* 3. جدول مواعيد اليوم بكامل عرض الصفحة مريح وبسيط */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">مواعيد اليوم</h3>
            <p style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '2px' }}>
              إجمالي {todayAppointments.length} موعد مجدول لليوم
            </p>
          </div>
          <Link href="/dashboard/appointments" className="btn btn-ghost btn-sm">
            عرض كل الحجوزات <ArrowLeft size={14} />
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="empty-state-icon">
              <CalendarDays size={36} color="#94A3B8" />
            </div>
            <div className="empty-state-title">لا توجد مواعيد متبقية لليوم</div>
            <div className="empty-state-text">يمكنك حجز موعد جديد بالضغط على زر "حجز موعد جديد" أعلاه</div>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>المريض</th>
                  <th>الهاتف</th>
                  <th>الخدمة الطبية</th>
                  <th>القيمة</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.map(apt => {
                  const price = getAppointmentPrice(apt);
                  return (
                    <tr key={apt.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar sm" style={{ background: getAvatarColor(apt.patient_name) }}>
                            {getInitials(apt.patient_name)}
                          </div>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{apt.patient_name}</span>
                        </div>
                      </td>
                      <td style={{ direction: 'ltr', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
                          <Phone size={13} />
                          {apt.patient_phone}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{apt.service_name || 'كشف'}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: apt.status === 'completed' ? '#16A34A' : '#0B8FAC' }}>
                          {price} ج.م
                          {apt.status === 'completed' && <span style={{ fontSize: '0.7rem', color: '#16A34A', marginRight: '4px' }}>(مدفوع)</span>}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
                          <Clock size={13} />
                          {formatTimeAr(apt.appointment_time)}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${apt.status}`}>
                          <span className="status-badge-dot" />
                          {STATUS_LABELS[apt.status]}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {getActionButtons(apt).map((btn, i) => (
                            <button
                              key={i}
                              className={`btn btn-sm ${btn.cls}`}
                              onClick={() => handleAction(apt.id, btn.action)}
                            >
                              <btn.icon size={14} />
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, id: null, action: null })}
        onConfirm={handleConfirmCancel}
        title="إلغاء الموعد"
        message="هل أنت متأكد من إلغاء هذا الموعد؟ لن يتم حذفه ولكن سيتم تغيير حالته إلى ملغي."
        confirmText="نعم، إلغاء الموعد"
        cancelText="تراجع"
        variant="danger"
      />
    </>
  );
}
