'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ToastContainer from '@/components/ui/ToastContainer';
import { AppProvider } from '@/contexts/AppContext';
import { ToastProvider } from '@/contexts/ToastContext';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppProvider>
      <ToastProvider>
        <div className="admin-layout">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="admin-content">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <main className="main-content">
              {children}
            </main>
          </div>
        </div>
        <ToastContainer />
      </ToastProvider>
    </AppProvider>
  );
}
