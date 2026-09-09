'use client';

import { Settings, User, Clock, Stethoscope } from 'lucide-react';
import { DEFAULT_DOCTOR, DEFAULT_SERVICES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

export default function SettingsPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">الإعدادات</h1>
          <p className="text-sm text-gray" style={{ marginTop: '4px' }}>
            إعدادات العيادة والنظام
          </p>
        </div>
      </div>

      {/* Clinic Info */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Stethoscope size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
            بيانات العيادة
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div className="form-label">اسم العيادة</div>
              <div style={{ fontWeight: 600, color: '#111827' }}>Dental Pin</div>
            </div>
            <div>
              <div className="form-label">ساعات العمل</div>
              <div style={{ fontWeight: 600, color: '#111827' }}>9:00 ص — 9:00 م</div>
            </div>
            <div>
              <div className="form-label">أيام العمل</div>
              <div style={{ fontWeight: 600, color: '#111827' }}>السبت إلى الخميس</div>
            </div>
            <div>
              <div className="form-label">مدة الموعد</div>
              <div style={{ fontWeight: 600, color: '#111827' }}>30 دقيقة</div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <User size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
            الطبيب
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #0D9488, #0E7490)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '1.25rem',
            }}>
              د
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#111827' }}>{DEFAULT_DOCTOR.name}</div>
              <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>{DEFAULT_DOCTOR.specialization}</div>
              <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '2px', direction: 'ltr', textAlign: 'right' }}>
                {DEFAULT_DOCTOR.phone}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
            الخدمات
          </h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>الخدمة</th>
                <th>الوصف</th>
                <th>المدة</th>
                <th>السعر</th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_SERVICES.map(service => (
                <tr key={service.id}>
                  <td style={{ fontWeight: 600 }}>{service.name}</td>
                  <td style={{ color: '#6B7280' }}>{service.description}</td>
                  <td>{service.duration} دقيقة</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(service.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
