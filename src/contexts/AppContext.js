'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { mockPatients, mockAppointments, mockNotifications } from '@/lib/mockData';
import { DEFAULT_SERVICES } from '@/lib/constants';
import { calculateAge } from '@/lib/utils';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [patients, setPatients] = useState(mockPatients);
  const [appointments, setAppointments] = useState(mockAppointments);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [usingMockData, setUsingMockData] = useState(true);

  // ---- تحميل البيانات من Supabase ----
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // فحص وجود الجداول
      const [
        { data: patientsData, error: pErr },
        { data: appointmentsData, error: aErr },
        { data: notificationsData, error: nErr },
        { data: servicesData, error: sErr }
      ] = await Promise.all([
        supabase.from('patients').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').order('appointment_date', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('services').select('*').order('price', { ascending: true })
      ]);

      if (pErr || aErr) {
        // الجداول غير موجودة بعد - استخدام البيانات التجريبية
        console.log('Supabase tables not found or error, using mock data:', pErr?.message || aErr?.message);
        setUsingMockData(true);
        setIsSupabaseConnected(true);
      } else {
        // الجداول موجودة وجلب البيانات بنجاح
        setUsingMockData(false);
        setIsSupabaseConnected(true);
        if (patientsData && patientsData.length > 0) {
          const mapped = patientsData.map(p => ({
            ...p,
            age: p.age ?? (p.date_of_birth ? calculateAge(p.date_of_birth) : null)
          }));
          setPatients(mapped);
        }
        if (appointmentsData && appointmentsData.length > 0) setAppointments(appointmentsData);
        if (notificationsData && notificationsData.length > 0) setNotifications(notificationsData);
        if (servicesData && servicesData.length > 0) setServices(servicesData);
      }
    } catch (err) {
      console.warn('Could not connect to Supabase, falling back to mock data:', err);
      setUsingMockData(true);
      setIsSupabaseConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // إعداد اشتراك Realtime للتحديث المباشر عند تغيير البيانات في Supabase
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // ---- Patients ----
  const addPatient = useCallback(async (patient) => {
    let dob = patient.date_of_birth;
    if (!dob && patient.age) {
      dob = `${new Date().getFullYear() - Number(patient.age)}-01-01`;
    }
    const computedAge = patient.age ? Number(patient.age) : (dob ? calculateAge(dob) : null);

    if (!usingMockData) {
      try {
        const { data, error } = await supabase.from('patients').insert([{
          name: patient.name,
          phone: patient.phone,
          date_of_birth: dob || null,
          gender: patient.gender || 'male',
          address: patient.address || '',
          notes: patient.notes || '',
          status: 'new',
        }]).select().single();

        if (!error && data) {
          const item = { ...data, age: computedAge, date_of_birth: dob || data.date_of_birth };
          setPatients(prev => [item, ...prev]);
          return item;
        }
      } catch (e) {
        console.error('Error adding patient to Supabase:', e);
      }
    }

    const newPatient = {
      ...patient,
      id: (Date.now() + Math.random()).toString(),
      age: computedAge,
      date_of_birth: dob || null,
      created_at: new Date().toISOString(),
      lastVisit: null,
      nextAppointment: null,
      status: 'new',
    };
    setPatients(prev => [newPatient, ...prev]);
    return newPatient;
  }, [usingMockData]);

  const updatePatient = useCallback(async (id, data) => {
    let dob = data.date_of_birth;
    if (!dob && data.age) {
      dob = `${new Date().getFullYear() - Number(data.age)}-01-01`;
    }
    const computedAge = data.age ? Number(data.age) : (dob ? calculateAge(dob) : null);

    if (!usingMockData) {
      try {
        await supabase.from('patients').update({
          name: data.name,
          phone: data.phone,
          date_of_birth: dob || null,
          gender: data.gender || 'male',
          address: data.address || '',
          notes: data.notes || '',
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch (e) {
        console.error('Error updating patient in Supabase:', e);
      }
    }
    setPatients(prev => prev.map(p => p.id === id ? {
      ...p,
      ...data,
      date_of_birth: dob || p.date_of_birth,
      age: computedAge
    } : p));
  }, [usingMockData]);

  const deletePatient = useCallback(async (id) => {
    if (!usingMockData) {
      try {
        await supabase.from('patients').delete().eq('id', id);
        await supabase.from('appointments').delete().eq('patient_id', id);
      } catch (e) {
        console.error('Error deleting patient from Supabase:', e);
      }
    }
    setPatients(prev => prev.filter(p => p.id !== id));
    setAppointments(prev => prev.filter(a => a.patient_id !== id));
  }, [usingMockData]);

  const getPatient = useCallback((id) => {
    return patients.find(p => p.id === id);
  }, [patients]);

  // ---- Services & Financial Helpers ----
  const getAppointmentPrice = useCallback((apt) => {
    if (!apt) return 0;
    if (apt.paid_amount) return Number(apt.paid_amount);
    if (apt.price) return Number(apt.price);
    const s = services.find(srv => srv.id === apt.service_id || srv.name === apt.service_name);
    return s ? Number(s.price) : 200;
  }, [services]);

  // ---- Notifications ----
  const addNotification = useCallback(async (notification) => {
    if (!usingMockData) {
      try {
        const { data, error } = await supabase.from('notifications').insert([{
          type: notification.type,
          title: notification.title,
          message: notification.message,
          is_read: false,
          related_appointment_id: notification.related_appointment_id || null,
        }]).select().single();

        if (!error && data) {
          setNotifications(prev => [data, ...prev]);
          return data;
        }
      } catch (e) {
        console.error('Error adding notification to Supabase:', e);
      }
    }

    const newNotification = {
      ...notification,
      id: (Date.now() + Math.random()).toString(),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, [usingMockData]);

  const markNotificationRead = useCallback(async (id) => {
    if (!usingMockData) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, is_read: true } : n
    ));
  }, [usingMockData]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!usingMockData) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      } catch (e) {
        console.error(e);
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [usingMockData]);

  // ---- Appointments ----
  const addAppointment = useCallback(async (appointment) => {
    if (!usingMockData) {
      try {
        const { data, error } = await supabase.from('appointments').insert([{
          patient_id: appointment.patient_id,
          patient_name: appointment.patient_name,
          patient_phone: appointment.patient_phone,
          doctor_id: appointment.doctor_id || 'd0000000-0000-0000-0000-000000000001',
          doctor_name: appointment.doctor_name || 'د. أحمد محمد',
          service_id: appointment.service_id,
          service_name: appointment.service_name,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          status: appointment.status || 'pending',
          notes: appointment.notes || '',
          source: appointment.source || 'admin',
        }]).select().single();

        if (!error && data) {
          setAppointments(prev => [data, ...prev]);
          if (appointment.source === 'online') {
            await addNotification({
              type: 'new_booking',
              title: 'حجز إلكتروني جديد',
              message: `تم استلام طلب حجز جديد من ${appointment.patient_name} — ${appointment.service_name}`,
              related_appointment_id: data.id,
            });
          }
          return data;
        }
      } catch (e) {
        console.error('Error adding appointment to Supabase:', e);
      }
    }

    const newAppointment = {
      ...appointment,
      id: (Date.now() + Math.random()).toString(),
      status: appointment.status || 'pending',
      source: appointment.source || 'admin',
      checked_in_at: null,
      checked_out_at: null,
      created_at: new Date().toISOString(),
    };
    setAppointments(prev => [newAppointment, ...prev]);

    if (appointment.source === 'online') {
      addNotification({
        type: 'new_booking',
        title: 'حجز إلكتروني جديد',
        message: `تم استلام طلب حجز جديد من ${appointment.patient_name} — ${appointment.service_name}`,
      });
    }

    return newAppointment;
  }, [usingMockData]);

  const updateAppointment = useCallback(async (id, data) => {
    if (!usingMockData) {
      try {
        await supabase.from('appointments').update({
          ...data,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch (e) {
        console.error('Error updating appointment in Supabase:', e);
      }
    }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, [usingMockData]);

  const cancelAppointment = useCallback(async (id) => {
    if (!usingMockData) {
      try {
        await supabase.from('appointments').update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch (e) {
        console.error('Error cancelling appointment in Supabase:', e);
      }
    }
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        addNotification({
          type: 'cancelled',
          title: 'إلغاء موعد',
          message: `تم إلغاء موعد ${a.patient_name} — ${a.service_name}`,
        });
        return { ...a, status: 'cancelled' };
      }
      return a;
    }));
  }, [usingMockData]);

  const rescheduleAppointment = useCallback(async (id, newDate, newTime) => {
    if (!usingMockData) {
      try {
        await supabase.from('appointments').update({
          appointment_date: newDate,
          appointment_time: newTime,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch (e) {
        console.error('Error rescheduling appointment in Supabase:', e);
      }
    }
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        addNotification({
          type: 'rescheduled',
          title: 'إعادة جدولة',
          message: `تمت إعادة جدولة موعد ${a.patient_name} إلى ${newDate} الساعة ${newTime}`,
        });
        return { ...a, appointment_date: newDate, appointment_time: newTime, updated_at: new Date().toISOString() };
      }
      return a;
    }));
  }, [usingMockData]);

  const checkInAppointment = useCallback(async (id) => {
    const timestamp = new Date().toISOString();
    if (!usingMockData) {
      try {
        await supabase.from('appointments').update({
          status: 'arrived',
          checked_in_at: timestamp,
          updated_at: timestamp,
        }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'arrived', checked_in_at: timestamp } : a
    ));
  }, [usingMockData]);

  const startTreatment = useCallback(async (id) => {
    const timestamp = new Date().toISOString();
    if (!usingMockData) {
      try {
        await supabase.from('appointments').update({
          status: 'in_treatment',
          updated_at: timestamp,
        }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'in_treatment' } : a
    ));
  }, [usingMockData]);

  const checkOutAppointment = useCallback(async (id, customPrice) => {
    const timestamp = new Date().toISOString();
    const targetApt = appointments.find(a => a.id === id);
    const amount = customPrice !== undefined ? Number(customPrice) : (targetApt ? getAppointmentPrice(targetApt) : 200);

    if (!usingMockData) {
      try {
        await supabase.from('appointments').update({
          status: 'completed',
          checked_out_at: timestamp,
          updated_at: timestamp,
        }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'completed', checked_out_at: timestamp, paid_amount: amount } : a
    ));

    if (targetApt) {
      addNotification({
        type: 'upcoming',
        title: 'اكتمال زيارة وتحصيل الرسوم',
        message: `تم إنهاء موعد ${targetApt.patient_name} وتم تسجيل تحصيل ${amount} ج.م مقابل ${targetApt.service_name || 'الكشف'}`,
        related_appointment_id: id,
      });
    }

    return amount;
  }, [usingMockData, appointments, getAppointmentPrice, addNotification]);

  const markNoShow = useCallback(async (id) => {
    const timestamp = new Date().toISOString();
    if (!usingMockData) {
      try {
        await supabase.from('appointments').update({
          status: 'no_show',
          updated_at: timestamp,
        }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'no_show' } : a
    ));
  }, [usingMockData]);

  const confirmAppointment = useCallback(async (id) => {
    const timestamp = new Date().toISOString();
    if (!usingMockData) {
      try {
        await supabase.from('appointments').update({
          status: 'confirmed',
          updated_at: timestamp,
        }).eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'confirmed' } : a
    ));
  }, [usingMockData]);

  const getPatientAppointments = useCallback((patientId) => {
    return appointments.filter(a => a.patient_id === patientId).sort((a, b) =>
      new Date(b.appointment_date + 'T' + b.appointment_time) - new Date(a.appointment_date + 'T' + a.appointment_time)
    );
  }, [appointments]);

  const getAvailableSlots = useCallback((date, doctorId = '1') => {
    const bookedSlots = appointments
      .filter(a => a.appointment_date === date && a.doctor_id === doctorId && a.status !== 'cancelled')
      .map(a => a.appointment_time);
    return bookedSlots;
  }, [appointments]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // الحسابات المالية (الإيرادات)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const todayRevenue = appointments
    .filter(a => a.appointment_date === todayStr && a.status === 'completed')
    .reduce((sum, a) => sum + getAppointmentPrice(a), 0);

  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + getAppointmentPrice(a), 0);

  return (
    <AppContext.Provider value={{
      // Status & Sync
      loading,
      isSupabaseConnected,
      usingMockData,
      fetchData,
      // Patients
      patients, addPatient, updatePatient, deletePatient, getPatient,
      // Appointments
      appointments, addAppointment, updateAppointment, cancelAppointment,
      rescheduleAppointment, checkInAppointment, startTreatment,
      checkOutAppointment, markNoShow, confirmAppointment,
      getPatientAppointments, getAvailableSlots,
      // Notifications
      notifications, addNotification, markNotificationRead,
      markAllNotificationsRead, unreadCount,
      // Services & Finances
      services,
      getAppointmentPrice,
      todayRevenue,
      totalRevenue,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
