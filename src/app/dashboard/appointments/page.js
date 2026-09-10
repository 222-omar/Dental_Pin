'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  CalendarDays, List, Plus, ChevronRight, ChevronLeft, Clock, Phone,
  CheckCircle, XCircle, UserCheck, Stethoscope, LogOut as LogOutIcon,
  Ban, Edit2, RefreshCw, Search, Filter, CalendarPlus, User, DollarSign,
  ArrowRight, ArrowLeft
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { STATUS_LABELS, WEEKDAYS_AR, MONTHS_AR, DEFAULT_SERVICES, generateTimeSlots } from '@/lib/constants';
import { formatTimeAr, formatDateAr, getInitials, getAvatarColor, calculateAge } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function AppointmentsPage() {
  const {
    appointments, patients, services, addAppointment,
    updateAppointment, cancelAppointment, rescheduleAppointment,
    checkInAppointment, startTreatment, checkOutAppointment,
    confirmAppointment, markNoShow, getAvailableSlots, getAppointmentPrice
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
    gender: '', address: '',
  });
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [formErrors, setFormErrors] = useState({});

  const timeSlots = generateTimeSlots();

  // توليد قائمة متتالية من 35 يوماً (أسبوع قبل اليوم و4 أسابيع بعده)
  const calendarDays = useMemo(() => {
    const days = [];
    const base = new Date();
    for (let i = -7; i <= 28; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  // التحكم في السحب والتحريك بالماوس والتاتش (Draggable Strip)
  const stripRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // التمرير التلقائي إلى اليوم المختار عند التحميل
  useEffect(() => {
    if (stripRef.current) {
      const selectedIndex = calendarDays.findIndex(d =>
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      );
      if (selectedIndex !== -1) {
        const itemWidth = 96;
        const target = (selectedIndex * itemWidth) - (stripRef.current.clientWidth / 2) + 48;
        stripRef.current.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      }
    }
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - (stripRef.current ? stripRef.current.offsetLeft : 0));
    setScrollLeftState(stripRef.current ? stripRef.current.scrollLeft : 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !stripRef.current) return;
    e.preventDefault();
    const x = e.pageX - stripRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    stripRef.current.scrollLeft = scrollLeftState - walk;
  };

  const scrollDays = (direction) => {
    if (stripRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      stripRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const scrollToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    if (stripRef.current) {
      const todayIndex = calendarDays.findIndex(d =>
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
      if (todayIndex !== -1) {
        const itemWidth = 96;
        const target = (todayIndex * itemWidth) - (stripRef.current.clientWidth / 2) + 48;
        stripRef.current.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      }
    }
  };

  const selectedDateStr = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

  // مواعيد اليوم المحدد
  const dayAppointments = useMemo(() => {
    return appointments
      .filter(a => a.appointment_date === selectedDateStr)
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  }, [appointments, selectedDateStr]);

  // إجمالي الإيرادات المحصلة لمواعيد اليوم
  const dayCompletedRevenue = useMemo(() => {
    return dayAppointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (getAppointmentPrice ? getAppointmentPrice(a) : 200), 0);
  }, [dayAppointments, getAppointmentPrice]);

  // المواعيد المفلترة لنمط القائمة
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments].sort((a, b) =>
      new Date(b.appointment_date + 'T' + b.appointment_time) - new Date(a.appointment_date + 'T' + a.appointment_time)
    );
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    return filtered;
  }, [appointments, statusFilter]);

  // عدد مواعيد كل يوم
  const getAppointmentCount = (date) => {
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return appointments.filter(a => a.appointment_date === dateStr && a.status !== 'cancelled').length;
  };

  const today = useMemo(() => new Date(), []);
  const todayStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()), [today]);
  const todayStr = useMemo(() => `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`, [today]);

  const isToday = (d) => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const isSelected = (d) => d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
  
  const isPastDate = (d) => {
    const dayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return dayDate < todayStart;
  };

  const isSelectedDatePast = useMemo(() => {
    const sStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return sStart < todayStart;
  }, [selectedDate, todayStart]);

  // دالة لجلب عمر المريض لعرضه في الحجوزات
  const getPatientAge = (apt) => {
    if (apt.patient_age && Number(apt.patient_age) > 0) return `${apt.patient_age} سنة`;
    const p = patients.find(patient => patient.id === apt.patient_id || patient.name === apt.patient_name);
    if (p) {
      if (p.age && Number(p.age) > 0) return `${p.age} سنة`;
      if (p.date_of_birth) {
        const age = calculateAge(p.date_of_birth);
        if (age !== null && age > 0) return `${age} سنة`;
      }
    }
    return null;
  };

  // دالة لجلب النوع والعنوان للمريض في الحجوزات
  const getPatientDetails = (apt) => {
    const p = patients.find(patient => patient.id === apt.patient_id || patient.name === apt.patient_name);
    const gender = apt.patient_gender || p?.gender;
    const genderLabel = gender === 'male' ? 'ذكر' : gender === 'female' ? 'أنثى' : '';
    const address = apt.patient_address || p?.address || '';
    return { genderLabel, address };
  };

  // إرسال تذكير أو تأكيد الموعد للمريض عبر واتساب مباشرة وتلقائياً في الخلفية
  const sendWhatsAppReminder = (apt, openWindow = true) => {
    let cleanPhone = (apt.patient_phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '2' + cleanPhone;
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }
    const timeFormatted = apt.appointment_time ? formatTimeAr(apt.appointment_time) : '';
    const dateFormatted = apt.appointment_date ? formatDateAr(apt.appointment_date) : '';
    const text = `مرحباً ${apt.patient_name} 👋
تم تأكيد حجز موعدك بنجاح في عيادة Dental Pin (د. أحمد محمد) 🦷✨

🩺 الخدمة: ${apt.service_name || 'كشف أسنان'}
📅 تاريخ الموعد: ${dateFormatted}
⏰ الوقت المحدد: ${timeFormatted}
👨‍⚕️ الطبيب المعالج: د. أحمد محمد
📍 عنوان العيادة: المعادي، القاهرة
📞 هاتف وواتساب العيادة: 01143912497

نرجو الحضور قبل الموعد بـ 10 دقائق لتأكيد الدخول. نتمنى لك دوام الصحة والعافية!`;

    // إرسال تلقائي في الخلفية بدون أي أزرار عبر السيرفر
    fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanPhone,
        message: text,
        patientName: apt.patient_name
      })
    }).catch(e => console.log('WhatsApp background error:', e));

    if (openWindow) {
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  // Actions
  const handleAction = async (id, action) => {
    switch (action) {
      case 'confirm': {
        await confirmAppointment(id);
        const targetApt = appointments.find(a => a.id === id);
        if (targetApt?.patient_phone) {
          sendWhatsAppReminder(targetApt, false);
          addToast('تم تأكيد الموعد وإرسال رسالة التأكيد للمريض على واتساب تلقائياً', 'success');
        } else {
          addToast('تم تأكيد الموعد بنجاح', 'success');
        }
        break;
      }
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
        setConfirmDialog({ open: true, id });
        break;
      case 'reschedule':
        setRescheduleTarget(id);
        setRescheduleData({ date: '', time: '' });
        setShowRescheduleModal(true);
        break;
    }
  };

  const handleConfirmCancel = async () => {
    await cancelAppointment(confirmDialog.id);
    addToast('تم إلغاء الموعد', 'warning');
    setConfirmDialog({ open: false, id: null });
  };

  const handleReschedule = () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      addToast('الرجاء اختيار التاريخ والوقت', 'error');
      return;
    }
    const targetDate = new Date(rescheduleData.date + 'T00:00:00');
    if (targetDate < todayStart) {
      addToast('لا يمكن إعادة الجدولة إلى تاريخ منقضي', 'error');
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
    if (!formData.appointment_date) {
      errors.appointment_date = 'الرجاء اختيار التاريخ';
    } else {
      const aptDate = new Date(formData.appointment_date + 'T00:00:00');
      if (aptDate < todayStart) {
        errors.appointment_date = 'لا يمكن حجز موعد في تاريخ منقضي';
      }
    }
    if (!formData.appointment_time) errors.appointment_time = 'الرجاء اختيار الوقت';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAppointment = () => {
    if (!validateAddForm()) return;

    const patient = patients.find(p => p.id === formData.patient_id);
    const service = services.find(s => s.id === formData.service_id);

    // التحقق من أن التاريخ ليس في الماضي
    const aptDate = new Date(formData.appointment_date + 'T00:00:00');
    if (aptDate < todayStart) {
      addToast('لا يمكن حجز موعد في تاريخ منقضي', 'error');
      return;
    }

    // Check availability
    const bookedSlots = getAvailableSlots(formData.appointment_date);
    if (bookedSlots.includes(formData.appointment_time)) {
      addToast('هذا الموعد غير متاح، الرجاء اختيار وقت آخر', 'error');
      return;
    }

    const patientAge = patient?.age ?? (patient?.date_of_birth ? calculateAge(patient.date_of_birth) : null);
    const finalGender = formData.gender || patient?.gender || '';
    const finalAddress = formData.address || patient?.address || '';

    if (patient && (formData.gender || formData.address)) {
      updatePatient(patient.id, {
        gender: finalGender,
        address: finalAddress,
      });
    }

    addAppointment({
      patient_id: formData.patient_id,
      patient_name: patient.name,
      patient_phone: patient.phone,
      patient_age: patientAge,
      patient_gender: finalGender,
      patient_address: finalAddress,
      doctor_id: '1',
      doctor_name: 'د. أحمد محمد',
      service_id: formData.service_id,
      service_name: service.name,
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      notes: formData.notes,
      source: 'admin',
    });

    addToast('تم حجز الموعد بنجاح وإرسال رسالة التأكيد للمريض على واتساب تلقائياً', 'success');
    if (patient?.phone) {
      sendWhatsAppReminder({
        patient_name: patient.name,
        patient_phone: patient.phone,
        service_name: service.name,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
      }, false);
    }
    setShowAddModal(false);
    setFormData({ patient_id: '', service_id: '', appointment_date: '', appointment_time: '', notes: '', gender: '', address: '' });
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
        btns.push({ label: 'إنهاء ودفع', action: 'checkout', icon: LogOutIcon, cls: 'btn-success' });
        break;
    }
    if (!['completed', 'cancelled', 'no_show'].includes(apt.status)) {
      btns.push({ label: 'إعادة جدولة', action: 'reschedule', icon: RefreshCw, cls: 'btn-ghost' });
    }
    return btns;
  };

  const bookedSlotsForForm = formData.appointment_date ? getAvailableSlots(formData.appointment_date) : [];

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">الحجوزات والمواعيد</h1>
          <p className="text-sm text-gray" style={{ marginTop: '4px' }}>
            إدارة المواعيد اليومية، تسجيل الحضور، وتحصيل الخدمات
          </p>
        </div>
        <div className="page-header-actions">
          <div className="calendar-view-toggle">
            <button
              className={`calendar-view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays size={14} style={{ marginLeft: '4px' }} />
              التقويم
            </button>
            <button
              className={`calendar-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={14} style={{ marginLeft: '4px' }} />
              قائمة
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <>
          {/* شريط التحكم والتنقل في التقويم */}
          <div className="calendar-header" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn btn-icon btn-secondary"
                onClick={() => scrollDays('right')}
                title="الأيام السابقة"
              >
                <ChevronRight size={18} />
              </button>
              <span className="calendar-month" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', minWidth: '150px', textAlign: 'center' }}>
                {MONTHS_AR[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </span>
              <button
                className="btn btn-icon btn-secondary"
                onClick={() => scrollDays('left')}
                title="الأيام القادمة"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={scrollToToday}
                style={{ fontWeight: 600 }}
              >
                الذهاب لليوم
              </button>
            </div>
          </div>

          {/* شريط الأيام القابل للسحب بالماوس والتاتش (Draggable Strip) */}
          <div className="calendar-strip-container">
            <div
              ref={stripRef}
              className="calendar-strip-scroll"
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              {calendarDays.map((day, i) => {
                const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                const count = getAppointmentCount(day);
                const dayIsToday = isToday(day);
                const dayIsSelected = isSelected(day);
                const dayIsPast = isPastDate(day);

                return (
                  <div
                    key={i}
                    className={`calendar-day ${dayIsToday ? 'today' : ''} ${dayIsSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(new Date(day))}
                  >
                    <div className="calendar-day-header">
                      {dayNames[day.getDay()]}
                    </div>
                    <div className="calendar-day-number">
                      {day.getDate()}
                    </div>
                    <div style={{
                      fontSize: '0.68rem',
                      color: dayIsSelected ? '#0B8FAC' : '#94A3B8',
                      marginTop: '2px'
                    }}>
                      {MONTHS_AR[day.getMonth()]}
                    </div>
                    {dayIsPast ? (
                      <div style={{
                        fontSize: '0.65rem',
                        color: count > 0 ? '#64748B' : '#94A3B8',
                        marginTop: '4px',
                        fontWeight: 600
                      }}>
                        {count > 0 ? `مغلق (${count})` : 'مغلق'}
                      </div>
                    ) : count > 0 ? (
                      <div className="calendar-day-count">
                        {count} {count === 1 ? 'موعد' : 'مواعيد'}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '0.65rem',
                        color: '#94A3B8',
                        marginTop: '4px'
                      }}>
                        متاح
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* قسم مواعيد اليوم بتصميم سمبل وهادئ صفوف تحت بعض */}
          <div className="day-appointments-card" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', background: '#FFFFFF', overflow: 'hidden', marginTop: '16px' }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#FAFAFA'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={18} style={{ color: '#0B8FAC' }} />
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
                  مواعيد {formatDateAr(selectedDate)}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
                  ({dayAppointments.length})
                </span>
                {isSelectedDatePast && (
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#64748B',
                    backgroundColor: '#E2E8F0',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}>
                    يوم منقضي
                  </span>
                )}
              </div>

              <div>
                {isSelectedDatePast ? (
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#64748B',
                    backgroundColor: '#F1F5F9',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    border: '1px solid #E2E8F0'
                  }}>
                    مغلق للحجز (يوم منقضي)
                  </div>
                ) : (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, appointment_date: selectedDateStr }));
                      setShowAddModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={15} />
                    <span>إضافة موعد</span>
                  </button>
                )}
              </div>
            </div>

            {dayAppointments.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: isSelectedDatePast ? '0' : '14px' }}>
                  {isSelectedDatePast
                    ? 'اليوم مغلق — لا توجد مواعيد سابقة مسجلة لهذا اليوم، ولا يمكن إضافة حجوزات جديدة في تواريخ منقضية'
                    : 'لا توجد مواعيد مجدولة لهذا اليوم'
                  }
                </div>
                {!isSelectedDatePast && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, appointment_date: selectedDateStr }));
                      setShowAddModal(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>حجز موعد لهذا اليوم</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                {dayAppointments.map((apt, index) => {
                  const price = getAppointmentPrice ? getAppointmentPrice(apt) : 200;
                  const isLast = index === dayAppointments.length - 1;
                  return (
                    <div
                      key={apt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 20px',
                        borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                        gap: '16px',
                        flexWrap: 'wrap',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      {/* الوقت وبيانات المريض */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        {/* الوقت */}
                        <div style={{ minWidth: '75px' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', direction: 'ltr', textAlign: 'right' }}>
                            {formatTimeAr(apt.appointment_time)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            {apt.duration || 30} دقيقة
                          </div>
                        </div>

                        {/* المريض */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                              {apt.patient_name}
                            </span>
                            {getPatientAge(apt) && (
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#475569',
                                backgroundColor: '#F1F5F9',
                                padding: '1px 8px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                border: '1px solid #E2E8F0'
                              }}>
                                {getPatientAge(apt)}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                            {apt.patient_phone && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748B', direction: 'ltr' }}>
                                  {apt.patient_phone}
                                </span>
                                <button
                                  type="button"
                                  title="تذكير وتأكيد بالموعد عبر واتساب"
                                  onClick={() => sendWhatsAppReminder(apt)}
                                  style={{
                                    background: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                    color: '#15803D',
                                    borderRadius: '4px',
                                    padding: '1px 6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1 .587 1.772.883 2.806.883 3.182 0 5.768-2.587 5.768-5.766.001-3.182-2.585-5.766-5.768-5.766zm9.969 5.766c0 5.485-4.465 9.949-9.969 9.949-1.745 0-3.37-.45-4.787-1.237l-5.244 1.375 1.4-5.109c-.86-1.464-1.338-3.167-1.338-4.978 0-5.485 4.465-9.949 9.969-9.949 5.504 0 9.969 4.464 9.969 9.949z"/>
                                  </svg>
                                  واتساب
                                </button>
                              </div>
                            )}
                            {getPatientDetails(apt).genderLabel && (
                              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                • {getPatientDetails(apt).genderLabel}
                              </span>
                            )}
                            {getPatientDetails(apt).address && (
                              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                • {getPatientDetails(apt).address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* الجانب الأيسر: الخدمة والسعر بجانب الحالة والأزرار */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {/* الخدمة والتكلفة */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
                          <span style={{ color: '#334155' }}>
                            {apt.service_name || 'كشف أسنان'}
                          </span>
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>
                            {price.toLocaleString()} ج.م
                          </span>
                        </div>

                        {/* الحالة */}
                        <span style={{
                          fontSize: '0.8rem',
                          color: apt.status === 'completed' ? '#15803D' : apt.status === 'confirmed' ? '#1D4ED8' : '#475569',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          fontWeight: 500
                        }}>
                          {STATUS_LABELS[apt.status]}
                        </span>

                        {/* الأزرار */}
                        {getActionButtons(apt).length > 0 && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {getActionButtons(apt).map((btn, i) => (
                              <button
                                key={i}
                                className={`btn btn-sm ${btn.cls}`}
                                onClick={() => handleAction(apt.id, btn.action)}
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              >
                                <btn.icon size={13} />
                                <span>{btn.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* نمط القائمة (List View) */
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
                  <th>السعر</th>
                  <th>التاريخ</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state" style={{ padding: '40px' }}>
                        <div className="empty-state-title">لا توجد حجوزات مطابقة</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.slice(0, 25).map(apt => {
                    const price = getAppointmentPrice ? getAppointmentPrice(apt) : 200;
                    return (
                      <tr key={apt.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="avatar sm" style={{ background: getAvatarColor(apt.patient_name) }}>
                              {getInitials(apt.patient_name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{apt.patient_name}</span>
                                {getPatientAge(apt) && (
                                  <span style={{
                                    fontSize: '0.72rem',
                                    color: '#475569',
                                    backgroundColor: '#F1F5F9',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                    border: '1px solid #E2E8F0'
                                  }}>
                                    {getPatientAge(apt)}
                                  </span>
                                )}
                              </div>
                              {(getPatientDetails(apt).genderLabel || getPatientDetails(apt).address) && (
                                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                                  {[getPatientDetails(apt).genderLabel, getPatientDetails(apt).address].filter(Boolean).join(' • ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ direction: 'ltr', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={13} /> {apt.patient_phone}
                            </span>
                            {apt.patient_phone && (
                              <button
                                type="button"
                                title="تذكير وتأكيد بالموعد عبر واتساب"
                                onClick={() => sendWhatsAppReminder(apt)}
                                style={{
                                  background: '#F0FDF4',
                                  border: '1px solid #BBF7D0',
                                  color: '#15803D',
                                  borderRadius: '4px',
                                  padding: '1px 5px',
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}
                              >
                                واتساب
                              </button>
                            )}
                          </div>
                        </td>
                        <td>{apt.service_name}</td>
                        <td style={{ fontWeight: 700, color: '#0B8FAC' }}>{price.toLocaleString()} ج.م</td>
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
                                <span>{btn.label}</span>
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* مودال حجز موعد جديد */}
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
            onChange={(e) => {
              const selectedId = e.target.value;
              const p = patients.find(item => item.id === selectedId);
              setFormData(prev => ({
                ...prev,
                patient_id: selectedId,
                gender: p ? (p.gender || '') : prev.gender,
                address: p ? (p.address || '') : prev.address,
              }));
            }}
          >
            <option value="">اختر المريض</option>
            {patients.map(p => {
              const ageStr = p.age ? `${p.age} سنة` : (p.date_of_birth ? `${calculateAge(p.date_of_birth)} سنة` : '');
              return (
                <option key={p.id} value={p.id}>
                  {p.name} {ageStr ? `(${ageStr})` : ''} — {p.phone}
                </option>
              );
            })}
          </select>
          {formErrors.patient_id && <div className="form-error">{formErrors.patient_id}</div>}
        </div>

        {/* النوع والعنوان للمريض أثناء حجز الموعد */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">النوع</label>
            <select
              className="form-select"
              value={formData.gender || ''}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="">اختر النوع</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">العنوان</label>
            <input
              type="text"
              className="form-input"
              placeholder="مثال: المعادي، القاهرة"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">الخدمة المطلوبة *</label>
          <select
            className={`form-select ${formErrors.service_id ? 'error' : ''}`}
            value={formData.service_id}
            onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
          >
            <option value="">اختر الخدمة</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name} — {s.price} ج.م ({s.duration} دقيقة)</option>
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
              min={todayStr}
            />
            {formErrors.appointment_date && <div className="form-error">{formErrors.appointment_date}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">الوقت المتاح *</label>
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
          <label className="form-label">ملاحظات إضافية</label>
          <textarea
            className="form-input"
            placeholder="أي ملاحظات حول المريض أو الحالة..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>

      {/* مودال إعادة الجدولة */}
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
            min={todayStr}
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

      {/* دايالوج تأكيد الإلغاء */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, id: null })}
        onConfirm={handleConfirmCancel}
        title="إلغاء الموعد"
        message="هل أنت متأكد من إلغاء هذا الموعد؟ سيتم إشعار الطبيب وإلغاء الحجز."
        confirmText="نعم، إلغاء الموعد"
        cancelText="تراجع"
        variant="danger"
      />
    </>
  );
}
