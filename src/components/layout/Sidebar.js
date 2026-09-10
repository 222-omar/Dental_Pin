'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, CalendarDays, BarChart3, Bell, Settings, LogOut, X, Stethoscope } from 'lucide-react';
import { SIDEBAR_ITEMS, SIDEBAR_BOTTOM_ITEMS } from '@/lib/constants';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase/client';

const iconMap = {
  LayoutDashboard, Users, CalendarDays, BarChart3, Bell, Settings,
};

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useApp();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    if (onClose) onClose();
    router.push('/login');
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0B8FAC, #0E7490)', color: '#ffffff' }}>
            <Stethoscope size={20} />
          </div>
          <div>
            <div className="sidebar-logo-text">
              Dental <span>Pin</span>
            </div>
          </div>
          <button className="mobile-menu-btn" onClick={onClose} style={{ marginRight: 'auto' }}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">القائمة الرئيسية</div>
          {SIDEBAR_ITEMS.map(item => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                {Icon && <Icon size={20} className="sidebar-item-icon" />}
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="sidebar-section-label" style={{ marginTop: '24px' }}>أخرى</div>
          {SIDEBAR_BOTTOM_ITEMS.map(item => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                {Icon && <Icon size={20} className="sidebar-item-icon" />}
                <span>{item.label}</span>
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span style={{
                    marginRight: 'auto',
                    background: '#EF4444',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-item"
            style={{ width: '100%', color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'right' }}
            onClick={handleLogout}
          >
            <LogOut size={20} className="sidebar-item-icon" />
            <span>تسجيل الخروج</span>
          </button>
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">م أ</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">محمد أحمد</div>
              <div className="sidebar-user-role">موظف استقبال</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
