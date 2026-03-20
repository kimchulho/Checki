import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../App';
import { supabase } from '../services/supabaseClient';

export function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Lookup email using username
      const lookupResponse = await fetch('/api/lookup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const lookupData = await lookupResponse.json();

      if (!lookupResponse.ok) {
        throw new Error(lookupData.error || t('auth.login_error'));
      }

      const email = lookupData.email;

      // 2. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error(t('auth.login_error'));

      // 3. Sync with backend to get place info
      const response = await fetch('/api/login-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: authData.user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.login_error'));
      }

      localStorage.setItem('checki_admin_auth', 'true');
      localStorage.setItem('checki_admin_place_info', JSON.stringify(data.place));
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || t('auth.login_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <div className="absolute top-6 right-6">
        <LanguageSelector />
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-100">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{t('auth.login_title')}</h1>
            <p className="text-slate-500 text-sm">{t('auth.login_subtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  {t('auth.username')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('auth.username_placeholder')}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-lg transition-all"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {t('auth.password')}
                  </label>
                  <Link 
                    to="/admin/forgot-password" 
                    className="text-[10px] font-bold text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-wider"
                  >
                    {t('auth.forgot_password')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.password_placeholder')}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-lg transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1"
              >
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('auth.login_button')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors"
              >
                {t('auth.go_register')}
              </button>
            </div>
          </form>
        </div>
        
        <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Checki Secure Admin System
          </p>
        </div>
      </motion.div>
    </div>
  );
}
