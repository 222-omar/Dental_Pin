'use client';

import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'تأكيد', cancelText = 'إلغاء', variant = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="confirm-dialog">
          <div className={`confirm-dialog-icon ${variant}`}>
            <AlertTriangle size={28} />
          </div>
          <h3 className="confirm-dialog-title">{title}</h3>
          <p className="confirm-dialog-message">{message}</p>
          <div className="confirm-dialog-actions">
            <button className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
              {confirmText}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
