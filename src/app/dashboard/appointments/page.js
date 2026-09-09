'use client';

import { useState, useMemo } from 'react';
import {
  CalendarDays, List, Plus, ChevronRight, ChevronLeft, Clock, Phone,
  CheckCircle, XCircle, UserCheck, Stethoscope, LogOut as LogOutIcon,
  Ban, Edit2, RefreshCw, Search, Filter, CalendarPlus
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { STATUS_LABELS, WEEKDAYS_AR, MONTHS_AR, DEFAULT_SERVICES, generateTimeSlots } from '@/lib/constants';
import { formatTimeAr, formatDateAr, getInitials, getAvatarColor } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function AppointmentsPage() {
  const {
    appointments, patients, services, addAppointment,
    updateAppointment, cancelAppointment, rescheduleAppointment,
    checkInAppointment, startTreatment, checkOutAppointment,
    confirmAppointment, markNoShow, getAvailableSlots
  } = useApp();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState('calendar'); // calendar | list
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    patient_id: '', service_id: '', appointment_date: '', appointment_time: '', notes: '',
  });
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [formErrors, setFormErrors] = useState({});

  const timeSlots = generateTimeSlots();

  // Week calculation
  const getWeekDays = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day + 1) % 7; // Start from Saturday
    const saturday = new Date(d);
    saturday.setDate(d.getDate() - diff);
    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(saturday);
      dayDate.setDate(saturday.getDate() + i);
      return dayDate;
    });
  };

  const weekDays = getWeekDays(selectedDate);
  const selectedDateStr = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

  // Appointments for selected date
  const dayAppointments = useMemo(() => {
    return appointments
      .filter(a => a.appointment_date === selectedDateStr)
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  }, [appointments, selectedDateStr]);

  // All filtered appointments for list view
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments].sort((a, b) =>
      new Date(b.appointment_date + 'T' + b.appointment_time) - new Date(a.appointment_date + 'T' + a.appointment_time)
    );
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    return filtered;
  }, [appointments, statusFilter]);

  // Count appointments per day in calendar
  const getAppointmentCount = (date) => {
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return appointments.filter(a => a.appointment_date === dateStr && a.status !== 'cancelled').length;
  };

  const today = new Date();
  const isToday = (d) => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const isSelected = (d) => d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();

  const prevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const nextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  // Actions
  const handleAction = (id, action) => {
    switch (action) {
      case 'confirm': confirmAppointment(id); addToast('تم تأكيد الموعد', 'success'); break;
      case 'checkin': checkInAppointment(id); addToast('تم تسجيل حضور المريض', 'success'); break;
      case 'start': startTreatment(id); addToast('تم بدء الكشف', 'success'); break;
      case 'checkout': checkOutAppointment(id); addToast('تم إنهاء الزيارة', 'success'); break;
      case 'noshow': markNoShow(id); addToast('تم تسجيل عدم الحضور', 'warning'); break;
      case 'cancel': setConfirmDialog({ open: true, id }); break;
      case 'reschedule':
        setRescheduleTarget(id);
        setRescheduleData({ date: '', time: '' });
        setShowRescheduleModal(true);
        break;
    }
  };

  const handleConfirmCancel = () => {
    cancelAppointment(confirmDialog.id);
    addToast('تم إلغاء الموعد', 'warning');
    setConfirmDialog({ open: false, id: null });
  };

  const handleReschedule = () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      addToast('الرجاء اختيار التاريخ والوقت', 'error');
      return;
    }
    rescheduleAppointment(rescheduleTarget, rescheduleData.date, rescheduleData.time);
    addToast('تمت إعادة جدولة الموعد بنجاح', 'success');
    setShowRescheduleModal(false);
  };

  // Add Appointment
  const validateAddForm = () => {
    const errors = {};
    if (!formData.patient_id) errors.patient_id = 'الرجاء اختيار المريض';
    if (!formData.service_id) errors.service_id = 'الرجاء اختيار الخدمة';
    if (!formData.appointment_date) errors.appointment_date = 'الرجاء اختيار التاريخ';
    if (!formData.appointment_time) errors.appointment_time = 'الرجاء اختيار الوقت';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAppointment = () => {
    if (!validateAddForm()) return;

    const patient = patients.find(p => p.id === formData.patient_id);
    const service = services.find(s => s.id === formData.service_id);

    // Check availability
    const bookedSlots = getAvailableSlots(formData.appointment_date);
    if (bookedSlots.includes(formData.appointment_time)) {
      addToast('هذا الموعد غير متاح، الرجاء اختيار وقت آخر', 'error');
      return;
    }

    addAppointment({
      patient_id: formData.patient_id,
      patient_name: patient.name,
      patient_phone: patient.phone,
      doctor_id: '1',
      doctor_name: 'د. أحمد محمد',
      service_id: formData.service_id,
      service_name: service.name,
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      notes: formData.notes,
      source: 'admin',
    });

    addToast('تم حجز الموعد بنجاح', 'success');
    setShowAddModal(false);
    setFormData({ patient_id: '', service_id: '', appointment_date: '', appointment_time: '', notes: '' });
  };

  const getActionButtons = (apt) => {
    const btns = [];
    switch (apt.status) {
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
    if (!['completed', 'cancelled', 'no_show'].includes(apt.status)) {
      btns.push({ label: 'إعادة جدولة', action: 'reschedule', icon: RefreshCw, cls: 'btn-ghost' });
    }
    return btns;
  };

  // Available time slots for form
  const bookedSlotsForForm = formData.appointment_date ? getAvailableSlots(formData.appointment_date) : [];

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">الحجوزات</h1>
          <p className="text-sm text-gray" style={{ marginTop: '4px' }}>
            إدارة مواعيد العيادة
          </p>
        </div>
        <div className="page-header-actions">
          <div className="calendar-view-toggle">
            <button
              className={`calendar-view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays size={14} style={{ marginLeft: '4px' }} />
              أسبوعي
            </button>
            <button
              className={`calendar-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={14} style={{ marginLeft: '4px' }} />
              قائمة
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <CalendarPlus size={18} />
            حجز موعد
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <>
          {/* Calendar Navigation */}
          <div className="calendar-header">
            <div className="calendar-nav">
              <button className="btn btn-icon btn-secondary" onClick={nextWeek}>
                <ChevronRight size={18} />
              </button>
              <span className="calendar-month">
                {MONTHS_AR[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </span>
              <button className="btn btn-icon btn-secondary" onClick={prevWeek}>
                <ChevronLeft size={18} />
              </button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(new Date())}>
              اليوم
            </button>
          </div>

          {/* Week Grid */}
          <div className="calendar-week-grid">
            {weekDays.map((day, i) => {
              const dayNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
              const count = getAppointmentCount(day);
              return (
                <div
                  key={i}
                  className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(new Date(day))}
                >
                  <div className="calendar-day-header" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                    {dayNames[i]}
                  </div>
                  <div className="calendar-day-number">{day.getDate()}</div>
                  {count > 0 && <div className="calendar-day-count">{count}</div>}
                </div>
              );
            })}
          </div>

          {/* Day Appointments */}
          <div className="card" style={{ overflow: 'hidden', marginTop: '16px' }}>
            <div className="card-header">
              <h3 className="card-title">
                مواعيد {formatDateAr(selectedDate)} ({dayAppointments.length})
              </h3>
            </div>

            {dayAppointments.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 24px' }}>
                <div className="empty-state-icon"><CalendarDays size={32} /></div>
                <div className="empty-state-title">لا توجد مواعيد</div>
                <div className="empty-state-text">لم يتم جدولة مواعيد لهذا اليوم</div>
              </div>
            ) : (
              dayAppointments.map(apt => (
                <div key={apt.id} className="appointment-slot">
                  {/* Time */}
                  <div className="appointment-slot-time">
                    <Clock size={14} />
                    {formatTimeAr(apt.appointment_time)}
                  </div>

                  {/* Status */}
                  <span className={`status-badge ${apt.status}`}>
                    <span className="status-badge-dot" />
                    {STATUS_LABELS[apt.status]}
                  </span>

                  {/* Patient */}
                  <div className="appointment-slot-patient">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="avatar sm" style={{ background: getAvatarColor(apt.patient_name) }}>
                        {getInitials(apt.patient_name)}
                      </div>
                      <div>
                        <div className="appointment-slot-patient-name">{apt.patient_name}</div>
                        <div className="appointment-slot-note">{apt.service_name}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    {getActionButtons(apt).map((btn, i) => (
                      <button
                        key={i}
                        className={`btn btn-sm ${btn.cls}`}
                        onClick={() => handleAction(apt.id, btn.action)}
                        title={btn.label}
                      >
                        <btn.icon size={14} />
                        <span className="hide-mobile">{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* List View */
        <>
          <div className="filter-bar">
            {['all', 'pending', 'confirmed', 'arrived', 'in_treatment', 'completed', 'cancelled', 'no_show'].map(status => (
              <button
                key={status}
                className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'الكل' : STATUS_LABELS[status]}
              </button>
            ))}
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>المريض</th>
                  <th>الهاتف</th>
                  <th>الخدمة</th>
                  <th>التاريخ</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state" style={{ padding: '40px' }}>
                        <div className="empty-state-title">لا توجد حجوزات</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.slice(0, 20).map(apt => (
                    <tr key={apt.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="avatar sm" style={{ background: getAvatarColor(apt.patient_name) }}>
                            {getInitials(apt.patient_name)}
                          </div>
                          <span style={{ fontWeight: 600 }}>{apt.patient_name}</span>
                        </div>
                      </td>
                      <td style={{ direction: 'ltr', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
                          <Phone size={13} /> {apt.patient_phone}
                        </div>
                      </td>
                      <td>{apt.service_name}</td>
                      <td>{formatDateAr(apt.appointment_date)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {formatTimeAr(apt.appointment_time)}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${apt.status}`}>
                          <span className="status-badge-dot" />
                          {STATUS_LABELS[apt.status]}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {getActionButtons(apt).slice(0, 2).map((btn, i) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Appointment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFormErrors({}); }}
        title="حجز موعد جديد"
        size="lg"
        footer={
          <>
            <button className="btn btn-primary" onClick={handleAddAppointment}>حجز الموعد</button>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">المريض *</label>
          <select
            className={`form-select ${formErrors.patient_id ? 'error' : ''}`}
            value={formData.patient_id}
            onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
          >
            <option value="">اختر المريض</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>
            ))}
          </select>
          {formErrors.patient_id && <div className="form-error">{formErrors.patient_id}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">الخدمة *</label>
          <select
            className={`form-select ${formErrors.service_id ? 'error' : ''}`}
            value={formData.service_id}
            onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
          >
            <option value="">اختر الخدمة</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name} — {s.price} ج.م</option>
            ))}
          </select>
          {formErrors.service_id && <div className="form-error">{formErrors.service_id}</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">التاريخ *</label>
            <input
              type="date"
              className={`form-input ${formErrors.appointment_date ? 'error' : ''}`}
              value={formData.appointment_date}
              onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value, appointment_time: '' })}
              min={new Date().toISOString().split('T')[0]}
            />
            {formErrors.appointment_date && <div className="form-error">{formErrors.appointment_date}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">الوقت *</label>
            <select
              className={`form-select ${formErrors.appointment_time ? 'error' : ''}`}
              value={formData.appointment_time}
              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
              disabled={!formData.appointment_date}
            >
              <option value="">اختر الوقت</option>
              {timeSlots.map(slot => (
                <option
                  key={slot.value}
                  value={slot.value}
                  disabled={bookedSlotsForForm.includes(slot.value)}
                >
                  {slot.label} {bookedSlotsForForm.includes(slot.value) ? '(محجوز)' : ''}
                </option>
              ))}
            </select>
            {formErrors.appointment_time && <div className="form-error">{formErrors.appointment_time}</div>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">ملاحظات</label>
          <textarea
            className="form-input"
            placeholder="أي ملاحظات..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="إعادة جدولة الموعد"
        footer={
          <>
            <button className="btn btn-primary" onClick={handleReschedule}>تأكيد إعادة الجدولة</button>
            <button className="btn btn-secondary" onClick={() => setShowRescheduleModal(false)}>إلغاء</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">التاريخ الجديد</label>
          <input
            type="date"
            className="form-input"
            value={rescheduleData.date}
            onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value, time: '' })}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="form-group">
          <label className="form-label">الوقت الجديد</label>
          <select
            className="form-select"
            value={rescheduleData.time}
            onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
            disabled={!rescheduleData.date}
          >
            <option value="">اختر الوقت</option>
            {timeSlots.map(slot => {
              const booked = rescheduleData.date ? getAvailableSlots(rescheduleData.date) : [];
              return (
                <option key={slot.value} value={slot.value} disabled={booked.includes(slot.value)}>
                  {slot.label} {booked.includes(slot.value) ? '(محجوز)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      </Modal>

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, id: null })}
        onConfirm={handleConfirmCancel}
        title="إلغاء الموعد"
        message="هل أنت متأكد من إلغاء هذا الموعد؟"
        confirmText="نعم، إلغاء الموعد"
        cancelText="تراجع"
        variant="danger"
      />
    </>
  );
}
