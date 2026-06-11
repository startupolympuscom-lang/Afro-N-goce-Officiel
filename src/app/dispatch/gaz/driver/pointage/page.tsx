import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatchGazStore } from '../../../../../stores/useDispatchGazStore';
import { useDispatchAuthStore } from '../../../../../stores/useDispatchAuthStore';
import { QrCode, Users, CheckCircle2, AlertCircle, Loader2, Camera, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { nanoid } from 'nanoid';

export default function DriverPointagePage() {
  const { user } = useDispatchAuthStore();
  const { pointages, convoyeurs, addPointage, hasPointageToday } = useDispatchGazStore();
  const [searchParams] = useSearchParams();
  const shouldAutoScan = searchParams.get('scan') === 'true';
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Identifies which convoyeurs are already taken today by another driver
  const takenConvoyeursIds = React.useMemo(() => {
    if (!user) return new Set<string>();
    
    const todayPointages = pointages.filter(p => p.date === todayDateStr && p.driverId !== user.id);
    const taken = new Set<string>();
    
    todayPointages.forEach(p => {
      if (p.convoyeurId) taken.add(p.convoyeurId);
      if (p.convoyeursIds) {
        p.convoyeursIds.forEach(id => taken.add(id));
      }
    });
    
    return taken;
  }, [pointages, user, todayDateStr]);

  const [selectedConvoyeursIds, setSelectedConvoyeursIds] = useState<string[]>([]);
  const [isAlone, setIsAlone] = useState(shouldAutoScan);
  
  const toggleConvoyeur = (id: string) => {
    setIsAlone(false);
    setSelectedConvoyeursIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleSelectAlone = () => {
    setIsAlone(true);
    setSelectedConvoyeursIds([]);
  };
  const [isScanning, setIsScanning] = useState(shouldAutoScan);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  useEffect(() => {
    if (user && hasPointageToday(user.id)) {
      setAlreadyCheckedIn(true);
    }
  }, [user, hasPointageToday]);

  const selectedConvoyeursIdsRef = React.useRef(selectedConvoyeursIds);
  const isAloneRef = React.useRef(isAlone);
  const userRef = React.useRef(user);

  useEffect(() => {
    selectedConvoyeursIdsRef.current = selectedConvoyeursIds;
    isAloneRef.current = isAlone;
    userRef.current = user;
  }, [selectedConvoyeursIds, isAlone, user]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isComponentMounted = true;

    if (isScanning && !alreadyCheckedIn) {
      // Small timeout to ensure DOM is ready and any previous animations settled
      setTimeout(() => {
        if (!isComponentMounted) return;
        
        try {
          html5QrCode = new Html5Qrcode("qr-reader");

          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              const cleanedText = decodedText.trim();
              const today = new Date().toISOString().split('T')[0];
              const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
              const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
              
              const isValidQr = 
                cleanedText === `pointage-afro-dispatch-${today}` ||
                cleanedText === `pointage-afro-dispatch-${yesterday}` || 
                cleanedText === `pointage-afro-dispatch-${tomorrow}`;

              if (isValidQr) {
                
                if (userRef.current && (isAloneRef.current || selectedConvoyeursIdsRef.current.length > 0)) {
                  const now = new Date();
                  addPointage({
                    id: nanoid(),
                    driverId: userRef.current.id,
                    convoyeursIds: isAloneRef.current ? [] : selectedConvoyeursIdsRef.current,
                    date: now.toISOString().split('T')[0],
                    timestamp: now.toISOString()
                  });
                  setScanStatus('success');
                  setIsScanning(false);
                  setAlreadyCheckedIn(true);
                }
                
                if (html5QrCode) {
                  html5QrCode.stop().catch(e => console.error("Scanner stop error on success:", e));
                  html5QrCode.clear();
                }
              } else {
                setScanStatus('error');
              }
            },
            (error) => {
              // Ignore finding errors
            }
          ).catch(e => {
            console.error("Scanner start error:", e);
          });
        } catch (e) {
          console.error("Scanner initialization error:", e);
        }
      }, 100);
    }

    return () => {
      isComponentMounted = false;
      if (html5QrCode) {
        // Try to stop first if it's scanning
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode?.clear();
          }).catch(e => console.log('Scanner cleanup error', e));
        } else {
          html5QrCode.clear();
        }
      }
    };
  }, [isScanning, alreadyCheckedIn, addPointage]);

  const handlePointageSuccess = () => {
    // Legacy function, kept so other calls won't break if any
  };

  if (alreadyCheckedIn) {
    return (
      <div className="max-w-xl mx-auto pt-12 pb-24 px-4 text-center space-y-8" dir="rtl">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xl shadow-emerald-500/20 border-4 border-white"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">تم تأكيد الحضور</h1>
          <p className="text-slate-500 font-medium">تم تسجيل خدمتك لهذا اليوم بالفعل.</p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 text-right">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">الوصول مسموح</p>
            <p className="text-sm font-black text-slate-900">يمكنك الآن إدارة مخزونك ومبيعاتك.</p>
          </div>
        </div>

        <button 
          onClick={() => window.location.href = '/dispatch/gaz/driver/sale'}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          الوصول إلى المبيعات
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pt-8 pb-32 px-4 space-y-8" dir="rtl">
      <div className="space-y-2 text-center md:text-right">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-2 justify-center md:justify-start">
          <QrCode className="w-8 h-8 text-blue-600" />
          الحضور اليومي
        </h1>
        <p className="text-slate-500 font-medium leading-tight">سجل حضورك لفتح الوصول إلى أدوات المبيعات الخاصة بك.</p>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            <Users className="w-4 h-4" />
            من يرافقك؟
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={handleSelectAlone}
              className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all ${
                isAlone 
                  ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-md' 
                  : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  isAlone ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  👤
                </div>
                <div className="text-right">
                  <p className="font-bold">أنا بمفردي</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">بدون مساعد</p>
                </div>
              </div>
              {isAlone && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
            </button>
            {convoyeurs.filter(c => c.status === 'actif').map(c => {
              const isSelected = selectedConvoyeursIds.includes(c.id);
              const isTaken = takenConvoyeursIds.has(c.id);
              
              return (
                <button
                  key={c.id}
                  disabled={isTaken}
                  onClick={() => toggleConvoyeur(c.id)}
                  className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all ${
                    isTaken 
                      ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                      : isSelected 
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-md' 
                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isTaken ? 'bg-slate-200 text-slate-500' :
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {c.prenom[0]}{c.nom[0]}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{c.prenom} {c.nom}</p>
                      <p className={`text-[10px] uppercase font-black tracking-widest ${isTaken ? 'text-red-400' : 'text-slate-400'}`}>
                        {isTaken ? 'تم تعيينه بالفعل' : 'مساعد'}
                      </p>
                    </div>
                  </div>
                  {isSelected && !isTaken && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {(isAlone || selectedConvoyeursIds.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-4 border-t border-slate-100"
            >
              {!isScanning ? (
                <button 
                  onClick={() => setIsScanning(true)}
                  className="w-full py-5 bg-slate-950 text-white rounded-[32px] font-bold text-xl flex items-center justify-center gap-3 shadow-2xl shadow-slate-950/20 active:scale-[0.98] transition-all"
                >
                  <Camera className="w-6 h-6" />
                  بدء الماسح الضوئي
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-950 rounded-[40px] overflow-hidden shadow-2xl relative">
                    <div id="qr-reader" className="w-full" />
                    <div className="absolute inset-0 border-8 border-white/10 pointer-events-none rounded-[40px]" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                      المسح الضوئي جاري
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsScanning(false)}
                    className="w-full py-4 text-slate-500 font-bold text-sm hover:text-red-500 transition-colors"
                  >
                    إلغاء المسح
                  </button>
                </div>
              )}

              {scanStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  رمز الإستجابة السريع غير صالح لهذا اليوم.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4 text-right">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-blue-100/50">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-black text-blue-600 uppercase tracking-[0.15em]">الأمن والتتبع</p>
          <p className="text-sm text-blue-800/80 font-medium leading-tight">
            يتم إنشاء رمز الإستجابة السريع يوميًا من قبل المسؤول. إنه يضمن وجودك الفعلي ووجود مساعدك.
          </p>
        </div>
      </div>
    </div>
  );
}
