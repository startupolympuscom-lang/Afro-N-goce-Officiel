import React, { useState } from 'react';
import { useDispatchGazStore } from '../../../../../stores/useDispatchGazStore';
import { Users, Save, CheckCircle2, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

export default function DispatchManualPointagePage() {
  const { drivers, convoyeurs, pointages, addPointage, hasPointageToday } = useDispatchGazStore();
  const navigate = useNavigate();
  
  const todayDateStr = new Date().toISOString().split('T')[0];

  const availableDrivers = drivers.filter(d => d.status === 'actif' && !hasPointageToday(d.id));
  
  const takenConvoyeursIds = React.useMemo(() => {
    const todayPointages = pointages.filter(p => p.date === todayDateStr);
    const taken = new Set<string>();
    todayPointages.forEach(p => {
      if (p.convoyeurId) taken.add(p.convoyeurId);
      if (p.convoyeursIds) {
        p.convoyeursIds.forEach(id => taken.add(id));
      }
    });
    return taken;
  }, [pointages, todayDateStr]);

  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedConvoyeursIds, setSelectedConvoyeursIds] = useState<string[]>([]);
  const [isAlone, setIsAlone] = useState(false);

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

  const handleSave = () => {
    if (!selectedDriverId) {
      toast.error('Veuillez sélectionner un chauffeur.');
      return;
    }
    if (!isAlone && selectedConvoyeursIds.length === 0) {
      toast.error('Veuillez sélectionner au moins un convoyeur ou indiquer que le chauffeur est seul.');
      return;
    }

    const now = new Date();
    addPointage({
      id: nanoid(),
      driverId: selectedDriverId,
      convoyeursIds: isAlone ? [] : selectedConvoyeursIds,
      date: now.toISOString().split('T')[0],
      timestamp: now.toISOString()
    });

    toast.success('Pointage enregistré. Veuillez maintenant affecter le stock.');
    navigate('/dispatch/gaz/stock');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pointage Manuelle</h1>
          <p className="mt-2 text-slate-500">
            Effectuez le pointage d'un chauffeur manuellement.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 space-y-8">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Choisir le chauffeur</label>
          {availableDrivers.length === 0 ? (
            <div className="p-4 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl">
              Tous les chauffeurs actifs ont déjà pointé aujourd'hui.
            </div>
          ) : (
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- Sélectionnez un chauffeur --</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>{d.prenom} {d.nom} (CIN: {d.cin})</option>
              ))}
            </select>
          )}
        </div>

        {selectedDriverId && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-500 uppercase tracking-[0.1em]">
              <Users className="w-5 h-5" />
              Qui accompagne ce chauffeur ?
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <div className="text-left">
                    <p className="font-bold">Il est seul</p>
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
                    <div className="flex items-center gap-3">
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

            <div className="pt-6">
              <button 
                onClick={handleSave}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all hover:bg-indigo-700"
              >
                <Save className="w-6 h-6" />
                Valider le Pointage
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
