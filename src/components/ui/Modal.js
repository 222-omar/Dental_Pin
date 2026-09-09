'use client';

import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'default' }) {
  if (!isOpen) return null;

  const maxWidth = size === 'lg' ? '720px' : size === 'sm' ? '420px' : '560px';

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
