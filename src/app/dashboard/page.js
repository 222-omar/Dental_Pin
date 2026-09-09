'use client';

import { useState } from 'react';
import {
  CalendarDays, Users, Clock, CheckCircle, UserPlus, CalendarPlus,
  ArrowLeft, Phone, MoreHorizontal, PlayCircle, LogOut as LogOutIcon,
  Ban, UserCheck, Stethoscope, XCircle
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { STATUS_LABELS } from '@/lib/constants';
import { formatTimeAr, getInitials, getAvatarColor, timeAgo } from '@/lib/utils';
import { NOTIFICATION_COLORS } from '@/lib/constants';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Link from 'next/link';

export default function DashboardPage() {
  const { appointments, patients, notifications, unreadCount,
    checkInAppointment, startTreatment, checkOutAppointment,
    confirmAppointment, cancelAppointment, markNoShow,
    usingMockData, isSupabaseConnected, fetchData
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
  const newPatientsToday = patients.filter(p => p.status === 'new').length;

  const stats = [
    { label: 'مواعيد اليوم', value: todayAppointments.length, icon: CalendarDays, color: 'primary' },
    { label: 'مرضى جدد', value: newPatientsToday, icon: UserPlus, color: 'info' },
    { label: 'في الانتظار', value: waitingToday, icon: Clock, color: 'warning' },
    { label: 'مكتملة', value: completedToday, icon: CheckCircle, color: 'success' },
  ];

  const handleAction = (id, action) => {
    switch (action) {
      case 'confirm':
        confirmAppointment(id);
        addToast('تم تأكيد الموعد بنجاح', 'success');
        break;
      case 'checkin':
        checkInAppointment(id);
        addToast('تم تسجيل حضور المريض', 'success');
        break;
      case 'start':
        startTreatment(id);
        addToast('تم بدء الكشف', 'success');
        break;
      case 'checkout':
        checkOutAppointment(id);
        addToast('تم إنهاء الزيارة بنجاح', 'success');
        break;
      case 'noshow':
        markNoShow(id);
        addToast('تم تسجيل عدم الحضور', 'warning');
        break;
      case 'cancel':
        setConfirmDialog({ open: true, id, action: 'cancel' });
        return;
    }
  };

  const handleConfirmCancel = () => {
    cancelAppointment(confirmDialog.id);
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
        btns.push({ label: 'إنهاء الزيارة', action: 'checkout', icon: LogOutIcon, cls: 'btn-success' });
        break;
    }
    return btns;
  };

  return (
    <>
      {/* Supabase Status Banner */}
      {usingMockData ? (
        <div style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.85rem',
          color: '#1E40AF',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <span>
              <strong>تم الاتصال بـ Supabase!</strong> النظام يعمل حالياً بوضع المعاينة. لتخزين البيانات دائماً على السحابة، يرجى تشغيل كود <code>supabase/schema.sql</code> في Supabase SQL Editor.
            </span>
          </div>
          <button
            onClick={() => {
              fetchData();
              addToast('جاري التحقق من حالة الجداول...', 'info');
            }}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: '#93C5FD', color: '#1E40AF', background: 'white' }}
          >
            تحديث التحقق 🔄
          </button>
        </div>
      ) : (
        <div style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '12px',
          padding: '10px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: '#166534',
          gap: '8px',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
          <span>قاعدة بيانات <strong>Supabase</strong> متصلة وتعمل بنجاح مع التحديث الفوري (Realtime Sync)</span>
        </div>
      )}

      {/* Stats */}
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

      {/* Quick Actions */}
      <div className="quick-actions-grid">
        <Link href="/dashboard/patients" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Users size={22} />
          </div>
          <span className="quick-action-label">المرضى</span>
        </Link>
        <Link href="/dashboard/appointments" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: '#F0FDFA', color: '#0D9488' }}>
            <CalendarDays size={22} />
          </div>
          <span className="quick-action-label">الحجوزات</span>
        </Link>
        <Link href="/dashboard/patients?action=add" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: '#FDF4FF', color: '#9333EA' }}>
            <UserPlus size={22} />
          </div>
          <span className="quick-action-label">إضافة مريض</span>
        </Link>
        <Link href="/dashboard/appointments?action=add" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: '#FFF7ED', color: '#EA580C' }}>
            <CalendarPlus size={22} />
          </div>
          <span className="quick-action-label">حجز موعد</span>
        </Link>
      </div>

      <div className="dashboard-grid">
        {/* Today's Appointments */}
        <div className="dashboard-main">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">مواعيد اليوم</h3>
              <Link href="/dashboard/appointments" className="btn btn-ghost btn-sm">
                عرض الكل <ArrowLeft size={14} />
              </Link>
            </div>
            {todayAppointments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CalendarDays size={32} />
                </div>
                <div className="empty-state-title">لا توجد مواعيد اليوم</div>
                <div className="empty-state-text">لم يتم جدولة أي مواعيد لليوم</div>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>المريض</th>
                      <th>الهاتف</th>
                      <th>الخدمة</th>
                      <th>الوقت</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppointments.map(apt => (
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
                        <td>{apt.service_name}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="dashboard-sidebar-content">
          {/* Notifications Preview */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">آخر الإشعارات</h3>
              {unreadCount > 0 && (
                <span style={{
                  background: '#FEF2F2', color: '#DC2626', fontSize: '0.75rem',
                  fontWeight: 700, padding: '2px 10px', borderRadius: '9999px',
                }}>
                  {unreadCount} جديد
                </span>
              )}
            </div>
            <div>
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
                  <div
                    className="notification-item-icon"
                    style={{
                      background: `${NOTIFICATION_COLORS[n.type]}15`,
                      color: NOTIFICATION_COLORS[n.type],
                    }}
                  >
                    •
                  </div>
                  <div className="notification-item-content">
                    <div className="notification-item-message">{n.message}</div>
                    <div className="notification-item-time" suppressHydrationWarning>{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
