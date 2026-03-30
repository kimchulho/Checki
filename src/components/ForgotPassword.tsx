import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../App';
import { supabase } from '../services/supabaseClient';

export function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        throw new Error(lookupData.error || t('auth.reset_password_error'));
      }

      const foundEmail = lookupData.email;
      setEmail(foundEmail);

      // 2. Send reset password email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(foundEmail, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (resetError) throw resetError;
      setIsSent(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || t('auth.reset_password_error'));
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
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors ${isSent ? 'bg-emerald-50 text-emerald-500 shadow-emerald-100' : 'bg-orange-50 text-orange-500 shadow-orange-100'}`}>
              {isSent ? <CheckCircle2 className="w-10 h-10" /> : <Mail className="w-10 h-10" />}
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {isSent ? t('auth.reset_sent_title') : t('auth.forgot_password_title')}
            </h1>
            <p className="text-slate-500 text-sm">
              {isSent ? t('auth.reset_sent_subtitle', { email }) : t('auth.forgot_password_subtitle')}
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden">
                <div className="pl-4 pr-3 py-3 flex items-center gap-2 text-slate-400 bg-slate-100/50 border-r border-slate-100 min-w-[110px]">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{t('auth.username')}</span>
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.username_placeholder')}
                  className="flex-1 px-4 py-4 bg-transparent focus:outline-none font-bold text-lg transition-all"
                  autoFocus
                />
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
                    <span>{t('auth.send_reset_link')}</span>
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('auth.back_to_login')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => navigate('/admin/login')}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-lg shadow-lg transition-all"
              >
                {t('auth.back_to_login')}
              </button>
              <p className="text-center text-xs text-slate-400">
                {t('auth.reset_not_received')}{' '}
                <button 
                  onClick={() => setIsSent(false)}
                  className="text-orange-500 font-bold hover:underline"
                >
                  {t('auth.try_again')}
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
