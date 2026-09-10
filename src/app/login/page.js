'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Eye, EyeOff, ShieldCheck, Stethoscope } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@dentalpin.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // استرجاع البريد المحفوظ إن وجد
    const savedEmail = localStorage.getItem('dentalpin_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('dentalpin_saved_email', email.trim());
    }

    try {
      // تجربة تسجيل الدخول عبر Supabase Auth أولاً
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (!authError && data?.user) {
        router.push('/dashboard');
        return;
      }
    } catch (err) {
      console.warn('Supabase auth fallback:', err);
    }

    // حساب مدير العيادة
    if (
      (email === 'admin@dentalpin.com' && password === 'admin123') ||
      (email === 'doctor@dentalpin.com' && password === 'doctor123')
    ) {
      setTimeout(() => {
        router.push('/dashboard');
      }, 400);
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="booking-logo-icon" style={{ margin: '0 auto 12px', background: 'linear-gradient(135deg, #0B8FAC, #0E7490)' }}>
            <Stethoscope size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
            Dental <span style={{ color: '#0B8FAC' }}>Pin</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '4px' }}>
            تسجيل الدخول إلى لوحة التحكم الإدارية
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>البريد الإلكتروني</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@dentalpin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ direction: 'ltr', textAlign: 'right' }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#0B8FAC' }}
              />
              <span>تذكر بيانات الدخول</span>
            </label>
          </div>

          {error && (
            <div style={{
              background: '#FEF2F2', color: '#DC2626', padding: '10px 16px',
              borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px',
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <div className="loading-spinner" style={{ width: '18px', height: '18px', margin: 0, borderWidth: '2px' }} />
                جاري التحقق والدخول...
              </span>
            ) : (
              <>
                <LogIn size={18} />
                تسجيل الدخول
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: '#94A3B8'
        }}>
          <ShieldCheck size={14} color="#10B981" />
          <span>اتصال مشفر وآمن لنظام إدارة العيادة</span>
        </div>
      </div>
    </div>
  );
}
