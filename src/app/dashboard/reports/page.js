'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart3, Users, CalendarDays, TrendingUp, UserPlus,
  UserCheck, XCircle, Ban, CircleDollarSign, CreditCard,
  Layers, ArrowUpRight, Activity
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function ReportsPage() {
  const { appointments, patients, services, getAppointmentPrice, totalRevenue, todayRevenue } = useApp();
  const [dateFilter, setDateFilter] = useState('week');
  const chartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const chartInstance = useRef(null);
  const revenueChartInstance = useRef(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  // حساب الإحصائيات مع الفلتر الزمني
  const stats = useMemo(() => {
    const now = new Date();
    let startDate;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    const startStr = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;

    const filteredAppointments = appointments.filter(a => a.appointment_date >= startStr);
    const completedApts = filteredAppointments.filter(a => a.status === 'completed');

    // حساب الإيرادات للفترة المحددة
    const periodRevenue = completedApts.reduce((sum, a) => sum + getAppointmentPrice(a), 0);
    const averagePerVisit = completedApts.length > 0 ? Math.round(periodRevenue / completedApts.length) : 0;

    // حساب الإيرادات حسب نوع الخدمة
    const serviceBreakdown = {};
    completedApts.forEach(a => {
      const name = a.service_name || 'كشف أسنان';
      const price = getAppointmentPrice(a);
      if (!serviceBreakdown[name]) {
        serviceBreakdown[name] = { name, count: 0, total: 0 };
      }
      serviceBreakdown[name].count += 1;
      serviceBreakdown[name].total += price;
    });

    const serviceList = Object.values(serviceBreakdown).sort((a, b) => b.total - a.total);

    return {
      totalAppointments: filteredAppointments.length,
      completed: completedApts.length,
      cancelled: filteredAppointments.filter(a => a.status === 'cancelled').length,
      noShow: filteredAppointments.filter(a => a.status === 'no_show').length,
      periodRevenue,
      averagePerVisit,
      serviceList,
      totalPatients: patients.length,
      newPatients: patients.filter(p => p.status === 'new').length,
      returningPatients: patients.filter(p => p.status === 'active').length,
    };
  }, [appointments, patients, dateFilter, getAppointmentPrice]);

  // تجهيز ورسم الشارتين: شارت الإيرادات وشارت المواعيد
  useEffect(() => {
    // 7 أيام سابقة
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`);
    }

    const dayLabels = days.map(day => {
      const d = new Date(day);
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return dayNames[d.getDay()];
    });

    // 1. شارت الإيرادات اليومية (Financial Revenue Chart)
    if (revenueChartRef.current) {
      if (revenueChartInstance.current) {
        revenueChartInstance.current.destroy();
      }

      const dailyRevenue = days.map(day => {
        return appointments
          .filter(a => a.appointment_date === day && a.status === 'completed')
          .reduce((sum, a) => sum + getAppointmentPrice(a), 0);
      });

      revenueChartInstance.current = new Chart(revenueChartRef.current, {
        type: 'line',
        data: {
          labels: dayLabels,
          datasets: [
            {
              label: 'الإيرادات المحصلة (ج.م)',
              data: dailyRevenue,
              borderColor: '#0B8FAC',
              backgroundColor: 'rgba(11, 143, 172, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#0B8FAC',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return ` الإيراد: ${context.raw.toLocaleString()} ج.م`;
                }
              },
              titleFont: { family: 'Cairo' },
              bodyFont: { family: 'Cairo' },
              rtl: true
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Cairo', size: 12 } },
            },
            y: {
              beginAtZero: true,
              grid: { color: '#F3F4F6' },
              ticks: {
                font: { family: 'Cairo', size: 12 },
                callback: function (val) {
                  return val.toLocaleString() + ' ج.م';
                }
              },
            },
          },
        }
      });
    }

    // 2. شارت إحصائيات المواعيد
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const completedData = days.map(day =>
        appointments.filter(a => a.appointment_date === day && a.status === 'completed').length
      );
      const cancelledData = days.map(day =>
        appointments.filter(a => a.appointment_date === day && a.status === 'cancelled').length
      );
      const totalData = days.map(day =>
        appointments.filter(a => a.appointment_date === day).length
      );

      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: dayLabels,
          datasets: [
            {
              label: 'إجمالي المواعيد',
              data: totalData,
              backgroundColor: 'rgba(11, 143, 172, 0.25)',
              borderColor: '#0B8FAC',
              borderWidth: 2,
              borderRadius: 8,
              barPercentage: 0.6,
            },
            {
              label: 'مكتملة ومحصلة',
              data: completedData,
              backgroundColor: 'rgba(34, 197, 94, 0.25)',
              borderColor: '#22C55E',
              borderWidth: 2,
              borderRadius: 8,
              barPercentage: 0.6,
            },
            {
              label: 'ملغاة',
              data: cancelledData,
              backgroundColor: 'rgba(239, 68, 68, 0.25)',
              borderColor: '#EF4444',
              borderWidth: 2,
              borderRadius: 8,
              barPercentage: 0.6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                font: { family: 'Cairo', size: 12 },
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 16,
              },
            },
            tooltip: {
              titleFont: { family: 'Cairo' },
              bodyFont: { family: 'Cairo' },
              rtl: true
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Cairo', size: 12 } },
            },
            y: {
              beginAtZero: true,
              grid: { color: '#F3F4F6' },
              ticks: {
                font: { family: 'Cairo', size: 12 },
                stepSize: 1,
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
      if (revenueChartInstance.current) revenueChartInstance.current.destroy();
    };
  }, [appointments, dateFilter, getAppointmentPrice]);

  return (
    <>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">التقارير المالية والتشغيلية</h1>
          <p className="text-sm text-gray" style={{ marginTop: '4px' }}>
            تحليل دقيق للإيرادات، كفاءة الحجوزات ومعدلات تردد المرضى
          </p>
        </div>

        {/* Date Filter */}
        <div className="date-filter" style={{ margin: 0 }}>
          {[
            { value: 'today', label: 'اليوم' },
            { value: 'week', label: 'هذا الأسبوع' },
            { value: 'month', label: 'هذا الشهر' },
          ].map(f => (
            <button
              key={f.value}
              className={`date-filter-btn ${dateFilter === f.value ? 'active' : ''}`}
              onClick={() => setDateFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Highlight Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Period Revenue */}
        <div className="card" style={{ padding: '20px', borderRight: '4px solid #0B8FAC' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>إيرادات الفترة المحددة</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(11, 143, 172, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B8FAC' }}>
              <CircleDollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0B8FAC', letterSpacing: '-0.5px' }}>
            {stats.periodRevenue.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            تم تحصيلها من {stats.completed} كشف وزيارة مكتملة
          </div>
        </div>

        {/* Average per Visit */}
        <div className="card" style={{ padding: '20px', borderRight: '4px solid #10B981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>متوسط الإيراد لكل كشف</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            {stats.averagePerVisit.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            معدل الصرف للزيارة الواحدة
          </div>
        </div>

        {/* All-time Revenue */}
        <div className="card" style={{ padding: '20px', borderRight: '4px solid #6366F1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>إجمالي الإيراد التراكمي</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            {totalRevenue.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            إجمالي دخل العيادة منذ بدء التشغيل
          </div>
        </div>

        {/* Operational Stats */}
        <div className="card" style={{ padding: '20px', borderRight: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>إجمالي الحجوزات</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <CalendarDays size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            {stats.totalAppointments} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>موعد</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            {stats.completed} مكتمل • {stats.cancelled} ملغي
          </div>
        </div>
      </div>

      {/* Two Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Chart 1: Daily Revenue */}
        <div className="chart-container" style={{ margin: 0, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(11, 143, 172, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B8FAC' }}>
                <CircleDollarSign size={18} />
              </div>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '1rem' }}>حركة الإيرادات اليومية</h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>المبالغ المحصلة فعلياً لآخر 7 أيام</span>
              </div>
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <canvas ref={revenueChartRef} />
          </div>
        </div>

        {/* Chart 2: Appointments Status Breakdown */}
        <div className="chart-container" style={{ margin: 0, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}>
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '1rem' }}>حركة المواعيد والزيارات</h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>المقارنة بين الحجوزات والمكتمل والملغي</span>
              </div>
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      </div>

      {/* Service Revenue & Patient Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {/* Service Revenue Breakdown */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: '#0B8FAC' }} />
              <h3 className="card-title" style={{ margin: 0, fontSize: '0.95rem' }}>تفاصيل الدخل حسب الإجراء الطبي</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>الزيارات المكتملة</span>
          </div>
          <div className="card-body" style={{ padding: '0 20px 16px' }}>
            {stats.serviceList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '0.85rem' }}>
                لا توجد كشوفات مكتملة ومحصلة خلال الفترة المختارة
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {stats.serviceList.map((srv, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: '1px solid #F1F5F9'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}>{srv.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{srv.count} زيارة مكتملة</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0B8FAC' }}>
                        {srv.total.toLocaleString()} ج.م
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patient Statistics */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: '#6366F1' }} />
              <h3 className="card-title" style={{ margin: 0, fontSize: '0.95rem' }}>إحصائيات وقاعدة المرضى</h3>
            </div>
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
              <div style={{ padding: '14px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>{stats.totalPatients}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>إجمالي المرضى</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB' }}>{stats.newPatients}</div>
                <div style={{ fontSize: '0.78rem', color: '#2563EB', marginTop: '4px' }}>مرضى جدد</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #D1FAE5' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>{stats.returningPatients}</div>
                <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '4px' }}>مرضى مستمرون</div>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '14px', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
              <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: 1.5 }}>
                يتم احتساب إيراد كل كشف تلقائياً بمجرد ضغط <strong>إنهاء ودفع</strong> في شاشة الاستقبال، مما يضمن دقة الحسابات المالية فورياً.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
