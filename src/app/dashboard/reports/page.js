'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart3, Users, CalendarDays, TrendingUp, UserPlus, UserCheck, XCircle, Ban } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function ReportsPage() {
  const { appointments, patients } = useApp();
  const [dateFilter, setDateFilter] = useState('week');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  // Calculate stats
  const stats = useMemo(() => {
    let filteredAppointments = appointments;
    let filteredPatients = patients;

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

    filteredAppointments = appointments.filter(a => a.appointment_date >= startStr);

    return {
      totalAppointments: filteredAppointments.length,
      completed: filteredAppointments.filter(a => a.status === 'completed').length,
      cancelled: filteredAppointments.filter(a => a.status === 'cancelled').length,
      noShow: filteredAppointments.filter(a => a.status === 'no_show').length,
      totalPatients: patients.length,
      newPatients: patients.filter(p => p.status === 'new').length,
      returningPatients: patients.filter(p => p.status === 'active').length,
    };
  }, [appointments, patients, dateFilter]);

  // Chart
  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    // Generate data per day
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`);
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

    const dayLabels = days.map(day => {
      const d = new Date(day);
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return dayNames[d.getDay()];
    });

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [
          {
            label: 'إجمالي',
            data: totalData,
            backgroundColor: 'rgba(11, 143, 172, 0.2)',
            borderColor: '#0B8FAC',
            borderWidth: 2,
            borderRadius: 8,
            barPercentage: 0.6,
          },
          {
            label: 'مكتمل',
            data: completedData,
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: '#22C55E',
            borderWidth: 2,
            borderRadius: 8,
            barPercentage: 0.6,
          },
          {
            label: 'ملغي',
            data: cancelledData,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
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

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [appointments, dateFilter]);

  const reportCards = [
    { label: 'إجمالي الحجوزات', value: stats.totalAppointments, icon: CalendarDays, color: '#0B8FAC' },
    { label: 'مكتملة', value: stats.completed, icon: UserCheck, color: '#22C55E' },
    { label: 'ملغاة', value: stats.cancelled, icon: XCircle, color: '#EF4444' },
    { label: 'لم يحضر', value: stats.noShow, icon: Ban, color: '#6B7280' },
    { label: 'إجمالي المرضى', value: stats.totalPatients, icon: Users, color: '#7C3AED' },
    { label: 'مرضى جدد', value: stats.newPatients, icon: UserPlus, color: '#2563EB' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">التقارير</h1>
          <p className="text-sm text-gray" style={{ marginTop: '4px' }}>
            إحصائيات ومؤشرات أداء العيادة
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="date-filter">
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

      {/* Report Cards */}
      <div className="reports-grid">
        {reportCards.map((card, i) => (
          <div key={i} className="report-stat-card">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <card.icon size={24} style={{ color: card.color }} />
            </div>
            <div className="report-stat-value">{card.value}</div>
            <div className="report-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="chart-container">
        <h3 className="card-title" style={{ marginBottom: '20px' }}>
          <BarChart3 size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
          الحجوزات خلال الأسبوع
        </h3>
        <div style={{ height: '320px' }}>
          <canvas ref={chartRef} />
        </div>
      </div>

      {/* Patient Stats */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">إحصائيات المرضى</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>{stats.totalPatients}</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>إجمالي المرضى</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563EB' }}>{stats.newPatients}</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>مرضى جدد</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22C55E' }}>{stats.returningPatients}</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>مرضى عائدون</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
