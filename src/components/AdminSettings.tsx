import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, LogOut, Trash2, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';

export function AdminSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      
      setMessage({ text: t('admin.settings.email_change_success'), type: 'success' });
      setNewEmail('');
    } catch (err: any) {
      setMessage({ text: err.message || t('admin.settings.email_change_error'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setMessage({ text: t('admin.settings.password_mismatch'), type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setMessage({ text: t('admin.settings.password_change_success'), type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ text: err.message || t('admin.settings.password_change_error'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('checki_admin_auth');
    localStorage.removeItem('checki_admin_place_info');
    navigate('/admin/login');
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('admin.settings.user_not_found'));

      // 2. Delete place info from backend (which should cascade or handle cleanup)
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('admin.settings.delete_error'));
      }

      // 3. Delete auth user (Supabase auth.users is usually restricted from client, 
      // so backend should handle it or we just sign out if backend deleted it)
      await supabase.auth.signOut();
      localStorage.removeItem('checki_admin_auth');
      localStorage.removeItem('checki_admin_place_info');
      navigate('/admin/login');
    } catch (err: any) {
      setMessage({ text: err.message || t('admin.settings.delete_error'), type: 'error' });
      setIsDeleteConfirmOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/admin" 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-400" />
            {t('admin.settings.title')}
          </h1>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl mb-6 font-bold text-sm flex items-center gap-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {message.text}
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Email Settings */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-slate-400" />
              {t('admin.settings.email_change')}
            </h2>
            <div className="mb-4">
              <p className="text-sm text-slate-500 font-medium">{t('admin.settings.current_email')}: <span className="text-slate-800 font-bold">{email}</span></p>
            </div>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden">
                <div className="pl-4 pr-3 py-3 flex items-center gap-2 text-slate-400 bg-slate-100/50 border-r border-slate-100 min-w-[110px]">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{t('admin.settings.new_email')}</span>
                </div>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('admin.settings.new_email_placeholder')}
                  className="flex-1 px-4 py-3 bg-transparent focus:outline-none font-medium text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !newEmail}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all"
              >
                {t('admin.settings.email_change_button')}
              </button>
            </form>
          </div>

          {/* Password Settings */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-400" />
              {t('admin.settings.password_change')}
            </h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden">
                <div className="pl-4 pr-3 py-3 flex items-center gap-2 text-slate-400 bg-slate-100/50 border-r border-slate-100 min-w-[110px]">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{t('admin.settings.new_password')}</span>
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('admin.settings.new_password_placeholder')}
                  className="flex-1 px-4 py-3 bg-transparent focus:outline-none font-medium text-sm"
                />
              </div>
              <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden">
                <div className="pl-4 pr-3 py-3 flex items-center gap-2 text-slate-400 bg-slate-100/50 border-r border-slate-100 min-w-[110px]">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{t('admin.settings.confirm_password')}</span>
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('admin.settings.confirm_password_placeholder')}
                  className="flex-1 px-4 py-3 bg-transparent focus:outline-none font-medium text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all"
              >
                {t('admin.settings.password_change_button')}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-[2rem] p-6 md:p-8 border border-red-100">
            <h2 className="text-lg font-bold text-red-600 mb-6 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              {t('admin.settings.danger_zone')}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleLogout}
                className="flex-1 py-4 bg-white text-slate-700 hover:bg-slate-100 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                {t('admin.settings.logout')}
              </button>
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="flex-1 py-4 bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                {t('admin.settings.delete_account')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center"
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t('admin.settings.delete_confirm_title')}</h3>
            <p className="text-slate-500 mb-8 text-sm">
              {t('admin.settings.delete_confirm_desc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isLoading}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                {t('admin.settings.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('admin.settings.delete_button')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
