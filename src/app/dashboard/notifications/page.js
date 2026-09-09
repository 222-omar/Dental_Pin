'use client';

import { Bell, Check, CheckCheck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { timeAgo } from '@/lib/utils';
import { NOTIFICATION_COLORS, NOTIFICATION_TYPE_LABELS } from '@/lib/constants';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useApp();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">الإشعارات</h1>
          <p className="text-sm text-gray" style={{ marginTop: '4px' }}>
            {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllNotificationsRead}>
            <CheckCheck size={16} />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Bell size={32} />
            </div>
            <div className="empty-state-title">لا توجد إشعارات</div>
            <div className="empty-state-text">ستظهر الإشعارات هنا عند وجود أحداث جديدة</div>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`notification-item ${!n.is_read ? 'unread' : ''}`}
              onClick={() => !n.is_read && markNotificationRead(n.id)}
              style={{ padding: '16px 24px' }}
            >
              <div
                className="notification-item-icon"
                style={{
                  background: `${NOTIFICATION_COLORS[n.type]}15`,
                  color: NOTIFICATION_COLORS[n.type],
                  width: '44px',
                  height: '44px',
                }}
              >
                <Bell size={20} />
              </div>
              <div className="notification-item-content" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
                    {n.title}
                  </span>
                  <span style={{
                    fontSize: '0.65rem', padding: '2px 8px', borderRadius: '9999px',
                    background: `${NOTIFICATION_COLORS[n.type]}15`,
                    color: NOTIFICATION_COLORS[n.type],
                    fontWeight: 600,
                  }}>
                    {NOTIFICATION_TYPE_LABELS[n.type]}
                  </span>
                </div>
                <div className="notification-item-message" style={{ fontSize: '0.85rem' }}>{n.message}</div>
                <div className="notification-item-time" style={{ marginTop: '4px' }} suppressHydrationWarning>{timeAgo(n.created_at)}</div>
              </div>
              {!n.is_read && (
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#0B8FAC', flexShrink: 0, marginTop: '6px',
                }} />
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
