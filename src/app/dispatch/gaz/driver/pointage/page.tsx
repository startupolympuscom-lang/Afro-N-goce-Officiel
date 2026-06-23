import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatchGazStore } from '../../../../../stores/useDispatchGazStore';
import { useDispatchAuthStore } from '../../../../../stores/useDispatchAuthStore';
import { QrCode, Users, CheckCircle2, AlertCircle, Loader2, Camera, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

export default function DriverPointagePage() {
  const navigate = useNavigate();
  const { user } = useDispatchAuthStore();
  const { pointages, convoyeurs, addPointage, hasPointageToday, stockDispatches } = useDispatchGazStore();
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
      navigate('/dispatch/gaz/driver/sale');
    }
  }, [user, hasPointageToday, navigate]);

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
      setTimeout(() => {
        if (!isComponentMounted) return;
        
        try {
          const qrElement = document.getElementById("qr-reader");
          if (!qrElement) return;

          html5QrCode = new Html5Qrcode("qr-reader");

          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              const cleanedText = decodedText.trim();
              const isValidQr = cleanedText.startsWith('pointage-afro-dispatch-');

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

                  setTimeout(() => {
                    if (html5QrCode) {
                      html5QrCode.stop().catch(() => {}).finally(() => {
                        html5QrCode?.clear();
                        setIsScanning(false);
                        setAlreadyCheckedIn(true);
                        navigate('/dispatch/gaz/driver/sale');
                      });
                    } else {
                      setIsScanning(false);
                      setAlreadyCheckedIn(true);
                      navigate('/dispatch/gaz/driver/sale');
                    }
                  }, 500);
                } else {
                  if (html5QrCode) {
                    html5QrCode.stop().catch(() => {}).finally(() => {
                      html5QrCode?.clear();
                      setIsScanning(false);
                      toast.error("Veuillez sélectionner les convoyeurs ou indiquer que vous êtes seul.");
                    });
                  } else {
                    setIsScanning(false);
                    toast.error("Veuillez sélectionner les convoyeurs ou indiquer que vous êtes seul.");
                  }
                }
              } else {
                setScanStatus('error');
              }
            },
            (error) => {} // ignore local read errors
          ).catch(e => {
            console.error("Scanner start error:", e);
            toast.error("Erreur d'accès à la caméra. Vérifiez les permissions.");
            setIsScanning(false);
          });
        } catch (e) {
          console.error("Scanner initialization error:", e);
          setIsScanning(false);
        }
      }, 300); // Give 300ms for element mount and transitions to complete
    }

    return () => {
      isComponentMounted = false;
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => html5QrCode?.clear()).catch(e => console.log('Scanner cleanup error', e));
          } else {
            html5QrCode.clear();
          }
        } catch(e) {}
      }
    };
  }, [isScanning, alreadyCheckedIn, addPointage]);

  const handlePointageSuccess = () => {
    // Legacy function, kept so other calls won't break if any
  };

  if (alreadyCheckedIn) {
    return (
      <div className="max-w-xl mx-auto pt-12 pb-24 px-4 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xl shadow-emerald-500/20 border-4 border-white"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Présence Confirmée</h1>
          <p className="text-slate-500 font-medium">Votre pointage a été enregistré avec succès pour aujourd'hui.</p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Accès Autorisé</p>
            <p className="text-sm font-black text-slate-900">Vous pouvez maintenant gérer vos ventes et votre stock.</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/dispatch/gaz/driver/sale')}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          Accéder aux Ventes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pt-8 pb-32 px-4 space-y-8">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-2 justify-center md:justify-start">
          <QrCode className="w-8 h-8 text-blue-600" />
          Pointage Quotidien
        </h1>
        <p className="text-slate-500 font-medium leading-tight">Enregistrez votre présence pour activer l'accès aux outils de vente.</p>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            <Users className="w-4 h-4" />
            Qui vous accompagne ?
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
              <div className="flex items-center gap-3 animate-fade-in text-left">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  isAlone ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  👤
                </div>
                <div className="text-left">
                  <p className="font-bold">Je suis seul</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Sans assistant</p>
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
                  <div className="flex items-center gap-3 text-left">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isTaken ? 'bg-slate-200 text-slate-500' :
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {c.prenom[0]}{c.nom[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{c.prenom} {c.nom}</p>
                      <p className={`text-[10px] uppercase font-black tracking-widest ${isTaken ? 'text-red-400' : 'text-slate-400'}`}>
                        {isTaken ? 'Déjà assigné(e)' : 'Assistant'}
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
                  Démarrer le Scanner
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-950 rounded-[40px] overflow-hidden shadow-2xl relative">
                    <div id="qr-reader" className="w-full min-h-[250px]" />
                    <div className="absolute inset-0 border-8 border-white/10 pointer-events-none rounded-[40px]" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                      Scan en cours...
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsScanning(false);
                      setScanStatus('idle');
                    }}
                    className="w-full py-4 text-slate-500 font-bold text-sm hover:text-red-500 transition-colors"
                  >
                    Annuler le scan
                  </button>
                </div>
              )}

              {scanStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  Code QR invalide ou expiré pour aujourd'hui.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4 text-left font-sans">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-blue-100/50">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-black text-blue-600 uppercase tracking-[0.15em]">Sécurité &amp; Traçabilité</p>
          <p className="text-sm text-blue-800/80 font-medium leading-tight">
            Le code QR est généré chaque jour par l'administrateur. Il garantit votre présence ainsi que celle de votre assistant.
          </p>
        </div>
      </div>
    </div>
  );
}
