'use client';

import { use, useMemo } from 'react';
import {
  ArrowRight, Phone, Calendar, MapPin, User, Edit2, CalendarPlus,
  Clock, FileText
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { STATUS_LABELS } from '@/lib/constants';
import { formatDateAr, formatTimeAr, calculateAge, getInitials, getAvatarColor, formatPhone } from '@/lib/utils';
import Link from 'next/link';

export default function PatientProfilePage({ params }) {
  const { id } = use(params);
  const { getPatient, getPatientAppointments } = useApp();

  const patient = getPatient(id);
  const patientAppointments = useMemo(() => getPatientAppointments(id), [id, getPatientAppointments]);

  if (!patient) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><User size={32} /></div>
        <div className="empty-state-title">المريض غير موجود</div>
        <Link href="/dashboard/patients" className="btn btn-primary" style={{ marginTop: '16px' }}>
          <ArrowRight size={16} /> العودة للمرضى
        </Link>
      </div>
    );
  }

  const upcomingAppointment = patientAppointments.find(a =>
    new Date(a.appointment_date) >= new Date() && !['cancelled', 'completed', 'no_show'].includes(a.status)
  );

  return (
    <>
      {/* Back */}
      <Link href="/dashboard/patients" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}>
        <ArrowRight size={16} />
        العودة لقائمة المرضى
      </Link>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="avatar xl" style={{ background: getAvatarColor(patient.name) }}>
          {getInitials(patient.name)}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{patient.name}</h2>
          <div className="profile-meta">
            <div className="profile-meta-item">
              <Phone size={14} />
              <span style={{ direction: 'ltr' }}>{formatPhone(patient.phone)}</span>
            </div>
            {patient.gender && (
              <div className="profile-meta-item">
                <User size={14} />
                <span>{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
              </div>
            )}
            {patient.date_of_birth && (
              <div className="profile-meta-item">
                <Calendar size={14} />
                <span>{calculateAge(patient.date_of_birth)} سنة</span>
              </div>
            )}
            {patient.address && (
              <div className="profile-meta-item">
                <MapPin size={14} />
                <span>{patient.address}</span>
              </div>
            )}
          </div>
        </div>
        <div className="profile-actions">
          <Link href={`/dashboard/appointments?action=add&patient=${id}`} className="btn btn-primary btn-sm">
            <CalendarPlus size={16} />
            حجز موعد
          </Link>
        </div>
      </div>

      {/* Upcoming Appointment */}
      {upcomingAppointment && (
        <div className="upcoming-widget" style={{ marginBottom: '24px' }}>
          <div className="upcoming-widget-label">الموعد القادم</div>
          <div className="upcoming-widget-name">{upcomingAppointment.service_name}</div>
          <div className="upcoming-widget-details">
            <span><Calendar size={14} /> {formatDateAr(upcomingAppointment.appointment_date)}</span>
            <span><Clock size={14} /> {formatTimeAr(upcomingAppointment.appointment_time)}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      {patient.notes && (
        <div className="card profile-section">
          <div className="card-header">
            <h3 className="card-title">
              <FileText size={18} /> ملاحظات
            </h3>
          </div>
          <div className="card-body">
            <p style={{ color: '#4B5563', lineHeight: 1.8 }}>{patient.notes}</p>
          </div>
        </div>
      )}

      {/* Appointment History */}
      <div className="profile-section">
        <h3 className="profile-section-title">
          <Calendar size={18} />
          سجل المواعيد ({patientAppointments.length})
        </h3>

        {patientAppointments.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <div className="empty-state-title">لا توجد مواعيد</div>
              <div className="empty-state-text">لم يتم حجز أي مواعيد لهذا المريض بعد</div>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الوقت</th>
                  <th>الطبيب</th>
                  <th>الخدمة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {patientAppointments.map(apt => (
                  <tr key={apt.id}>
                    <td>{formatDateAr(apt.appointment_date)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        {formatTimeAr(apt.appointment_time)}
                      </div>
                    </td>
                    <td>{apt.doctor_name}</td>
                    <td>{apt.service_name}</td>
                    <td>
                      <span className={`status-badge ${apt.status}`}>
                        <span className="status-badge-dot" />
                        {STATUS_LABELS[apt.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
