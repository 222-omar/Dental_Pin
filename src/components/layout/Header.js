'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Calendar } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { formatDateWithDay, timeAgo } from '@/lib/utils';
import { NOTIFICATION_COLORS } from '@/lib/constants';

export default function Header({ onMenuClick, title, subtitle }) {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = new Date();

  return (
    <header className="header">
      <div className="header-right">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <div>
          <div className="header-title">{title || 'الرئيسية'}</div>
          {subtitle && <div className="header-subtitle">{subtitle}</div>}
        </div>
      </div>

      <div className="header-left">
        <div className="header-date">
          <Calendar size={14} />
          <span suppressHydrationWarning>{formatDateWithDay(today)}</span>
        </div>

        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="header-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <span className="notification-dropdown-title">الإشعارات</span>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={markAllNotificationsRead}
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.8rem' }}>
                    لا توجد إشعارات
                  </div>
                ) : (
                  notifications.slice(0, 8).map(notification => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <div
                        className="notification-item-icon"
                        style={{
                          background: `${NOTIFICATION_COLORS[notification.type]}15`,
                          color: NOTIFICATION_COLORS[notification.type],
                        }}
                      >
                        <Bell size={16} />
                      </div>
                      <div className="notification-item-content">
                        <div className="notification-item-message">{notification.message}</div>
                        <div className="notification-item-time" suppressHydrationWarning>{timeAgo(notification.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
