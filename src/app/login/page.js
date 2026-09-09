'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);

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

    // حساب الأدمن التجريبي السريع
    if (
      (email === 'admin@dentalpin.com' && password === 'admin123') ||
      (email === 'doctor@dentalpin.com' && password === 'doctor123')
    ) {
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="booking-logo-icon" style={{ margin: '0 auto 12px' }}>🦷</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
            Dental <span style={{ color: '#0B8FAC' }}>Pin</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '4px' }}>
            تسجيل الدخول إلى لوحة التحكم
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@dentalpin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ direction: 'ltr', textAlign: 'right' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
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
                جاري تسجيل الدخول...
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
          marginTop: '24px', padding: '16px', background: '#F0FDFA',
          borderRadius: '12px', fontSize: '0.8rem', color: '#0E7490',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>بيانات الدخول السريعة:</div>
          <div>البريد: admin@dentalpin.com</div>
          <div>كلمة المرور: admin123</div>
        </div>
      </div>
    </div>
  );
}
