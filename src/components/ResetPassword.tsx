import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../App';
import { supabase } from '../services/supabaseClient';

export function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a session (Supabase should have set it from the recovery link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(t('auth.invalid_reset_link'));
      }
    };
    checkSession();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('auth.passwords_do_not_match'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Update password error:', err);
      setError(err.message || t('auth.update_password_error'));
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-colors ${isSuccess ? 'bg-emerald-50 text-emerald-500 shadow-emerald-100' : 'bg-orange-50 text-orange-500 shadow-orange-100'}`}>
              {isSuccess ? <CheckCircle2 className="w-10 h-10" /> : <Lock className="w-10 h-10" />}
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {isSuccess ? t('auth.reset_success_title') : t('auth.reset_password_title')}
            </h1>
            <p className="text-slate-500 text-sm">
              {isSuccess ? t('auth.reset_success_subtitle') : t('auth.reset_password_subtitle')}
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden">
                <div className="pl-4 pr-3 py-3 flex items-center gap-2 text-slate-400 bg-slate-100/50 border-r border-slate-100 min-w-[110px]">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{t('auth.new_password')}</span>
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder')}
                  className="flex-1 px-4 py-4 bg-transparent focus:outline-none font-bold text-lg transition-all"
                />
              </div>

              <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden">
                <div className="pl-4 pr-3 py-3 flex items-center gap-2 text-slate-400 bg-slate-100/50 border-r border-slate-100 min-w-[110px]">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{t('auth.confirm_new_password')}</span>
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirm_password_placeholder')}
                  className="flex-1 px-4 py-4 bg-transparent focus:outline-none font-bold text-lg transition-all"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-500 p-4 rounded-2xl flex items-start gap-3 border border-red-100"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">{error}</p>
                </motion.div>
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
                    <span>{t('auth.update_password')}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => navigate('/admin/login')}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-lg shadow-lg transition-all"
              >
                {t('auth.go_to_login')}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
