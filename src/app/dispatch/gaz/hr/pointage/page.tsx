import React, { useState, useMemo } from 'react';
import { useDispatchGazStore } from '../../../../../stores/useDispatchGazStore';
import { QrCode, Calendar, Search, History, CheckCircle2, User, Users, Clock, ChevronRight, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

export default function PointageAdminPage() {
  const { pointages, drivers, convoyeurs } = useDispatchGazStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'today' | 'history'>('today');
  const [showQrModal, setShowQrModal] = useState(false);

  // Generate QR value based on date to ensure it's "daily"
  const qrValue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return `pointage-afro-dispatch-${today}`;
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const pointageData = useMemo(() => {
    const data = pointages.map(p => {
      const driver = drivers.find(d => d.id === p.driverId);
      
      let mappedConvoyeurs: typeof convoyeurs = [];
      if (p.convoyeursIds && p.convoyeursIds.length > 0) {
        mappedConvoyeurs = p.convoyeursIds.map(id => convoyeurs.find(c => c.id === id)).filter(Boolean) as typeof convoyeurs;
      } else if (p.convoyeurId) {
        const c = convoyeurs.find(c => c.id === p.convoyeurId);
        if (c) mappedConvoyeurs = [c];
      }

      return { ...p, driver, mappedConvoyeurs };
    });

    if (view === 'today') {
      return data.filter(p => p.date === today);
    }
    return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [pointages, drivers, convoyeurs, view, today]);

  const filteredPointages = pointageData.filter(p => 
    `${p.driver?.prenom} ${p.driver?.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mappedConvoyeurs.some(c => `${c.prenom} ${c.nom}`.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
            Suivi du Pointage
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les présences quotidiennes des chauffeurs et accompagnateurs</p>
        </div>

        <button 
          onClick={() => setShowQrModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10"
        >
          <QrCode className="w-5 h-5" />
          Aperçu QR du Jour
        </button>
      </div>

      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
        <button 
          onClick={() => setView('today')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            view === 'today' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Aujourd'hui
        </button>
        <button 
          onClick={() => setView('history')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            view === 'history' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          Historique
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un chauffeur ou convoyeur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black bg-slate-50/30">
                <th className="px-8 py-5">Horodatage</th>
                <th className="px-8 py-5">Chauffeur</th>
                <th className="px-8 py-5">Accompagnateur (Convoyeur)</th>
                <th className="px-8 py-5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPointages.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">
                        {new Date(p.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{p.date}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase">{p.driver?.prenom} {p.driver?.nom}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Conducteur</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center border ${p.mappedConvoyeurs.length > 0 ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-orange-50 text-orange-400 border-orange-100'}`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        {p.mappedConvoyeurs.length > 0 ? (
                          <div className="space-y-1">
                            {p.mappedConvoyeurs.map(convoyeur => (
                              <p key={convoyeur.id} className="text-sm font-black text-slate-600 uppercase leading-none">
                                {convoyeur.prenom} {convoyeur.nom}
                              </p>
                            ))}
                            <p className="text-[10px] text-slate-400 font-medium">Assistant{p.mappedConvoyeurs.length > 1 ? 's' : ''}</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-black text-orange-600 uppercase">Seul</p>
                            <p className="text-[10px] text-orange-400 font-medium">Sans assistant</p>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-4 py-1.5 rounded-full border border-emerald-100">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Confirmé</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPointages.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                        <History className="w-8 h-8" />
                      </div>
                      <p className="text-slate-400 font-medium italic">Aucun pointage enregistré pour cette période</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal for drivers to scan */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="relative w-full max-w-xl bg-white rounded-[60px] p-12 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              
              <button 
                onClick={() => setShowQrModal(false)}
                className="absolute top-8 right-8 p-3 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-10">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">QR Code de Pointage</h2>
                <p className="text-slate-500 font-medium text-lg leading-tight">Veuillez scanner ce code pour débuter votre service</p>
                <p className="text-blue-600 font-black mt-2 uppercase tracking-widest text-[10px]">Valable pour aujourd'hui seulement</p>
              </div>

              <div className="bg-white p-8 rounded-[40px] border-4 border-slate-50 shadow-inner inline-block relative group">
                <div className="absolute inset-0 border-2 border-blue-500/20 rounded-[40px] animate-pulse pointer-events-none" />
                <QRCodeSVG 
                  value={qrValue} 
                  size={280}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="mt-12 grid grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-lg font-black text-slate-900 uppercase">
                    {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Système</p>
                  <p className="text-lg font-black text-slate-900 uppercase tracking-tighter">AFRO Négoce</p>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center gap-4 text-slate-400">
                <Shield className="w-5 h-5 text-blue-500" />
                <p className="text-xs font-bold uppercase tracking-widest">Générateur Certifié v2.4</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
