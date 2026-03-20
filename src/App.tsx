/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useLocation, Link, useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Delete, Check, Clock, User, Zap, ShieldCheck, UserCheck, LayoutDashboard, ArrowLeft, Search, Calendar, UserPlus, Save, X, Image as ImageIcon, Eye, Phone, History, ChevronRight, ChevronLeft, ChevronDown, Lock, Users, Edit, Trash2, BellOff, Bell, LogOut, ArrowRight, AlertCircle, Settings, MapPin, MapPinOff, SwitchCamera, RefreshCw, Download, SmartphoneCharging, Pointer, CreditCard, CameraOff } from 'lucide-react';
import { encryptBlob, uploadAttendanceData, decryptBlob } from './services/securityService';
import { supabase } from './services/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';

import { SchoolRegistration } from './components/SchoolRegistration';
import { AdminLogin } from './components/AdminLogin';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { AdminSettings } from './components/AdminSettings';
import { QRScanner } from './components/QRScanner';

export function LanguageSelector() {
  const { i18n } = useTranslation();
  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="bg-transparent text-sm font-bold text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer"
    >
      <option value="en">English</option>
      <option value="ja">日本語</option>
      <option value="ko">한국어</option>
    </select>
  );
}

// --- Global Helpers ---
const urlBase64ToUint8Array = (base64String: string) => {
  if (!base64String) return new Uint8Array();
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  try {
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    console.error('Failed to decode base64 VAPID key:', e);
    return new Uint8Array();
  }
};

// --- Components ---

const storyItems = [
  { id: 1, src: "https://ewbjogsolylcbfmpmyfa.supabase.co/storage/v1/object/public/checki/1.jpg" },
  { id: 2, src: "https://ewbjogsolylcbfmpmyfa.supabase.co/storage/v1/object/public/checki/2.jpg" },
  { id: 3, src: "https://ewbjogsolylcbfmpmyfa.supabase.co/storage/v1/object/public/checki/3.jpg" },
  { id: 4, src: "https://ewbjogsolylcbfmpmyfa.supabase.co/storage/v1/object/public/checki/4.jpg" },
  { id: 5, src: "https://ewbjogsolylcbfmpmyfa.supabase.co/storage/v1/object/public/checki/5.jpg" },
  { id: 6, src: "https://ewbjogsolylcbfmpmyfa.supabase.co/storage/v1/object/public/checki/6.jpg" },
];

function StoryCarousel() {
  const { t } = useTranslation();
  const storyTexts = t('landing.story.items', { returnObjects: true }) as string[];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="w-full mt-24"
    >
      <div className="text-center mb-10">
        <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-bold mb-4">
          {t('landing.story.badge')}
        </span>
        <h2 className="text-2xl md:text-4xl font-black text-slate-800">{t('landing.story.title')}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {storyItems.map((item, idx) => (
          <motion.div 
            key={item.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-lg border-2 border-white bg-slate-100 group"
          >
            <img 
              src={item.src} 
              alt={storyTexts[idx]} 
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${item.id === 6 ? 'object-[70%_center]' : ''}`} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-[10px] sm:text-xs shadow-md shrink-0">
                  {item.id}
                </div>
                <p className="text-white text-sm sm:text-base font-bold drop-shadow-md leading-tight tracking-tight whitespace-nowrap">
                  {storyTexts[idx]}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function LandingPage() {
  const { t } = useTranslation();
  const isLoggedIn = localStorage.getItem('checki_admin_auth') === 'true';
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <Check className="text-white w-6 h-6" strokeWidth={3} />
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tight">{t('landing.logo')}</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSelector />
          {isLoggedIn ? (
            <Link to="/admin" className="bg-slate-800 text-white px-3 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-700 transition-all shadow-md whitespace-nowrap">{t('landing.go_admin')}</Link>
          ) : (
            <>
              <Link to="/admin/login" className="text-xs md:text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap">{t('landing.login')}</Link>
              <Link to="/register" className="bg-slate-800 text-white px-3 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-700 transition-all shadow-md whitespace-nowrap">{t('landing.start_free')}</Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-bold mb-6">
            {t('landing.badge')}
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.25] tracking-tight">
            {t('landing.hero_title_1')}<br />
            <span className="text-orange-500">{t('landing.hero_title_2')}</span>
          </h1>
          <p className="text-base md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            {t('landing.hero_subtitle_1')}<br />
            {t('landing.hero_subtitle_2')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link 
              to="/kiosk" 
              className="w-full sm:w-auto bg-orange-500 text-white px-10 py-5 rounded-[2rem] text-xl font-black hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 flex items-center justify-center gap-3 group"
            >
              <Camera className="w-6 h-6" />
              {t('landing.cta_button')}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        <StoryCarousel />

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {[
            { icon: <SmartphoneCharging className="w-8 h-8 text-orange-500" />, title: t('landing.feature_1_title'), desc: t('landing.feature_1_desc') },
            { icon: <UserCheck className="w-8 h-8 text-orange-500" />, title: t('landing.feature_2_title'), desc: t('landing.feature_2_desc') },
            { icon: <ImageIcon className="w-8 h-8 text-orange-500" />, title: t('landing.feature_3_title'), desc: t('landing.feature_3_desc') }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-left"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className="mt-32 w-full max-w-5xl mx-auto mb-12">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold mb-4">
              {t('subscription.pricing_badge')}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-normal md:leading-snug">
              {t('subscription.hero_title_1')}<br />{t('subscription.hero_title_2')}
            </h2>
            <p className="text-lg text-slate-500">
              {t('subscription.hero_subtitle_1')}<span className="font-bold text-indigo-600">{t('subscription.hero_subtitle_highlight')}</span>{t('subscription.hero_subtitle_2')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col relative text-left"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('subscription.monthly.title')}</h3>
              <p className="text-slate-500 mb-6">{t('subscription.monthly.desc')}</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-slate-900">$2.99</span>
                <span className="text-slate-500 font-medium">{t('subscription.monthly.period')}</span>
                <div className="mt-2 inline-block bg-indigo-50 text-indigo-600 text-sm font-bold px-3 py-1 rounded-full">
                  {t('subscription.monthly.badge')}
                </div>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {(t('subscription.features', { returnObjects: true }) as string[]).map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/register" className="w-full block text-center bg-slate-100 text-slate-800 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
                {t('subscription.start_free')}
              </Link>
            </motion.div>

            {/* Yearly Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-800 flex flex-col relative overflow-hidden text-left"
            >
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-black px-4 py-2 rounded-bl-2xl uppercase tracking-wider">
                Best Value
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t('subscription.yearly.title')}</h3>
              <p className="text-slate-400 mb-6">{t('subscription.yearly.desc')}</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-white">$29.99</span>
                <span className="text-slate-400 font-medium">{t('subscription.yearly.period')}</span>
                <div className="mt-2 inline-block bg-white/10 text-orange-400 text-sm font-bold px-3 py-1 rounded-full">
                  {t('subscription.yearly.badge')}
                </div>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {(t('subscription.features', { returnObjects: true }) as string[]).map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 font-medium">
                    <Check className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" strokeWidth={3} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/register" className="w-full block text-center bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30">
                {t('subscription.start_free')}
              </Link>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="p-12 text-center text-slate-400 text-sm border-t border-slate-100">
        &copy; 2026 {t('admin.title')}. All rights reserved.
      </footer>
    </div>
  );
}

const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

const isSafari = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('crios');
};

function AttendanceView({ 
  view, setView, currentTime, videoRef, flash, 
  isProcessing, isPowerSaving, setIsPowerSaving,
  showModeSelector, setShowModeSelector, currentCheckiMode, setCurrentCheckiMode,
  directInput, setDirectInput, showDirectInput, setShowDirectInput,
  pendingChildName, setPendingChildName,
  triggerInstantCapture,
  currentLocation, setCurrentLocation,
  kioskAuth, setKioskAuth, kioskSchoolInfo, setKioskSchoolInfo,
  getModeOptions,
  terminalName,
  facingMode, setFacingMode,
  restartCamera
}: any) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'ja' ? 'ja-JP' : 'en-US';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isScanningQR, setIsScanningQR] = useState(false);
  const navigate = useNavigate();
  const [isStandalone, setIsStandalone] = useState(false);
  const [installGuideType, setInstallGuideType] = useState<'ios' | 'android' | 'other' | null>(null);

  useEffect(() => {
    let isStandaloneMode = false;
    const checkStandalone = () => {
      isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         window.matchMedia('(display-mode: minimal-ui)').matches ||
                         (window.navigator as any).standalone === true ||
                         document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };
    
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIos() && isSafari() && !isStandaloneMode) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } else if (isIos() && isSafari()) {
      setInstallGuideType('ios');
    } else {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('android')) {
        setInstallGuideType('android');
      } else {
        setInstallGuideType('other');
      }
    }
  };

  useEffect(() => {
    if (kioskAuth && kioskSchoolInfo?.id) {
      fetchChildren();
    }
  }, [kioskAuth, kioskSchoolInfo]);

  const fetchChildren = async () => {
    setIsLoadingChildren(true);
    try {
      const { data, error } = await supabase
        .from('checki_members')
        .select('*')
        .eq('place_id', kioskSchoolInfo.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      setChildrenList(data || []);
    } catch (err) {
      console.error('Error fetching children:', err);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const handleScreenInteraction = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as any).clientX;
      clientY = (e as any).clientY;
    }
    
    setTouchPosition({ x: clientX, y: clientY });
    // Use requestAnimationFrame to ensure the position state update is processed
    // before the exit animation starts
    requestAnimationFrame(() => {
      setIsPowerSaving(false);
    });
  };

  const handleKioskLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/login-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, type: 'kiosk' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('checki_kiosk_auth', 'true');
      localStorage.setItem('checki_kiosk_place_info', JSON.stringify(data.place));
      setKioskAuth(true);
      setKioskSchoolInfo(data.place);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleKioskLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmKioskLogout = () => {
    localStorage.removeItem('checki_kiosk_auth');
    localStorage.removeItem('checki_kiosk_place_info');
    localStorage.removeItem('checki_terminal_id');
    setKioskAuth(false);
    setKioskSchoolInfo(null);
    setIsLogoutConfirmOpen(false);
  };

  const handleModeSelect = (option: string) => {
    if (option === t('terminal.modes.manual')) {
      setShowDirectInput(true);
    } else {
      setCurrentCheckiMode(option);
      setShowModeSelector(false);
      if (pendingChildName) {
        triggerInstantCapture(pendingChildName, option);
        setPendingChildName(null);
      }
    }
  };

  const handleChildClick = (childName: string) => {
    if (isProcessing) return;
    setPendingChildName(childName);
    setShowModeSelector(true);
  };

  const screensaverVariants = {
    initial: { opacity: 0 },
    animate: (pos: { x: number, y: number }) => ({ 
      opacity: 1,
      WebkitMaskImage: `radial-gradient(circle at ${pos.x}px ${pos.y}px, transparent 0%, black 0%)`,
      maskImage: `radial-gradient(circle at ${pos.x}px ${pos.y}px, transparent 0%, black 0%)`
    }),
    exit: (pos: { x: number, y: number }) => ({ 
      opacity: 1,
      WebkitMaskImage: `radial-gradient(circle at ${pos.x}px ${pos.y}px, transparent 150%, black 150%)`,
      maskImage: `radial-gradient(circle at ${pos.x}px ${pos.y}px, transparent 150%, black 150%)`,
      transition: { duration: 0.8, ease: "easeInOut" }
    })
  };

  if (!kioskAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {isScanningQR && (
          <QRScanner 
            onClose={() => setIsScanningQR(false)}
            onScan={(data) => {
              setIsScanningQR(false);
              try {
                const url = new URL(data);
                const token = url.searchParams.get('token');
                if (token) {
                  navigate(`/kiosk/setup?token=${token}`);
                } else {
                  alert(t('terminal.messages.registration.invalid_qr'));
                }
              } catch (e) {
                // If it's not a valid URL, check if it's just a token
                if (data && data.length > 10) {
                  navigate(`/kiosk/setup?token=${data}`);
                } else {
                  alert(t('terminal.messages.registration.invalid_qr'));
                }
              }
            }}
          />
        )}
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
              <h1 className="text-2xl font-bold text-slate-800 mb-2">{t('terminal.messages.unregistered_title', { title: t('admin.title') })}</h1>
              <p className="text-slate-500 text-sm">{t('terminal.messages.unregistered_desc', { title: t('admin.title') })}</p>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                <p className="text-slate-600 font-medium mb-4">{t('terminal.messages.scan_qr_desc')}</p>
                <button
                  onClick={() => setIsScanningQR(true)}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 transition-colors flex items-center justify-center gap-2 mb-4"
                >
                  <Camera className="w-5 h-5" />
                  {t('terminal.messages.scan_qr_button') || 'QR 코드 스캔하기'}
                </button>
                <div className="flex items-center justify-center gap-2 text-orange-500 font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{t('terminal.messages.qr_valid_time')}</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <Link to="/" className="text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors">
                  {t('terminal.messages.go_home', { title: t('admin.title') })}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center bg-orange-50 overflow-hidden">
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-b-[2rem] shadow-sm border-b border-orange-100 z-20">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200" onDoubleClick={handleKioskLogout}>
            <Check className="text-white w-6 h-6" strokeWidth={3} />
          </div>
          <div>
            <h1 className="font-cute text-2xl font-bold text-orange-600 leading-tight">
              {t('admin.title')}
            </h1>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">{terminalName || t('admin.title')}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-500 rounded-full hover:bg-orange-200 transition-colors"
                title={t('terminal.messages.install_app')}
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors bg-slate-100 text-slate-400`}
              title={currentLocation ? t('terminal.messages.gps_receiving') : t('terminal.messages.gps_not_receiving')}
            >
              {currentLocation ? <MapPin className="w-4 h-4" /> : <MapPinOff className="w-4 h-4" />}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-orange-50 hover:text-orange-500 transition-colors"
              title={t('terminal.messages.refresh')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleKioskLogout}
              className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
              title={t('terminal.messages.logout_title', { title: t('admin.title') })}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 w-full max-w-md flex flex-col gap-4 p-4">
        
        {/* Persistent Camera Feed */}
        <div className="relative w-full aspect-square bg-slate-900 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white shrink-0 transition-all duration-300">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          
          {/* Flash Effect */}
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/50 z-30"
              />
            )}
          </AnimatePresence>

          {/* Clock Indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 z-40 shadow-lg">
            <Clock className="w-4 h-4 text-white/90" />
            <span className="text-sm text-white font-bold tracking-wide tabular-nums">
              {currentTime.toLocaleDateString(dateLocale, { month: 'numeric', day: 'numeric' })} {currentTime.toLocaleTimeString(dateLocale, { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Camera Toggle Button */}
          <button
            onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-black/50 transition-colors z-40"
            title={t('terminal.messages.switch_camera')}
          >
            <SwitchCamera className="w-5 h-5" />
          </button>

          <button
            onClick={restartCamera}
            className="absolute top-16 right-4 w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-black/50 transition-colors z-40"
            title={t('terminal.messages.restart_camera')}
          >
            <CameraOff className="w-5 h-5" />
          </button>

          {/* Success/Error Overlays */}
          <AnimatePresence>
            {(view === 'success' || view === 'error') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className={`absolute inset-0 z-40 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center ${
                  view === 'success' ? 'bg-orange-400/90' : 'bg-red-500/90'
                }`}
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                    {view === 'success' ? (
                      <Check className="text-orange-500 w-14 h-14" strokeWidth={3} />
                    ) : (
                      <Zap className="text-red-500 w-14 h-14" />
                    )}
                  </div>
                  <h2 className="text-4xl font-cute font-bold text-white mb-1">
                    {view === 'success' ? t('terminal.messages.success', { title: t('admin.title') }) : t('terminal.messages.error')}
                  </h2>
                  <p className="text-white/90 font-medium">
                    {view === 'success' ? t('terminal.messages.success_desc') : t('terminal.messages.error_desc')}
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Children Grid Section */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl">
              <div className="flex items-center gap-2 text-orange-500 font-bold animate-pulse">
                <ShieldCheck className="w-5 h-5" />
                <span>{t('terminal.messages.encrypting')}</span>
              </div>
            </div>
          )}

          {/* Grid of Children */}
          <div className="w-full flex items-start justify-center h-full">
            {isLoadingChildren ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : childrenList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Users className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">{t('terminal.messages.no_members')}</p>
                <p className="text-[10px]">{t('terminal.messages.register_in_admin')}</p>
              </div>
            ) : (
              <div className="flex gap-3 w-full overflow-x-auto no-scrollbar snap-x snap-mandatory px-1 py-1">
                {childrenList.map((child) => {
                  let buttonWidthClass = '';
                  if (childrenList.length === 1) {
                    buttonWidthClass = 'w-full';
                  } else if (childrenList.length === 2) {
                    buttonWidthClass = 'w-[calc(50%-0.375rem)]';
                  } else {
                    buttonWidthClass = 'w-[calc((100%-1.5rem)/3)]';
                  }
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleChildClick(child.name)}
                      className={`flex-shrink-0 h-32 bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border border-orange-50 hover:bg-orange-50 active:scale-95 transition-all group snap-center ${buttonWidthClass}`}
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <User className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="text-lg font-black text-slate-700 truncate w-full text-center">{child.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Install Guide Modal */}
      <AnimatePresence>
        {installGuideType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[70] flex items-end justify-center p-4"
            onClick={() => setInstallGuideType(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-md bg-white rounded-[2rem] p-8 space-y-6 shadow-2xl mb-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">{t('terminal.messages.install_guide_title')}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {installGuideType === 'ios' && (
                    <>
                      {t('terminal.messages.install_guide_ios_1')} <br/>
                      <span className="font-bold text-slate-700">{t('terminal.messages.install_guide_ios_2')}</span> {t('terminal.messages.install_guide_ios_3')}<br/>
                      <span className="font-bold text-slate-700">{t('terminal.messages.install_guide_ios_4')}</span>{t('terminal.messages.install_guide_ios_5')}
                    </>
                  )}
                  {installGuideType === 'android' && (
                    <>
                      {t('terminal.messages.install_guide_android_1')} <br/>
                      <span className="font-bold text-slate-700">{t('terminal.messages.install_guide_android_2')}</span> {t('terminal.messages.install_guide_android_3')}<br/>
                      <span className="font-bold text-slate-700">{t('terminal.messages.install_guide_android_4')}</span> {t('terminal.messages.install_guide_android_5')} <span className="font-bold text-slate-700">{t('terminal.messages.install_guide_android_6')}</span>{t('terminal.messages.install_guide_android_7')}
                    </>
                  )}
                  {installGuideType === 'other' && (
                    <>
                      {t('terminal.messages.install_guide_other_1')} <br/>
                      <span className="font-bold text-slate-700">{t('terminal.messages.install_guide_other_2')}</span> {t('terminal.messages.install_guide_other_3')}<br/>
                      <span className="font-bold text-slate-700">{t('terminal.messages.install_guide_other_4')}</span> {t('terminal.messages.install_guide_other_5')} <span className="font-bold text-slate-700">{t('terminal.messages.install_guide_other_6')}</span>{t('terminal.messages.install_guide_other_7')}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setInstallGuideType(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                {t('terminal.messages.confirm')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Selector Modal */}
      <AnimatePresence>
        {showModeSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center p-4"
            onClick={() => {
              setShowModeSelector(false);
              setPendingChildName(null);
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-md bg-white rounded-t-[2.5rem] p-8 space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800">{t('terminal.messages.select_activity', { title: t('admin.title') })}</h3>
                <p className="text-slate-500 text-sm">{t('terminal.messages.what_activity')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {getModeOptions().map((option) => (
                  <button
                    key={option}
                    onClick={() => handleModeSelect(option)}
                    className={`py-4 rounded-2xl font-bold text-lg transition-all border ${
                      currentCheckiMode === option 
                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-100' 
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowModeSelector(false);
                  setPendingChildName(null);
                }}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold"
              >
                {t('terminal.messages.cancel')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direct Input Modal */}
      <AnimatePresence>
        {showDirectInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-[2rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800">{t('terminal.modes.manual')}</h3>
                <p className="text-slate-500 text-sm">{t('terminal.messages.enter_activity')}</p>
              </div>
              <input
                type="text"
                value={directInput}
                onChange={(e) => setDirectInput(e.target.value)}
                placeholder={t('terminal.messages.direct_input_placeholder')}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-lg"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDirectInput(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold"
                >
                  {t('terminal.messages.cancel')}
                </button>
                <button
                  onClick={() => {
                    if (directInput.trim()) {
                      const mode = directInput.trim();
                      setCurrentCheckiMode(mode);
                      setDirectInput('');
                      setShowDirectInput(false);
                      setShowModeSelector(false);
                      if (pendingChildName) {
                        triggerInstantCapture(pendingChildName, mode);
                        setPendingChildName(null);
                      }
                    }
                  }}
                  className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-100"
                >
                  {t('terminal.messages.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Power Saving Overlay */}
      <AnimatePresence custom={touchPosition}>
        {isPowerSaving && (
          <motion.div
            key="screensaver"
            custom={touchPosition}
            variants={screensaverVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onPointerDown={handleScreenInteraction}
            className="fixed inset-0 bg-black z-[100] cursor-pointer overflow-hidden flex items-center justify-center"
          >
            <motion.div
              animate={{
                y: ["-35vh", "35vh", "-35vh"],
                x: ["-35vw", "35vw", "-35vw"],
              }}
              transition={{
                y: {
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear"
                },
                x: {
                  duration: 23,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
              className="absolute flex flex-col items-center gap-6 text-white/50"
            >
              <Check className="w-16 h-16 md:w-24 md:h-24 animate-pulse" />
              <div className="text-3xl md:text-5xl font-bold tracking-widest text-center leading-relaxed">
                {t('terminal.screensaver.touch_screen')}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirm Popup */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t('terminal.messages.logout_confirm_title')}</h3>
              <p className="text-slate-500 mb-8 text-sm">{t('terminal.messages.logout_confirm_desc')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  {t('terminal.messages.cancel')}
                </button>
                <button
                  onClick={confirmKioskLogout}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                >
                  {t('terminal.messages.logout')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square bg-orange-300/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

function SubscriptionView() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'ja' ? 'ja-JP' : 'en-US';
  const navigate = useNavigate();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const placeInfoStr = localStorage.getItem('checki_admin_place_info');
        const placeInfo = placeInfoStr ? JSON.parse(placeInfoStr) : null;
        if (!placeInfo || !placeInfo.id) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('checki_subscriptions')
          .select('*')
          .eq('place_id', placeInfo.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setSubscription(data);
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleManageSubscription = async () => {
    if (!subscription?.polar_customer_id) {
      alert(t('subscription.errors.no_customer'));
      return;
    }
    
    setIsManaging(true);
    try {
      const response = await fetch('/api/portal/polar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: subscription.polar_customer_id
        })
      });
      
      if (!response.ok) {
        throw new Error(t('subscription.errors.portal_fail'));
      }
      
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error(t('subscription.errors.no_url'));
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert(t('subscription.errors.portal_error'));
    } finally {
      setIsManaging(false);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setIsSubscribing(true);
    try {
      const placeInfoStr = localStorage.getItem('checki_admin_place_info');
      const placeInfo = placeInfoStr ? JSON.parse(placeInfoStr) : null;
      
      if (!placeInfo || !placeInfo.id) {
        alert(t('subscription.errors.no_login'));
        return;
      }

      const response = await fetch('/api/checkout/polar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan,
          placeId: placeInfo.id,
          successUrl: `${window.location.origin}/admin/subscription?success=true`
        })
      });

      if (!response.ok) {
        throw new Error(t('subscription.errors.checkout_fail'));
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(t('subscription.errors.no_checkout_url'));
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(t('subscription.errors.checkout_error'));
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <CreditCard className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t('subscription.title')}</h1>
            <p className="text-xs text-slate-500 font-medium">{t('subscription.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-8 pb-24">
        {isSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl flex items-center gap-3 max-w-4xl mx-auto">
            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="font-medium text-sm">{t('subscription.success_message')}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : subscription ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {t('subscription.current_plan')}
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold">
                  {subscription.plan_id === 'monthly' ? t('subscription.monthly_plan') : subscription.plan_id === 'yearly' ? t('subscription.yearly_plan') : subscription.plan_id}
                </span>
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {t('subscription.next_billing')} <span className="font-medium text-slate-700">{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' }) : t('subscription.no_info')}</span>
              </p>
            </div>
            <button 
              onClick={handleManageSubscription}
              disabled={isManaging}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors shrink-0 disabled:opacity-50"
            >
              {isManaging ? t('subscription.managing_button') : t('subscription.manage_button')}
            </button>
          </div>
        ) : null}

        <div className="text-center mb-12 mt-8">
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-normal">
            {t('subscription.hero_title_1')}<br />{t('subscription.hero_title_2')}
          </h2>
          <p className="text-slate-500">
            {t('subscription.hero_subtitle_1')}<span className="font-bold text-indigo-600">{t('subscription.hero_subtitle_highlight')}</span>{t('subscription.hero_subtitle_2')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col relative text-left"
          >
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('subscription.monthly.title')}</h3>
            <p className="text-slate-500 mb-6">{t('subscription.monthly.desc')}</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900">$2.99</span>
              <span className="text-slate-500 font-medium">{t('subscription.monthly.period')}</span>
              <div className="mt-2 inline-block bg-indigo-50 text-indigo-600 text-sm font-bold px-3 py-1 rounded-full">
                {t('subscription.monthly.badge')}
              </div>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {(t('subscription.features', { returnObjects: true }) as string[]).map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => subscription ? handleManageSubscription() : handleSubscribe('monthly')}
              disabled={isSubscribing || isManaging || subscription?.plan_id === 'monthly'}
              className={`w-full block text-center py-4 rounded-2xl font-bold transition-colors disabled:opacity-50 ${
                subscription?.plan_id === 'monthly' 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {subscription?.plan_id === 'monthly' ? t('subscription.button_current') : subscription ? (isManaging ? t('subscription.managing_button') : t('subscription.button_change')) : isSubscribing ? t('subscription.button_processing') : t('subscription.monthly.button')}
            </button>
          </motion.div>

          {/* Yearly Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-800 flex flex-col relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-black px-4 py-2 rounded-bl-2xl uppercase tracking-wider">
              Best Value
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{t('subscription.yearly.title')}</h3>
            <p className="text-slate-400 mb-6">{t('subscription.yearly.desc')}</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-white">$29.99</span>
              <span className="text-slate-400 font-medium">{t('subscription.yearly.period')}</span>
              <div className="mt-2 inline-block bg-white/10 text-orange-400 text-sm font-bold px-3 py-1 rounded-full">
                {t('subscription.yearly.badge')}
              </div>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {(t('subscription.features', { returnObjects: true }) as string[]).map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300 font-medium">
                  <Check className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => subscription ? handleManageSubscription() : handleSubscribe('yearly')}
              disabled={isSubscribing || isManaging || subscription?.plan_id === 'yearly'}
              className={`w-full block text-center py-4 rounded-2xl font-bold transition-colors shadow-lg disabled:opacity-50 ${
                subscription?.plan_id === 'yearly'
                  ? 'bg-white/10 text-white border border-white/20 shadow-none'
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/30'
              }`}
            >
              {subscription?.plan_id === 'yearly' ? t('subscription.button_current') : subscription ? (isManaging ? t('subscription.managing_button') : t('subscription.button_change')) : isSubscribing ? t('subscription.button_processing') : t('subscription.yearly.button')}
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function AdminView({ attendanceList, isLoadingAdmin, fetchAttendance }: any) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'ja' ? 'ja-JP' : 'en-US';
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'attendance' | 'students' | 'terminals'>('attendance');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [terminalsList, setTerminalsList] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingTerminals, setIsLoadingTerminals] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editingTerminal, setEditingTerminal] = useState<any | null>(null);
  const [newStudent, setNewStudent] = useState({
    name: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ id: string; url: string; name: string; time: string; imagePath: string } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [kioskToken, setKioskToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [deletingTerminalId, setDeletingTerminalId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const placeInfoStr = localStorage.getItem('checki_admin_place_info');
  const placeInfo = placeInfoStr ? JSON.parse(placeInfoStr) : null;

  useEffect(() => {
    if (placeInfo?.language && placeInfo.language !== i18n.language) {
      i18n.changeLanguage(placeInfo.language);
    }
  }, [placeInfo?.language, i18n]);

  const handleLanguageChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    if (placeInfo?.id) {
      try {
        await supabase.from('checki_places').update({ language: lang }).eq('id', placeInfo.id);
        const updatedPlace = { ...placeInfo, language: lang };
        localStorage.setItem('checki_admin_place_info', JSON.stringify(updatedPlace));
      } catch (err) {
        console.error('Failed to update language in DB', err);
      }
    }
  };

  const [isAdminSubscribed, setIsAdminSubscribed] = useState(false);
  const [isSubscribingAdmin, setIsSubscribingAdmin] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const checkAdminSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const { data } = await supabase
          .from('checki_push_subscriptions')
          .select('id')
          .eq('place_id', placeInfo?.id)
          .contains('subscription', { endpoint: subscription.endpoint })
          .maybeSingle();
        setIsAdminSubscribed(!!data);
      } else {
        setIsAdminSubscribed(false);
      }
    } catch (err) {
      console.error('Error checking admin subscription:', err);
    }
  };

  useEffect(() => {
    checkAdminSubscription();
  }, [placeInfo?.id]);

  const subscribeToAdminPush = async () => {
    setIsSubscribingAdmin(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showNotification(t('admin.notifications.permission_denied'), 'error');
        return;
      }

      const swReg = await navigator.serviceWorker.register('/sw.js?v=1.7');
      const registration = await navigator.serviceWorker.ready;
      
      const response = await fetch('/api/vapid-public-key');
      const { publicKey } = await response.json();
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      const { error } = await supabase
        .from('checki_push_subscriptions')
        .insert({
          place_id: placeInfo.id,
          member_code: 'ADMIN', // DB 제약 조건 방지를 위한 더미 값
          phone_number: 'ADMIN', // DB 제약 조건 방지를 위한 더미 값
          subscription: subscription.toJSON()
        });

      if (error) throw error;
      setIsAdminSubscribed(true);
      showNotification(t('admin.notifications.subscribe_success'));
    } catch (error: any) {
      console.error('Admin subscription error:', error);
      showNotification(t('admin.notifications.subscribe_error'), 'error');
    } finally {
      setIsSubscribingAdmin(false);
    }
  };

  const unsubscribeFromAdminPush = async () => {
    if (!confirm(t('admin.notifications.unsubscribe_confirm'))) return;
    setIsSubscribingAdmin(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await supabase
          .from('checki_push_subscriptions')
          .delete()
          .eq('place_id', placeInfo.id)
          .contains('subscription', { endpoint: subscription.endpoint });
      }
      setIsAdminSubscribed(false);
      showNotification(t('admin.notifications.unsubscribe_success'));
    } catch (error) {
      console.error('Admin unsubscription error:', error);
      showNotification(t('admin.notifications.unsubscribe_error'), 'error');
    } finally {
      setIsSubscribingAdmin(false);
    }
  };

  const testAdminPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          payload: {
            title: t('admin.notifications.test_title', { title: t('admin.title') }),
            body: t('admin.notifications.test_body'),
            url: '/admin',
            icon: '/icon.svg',
            badge: '/badge.svg',
            timestamp: Date.now()
          }
        })
      });
      if (response.ok) {
        showNotification(t('admin.notifications.test_success'));
      }
    } catch (err) {
      showNotification(t('admin.notifications.test_error'), 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    let intervalId: number;
    if (kioskToken && placeInfo?.id) {
      const initialCount = terminalsList.length;
      intervalId = window.setInterval(async () => {
        try {
          const response = await fetch(`/api/terminals/${placeInfo.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.length > initialCount) {
              setTerminalsList(data);
              setKioskToken(null);
              showNotification(t('admin.messages.register_success'));
            }
          }
        } catch (error) {
          console.error('Error polling terminals:', error);
        }
      }, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kioskToken, placeInfo?.id, terminalsList.length, t]);

  const viewPhoto = async (item: any) => {
    if (!item.image_url) {
      showNotification(t('admin.messages.no_photo_data'), 'error');
      return;
    }

    setIsDecrypting(true);
    try {
      const [imagePath, ivString] = item.image_url.split('|');
      if (!imagePath || !ivString) throw new Error('잘못된 이미지 데이터 형식입니다.');

      // 1. Download encrypted file from storage
      const { data, error } = await supabase
        .storage
        .from('checki-attendance-images')
        .download(imagePath);

      if (error) throw error;
      if (!data) throw new Error('파일을 찾을 수 없습니다.');

      // 2. Decrypt the blob
      const decryptedBlob = await decryptBlob(data, ivString);
      const url = URL.createObjectURL(decryptedBlob);

      setSelectedPhoto({
        id: item.id,
        url,
        name: item.student?.name || t('admin.messages.unregistered_member'),
        time: new Date(item.timestamp).toLocaleString(dateLocale),
        imagePath
      });

      // Update viewed_at status if not already set
      if (!item.viewed_at) {
        try {
          const response = await fetch(`/api/attendance/${item.id}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            // Refresh list to remove red dot
            fetchAttendance();
          }
        } catch (err) {
          console.error('Error updating viewed status:', err);
        }
      }
    } catch (error: any) {
      console.error('Error viewing photo:', error);
      showNotification(t('admin.messages.fetch_photo_error') + ': ' + error.message, 'error');
    } finally {
      setIsDecrypting(false);
    }
  };

  const deletePhoto = async () => {
    if (!selectedPhoto || !confirm(t('common.photo_modal.delete_confirm'))) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/attendance/${selectedPhoto.id}/photo`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('common.photo_modal.delete_error'));
      }
      
      showNotification(t('common.photo_modal.delete_success'));
      closePhoto();
      fetchAttendance(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting photo:', err);
      showNotification(t('common.photo_modal.delete_error') + ': ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const savePhoto = () => {
    if (!selectedPhoto) return;
    const link = document.createElement('a');
    link.href = selectedPhoto.url;
    link.download = `checki_${selectedPhoto.name}_${selectedPhoto.time.replace(/[:\s]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closePhoto = () => {
    if (selectedPhoto?.url) {
      URL.revokeObjectURL(selectedPhoto.url);
    }
    setSelectedPhoto(null);
  };

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const placeInfoStr = localStorage.getItem('checki_admin_place_info');
      const placeInfo = placeInfoStr ? JSON.parse(placeInfoStr) : null;
      const placeId = placeInfo?.id;

      // 1. Fetch students
      let query = supabase
        .from('checki_members')
        .select('*')
        .order('name', { ascending: true });

      if (placeId) {
        query = query.eq('place_id', placeId);
      }

      const { data: students, error: studentsError } = await query;
      if (studentsError) throw studentsError;

      // 2. Fetch latest history for each student to show "Recent Activity"
      let history: any[] = [];
      try {
        if (placeId) {
          const { data: historyData, error: historyError } = await supabase
            .from('checki_history')
            .select('child_name, child_id, timestamp')
            .eq('place_id', placeId)
            .order('timestamp', { ascending: false });
          
          if (!historyError) {
            history = historyData || [];
          }
        }
      } catch (e) {
        console.warn('Failed to fetch history for students list:', e);
      }

      const mappedStudents = (students || []).map(student => {
        const lastActivity = history.find(h => h.child_id === student.id || h.child_name === student.name);
        return {
          ...student,
          last_activity_at: lastActivity ? lastActivity.timestamp : null
        };
      });

      setStudentsList(mappedStudents);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      showNotification(t('admin.messages.fetch_members_error'), 'error');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    setSearchTerm(''); // Clear search term when switching tabs
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'terminals') {
      fetchTerminals();
    } else if (activeTab === 'attendance') {
      fetchAttendance();
      fetchStudents();
    }
  }, [activeTab]);

  const fetchTerminals = async () => {
    setIsLoadingTerminals(true);
    try {
      const placeInfoStr = localStorage.getItem('checki_admin_place_info');
      const placeInfo = placeInfoStr ? JSON.parse(placeInfoStr) : null;
      const placeId = placeInfo?.id;

      const response = await fetch(`/api/terminals/${placeId}`);
      const data = await response.json();
      if (response.ok) {
        setTerminalsList(data);
      }
    } catch (error) {
      console.error('Error fetching terminals:', error);
    } finally {
      setIsLoadingTerminals(false);
    }
  };

  const deleteTerminal = async (terminalId: string) => {
    try {
      const response = await fetch(`/api/terminals/${terminalId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showNotification(t('admin.messages.delete_terminal_success', { title: t('admin.title') }));
        setDeletingTerminalId(null);
        fetchTerminals();
      } else {
        throw new Error(t('admin.messages.delete_terminal_error'));
      }
    } catch (error) {
      console.error('Error deleting terminal:', error);
      showNotification(t('admin.messages.delete_terminal_error'), 'error');
    }
  };

  const handleDeleteRecord = async () => {
    if (!deletingRecordId) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/attendance/${deletingRecordId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(t('admin.messages.delete_record_error'));
      }
      
      showNotification(t('admin.messages.delete_record_success'));
      setDeletingRecordId(null);
      fetchAttendance(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting record:', err);
      showNotification(err.message || t('admin.messages.delete_record_error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name) return;
    
    setIsSaving(true);
    try {
      const placeInfoStr = localStorage.getItem('checki_admin_place_info');
      const placeInfo = placeInfoStr ? JSON.parse(placeInfoStr) : null;
      const placeId = placeInfo?.id;

      if (!placeId) {
        throw new Error(t('admin.messages.no_place_info'));
      }

      // Check if name already exists for this school
      const { data: existing, error: checkError } = await supabase
        .from('checki_members')
        .select('name')
        .eq('name', newStudent.name)
        .eq('place_id', placeId)
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error(t('admin.messages.already_registered_name'));
      }

      const memberData = {
        name: newStudent.name,
        place_id: placeId
      };

      const { error } = await supabase
        .from('checki_members')
        .insert([memberData]);
      
      if (error) throw error;
      
      showNotification(t('admin.messages.register_success'));
      setNewStudent({ name: '' });
      setIsRegistering(false);
      fetchAttendance();
      if (activeTab === 'students') fetchStudents();
    } catch (error: any) {
      console.error('Error registering student:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    setIsSaving(true);
    try {
      const placeInfoStr = localStorage.getItem('checki_admin_place_info');
      const placeInfo = placeInfoStr ? JSON.parse(placeInfoStr) : null;
      const placeId = placeInfo?.id;

      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          name: editingStudent.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('admin.messages.edit_member_error'));
      }
      
      showNotification(t('admin.messages.edit_member_success'));
      setEditingStudent(null);
      fetchStudents();
      fetchAttendance();
    } catch (error: any) {
      console.error('Error updating student:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerminal) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/terminals/${editingTerminal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editingTerminal.name })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('admin.messages.delete_terminal_error'));
      }
      
      showNotification(t('admin.messages.edit_terminal_success'));
      setEditingTerminal(null);
      fetchTerminals();
    } catch (error: any) {
      console.error('Error updating terminal:', error);
      showNotification(t('admin.messages.delete_terminal_error') + ': ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!placeInfo) {
      showNotification(t('admin.messages.no_place_info'), 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/students/${studentId}?placeId=${placeInfo.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('admin.messages.delete_error'));
      }
      
      showNotification(t('admin.messages.delete_success'));
      setDeletingStudentId(null);
      fetchStudents();
      fetchAttendance();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAttendance = attendanceList.filter((item: any) => {
    const search = searchTerm.toLowerCase();
    const nameToSearch = item.student?.name || item.child_name || '';
    return (
      nameToSearch.toLowerCase().includes(search) ||
      (item.student?.contact_number || '').toLowerCase().includes(search)
    );
  });

  const filteredStudents = studentsList.filter((student: any) => {
    const search = searchTerm.toLowerCase();
    return (
      (student.name || '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AnimatePresence>
        {notification && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex items-center gap-3 p-4 rounded-2xl shadow-xl border ${
                notification.type === 'success' 
                  ? 'bg-white border-emerald-100 text-emerald-800' 
                  : 'bg-white border-red-100 text-red-800'
              }`}
            >
              {notification.type === 'success' ? (
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                  <Check className="w-5 h-5" strokeWidth={3} />
                </div>
              ) : (
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <p className="font-bold flex-1">{notification.message}</p>
              <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Admin Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 shrink-0">
                <Check className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{t('admin.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative lg:hidden">
                <select
                  value={i18n.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="appearance-none pl-2 pr-6 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/50 cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative lg:hidden">
                <button 
                  onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                  className={`flex items-center gap-2 transition-colors p-2 rounded-xl ${
                    isAdminSubscribed ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                  }`}
                  title={t('admin.buttons.notifications')}
                >
                  {isAdminSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </button>

                <AnimatePresence>
                  {showNotificationSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-[100]"
                    >
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-orange-500" />
                        {t('admin.notifications.title')}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        {t('admin.notifications.desc', { members: t('admin.tabs.members'), title: t('admin.title') })}
                      </p>
                      
                      <div className="space-y-2">
                        {!isAdminSubscribed ? (
                          <button
                            onClick={() => {
                              subscribeToAdminPush();
                              setShowNotificationSettings(false);
                            }}
                            disabled={isSubscribingAdmin}
                            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                          >
                            {isSubscribingAdmin ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Bell className="w-3 h-3" />
                                {t('admin.notifications.subscribe')}
                              </>
                            )}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={testAdminPush}
                              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <Zap className="w-3 h-3" />
                              {t('admin.notifications.test')}
                            </button>
                            <button
                              onClick={() => {
                                unsubscribeFromAdminPush();
                                setShowNotificationSettings(false);
                              }}
                              disabled={isSubscribingAdmin}
                              className="w-full py-2.5 bg-white border border-slate-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <BellOff className="w-3 h-3" />
                              {t('admin.notifications.unsubscribe')}
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link 
                to="/admin/subscription"
                className="lg:hidden flex items-center gap-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors p-2 rounded-xl"
                title={t('admin.buttons.subscription')}
              >
                <CreditCard className="w-5 h-5" />
              </Link>

              <Link 
                to="/admin/settings"
                className="lg:hidden flex items-center gap-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors p-2 rounded-xl"
                title={t('admin.buttons.settings')}
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex flex-wrap items-center gap-2 justify-end">
            <div className="relative">
              <select
                value={i18n.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/50 cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className={`flex items-center gap-2 transition-colors p-2 rounded-xl ${
                  isAdminSubscribed ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                }`}
                title={t('admin.buttons.notifications')}
              >
                {isAdminSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                <span className="text-sm font-bold">{t('admin.buttons.notifications')}</span>
              </button>

              <AnimatePresence>
                {showNotificationSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-[100]"
                  >
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-500" />
                      {t('admin.notifications.title')}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      {t('admin.notifications.desc', { members: t('admin.tabs.members'), title: t('admin.title') })}
                    </p>
                    
                    <div className="space-y-2">
                      {!isAdminSubscribed ? (
                        <button
                          onClick={() => {
                            subscribeToAdminPush();
                            setShowNotificationSettings(false);
                          }}
                          disabled={isSubscribingAdmin}
                          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          {isSubscribingAdmin ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Bell className="w-3 h-3" />
                              {t('admin.notifications.subscribe')}
                            </>
                          )}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={testAdminPush}
                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                          >
                            <Zap className="w-3 h-3" />
                            {t('admin.notifications.test')}
                          </button>
                          <button
                            onClick={() => {
                              unsubscribeFromAdminPush();
                              setShowNotificationSettings(false);
                            }}
                            disabled={isSubscribingAdmin}
                            className="w-full py-2.5 bg-white border border-slate-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                          >
                            <BellOff className="w-3 h-3" />
                            {t('admin.notifications.unsubscribe')}
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link 
              to="/admin/subscription"
              className="flex items-center gap-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors p-2 rounded-xl"
              title={t('admin.buttons.subscription')}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-bold">{t('admin.buttons.subscription')}</span>
            </Link>

            <Link 
              to="/admin/settings"
              className="flex items-center gap-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors p-2 rounded-xl"
              title={t('admin.buttons.settings')}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-bold">{t('admin.buttons.settings')}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6 pb-24">
        {/* Main Table Area */}
        <div className="flex flex-col gap-4">
          <div className="px-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {activeTab === 'attendance' ? (
                  <>
                    <Clock className="w-5 h-5 text-orange-500" />
                    {t('admin.tabs.attendance')}
                  </>
                ) : activeTab === 'students' ? (
                  <>
                    <Users className="w-5 h-5 text-orange-500" />
                    {t('admin.tabs.members')}
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-orange-500" />
                    {t('admin.tabs.terminals')}
                  </>
                )}
              </h2>
            </div>
            
            <div className="flex items-center justify-end">
              {activeTab === 'attendance' && (
                <div className="relative">
                  <select
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 text-white bg-orange-500 hover:bg-orange-600 transition-colors rounded-xl font-bold shadow-md shadow-orange-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                  >
                    <option value="">{t('admin.search.all')} {t('admin.tabs.members')}</option>
                    {studentsList.map(student => (
                      <option key={student.id} value={student.name}>{student.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white pointer-events-none" />
                </div>
              )}
              {activeTab === 'students' && (
                <button 
                  onClick={() => setIsRegistering(true)}
                  className="flex items-center gap-2 text-white bg-orange-500 hover:bg-orange-600 transition-colors px-3 py-1.5 rounded-xl font-bold shadow-md shadow-orange-100 text-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('admin.buttons.register_member')}</span>
                </button>
              )}
              {activeTab === 'terminals' && (
                <button 
                  onClick={async () => {
                    setIsGeneratingToken(true);
                    try {
                      const response = await fetch('/api/kiosk/generate-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ placeId: placeInfo?.id }),
                      });
                      const data = await response.json();
                      if (data.token) {
                        setKioskToken(data.token);
                      }
                    } catch (err) {
                      console.error('Error generating token:', err);
                      showNotification(t('admin.messages.token_fail'), 'error');
                    } finally {
                      setIsGeneratingToken(false);
                    }
                  }}
                  disabled={isGeneratingToken}
                  className="flex items-center gap-2 text-white bg-blue-500 hover:bg-blue-600 transition-colors px-3 py-1.5 rounded-xl font-bold shadow-md shadow-blue-100 disabled:opacity-50 text-sm"
                >
                  {isGeneratingToken ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>{t('admin.buttons.register_terminal')}</span>
                </button>
              )}
            </div>
          </div>

          <div className="">
            {activeTab === 'attendance' ? (
              <div className="flex flex-col gap-3">
                {isLoadingAdmin ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium">{t('admin.messages.loading')}</p>
                  </div>
                ) : filteredAttendance.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-medium">
                    {searchTerm ? t('admin.messages.no_search_results') : t('admin.messages.no_records')}
                  </div>
                ) : (
                  Object.entries(
                    filteredAttendance.reduce((acc: any, item: any) => {
                      const dateStr = new Date(item.timestamp).toLocaleDateString(dateLocale, { month: 'long', day: 'numeric', weekday: 'short' });
                      if (!acc[dateStr]) acc[dateStr] = [];
                      acc[dateStr].push(item);
                      return acc;
                    }, {})
                  ).map(([dateStr, items]: [string, any], groupIndex) => (
                    <div key={dateStr} className="flex flex-col gap-3">
                      <h3 className="text-sm font-bold text-slate-500 mt-2 mb-1 pl-2">{dateStr}</h3>
                      {items.map((item: any, index: number) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                          className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-row items-center justify-between gap-4 group hover:border-orange-200 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => viewPhoto(item)}
                              disabled={isDecrypting || !item.image_url}
                              className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                                item.image_url 
                                  ? 'bg-orange-50 text-orange-500 hover:bg-orange-100 cursor-pointer' 
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                              title={item.image_url ? t('admin.photo.view') : t('admin.photo.none')}
                            >
                              <ImageIcon className="w-6 h-6" />
                              {item.image_url && !item.viewed_at && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-slate-800 text-lg">{item.student?.name || item.child_name}</p>
                                <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-sm font-bold">
                                  {item.activity_type || t('admin.status.verified')}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(item.timestamp).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                
                                {(item.terminal_name || item.terminal?.name || (item.lat && item.lng)) && (
                                  <>
                                    <span className="text-slate-300">|</span>
                                    {item.lat && item.lng ? (
                                      <button 
                                        onClick={() => setSelectedLocation({ lat: item.lat, lng: item.lng, name: item.terminal_name || item.terminal?.name || t('admin.location.terminal') })}
                                        className="text-blue-500 hover:underline flex items-center gap-1"
                                      >
                                        <MapPin className="w-3.5 h-3.5" />
                                        {item.terminal_name || item.terminal?.name || (item.terminal_id ? `${t('admin.location.terminal')}(${item.terminal_id.slice(0, 4)})` : t('admin.location.view'))}
                                      </button>
                                    ) : (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {item.terminal_name || item.terminal?.name || item.terminal_id || t('admin.location.terminal')}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setDeletingRecordId(item.id)}
                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0 ml-auto"
                            title={t('common.photo_modal.delete')}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'students' ? (
              <div className="flex flex-col gap-3">
                {isLoadingStudents ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium">{t('admin.messages.loading_members')}</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-medium">
                    {searchTerm ? t('admin.messages.no_search_results') : t('admin.messages.no_members', { members: t('admin.tabs.members') })}
                  </div>
                ) : (
                  filteredStudents.map((student: any, index: number) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between gap-4 group hover:border-orange-200 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                          <User className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-lg">{student.name}</p>
                      </div>
                      
                      <button 
                        onClick={() => setEditingStudent(student)}
                        className="p-3 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all shrink-0"
                        title={t('admin.buttons.settings')}
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {isLoadingTerminals ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium">{t('admin.messages.loading')}</p>
                  </div>
                ) : terminalsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-medium">
                    {t('admin.messages.no_terminals', { title: t('admin.title') })}
                  </div>
                ) : (
                  terminalsList.map((terminal: any, index: number) => (
                    <motion.div
                      key={terminal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between gap-4 group hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{terminal.name}</p>
                          <div className="flex flex-col gap-0.5 mt-1">
                            {terminal.last_lat && terminal.last_lng ? (
                              <button 
                                onClick={() => setSelectedLocation({ lat: terminal.last_lat, lng: terminal.last_lng, name: terminal.name })}
                                className="text-blue-500 hover:underline text-xs flex items-center gap-1 font-medium"
                              >
                                <MapPin className="w-3 h-3" />
                                {t('admin.messages.view_location')}
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs font-medium">{t('admin.messages.no_location_info')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setEditingTerminal(terminal)}
                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0"
                        title={t('admin.buttons.settings')}
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] z-40">
        <div className="max-w-md mx-auto flex justify-around items-center p-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex flex-col items-center gap-1 p-2 w-full rounded-xl transition-all ${
              activeTab === 'attendance'
                ? 'text-orange-500'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-6 h-6" />
            <span className="text-[10px] font-bold">{t('admin.tabs.attendance')}</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex flex-col items-center gap-1 p-2 w-full rounded-xl transition-all ${
              activeTab === 'students'
                ? 'text-orange-500'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold">{t('admin.tabs.members')}</span>
          </button>
          <button
            onClick={() => setActiveTab('terminals')}
            className={`flex flex-col items-center gap-1 p-2 w-full rounded-xl transition-all ${
              activeTab === 'terminals'
                ? 'text-orange-500'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Camera className="w-6 h-6" />
            <span className="text-[10px] font-bold">{t('admin.tabs.terminals')}</span>
          </button>
        </div>
      </div>

      {/* Student Registration Modal */}
      <AnimatePresence>
        {isRegistering && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegistering(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">{t('admin.messages.register_member_title', { members: t('admin.tabs.members') })}</h3>
                  <button onClick={() => setIsRegistering(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <input 
                      required
                      type="text"
                      placeholder={t('admin.messages.member_name_placeholder')}
                      value={newStudent.name}
                      onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>{t('admin.messages.save')}</span>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingStudent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">{t('admin.messages.edit_member_title', { members: t('admin.tabs.members') })}</h3>
                  <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateStudent} className="space-y-6">
                  <div>
                    <input 
                      required
                      type="text"
                      placeholder={t('admin.messages.member_name_placeholder')}
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-bold text-slate-700"
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.messages.registration_date')}</span>
                      <span className="text-sm font-bold text-slate-600">
                        {new Date(editingStudent.created_at).toLocaleDateString(dateLocale)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.messages.last_activity')}</span>
                      <span className="text-sm font-bold text-slate-600">
                        {editingStudent.last_activity_at 
                          ? `${new Date(editingStudent.last_activity_at).toLocaleDateString(dateLocale)} ${new Date(editingStudent.last_activity_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}`
                          : t('admin.messages.no_activity')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      {t('admin.messages.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingStudentId(editingStudent.id);
                        setEditingStudent(null);
                      }}
                      className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-all"
                    >
                      {t('admin.messages.delete')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        t('admin.messages.save')
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Terminal Modal */}
      <AnimatePresence>
        {editingTerminal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTerminal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">{t('admin.messages.edit_terminal_title')}</h3>
                  <button onClick={() => setEditingTerminal(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateTerminal} className="space-y-6">
                  <div>
                    <input 
                      required
                      type="text"
                      placeholder={t('admin.messages.terminal_name_placeholder')}
                      value={editingTerminal.name}
                      onChange={(e) => setEditingTerminal({...editingTerminal, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-bold text-slate-700"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.messages.id')}</span>
                        <span className="text-xs font-mono font-bold text-slate-600">
                          {editingTerminal.id}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.messages.registration_date')}</span>
                        <span className="text-sm font-bold text-slate-600">
                          {new Date(editingTerminal.created_at).toLocaleDateString(dateLocale)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">최근 활동</span>
                        <span className="text-sm font-bold text-slate-600">
                          {editingTerminal.last_seen_at 
                            ? `${new Date(editingTerminal.last_seen_at).toLocaleDateString(dateLocale)} ${new Date(editingTerminal.last_seen_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}`
                            : '기록 없음'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingTerminal(null)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      {t('admin.messages.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingTerminalId(editingTerminal.id);
                        setEditingTerminal(null);
                      }}
                      className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-all"
                    >
                      {t('admin.messages.delete')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        t('admin.messages.save')
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLocation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLocation(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-500" />
                  {t('admin.location.title', { name: selectedLocation.name })}
                </h3>
                <button onClick={() => setSelectedLocation(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="w-full h-[400px] bg-slate-100">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=15&output=embed`}
                ></iframe>
              </div>
              <div className="p-6 bg-slate-50 flex items-center justify-between">
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {t('admin.location.disclaimer')}
                </p>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
                >
                  {t('admin.terminal_qr.close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePhoto}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedPhoto.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedPhoto.time}</p>
                </div>
                <button onClick={closePhoto} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 bg-slate-900 aspect-video flex items-center justify-center">
                <img 
                  src={selectedPhoto.url} 
                  alt="Attendance" 
                  className="max-w-full max-h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-orange-500 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('common.photo_modal.secure_msg')}</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={deletePhoto}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {t('common.photo_modal.delete')}
                  </button>
                  <button 
                    onClick={savePhoto}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    {t('common.photo_modal.save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decrypting Loader Overlay */}
      <AnimatePresence>
        {isDecrypting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-orange-600 font-bold animate-pulse">{t('common.photo_modal.decrypting')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kiosk Registration Modal */}
      <AnimatePresence>
        {kioskToken && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setKioskToken(null);
                fetchTerminals();
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{t('admin.title')} {t('admin.terminal_qr.title')}</h3>
                <p className="text-slate-500 text-sm mt-1">{t('admin.terminal_qr.desc')}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 inline-block mb-6">
                <QRCodeCanvas 
                  value={`${window.location.origin}/kiosk/setup?token=${kioskToken}`} 
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 text-xs font-bold flex items-center justify-center gap-2 mb-6">
                <Clock className="w-4 h-4" />
                <span>{t('admin.terminal_qr.valid_time')}</span>
              </div>

              <button
                onClick={() => {
                  setKioskToken(null);
                  fetchTerminals();
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                {t('admin.terminal_qr.close')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="p-6 text-center text-slate-400 text-xs font-medium">
        {t('admin.footer')}
      </footer>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingStudentId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t('admin.messages.delete_confirm_title')}</h3>
              <p className="text-slate-500 mb-1 text-sm font-medium text-red-500">{t('admin.messages.delete_confirm_desc')}</p>
              <p className="text-slate-500 mb-8 text-sm">{t('admin.messages.delete_confirm_warning')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingStudentId(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  {t('admin.messages.cancel')}
                </button>
                <button
                  onClick={() => handleDeleteStudent(deletingStudentId)}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-100 transition-all disabled:opacity-50"
                >
                  {isSaving ? t('admin.messages.deleting') : t('admin.messages.delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terminal Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingTerminalId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t('admin.messages.delete_terminal_confirm')}</h3>
              <p className="text-slate-500 mb-8 text-sm">{t('admin.messages.delete_terminal_desc', { title: t('admin.title') })}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingTerminalId(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  {t('admin.messages.cancel')}
                </button>
                <button
                  onClick={() => deleteTerminal(deletingTerminalId)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
                >
                  {t('admin.messages.delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingRecordId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingRecordId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t('common.photo_modal.delete')}</h3>
              <p className="text-slate-500 font-medium mb-8">
                {t('admin.messages.delete_record_confirm')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingRecordId(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  {t('terminal.messages.cancel')}
                </button>
                <button
                  onClick={handleDeleteRecord}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    t('common.photo_modal.delete')
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t('admin.messages.logout_confirm_title')}</h3>
              <p className="text-slate-500 mb-8 text-sm">{t('admin.messages.logout_confirm_desc')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  {t('admin.messages.cancel')}
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('checki_admin_auth');
                    localStorage.removeItem('checki_admin_place_info');
                    navigate('/admin/login');
                  }}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  {t('admin.messages.logout')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KioskSetup({ setKioskAuth, setKioskSchoolInfo, setTerminalName }: any) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setError('유효하지 않은 접근입니다.');
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    let isMounted = true;

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/kiosk/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!isMounted) return;

        if (!response.ok) {
          throw new Error(data.error || '인증에 실패했습니다.');
        }

        localStorage.setItem('checki_kiosk_auth', 'true');
        localStorage.setItem('checki_kiosk_place_info', JSON.stringify(data.place));
        localStorage.setItem('checki_terminal_id', data.terminalId);
        
        setKioskAuth(true);
        setKioskSchoolInfo(data.place);
        
        if (data.terminalName) {
          localStorage.setItem('checki_terminal_name', data.terminalName);
          setTerminalName(data.terminalName);
        }
        setStatus('success');
        
        setTimeout(() => {
          if (isMounted) navigate('/kiosk');
        }, 2000);
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        if (err.message === 'Invalid or expired token') {
          setError(t('terminal.messages.registration.invalid_qr'));
        } else {
          setError(err.message);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate, setKioskAuth, setKioskSchoolInfo, setTerminalName, t]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl p-10 text-center border border-slate-100"
      >
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800">{t('terminal.messages.registration.registering', { title: t('admin.title') })}</h2>
            <p className="text-slate-500">{t('admin.messages.loading')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
              <Check className="w-10 h-10" strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{t('terminal.messages.success', { title: '' })}</h2>
            <p className="text-slate-500">{t('terminal.messages.registration.success', { title: t('admin.title') })}<br/>{t('terminal.messages.registration.success_desc', { title: t('admin.title') })}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-red-100">
              <X className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">등록 실패</h2>
            <p className="text-red-500 font-medium whitespace-pre-line">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function HistoryView() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'ja' ? 'ja-JP' : 'en-US';
  const { placeId: urlPlaceId } = useParams();
  const [memberCode, setStudentId] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; time: string } | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [placeInfo, setPlaceInfo] = useState<any>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Fetch place info if placeId exists
  useEffect(() => {
    if (urlPlaceId) {
      fetchPlaceInfo(urlPlaceId);
    }
  }, [urlPlaceId]);

  const fetchPlaceInfo = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('checki_places')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPlaceInfo(data);
    } catch (err) {
      console.error('Error fetching place info:', err);
    }
  };

  // Authentication Logic
  const authenticateUser = async (id: string, contact: string, placeId?: string) => {
    if (!id || !contact) return;

    const targetPlaceId = placeId || urlPlaceId;
    if (!targetPlaceId) {
      alert('장소 정보가 없습니다.');
      return;
    }

    setIsLoading(true);
    setIsSearched(false);
    try {
      // 1. Verify student and parent contact
      const { data: memberData, error: memberError } = await supabase
        .from('checki_members')
        .select('*')
        .eq('member_code', id)
        .eq('place_id', targetPlaceId)
        .single();

      if (memberError || !memberData) {
        if (localStorage.getItem('checki_parent_auth')) {
             localStorage.removeItem('checki_parent_auth');
             alert('멤버 정보를 찾을 수 없어 자동 로그인이 해제되었습니다.');
        } else {
             alert('멤버 정보를 찾을 수 없습니다.');
        }
        return;
      }

      // Simple verification
      const storedContact = memberData.contact_number.replace(/[^0-9]/g, '');
      const inputContact = contact.replace(/[^0-9]/g, '');

      if (!storedContact.includes(inputContact) || inputContact.length < 4) {
         if (localStorage.getItem('checki_parent_auth')) {
             localStorage.removeItem('checki_parent_auth');
             alert('연락처 정보가 변경되어 자동 로그인이 해제되었습니다.');
        } else {
             alert('연락처 정보가 일치하지 않습니다.');
        }
        return;
      }

      setStudentInfo({ ...memberData, placeName: placeInfo?.name || '' });

      // 2. Fetch attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('checki_history')
        .select('*')
        .eq('member_code', id)
        .eq('place_id', targetPlaceId)
        .order('timestamp', { ascending: false });

      if (attendanceError) throw attendanceError;
      setAttendance(attendanceData || []);
      
      // Save session
      localStorage.setItem('checki_parent_auth', JSON.stringify({ 
        memberCode: id, 
        parentContact: contact,
        placeId: targetPlaceId 
      }));
      
      setIsSearched(true);
    } catch (error: any) {
      console.error('Error fetching parent data:', error);
      alert('조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    const keyFromUrl = searchParams.get('key');
    const placeIdFromUrl = searchParams.get('placeId') || urlPlaceId;
    const savedAuth = localStorage.getItem('checki_parent_auth');

    if (idFromUrl && keyFromUrl) {
      // Magic Link Login (Highest Priority)
      setStudentId(idFromUrl);
      setParentContact(keyFromUrl);
      authenticateUser(idFromUrl, keyFromUrl, placeIdFromUrl || undefined);
      
      // Remove key from URL for security (visual only)
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('key');
      window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    } else if (savedAuth) {
      try {
        const { memberCode: savedId, parentContact: savedContact, placeId: savedSchoolId } = JSON.parse(savedAuth);
        
        // If we are on a specific place page, only auto-login if it matches
        if (urlPlaceId && savedSchoolId !== urlPlaceId) {
          // Don't auto-login if placeId mismatch
          if (idFromUrl) setStudentId(idFromUrl);
          return;
        }

        if (idFromUrl) {
          if (idFromUrl === savedId) {
            setStudentId(savedId);
            setParentContact(savedContact);
            authenticateUser(savedId, savedContact, savedSchoolId);
          } else {
            setStudentId(idFromUrl);
          }
        } else {
          setStudentId(savedId);
          setParentContact(savedContact);
          authenticateUser(savedId, savedContact, savedSchoolId);
        }
      } catch (e) {
        localStorage.removeItem('checki_parent_auth');
      }
    } else if (idFromUrl) {
      setStudentId(idFromUrl);
    }
  }, [searchParams, urlPlaceId]);

  if (!urlPlaceId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-3xl flex items-center justify-center mb-6">
          <Search className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">장소 ID로 접속해주세요.</h1>
        <p className="text-slate-500 mb-8">학원이나 기관에서 제공한 전용 링크로 접속해야 기록을 확인할 수 있습니다.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('checki_parent_auth');
      setIsSearched(false);
      setStudentId('');
      setParentContact('');
      setAttendance([]);
      setStudentInfo(null);
    }
  };

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, [memberCode]);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
  };

  const subscribeToPush = async () => {
    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('알림 권한이 거부되었습니다.');
        return;
      }

      console.log('Registering service worker...');
      // Use version query to bypass cache
      const swReg = await navigator.serviceWorker.register('/sw.js?v=1.7', {
        updateViaCache: 'none'
      });
      await swReg.update(); // Force update check
      console.log('Service worker registered and updated to v1.7');
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready');

      console.log('Fetching VAPID public key...');
      const response = await fetch('/api/vapid-public-key');
      if (!response.ok) {
        throw new Error(`Failed to fetch VAPID key: ${response.statusText}`);
      }
      const data = await response.json();
      const publicKey = data.publicKey;
      console.log('Received VAPID public key:', publicKey);

      if (!publicKey || typeof publicKey !== 'string') {
        throw new Error('Invalid VAPID public key received from server');
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey.trim());
      if (applicationServerKey.length === 0) {
        throw new Error('Failed to convert VAPID public key');
      }

      console.log('Subscribing to push manager...');
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Unsubscribing from existing subscription...');
        await existingSubscription.unsubscribe();
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      console.log('Subscription successful:', subscription);

      // Save subscription to Supabase
      // Check if this specific subscription already exists to avoid duplicates
      const { data: existing } = await supabase
        .from('checki_push_subscriptions')
        .select('id')
        .eq('member_code', memberCode)
        .contains('subscription', { endpoint: subscription.endpoint })
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('checki_push_subscriptions')
          .insert({
            member_code: memberCode,
            phone_number: parentContact,
            subscription: subscription.toJSON(),
          });
          
        if (error) throw error;
      } else {
        // Update phone number if it's missing or changed
        await supabase
          .from('checki_push_subscriptions')
          .update({ phone_number: parentContact })
          .eq('id', existing.id);
      }
      
      setIsSubscribed(true);
      alert('알림 등록이 완료되었습니다!');
    } catch (error: any) {
      console.error('Subscription error:', error);
      const message = error.message || '알 수 없는 오류';
      alert(`알림 등록 중 오류가 발생했습니다: ${message}\n\n브라우저 콘솔에서 자세한 에러 내용을 확인해주세요.`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!confirm('정말로 실시간 알림을 해제하시겠습니까?')) return;
    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from Supabase using phone_number OR member_code to cover all bases
        // This ensures we remove the device for this parent across all their students/schools
        const { error } = await supabase
          .from('checki_push_subscriptions')
          .delete()
          .or(`phone_number.eq.${parentContact},member_code.eq.${memberCode}`)
          .contains('subscription', { endpoint: subscription.endpoint });
          
        if (error) console.warn('DB deletion warning:', error);
      }
      setIsSubscribed(false);
      alert('알림이 해제되었습니다.');
    } catch (error) {
      console.error('Unsubscription error:', error);
      alert('알림 해제 중 오류가 발생했습니다.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestNotification = async () => {
    if (!isSubscribed) {
      alert('먼저 알림을 구독해주세요.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        alert('구독 정보를 찾을 수 없습니다.');
        return;
      }

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          payload: {
            title: `${t('admin.title')} 알림 테스트`,
            body: '알림이 정상적으로 작동합니다! 🔔',
            icon: '/icon.svg',
            badge: '/badge.svg',
            url: `/history${urlPlaceId ? `/${urlPlaceId}` : ''}?autoLogin=true&id=${memberCode}&key=${parentContact}`,
            data: { url: `/history${urlPlaceId ? `/${urlPlaceId}` : ''}?autoLogin=true&id=${memberCode}&key=${parentContact}` },
            timestamp: Date.now(),
          },
        }),
      });

      if (response.ok) {
        alert('테스트 알림을 전송했습니다. 잠시 후 알림이 도착합니다.');
      } else {
        throw new Error('알림 전송 실패');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      alert('테스트 알림 전송 중 오류가 발생했습니다.');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    authenticateUser(memberCode, parentContact);
  };

  const viewPhoto = async (item: any) => {
    if (!item.image_url) return;

    // Mark as viewed if not already viewed
    if (!item.viewed_at) {
      const now = new Date().toISOString();
      
      // Optimistic update
      setAttendance(prev => prev.map(record => 
        record.id === item.id ? { ...record, viewed_at: now } : record
      ));

      // Background DB update via server API (bypasses RLS)
      fetch(`/api/attendance/${item.id}/view`, { method: 'POST' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to update viewed status');
        })
        .catch(err => console.error('Error updating viewed status:', err));
    }

    setIsDecrypting(true);
    try {
      const [imagePath, ivString] = item.image_url.split('|');
      if (!imagePath || !ivString) throw new Error('잘못된 이미지 데이터 형식입니다.');

      const { data, error } = await supabase.storage.from('checki-attendance-images').download(imagePath);
      if (error) throw error;
      const decryptedBlob = await decryptBlob(data, ivString);
      const url = URL.createObjectURL(decryptedBlob);
      setSelectedPhoto({ url, time: new Date(item.timestamp).toLocaleString(dateLocale) });
    } catch (error: any) {
      alert('사진을 불러올 수 없습니다.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
            <UserCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">학부모 안심 서비스</h1>
            <p className="text-xs text-slate-500 font-medium">{studentInfo?.placeName || '우리 멤버 출석 확인'}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:p-6 space-y-6">
        {!isSearched ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">멤버 출석 조회</h2>
              <p className="text-slate-500 mt-2">등록된 출석 번호와 연락처를 입력해주세요.</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">출석 번호 (4자리)</label>
                <input 
                  required
                  type="text"
                  maxLength={4}
                  placeholder="예: 1234"
                  value={memberCode}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">학부모 연락처 (뒤 4자리 이상)</label>
                <input 
                  required
                  type="password"
                  placeholder="연락처 입력"
                  value={parentContact}
                  onChange={e => setParentContact(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-lg"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>조회하기</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Student Profile Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-2xl font-bold">
                {studentInfo?.name?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{studentInfo?.name} 멤버</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">
                    ID: {memberCode}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    최근 출석: {attendance.length > 0 ? new Date(attendance[0].timestamp).toLocaleDateString(dateLocale) : '기록 없음'}
                  </span>
                </div>
              </div>
              
              {/* Push Notification Toggle */}
              <div className="ml-auto flex flex-col items-end gap-2">
                {isSubscribed && (
                  <button
                    onClick={handleTestNotification}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                  >
                    <Bell className="w-3 h-3" />
                    알림 테스트
                  </button>
                )}
                <button 
                  onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                  disabled={isSubscribing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    isSubscribed 
                      ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500' 
                      : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-100'
                  }`}
                >
                  {isSubscribing ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isSubscribed ? (
                    <>
                      <BellOff className="w-3 h-3" />
                      알림 해제
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      실시간 알림 받기
                    </>
                  )}
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* Attendance History */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <History className="w-4 h-4" />
                출석 히스토리
              </h3>
              
              {attendance.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
                  <p className="text-slate-400 font-medium">출석 기록이 없습니다.</p>
                </div>
              ) : (
                Object.entries(
                  attendance.reduce((acc: any, item: any) => {
                    const dateStr = new Date(item.timestamp).toLocaleDateString(dateLocale, { month: 'long', day: 'numeric', weekday: 'short' });
                    if (!acc[dateStr]) acc[dateStr] = [];
                    acc[dateStr].push(item);
                    return acc;
                  }, {})
                ).map(([dateStr, items]: [string, any], groupIndex) => (
                  <div key={dateStr} className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-slate-500 mt-2 mb-1 pl-2">{dateStr}</h3>
                    {items.map((item: any, index: number) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                        className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {new Date(item.timestamp).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm font-bold">
                            {item.activity_type || '정상 등원'}
                          </span>
                          <button 
                            onClick={() => viewPhoto(item)}
                            disabled={!item.image_url}
                            className={`relative p-2 rounded-xl transition-all ${
                              item.image_url 
                                ? 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500' 
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <ImageIcon className="w-5 h-5" />
                            {item.image_url && !item.viewed_at && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">{t('common.photo_modal.title')}</h3>
                <button onClick={() => setSelectedPhoto(null)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="aspect-video bg-slate-900 flex items-center justify-center">
                <img src={selectedPhoto.url} alt="Attendance" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="p-6 bg-slate-50 flex flex-col items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-500 font-medium">{selectedPhoto.time}</p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-emerald-600 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('common.photo_modal.secure_msg')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedPhoto.url;
                    link.download = `checki_attendance_${selectedPhoto.time.replace(/[:\s]/g, '_')}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                >
                  <Download className="w-4 h-4" />
                  {t('common.photo_modal.save_button')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decrypting Loader */}
      <AnimatePresence>
        {isDecrypting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-emerald-600 font-bold">{t('common.photo_modal.decrypting')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="p-8 text-center">
        <p className="text-slate-400 text-xs font-medium">Checki Parent Service • Secure Attendance System</p>
      </footer>
    </div>
  );
}

// --- Main App Component ---

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('checki_admin_auth') === 'true');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAutoLogin = async () => {
      const autoLogin = searchParams.get('autoLogin');
      const placeId = searchParams.get('placeId');

      if (autoLogin === 'true' && placeId) {
        try {
          const { data, error } = await supabase
            .from('checki_places')
            .select('*')
            .eq('id', placeId)
            .single();

          if (error) throw error;
          if (data) {
            localStorage.setItem('checki_admin_auth', 'true');
            localStorage.setItem('checki_admin_place_info', JSON.stringify(data));
            setIsAuthenticated(true);
            setIsChecking(false);
            // Remove query params from URL to clean it up
            navigate('/admin', { replace: true });
            return;
          }
        } catch (err) {
          console.error("Auto login failed:", err);
        }
      }
      
      const isAuth = localStorage.getItem('checki_admin_auth') === 'true';
      if (!isAuth) {
        navigate('/admin/login');
      } else {
        setIsAuthenticated(true);
      }
      setIsChecking(false);
    };

    checkAutoLogin();
  }, [navigate, searchParams]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

export default function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPowerSaving, setIsPowerSaving] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [currentCheckiMode, setCurrentCheckiMode] = useState<string>('');
  const [directInput, setDirectInput] = useState('');
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [pendingChildName, setPendingChildName] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [kioskAuth, setKioskAuth] = useState(false);
  const [kioskSchoolInfo, setKioskSchoolInfo] = useState<any>(null);
  const [terminalName, setTerminalName] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const getModeOptions = () => {
    return [
      t('terminal.modes.attendance'),
      t('terminal.modes.leave'),
      t('terminal.modes.checki'),
      t('terminal.modes.manual')
    ];
  };

  useEffect(() => {
    if (kioskSchoolInfo && !currentCheckiMode) {
      const options = getModeOptions();
      setCurrentCheckiMode(options[0]);
    }
  }, [kioskSchoolInfo, currentCheckiMode]);

  useEffect(() => {
    const auth = localStorage.getItem('checki_kiosk_auth');
    const info = localStorage.getItem('checki_kiosk_place_info');
    const name = localStorage.getItem('checki_terminal_name');
    if (auth === 'true' && info) {
      setKioskAuth(true);
      setKioskSchoolInfo(JSON.parse(info));
      if (name) setTerminalName(name);
    }
  }, []);

  useEffect(() => {
    if (kioskSchoolInfo?.language && kioskSchoolInfo.language !== i18n.language) {
      i18n.changeLanguage(kioskSchoolInfo.language);
    }
  }, [kioskSchoolInfo?.language, i18n]);

  useEffect(() => {
    if (kioskAuth && kioskSchoolInfo?.id) {
      const fetchLatestPlaceInfo = async () => {
        try {
          const { data, error } = await supabase
            .from('checki_places')
            .select('*')
            .eq('id', kioskSchoolInfo.id)
            .single();
          
          if (data) {
            setKioskSchoolInfo(data);
            localStorage.setItem('checki_kiosk_place_info', JSON.stringify(data));
          }
        } catch (err) {
          console.error('Failed to fetch latest place info', err);
        }
      };
      fetchLatestPlaceInfo();
      
      const channel = supabase.channel(`public:checki_places:${kioskSchoolInfo.id}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'checki_places', 
          filter: `id=eq.${kioskSchoolInfo.id}` 
        }, (payload) => {
          if (payload.new) {
            setKioskSchoolInfo(payload.new);
            localStorage.setItem('checki_kiosk_place_info', JSON.stringify(payload.new));
          }
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [kioskAuth, kioskSchoolInfo?.id]);

  // Location tracking for kiosk
  useEffect(() => {
    if (!kioskAuth || location.pathname !== '/kiosk') return;

    const checkTerminalStatus = async () => {
      const terminalId = localStorage.getItem('checki_terminal_id');
      if (!terminalId) return;

      try {
        const response = await fetch(`/api/terminals/${terminalId}/status`);
        if (response.status === 404) {
          // Terminal was deleted from admin
          localStorage.removeItem('checki_kiosk_auth');
          localStorage.removeItem('checki_kiosk_place_info');
          localStorage.removeItem('checki_terminal_id');
          setKioskAuth(false);
          setKioskSchoolInfo(null);
          setTerminalName('');
          alert(t('terminal.messages.terminal_deleted', { title: t('admin.title') }));
          return false;
        }
        
        const data = await response.json();
        if (data.name) {
          setTerminalName(data.name);
          localStorage.setItem('checki_terminal_name', data.name);
        }
        
        return true;
      } catch (err) {
        console.error('Status check failed:', err);
        return true; // Assume okay on network error
      }
    };

    const updateLocation = async () => {
      const isActive = await checkTerminalStatus();
      if (!isActive) return;

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            
            // Update terminal location on server
            const terminalId = localStorage.getItem('checki_terminal_id');
            if (terminalId) {
              fetch(`/api/terminals/${terminalId}/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: latitude, lng: longitude })
              }).then(async (res) => {
                if (res.status === 404) {
                  // Terminal was deleted from admin
                  localStorage.removeItem('checki_kiosk_auth');
                  localStorage.removeItem('checki_kiosk_place_info');
                  localStorage.removeItem('checki_terminal_id');
                  setKioskAuth(false);
                  setKioskSchoolInfo(null);
                  setTerminalName('');
                  alert(t('terminal.messages.terminal_deleted', { title: t('admin.title') }));
                }
              }).catch(err => console.error('Failed to update terminal location:', err));
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
          },
          { enableHighAccuracy: true }
        );
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, 60 * 1000); // Every 1 minute
    return () => clearInterval(interval);
  }, [kioskAuth, location.pathname]);
  
  // Redirect if already in kiosk mode
  useEffect(() => {
    const auth = localStorage.getItem('checki_kiosk_auth');
    if (auth === 'true' && location.pathname === '/') {
      navigate('/kiosk');
    }
  }, [location.pathname, navigate]);

  // Admin State
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

  // Fetch attendance for admin
  useEffect(() => {
    if (location.pathname === '/admin') {
      fetchAttendance();
    }
  }, [location.pathname]);

  const fetchAttendance = async () => {
    setIsLoadingAdmin(true);
    try {
      const placeInfoStr = localStorage.getItem('checki_admin_place_info');
      const placeInfo = placeInfoStr ? JSON.parse(placeInfoStr) : null;
      const placeId = placeInfo?.id;

      // 1. Fetch attendance records
      let query = supabase
        .from('checki_history')
        .select('*')
        .order('timestamp', { ascending: false });

      if (placeId) {
        query = query.eq('place_id', placeId);
      }

      const { data: attendanceData, error: attendanceError } = await query;
      
      if (attendanceError) throw attendanceError;

      // 2. Fetch all students to join manually (more robust if foreign keys aren't set)
      let studentsQuery = supabase
        .from('checki_members')
        .select('*');

      if (placeId) {
        studentsQuery = studentsQuery.eq('place_id', placeId);
      }

      const { data: studentsData, error: studentsError } = await studentsQuery;
      
      if (studentsError) throw studentsError;

      // 3. Fetch all terminals to join manually (remove place_id filter to be more robust for joining)
      const { data: terminalsData, error: terminalsError } = await supabase
        .from('checki_terminals')
        .select('*');
      
      if (terminalsError) throw terminalsError;

      // 4. Map students and terminals to attendance
      const mappedData = (attendanceData || []).map(record => {
        const recordTerminalId = String(record.terminal_id || record.terminalId || '').toLowerCase();
        const terminal = (terminalsData || []).find(t => {
          const terminalId = String(t.id || '').toLowerCase();
          return terminalId === recordTerminalId && recordTerminalId !== '';
        });
        
        const student = (studentsData || []).find(s => {
          if (record.child_id && s.id === record.child_id) return true;
          return String(s.name).toLowerCase() === String(record.child_name).toLowerCase();
        });
        
        return {
          ...record,
          student,
          terminal
        };
      });

      setAttendanceList(mappedData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoadingAdmin(false);
    }
  };
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Idle detection logic
  useEffect(() => {
    const resetIdleTimer = () => {
      if (isPowerSaving) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsPowerSaving(true);
      }, 60000);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      activityEvents.forEach(event => window.removeEventListener(event, resetIdleTimer));
    };
  }, [isPowerSaving]);

  // Update status bar color based on power saving mode
  useEffect(() => {
    const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
    metaThemeColors.forEach(meta => {
      if (isPowerSaving) {
        meta.setAttribute('content', '#000000');
      } else {
        meta.setAttribute('content', '#F97316'); // Default orange-500
      }
    });
  }, [isPowerSaving]);

  // Always start camera on mount or when waking up
  useEffect(() => {
    if (!isPowerSaving && location.pathname === '/kiosk' && kioskAuth) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isPowerSaving, location.pathname, kioskAuth, facingMode]);

  const startCamera = async () => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: facingMode === 'user' ? { ideal: 1280 } : { ideal: 4096 },
          height: facingMode === 'user' ? { ideal: 960 } : { ideal: 2160 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const triggerInstantCapture = async (childName: string, selectedMode?: string) => {
    if (!videoRef.current || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      console.error('Video is not ready for capture');
      return;
    }

    setIsProcessing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    
    const modeToUse = selectedMode || currentCheckiMode;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Failed to get canvas context');
      setIsProcessing(false);
      return;
    }

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        setIsProcessing(false);
        return;
      }
      
      const previewUrl = URL.createObjectURL(blob);
      setCapturedImage(previewUrl);
      
      try {
        let childId: string | undefined;
        try {
          const { data } = await supabase
            .from('checki_members')
            .select('id')
            .eq('name', childName)
            .eq('place_id', kioskSchoolInfo?.id)
            .single();
          childId = data?.id;
        } catch (e) {
          console.error('Error fetching child id:', e);
        }

        const placeId = kioskSchoolInfo?.id;
        const terminalId = localStorage.getItem('checki_terminal_id') || undefined;
        const terminalName = localStorage.getItem('checki_terminal_name') || undefined;

        if (!placeId) {
          throw new Error('기관 정보(placeId)를 찾을 수 없습니다. 다시 로그인해 주세요.');
        }

        const { encryptedBlob, iv } = await encryptBlob(blob);
        await uploadAttendanceData(
          childName, 
          encryptedBlob, 
          iv, 
          placeId, 
          modeToUse, 
          terminalId, 
          currentLocation?.lat, 
          currentLocation?.lng,
          terminalName,
          childId
        );
        
        // Trigger push notification
        const notificationUrl = '/api/send-attendance-notification';
        console.log(`Triggering notification at: ${window.location.origin}${notificationUrl}`);
        fetch(notificationUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childName, placeId, activity_type: modeToUse })
        }).then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('Notification trigger failed with status:', res.status, errorData);
          } else {
            console.log('Notification trigger successful');
          }
        }).catch(err => console.error('Notification trigger network error:', err));

        setView('success');
      } catch (error) {
        console.error("Security/Upload error:", error);
        setView('error');
      } finally {
        URL.revokeObjectURL(previewUrl);
        setCapturedImage(null);
        setIsProcessing(false);
        setTimeout(() => {
          setView('idle');
        }, 1500);
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/kiosk" element={
          <AttendanceView 
            view={view} setView={setView} 
            currentTime={currentTime} videoRef={videoRef} flash={flash} 
            isProcessing={isProcessing} isPowerSaving={isPowerSaving} 
            setIsPowerSaving={setIsPowerSaving} 
            showModeSelector={showModeSelector} setShowModeSelector={setShowModeSelector}
            currentCheckiMode={currentCheckiMode} setCurrentCheckiMode={setCurrentCheckiMode}
            directInput={directInput} setDirectInput={setDirectInput}
            showDirectInput={showDirectInput} setShowDirectInput={setShowDirectInput}
            pendingChildName={pendingChildName} setPendingChildName={setPendingChildName}
            triggerInstantCapture={triggerInstantCapture}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
            kioskAuth={kioskAuth}
            setKioskAuth={setKioskAuth}
            kioskSchoolInfo={kioskSchoolInfo}
            setKioskSchoolInfo={setKioskSchoolInfo}
            getModeOptions={getModeOptions}
            terminalName={terminalName}
            facingMode={facingMode}
            setFacingMode={setFacingMode}
            restartCamera={startCamera}
          />
      } />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminView 
            attendanceList={attendanceList} 
            isLoadingAdmin={isLoadingAdmin} 
            fetchAttendance={fetchAttendance} 
          />
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute>
          <AdminSettings />
        </ProtectedRoute>
      } />
      <Route path="/admin/subscription" element={
        <ProtectedRoute>
          <SubscriptionView />
        </ProtectedRoute>
      } />
      <Route path="/register" element={<SchoolRegistration />} />
      <Route path="/kiosk/setup" element={<KioskSetup setKioskAuth={setKioskAuth} setKioskSchoolInfo={setKioskSchoolInfo} setTerminalName={setTerminalName} />} />
      <Route path="/history" element={<HistoryView />} />
      <Route path="/history/:placeId" element={<HistoryView />} />
    </Routes>
  );
}
