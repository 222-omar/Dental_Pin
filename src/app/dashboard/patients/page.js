'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, UserPlus, Phone, Calendar, MapPin, ChevronLeft, ChevronRight,
  Eye, Edit2, Trash2, CalendarPlus, X, User
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { GENDER_OPTIONS } from '@/lib/constants';
import { formatDateAr, calculateAge, getInitials, getAvatarColor, formatPhone } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Link from 'next/link';

const ITEMS_PER_PAGE = 8;

function PatientsContent() {
  const { patients, addPatient, updatePatient, deletePatient } = useApp();
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(searchParams.get('action') === 'add');
  const [editingPatient, setEditingPatient] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', age: '', gender: '', address: '', notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // فلترة المرضى
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchSearch = !searchQuery ||
        p.name.includes(searchQuery) ||
        p.phone.includes(searchQuery);
      const matchGender = filterGender === 'all' || p.gender === filterGender;
      return matchSearch && matchGender;
    });
  }, [patients, searchQuery, filterGender]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetForm = () => {
    setFormData({ name: '', phone: '', age: '', gender: '', address: '', notes: '' });
    setFormErrors({});
    setEditingPatient(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (patient) => {
    const rawAge = patient.age ?? (patient.date_of_birth ? calculateAge(patient.date_of_birth) : '');
    const validAge = rawAge && Number(rawAge) > 0 ? rawAge : '';
    setEditingPatient(patient);
    setFormData({
      name: patient.name || '',
      phone: patient.phone || '',
      age: validAge ? String(validAge) : '',
      gender: patient.gender || '',
      address: patient.address || '',
      notes: patient.notes || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'الاسم مطلوب';
    if (!formData.phone.trim()) errors.phone = 'رقم الهاتف مطلوب';
    else if (formData.phone.trim().length < 11) errors.phone = 'رقم الهاتف غير صحيح';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      age: formData.age ? Number(formData.age) : null,
      date_of_birth: formData.age ? `${new Date().getFullYear() - Number(formData.age)}-01-01` : (editingPatient?.date_of_birth || null),
    };

    if (editingPatient) {
      updatePatient(editingPatient.id, payload);
      addToast('تم تعديل بيانات المريض بنجاح', 'success');
    } else {
      addPatient(payload);
      addToast('تم إضافة المريض بنجاح', 'success');
    }
    setShowModal(false);
    resetForm();
  };

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">المرضى</h1>
          <p className="text-sm text-gray" style={{ marginTop: '4px' }}>
            إجمالي {filteredPatients.length} مريض
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <UserPlus size={18} />
            إضافة مريض
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="filter-bar">
        <div className="search-input-wrapper" style={{ flex: 1, maxWidth: '360px' }}>
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button
          className={`filter-chip ${filterGender === 'all' ? 'active' : ''}`}
          onClick={() => { setFilterGender('all'); setCurrentPage(1); }}
        >
          الكل
        </button>
        <button
          className={`filter-chip ${filterGender === 'male' ? 'active' : ''}`}
          onClick={() => { setFilterGender('male'); setCurrentPage(1); }}
        >
          ذكور
        </button>
        <button
          className={`filter-chip ${filterGender === 'female' ? 'active' : ''}`}
          onClick={() => { setFilterGender('female'); setCurrentPage(1); }}
        >
          إناث
        </button>
      </div>

      {/* Patients List (Apexo-style rows) */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {paginatedPatients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <User size={32} />
            </div>
            <div className="empty-state-title">لا توجد نتائج</div>
            <div className="empty-state-text">جرب البحث بكلمات مختلفة أو أضف مريض جديد</div>
          </div>
        ) : (
          paginatedPatients.map(patient => (
            <div key={patient.id} className="patient-row">
              {/* Avatar + Name */}
              <div className="patient-row-main">
                <div className="avatar" style={{ background: getAvatarColor(patient.name) }}>
                  {getInitials(patient.name)}
                </div>
                <div>
                  <div className="patient-row-name">{patient.name}</div>
                  {patient.status === 'new' && (
                    <span style={{
                      fontSize: '0.65rem', background: '#DBEAFE', color: '#2563EB',
                      padding: '1px 8px', borderRadius: '9999px', fontWeight: 600,
                    }}>جديد</span>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="patient-row-field">
                <Phone size={14} className="patient-row-field-icon" style={{ color: '#F97316' }} />
                <div>
                  <div className="patient-row-field-label">الهاتف</div>
                  <div className="patient-row-field-value" style={{ direction: 'ltr' }}>{formatPhone(patient.phone)}</div>
                </div>
              </div>

              {/* Gender */}
              <div className="patient-row-field">
                <User size={14} className="patient-row-field-icon" />
                <div>
                  <div className="patient-row-field-label">النوع</div>
                  <div className="patient-row-field-value">
                    {patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : '—'}
                  </div>
                </div>
              </div>

              {/* Age */}
              <div className="patient-row-field">
                <Calendar size={14} className="patient-row-field-icon" />
                <div>
                  <div className="patient-row-field-label">العمر</div>
                  <div className="patient-row-field-value">
                    {patient.age && Number(patient.age) > 0 ? `${patient.age} سنة` : (patient.date_of_birth && calculateAge(patient.date_of_birth) > 0 ? `${calculateAge(patient.date_of_birth)} سنة` : '—')}
                  </div>
                </div>
              </div>

              {/* Last Visit */}
              <div className="patient-row-field">
                <Calendar size={14} className="patient-row-field-icon" />
                <div>
                  <div className="patient-row-field-label">آخر زيارة</div>
                  <div className="patient-row-field-value">
                    {patient.lastVisit ? formatDateAr(patient.lastVisit) : 'لا يوجد'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="patient-row-actions">
                <Link href={`/dashboard/patients/${patient.id}`} className="btn btn-icon btn-ghost sm" title="عرض الملف">
                  <Eye size={16} />
                </Link>
                <button className="btn btn-icon btn-ghost sm" onClick={() => openEditModal(patient)} title="تعديل">
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn btn-icon btn-ghost sm"
                  onClick={() => setPatientToDelete(patient)}
                  title="حذف المريض"
                  style={{ color: '#EF4444' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronRight size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="pagination-info">
            عرض {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredPatients.length)} من {filteredPatients.length}
          </span>
        </div>
      )}

      {/* Add/Edit Patient Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingPatient ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}
        footer={
          <>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingPatient ? 'حفظ التعديلات' : 'إضافة المريض'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              إلغاء
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">الاسم بالكامل *</label>
            <input
              type="text"
              className={`form-input ${formErrors.name ? 'error' : ''}`}
              placeholder="أدخل اسم المريض"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {formErrors.name && <div className="form-error">{formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">رقم الهاتف *</label>
            <input
              type="tel"
              className={`form-input ${formErrors.phone ? 'error' : ''}`}
              placeholder="01xxxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{ direction: 'ltr', textAlign: 'right' }}
            />
            {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">العمر (بالسنوات)</label>
              <input
                type="number"
                className="form-input"
                placeholder="مثال: 32"
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">النوع</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">اختر النوع</option>
                {GENDER_OPTIONS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">العنوان</label>
            <input
              type="text"
              className="form-input"
              placeholder="أدخل العنوان"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ملاحظات</label>
            <textarea
              className="form-input"
              placeholder="أي ملاحظات طبية أو شخصية..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </form>
      </Modal>

      {/* دايالوج تأكيد حذف المريض */}
      <ConfirmDialog
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={() => {
          if (patientToDelete) {
            deletePatient(patientToDelete.id);
            addToast(`تم حذف المريض ${patientToDelete.name} بنجاح`, 'info');
            setPatientToDelete(null);
          }
        }}
        title="حذف المريض"
        message={`هل أنت متأكد من حذف بيانات المريض "${patientToDelete?.name}"؟ سيتم حذف المريض وجميع مواعيده المسجلة نهائياً.`}
        confirmText="نعم، حذف المريض"
        cancelText="إلغاء"
        variant="danger"
      />
    </>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>جاري التحميل...</div>}>
      <PatientsContent />
    </Suspense>
  );
}
