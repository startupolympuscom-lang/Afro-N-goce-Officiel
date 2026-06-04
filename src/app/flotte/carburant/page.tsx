import React, { useState, useMemo } from 'react';
import { useCarburantStore } from '../../../stores/useCarburantStore';
import { useVehiculeStore } from '../../../stores/useVehiculeStore';
import { useChauffeurStore } from '../../../stores/useChauffeurStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { usePrestataireStore } from '../../../stores/usePrestataireStore';
import { 
  Plus, 
  Search, 
  Download, 
  Fuel, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  MapPin,
  Trash2,
  Printer,
  Settings,
  ChevronRight,
  ChevronDown,
  Clock,
  Filter
} from 'lucide-react';
import { formatMAD, formatDate, formatDatetime } from '../../../lib/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { AfroNegoceLogo } from '../../../components/Logo';

export default function CarburantPage() {
  const { tickets, stationInterne, addTicket, deleteTicket, resetStationStock } = useCarburantStore();
  const vehicules = useVehiculeStore(s => s.vehicules);
  const chauffeurs = useChauffeurStore(s => s.chauffeurs);
  const prestataires = usePrestataireStore(s => s.prestataires);
  const user = useAuthStore(s => s.user);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isApprovisionnerModalOpen, setIsApprovisionnerModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'month' | 'range' | 'all'>('month');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [ticketToPrint, setTicketToPrint] = useState<any>(null);
  const [expandedVehicule, setExpandedVehicule] = useState<string | null>(null);

  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  // Helper to calculate L/100km for a ticket
  const getEfficiency = (ticketId: string) => {
    const currentTicket = tickets.find(t => t.id === ticketId);
    if (!currentTicket) return null;

    // Find the immediate previous ticket for this vehicle
    const vehicleTickets = tickets
      .filter(t => t.vehiculeId === currentTicket.vehiculeId && new Date(t.dateHeure) < new Date(currentTicket.dateHeure))
      .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
    
    const prevTicket = vehicleTickets[0];
    if (!prevTicket || currentTicket.kilometrageAuPlein <= prevTicket.kilometrageAuPlein) return null;

    const distance = currentTicket.kilometrageAuPlein - prevTicket.kilometrageAuPlein;
    const l100 = (currentTicket.volume / distance) * 100;
    return { l100, distance };
  };

  // Form state
  const [vehiculeId, setVehiculeId] = useState('');
  const [chauffeurId, setChauffeurId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [km, setKm] = useState<string>('0');
  const [volume, setVolume] = useState<string>('0');
  const [prixLitre, setPrixLitre] = useState<string>('0');
  const [lieu, setLieu] = useState<'interne' | 'externe'>('interne');
  const [prestataireId, setPrestataireId] = useState('');
  const [typeCarburant, setTypeCarburant] = useState<'diesel' | 'essence'>('diesel');
  const [notes, setNotes] = useState('');

  // Approvisionner form state
  const [approvVolume, setApprovVolume] = useState<string>('');
  const [approvDate, setApprovDate] = useState(new Date().toISOString().split('T')[0]);
  const [approvFournisseur, setApprovFournisseur] = useState('');
  const [approvPrixLitre, setApprovPrixLitre] = useState<string>('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const parsedVolume = parseFloat(volume) || 0;
  const parsedPrixLitre = parseFloat(prixLitre) || 0;
  const parsedKm = parseFloat(km) || 0;

  const pctStock = stationInterne.capacite > 0 ? (stationInterne.stockActuel / stationInterne.capacite) * 100 : 0;

  const consumptionStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const statsMap = new Map<string, { 
      current: number, 
      previous: number, 
      refills: number, 
      effCurrent: number, 
      effCountCurrent: number,
      effPrevious: number,
      effCountPrevious: number
    }>();

    // Sort tickets globally to calculate efficiency chronologically
    const sortedAllTickets = [...tickets].sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime());
    const lastKmMap = new Map<string, number>();

    sortedAllTickets.forEach(t => {
      const vId = t.vehiculeId;
      const vol = t.volume;
      const km = t.kilometrageAuPlein;
      const date = new Date(t.dateHeure);

      if (!statsMap.has(vId)) {
        statsMap.set(vId, { 
          current: 0, 
          previous: 0, 
          refills: 0, 
          effCurrent: 0, 
          effCountCurrent: 0,
          effPrevious: 0,
          effCountPrevious: 0
        });
      }

      const stats = statsMap.get(vId)!;
      const prevKm = lastKmMap.get(vId);
      
      if (prevKm && km > prevKm) {
        const dist = km - prevKm;
        const eff = (vol / dist) * 100;
        
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          stats.effCurrent = (stats.effCurrent * stats.effCountCurrent + eff) / (stats.effCountCurrent + 1);
          stats.effCountCurrent++;
        } else if (date.getMonth() === prevMonth && date.getFullYear() === prevYear) {
          stats.effPrevious = (stats.effPrevious * stats.effCountPrevious + eff) / (stats.effCountPrevious + 1);
          stats.effCountPrevious++;
        }
      }
      
      lastKmMap.set(vId, km);

      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        stats.current += vol;
        stats.refills++;
      } else if (date.getMonth() === prevMonth && date.getFullYear() === prevYear) {
        stats.previous += vol;
      }
    });

    const results = Array.from(statsMap.entries()).map(([vId, data]) => {
      const v = vehicules.find(v => v.id === vId);
      let diffEffPct = 0;
      if (data.effPrevious > 0 && data.effCurrent > 0) {
        diffEffPct = ((data.effCurrent - data.effPrevious) / data.effPrevious) * 100;
      }

      return {
        id: vId,
        immatriculation: v?.immatriculation || 'Inconnu',
        current: data.current,
        previous: data.previous,
        refills: data.refills,
        avgEfficiency: data.effCurrent,
        diffEffPct
      };
    }).sort((a, b) => b.current - a.current);

    const alerts = results.filter(r => r.diffEffPct > 15 || r.avgEfficiency > 45); 

    return { results, alerts };
  }, [tickets, vehicules]);

  const groupedTickets = useMemo(() => {
    const raw = tickets.filter(t => {
      const v = vehicules.find(v => v.id === t.vehiculeId);
      const c = chauffeurs.find(c => c.id === t.chauffeurId);
      
      const searchMatch = !search || 
        t.reference.toLowerCase().includes(search.toLowerCase()) ||
        v?.immatriculation.toLowerCase().includes(search.toLowerCase()) ||
        c?.nom.toLowerCase().includes(search.toLowerCase()) ||
        c?.prenom.toLowerCase().includes(search.toLowerCase()) ||
        v?.parc.toLowerCase().includes(search.toLowerCase());

      const ticketDate = new Date(t.dateHeure);
      
      if (filterType === 'month') {
        const now = new Date();
        return searchMatch && ticketDate.getMonth() === now.getMonth() && ticketDate.getFullYear() === now.getFullYear();
      } else if (filterType === 'range') {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return searchMatch && ticketDate >= start && ticketDate <= end;
      }
      
      return searchMatch;
    });

    const groups = new Map<string, typeof raw>();
    raw.forEach(t => {
      if (!groups.has(t.vehiculeId)) groups.set(t.vehiculeId, []);
      groups.get(t.vehiculeId)!.push(t);
    });

    return Array.from(groups.entries()).map(([vehiculeId, tList]) => {
      const v = vehicules.find(v => v.id === vehiculeId);
      const totalVolume = tList.reduce((acc, t) => acc + t.volume, 0);
      const totalCost = tList.reduce((acc, t) => acc + t.coutTotal, 0);
      
      // Calculate period efficiency
      const sorted = [...tList].sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime());
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      
      let efficiency = 0;
      if (first && last && last.kilometrageAuPlein > first.kilometrageAuPlein) {
        const dist = last.kilometrageAuPlein - first.kilometrageAuPlein;
        efficiency = (totalVolume / dist) * 100;
      }

      return {
        vehiculeId,
        immatriculation: v?.immatriculation || 'Inconnu',
        parc: v?.parc || 'N/A',
        marque: v?.marque,
        modele: v?.modele,
        totalVolume,
        totalCost,
        refills: tList.length,
        efficiency,
        tickets: sorted.reverse()
      };
    }).sort((a, b) => b.totalVolume - a.totalVolume);
  }, [tickets, vehicules, chauffeurs, search, filterType, startDate, endDate]);

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket = {
      vehiculeId,
      chauffeurId,
      dateHeure: new Date(date).toISOString(),
      kilometrageAuPlein: parsedKm,
      kilometragePrecedent: 0,
      volume: parsedVolume,
      prixParLitre: parsedPrixLitre,
      coutTotal: parsedVolume * parsedPrixLitre,
      lieu,
      prestataireId: lieu === 'externe' ? prestataireId : undefined,
      typeCarburant,
      notes
    };
    const addedTicket = addTicket(newTicket);
    setIsDrawerOpen(false);
    
    // Trigger print
    setTicketToPrint(addedTicket);
    setTimeout(() => {
      window.print();
      setTicketToPrint(null);
    }, 500);

    // Reset form
    setVehiculeId('');
    setChauffeurId('');
    setDate(new Date().toISOString().slice(0, 16));
    setKm('0');
    setVolume('0');
    setPrixLitre('0');
    setLieu('interne');
    setPrestataireId('');
    setTypeCarburant('diesel');
    setNotes('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce ticket de carburant ?')) {
      deleteTicket(id);
    }
  };

  const handleApprovisionner = (e: React.FormEvent) => {
    e.preventDefault();
    const volumeValue = parseFloat(approvVolume) || 0;
    const prixLitreValue = parseFloat(approvPrixLitre) || 0;
    if (volumeValue > 0) {
      useCarburantStore.getState().updateStationStock(volumeValue, 'add', {
        fournisseur: approvFournisseur || 'Station Interne',
        prixParLitre: prixLitreValue,
        coutTotal: volumeValue * prixLitreValue,
        date: new Date(approvDate).toISOString()
      });
      setIsApprovisionnerModalOpen(false);
      setApprovVolume('');
      setApprovFournisseur('');
      setApprovPrixLitre('');
      setApprovDate(new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-6 relative h-full">
      {consumptionStats.alerts.length > 0 && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-top duration-500">
          <div className="p-2 bg-error/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
          <div>
            <h3 className="text-sm font-black text-error uppercase tracking-widest leading-none mb-1">Alerte Consommation</h3>
            <p className="text-xs text-text-primary font-bold">
              {consumptionStats.alerts.length} véhicule(s) ont une surconsommation anormale {">"} 15% ou efficacité {">"} 45L/100km.
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Gestion du Carburant
          </h1>
          <p className="text-text-secondary mt-1">
            {filterType === 'month' ? 'Statistiques pour ce mois' : filterType === 'range' ? `Période du ${formatDate(startDate)} au ${formatDate(endDate)}` : 'Historique complet'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-surface hover:bg-surface-2 text-text-primary border border-border px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>
          {canManage && (
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau ticket</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - 3/5 */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Rechercher par référence, immatriculation, parc..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex bg-surface-2 p-1 rounded-lg border border-border">
                <button 
                  onClick={() => setFilterType('month')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    filterType === 'month' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Ce mois
                </button>
                <button 
                  onClick={() => setFilterType('range')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    filterType === 'range' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Période
                </button>
                <button 
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    filterType === 'all' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Tout
                </button>
              </div>
            </div>

            {filterType === 'range' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="flex items-center gap-3 pt-2 border-t border-border overflow-hidden"
              >
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Du</span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border border-border bg-surface text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Au</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border border-border bg-surface text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Véhicule / Parc</th>
                    <th className="px-6 py-4">Ravitaillements</th>
                    <th className="px-6 py-4">Volume Total</th>
                    <th className="px-6 py-4">Efficacité (L/100)</th>
                    <th className="px-6 py-4 text-right">Budget</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {groupedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                        <Fuel className="w-12 h-12 mx-auto text-border-strong mb-4" />
                        <p className="text-lg font-medium text-text-primary">Aucun ravitaillement trouvé</p>
                        <p className="text-sm">Modifiez vos filtres ou créez un nouveau ticket.</p>
                      </td>
                    </tr>
                  ) : (
                    groupedTickets.map(group => {
                      const id = group.vehiculeId;
                      const isExpanded = expandedVehicule === id;
                      return (
                        <React.Fragment key={id}>
                          <tr 
                            onClick={() => setExpandedVehicule(isExpanded ? null : id)}
                            className={`cursor-pointer transition-colors ${isExpanded ? 'bg-primary/5' : 'hover:bg-surface-2/50'}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  group.parc === 'Afro Négoce' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  <Fuel className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-text-primary uppercase tracking-tight">{group.immatriculation}</div>
                                  <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">{group.parc}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-surface-2 px-2 py-1 rounded-lg text-xs font-bold text-text-primary">
                                {group.refills} ticket{group.refills > 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-black text-text-primary">
                              {group.totalVolume.toFixed(1)} L
                            </td>
                            <td className="px-6 py-4">
                              {group.efficiency > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                    group.efficiency > 40 ? 'bg-error/10 text-error' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {group.efficiency.toFixed(1)}
                                  </span>
                                  {group.efficiency > 40 && <AlertTriangle className="w-3.5 h-3.5 text-error" />}
                                </div>
                              ) : (
                                <span className="text-text-muted text-xs italic">Nécessite 2 pleins</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-black text-primary">
                              {formatMAD(group.totalCost)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-primary font-black text-xs uppercase tracking-widest hover:underline">
                                {isExpanded ? 'Masquer' : 'Détails'}
                              </button>
                            </td>
                          </tr>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="p-0 border-none">
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-surface-2/30"
                                  >
                                    <div className="px-6 py-4 space-y-3">
                                      <div className="grid grid-cols-6 text-[10px] font-black text-text-muted uppercase tracking-widest px-4 pb-2 border-b border-border/50">
                                        <div className="col-span-1">Référence</div>
                                        <div className="col-span-1 text-center">Date</div>
                                        <div className="col-span-1 text-center">KM</div>
                                        <div className="col-span-1 text-center">Volume</div>
                                        <div className="col-span-1 text-right">Coût</div>
                                        <div className="col-span-1 text-right">Actions</div>
                                      </div>
                                      {group.tickets.map(t => {
                                        const efficiencyData = getEfficiency(t.id);
                                        return (
                                          <div key={t.id} className="grid grid-cols-6 items-center px-4 py-2 bg-surface rounded-lg border border-border/50 shadow-sm">
                                            <div className="col-span-1 font-mono text-xs font-bold text-text-primary">{t.reference}</div>
                                            <div className="col-span-1 text-center text-xs text-text-muted">{formatDate(t.dateHeure)}</div>
                                            <div className="col-span-1 text-center text-xs font-bold">{t.kilometrageAuPlein} km</div>
                                            <div className="col-span-1 text-center">
                                              <div className="text-xs font-black text-text-primary">{t.volume} L</div>
                                              {efficiencyData && (
                                                <div className={`text-[9px] font-black ${efficiencyData.l100 > 45 ? 'text-error' : 'text-emerald-500'}`}>
                                                  {efficiencyData.l100.toFixed(1)} L/100
                                                </div>
                                              )}
                                            </div>
                                            <div className="col-span-1 text-right text-xs font-black text-primary">{formatMAD(t.coutTotal)}</div>
                                            <div className="col-span-1 text-right flex justify-end gap-1">
                                              {t.prestataireId && (
                                                <div className="mr-auto">
                                                  <div className="text-[8px] font-black text-text-muted uppercase">Station</div>
                                                  <div className="text-[10px] font-bold truncate max-w-[80px]">
                                                    {prestataires.find(p => p.id === t.prestataireId)?.nom || 'Inconnue'}
                                                  </div>
                                                </div>
                                              )}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setTicketToPrint(t);
                                                  setTimeout(() => {
                                                    window.print();
                                                    setTicketToPrint(null);
                                                  }, 100);
                                                }}
                                                className="p-1.5 text-text-muted hover:text-primary transition-colors"
                                              >
                                                <Printer className="w-3.5 h-3.5" />
                                              </button>
                                              {canManage && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(t.id);
                                                  }}
                                                  className="p-1.5 text-text-muted hover:text-error transition-colors"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Summary Footer */}
            <div className="bg-surface-2 border-t border-border p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-text-muted font-medium mb-1">Volume Total</div>
                <div className="text-lg font-bold text-text-primary">
                  {groupedTickets.reduce((acc, g) => acc + g.totalVolume, 0).toFixed(2)} L
                </div>
              </div>
              <div className="border-l border-r border-border">
                <div className="text-xs text-text-muted font-medium mb-1">Coût Total</div>
                <div className="text-lg font-bold text-text-primary">
                  {formatMAD(groupedTickets.reduce((acc, g) => acc + g.totalCost, 0))}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted font-medium mb-1">Moyenne L/100km</div>
                <div className="text-lg font-bold text-text-primary">
                  {(() => {
                    const validGroups = groupedTickets.filter(g => g.efficiency > 0);
                    if (validGroups.length === 0) return 'N/A';
                    const avg = validGroups.reduce((acc, g) => acc + g.efficiency, 0) / validGroups.length;
                    return `${avg.toFixed(1)} L`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 2/5 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Fuel className="w-24 h-24 rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-text-primary tracking-tight">Station Interne</h3>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-0.5">État du Stock</p>
                </div>
                <div className="bg-primary/10 text-primary p-2 rounded-xl">
                  <Fuel className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" strokeWidth="8" opacity="0.5" />
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke={pctStock < 20 ? "var(--color-error)" : "var(--color-primary)"} 
                      strokeWidth="8" 
                      strokeDasharray="283" 
                      strokeDashoffset={283 - (283 * pctStock) / 100} 
                      strokeLinecap="round" 
                      transform="rotate(-90 50 50)" 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-text-primary tracking-tighter">{Math.round(pctStock)}%</span>
                  </div>
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                  <div className="bg-surface-2 p-3 rounded-xl border border-border">
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Actuel</div>
                    <div className="text-lg font-black text-text-primary">{stationInterne.stockActuel.toLocaleString()} L</div>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-xl border border-border">
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Capacité</div>
                    <div className="text-lg font-black text-text-primary">{stationInterne.capacite.toLocaleString()} L</div>
                  </div>
                </div>

                {pctStock < 20 && (
                  <div className="mt-6 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl flex items-center gap-3 w-full">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold leading-tight">Stock critique. Réapprovisionnement urgent conseillé.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* New Management Card for explicit Reset & Approvisionnement */}
          {canManage && (
            <div className="bg-[#0B1120] p-6 rounded-2xl border border-white/10 shadow-xl text-white">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Actions Station
              </h3>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setIsApprovisionnerModalOpen(true)}
                  className="w-full bg-primary hover:bg-primary-hover py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  Approvisionner
                </button>
                <button 
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="w-full bg-surface hover:bg-surface-2 border border-border py-3 rounded-xl font-bold text-text-primary transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Clock className="w-4 h-4" />
                  Historique d'approvisionnement
                </button>
                
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      if (window.confirm('ATTENTION: Voulez-vous vraiment remettre le stock de la station à 0 ? Cette action supprimera également l\'historique d\'approvisionnement.')) {
                        resetStationStock();
                      }
                    }}
                    className="w-full bg-white/5 hover:bg-error/20 hover:text-error border border-white/10 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Réinitialiser le Compteur (0L)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-muted mb-6 flex items-center justify-between">
              Classement Consommations
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">MOIS EN COURS</span>
            </h3>
            <div className="space-y-5">
              {consumptionStats.results.map((v, index) => {
                const isInefficient = v.diffEffPct > 0;
                return (
                  <div key={v.id} className="group">
                    <div className="flex justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-text-muted w-4">{index + 1}.</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-text-primary tracking-tight">{v.immatriculation}</span>
                          <div className={`flex items-center gap-0.5 text-[9px] font-black w-fit mt-0.5 ${
                            v.diffEffPct > 15 || v.avgEfficiency > 45 ? 'text-error' : 'text-emerald-600'
                          }`}>
                            {v.avgEfficiency > 0 ? (
                              <>
                                <TrendingUp className={`w-2.5 h-2.5 ${v.diffEffPct > 0 ? '' : 'rotate-180'}`} />
                                {Math.abs(v.diffEffPct).toFixed(0)}% var. eff ({v.avgEfficiency.toFixed(1)} L/100)
                              </>
                            ) : (
                              'Données insuffisantes'
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-text-primary leading-tight">{v.current.toFixed(0)} L</span>
                          <span className="text-[9px] text-primary font-black uppercase tracking-tighter">
                            {v.refills} Ravitaillement{v.refills > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          v.diffEffPct > 15 || v.avgEfficiency > 45 ? 'bg-error' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(100, (v.current / (consumptionStats.results[0]?.current || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {consumptionStats.results.length === 0 && (
                <div className="text-sm text-text-secondary text-center py-8 italic bg-surface-2 rounded-xl border border-dashed border-border">
                  Aucune donnée de consommation enregistrée ce mois-ci
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-surface shadow-2xl z-50 flex flex-col border-l border-border"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-primary" />
                  Nouveau ticket
                </h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form id="add-ticket-form" onSubmit={handleAddTicket} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Véhicule</label>
                    <select 
                      required
                      value={vehiculeId}
                      onChange={e => {
                        setVehiculeId(e.target.value);
                        const v = vehicules.find(v => v.id === e.target.value);
                        if (v && v.chauffeurAssigneId) {
                          setChauffeurId(v.chauffeurAssigneId);
                        }
                      }}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="">Sélectionner un véhicule...</option>
                      {vehicules.map(v => (
                        <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Chauffeur</label>
                    <select 
                      required
                      value={chauffeurId}
                      onChange={e => setChauffeurId(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="">Sélectionner un chauffeur...</option>
                      {chauffeurs.filter(c => c.status === 'actif').map(c => (
                        <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date & Heure</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Kilométrage actuel</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        min="0"
                        value={km}
                        onChange={e => setKm(e.target.value)}
                        placeholder="Ex: 145000" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Volume (L)</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        value={volume}
                        onChange={e => setVolume(e.target.value)}
                        placeholder="Ex: 450.50" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Prix/L (MAD)</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        required
                        value={prixLitre}
                        onChange={e => setPrixLitre(e.target.value.replace(',', '.'))}
                        placeholder="Ex: 14.67" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-bold" 
                      />
                    </div>
                  </div>

                  <div className="bg-surface-2 p-4 rounded-xl border border-border flex items-center justify-between">
                    <span className="text-text-secondary font-medium">Coût Total</span>
                    <span className="text-2xl font-bold text-primary">{formatMAD(parsedVolume * parsedPrixLitre)}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Type de carburant</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="cursor-pointer">
                        <input 
                          type="radio" 
                          name="typeCarburant" 
                          value="diesel" 
                          checked={typeCarburant === 'diesel'}
                          onChange={() => setTypeCarburant('diesel')}
                          className="peer sr-only" 
                        />
                        <div className="p-3 text-center border border-border rounded-lg peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary font-medium transition-all">
                          Gasoil
                        </div>
                      </label>
                      <label className="cursor-pointer">
                        <input 
                          type="radio" 
                          name="typeCarburant" 
                          value="essence" 
                          checked={typeCarburant === 'essence'}
                          onChange={() => setTypeCarburant('essence')}
                          className="peer sr-only" 
                        />
                        <div className="p-3 text-center border border-border rounded-lg peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary font-medium transition-all">
                          Essence
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Lieu de ravitaillement</label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <label className="cursor-pointer">
                        <input 
                          type="radio" 
                          name="lieu" 
                          value="interne" 
                          checked={lieu === 'interne'}
                          onChange={() => setLieu('interne')}
                          className="peer sr-only" 
                        />
                        <div className="p-3 text-center border border-border rounded-lg peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary font-bold text-xs uppercase transition-all">
                          Station Interne
                        </div>
                      </label>
                      <label className="cursor-pointer">
                        <input 
                          type="radio" 
                          name="lieu" 
                          value="externe" 
                          checked={lieu === 'externe'}
                          onChange={() => setLieu('externe')}
                          className="peer sr-only" 
                        />
                        <div className="p-3 text-center border border-border rounded-lg peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary font-bold text-xs uppercase transition-all">
                          Station Externe
                        </div>
                      </label>
                    </div>

                    <AnimatePresence>
                      {lieu === 'externe' && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">Sélectionner la station</label>
                          <select 
                            required={lieu === 'externe'}
                            value={prestataireId}
                            onChange={e => setPrestataireId(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-bold"
                          >
                            <option value="">-- Choisir une station --</option>
                            {prestataires
                              .filter(p => p.type === 'carburant') // From usePrestataireStore
                              .map(p => (
                                <option key={p.id} value={p.id}>{p.nom} ({p.adresse})</option>
                              ))
                            }
                          </select>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="bg-surface-2 p-4 rounded-xl border border-border">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-text-secondary">Stock actuel</span>
                      <span className="font-medium text-text-primary">{stationInterne.stockActuel} L / {stationInterne.capacite} L</span>
                    </div>
                    <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pctStock}%` }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Notes (optionnel)</label>
                    <textarea 
                      rows={3} 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full p-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" 
                      placeholder="Observations..."
                    ></textarea>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-border bg-surface-2 flex gap-3">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 h-11 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  form="add-ticket-form"
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                >
                  Créer le ticket
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Approvisionner Modal */}
      <AnimatePresence>
        {isApprovisionnerModalOpen && canManage && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApprovisionnerModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-primary" />
                  Approvisionner la station
                </h2>
                <button 
                  onClick={() => setIsApprovisionnerModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <form id="approvisionner-form" onSubmit={handleApprovisionner} className="space-y-6">
                  <div className="bg-surface-2 p-4 rounded-xl border border-border mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-text-secondary">Stock actuel</span>
                      <span className="font-medium text-text-primary">{stationInterne.stockActuel.toLocaleString()} L / {stationInterne.capacite.toLocaleString()} L</span>
                    </div>
                    <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pctStock}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
                      <input 
                        type="date"
                        required
                        value={approvDate}
                        onChange={e => setApprovDate(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Fournisseur (Prestataire)</label>
                      <select 
                        required
                        value={approvFournisseur}
                        onChange={e => setApprovFournisseur(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none" 
                      >
                        <option value="">Sélectionner un fournisseur...</option>
                        {prestataires.filter(p => p.type === 'carburant' || p.type === 'autre').map(p => (
                          <option key={p.id} value={p.nom}>{p.nom} ({p.type})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Volume Ajouter (L)</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        min="1"
                        max={stationInterne.capacite - stationInterne.stockActuel}
                        value={approvVolume}
                        onChange={e => setApprovVolume(e.target.value)}
                        placeholder="Ex: 5000" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-bold" 
                      />
                      <p className="text-xs text-text-muted mt-2">
                        {stationInterne.capacite - stationInterne.stockActuel} L max
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Prix par Litre (MAD)</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        min="0"
                        value={approvPrixLitre}
                        onChange={e => setApprovPrixLitre(e.target.value)}
                        placeholder="Ex: 14.50" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-surface-2 rounded-lg border border-border flex justify-between items-center mt-4">
                    <span className="text-sm font-medium text-text-secondary">Coût Total Estimé</span>
                    <span className="text-lg font-bold text-primary">
                      {formatMAD((parseFloat(approvVolume) || 0) * (parseFloat(approvPrixLitre) || 0))}
                    </span>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-border bg-surface-2 flex gap-3">
                <button 
                  onClick={() => setIsApprovisionnerModalOpen(false)}
                  className="flex-1 h-11 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  form="approvisionner-form"
                  disabled={parseFloat(approvVolume || '0') <= 0 || parseFloat(approvVolume || '0') > (stationInterne.capacite - stationInterne.stockActuel)}
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Historique Approvisionnement Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-surface rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-surface flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Historique d'Approvisionnement
                </h2>
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Fournisseur</th>
                      <th className="px-4 py-3 text-right">Volume (L)</th>
                      <th className="px-4 py-3 text-right">Prix/L</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stationInterne.historique.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                          Aucun historique disponible
                        </td>
                      </tr>
                    ) : (
                      [...stationInterne.historique].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((h) => (
                        <tr key={h.id}>
                          <td className="px-4 py-3 text-text-primary">{formatDate(h.date)}</td>
                          <td className="px-4 py-3 font-medium text-text-primary">{h.fournisseur}</td>
                          <td className="px-4 py-3 text-right font-bold text-text-primary border-l border-border bg-primary/5">+{h.volume.toLocaleString()} L</td>
                          <td className="px-4 py-3 text-right font-medium text-text-secondary">{formatMAD(h.prixParLitre)}</td>
                          <td className="px-4 py-3 text-right font-bold text-text-primary">{formatMAD(h.coutTotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Printable Ticket */}
      {ticketToPrint && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] text-black font-mono">
          <div className="w-[76mm] mx-auto py-2 px-1">
            {/* Header */}
            <div className="text-center border-b-4 border-double border-black pb-4 mb-4">
              <div className="flex justify-center mb-2">
                <AfroNegoceLogo className="w-10 h-10" />
              </div>
              <div className="bg-black text-white px-2 py-1 mb-2 inline-block mx-auto">
                <h1 className="text-sm font-black tracking-[0.2em] leading-none uppercase">
                  {vehicules.find(v => v.id === ticketToPrint.vehiculeId)?.parc || 'AFRO NÉGOCE'}
                </h1>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black">Ticket de Carburant</p>
            </div>
            
            {/* Info Section */}
            <div className="space-y-0.5 mb-3 text-[10px]">
              <div className="flex justify-between font-bold">
                <span>Réf:</span>
                <span>{ticketToPrint.reference}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDatetime(ticketToPrint.dateHeure)}</span>
              </div>
              <div className="h-1.5" />
              <div className="flex justify-between border-b border-gray-100">
                <span className="font-bold">PARC / GARAGE:</span>
                <span className="font-black uppercase">{vehicules.find(v => v.id === ticketToPrint.vehiculeId)?.parc || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100">
                <span className="font-bold">VÉHICULE:</span>
                <span className="font-black">{vehicules.find(v => v.id === ticketToPrint.vehiculeId)?.immatriculation || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100">
                <span className="font-bold">CHAUFFEUR:</span>
                <span className="font-black truncate ml-4">
                  {(() => {
                    const c = chauffeurs.find(c => c.id === ticketToPrint.chauffeurId);
                    return c ? `${c.prenom.charAt(0)}. ${c.nom}`.toUpperCase() : 'N/A';
                  })()}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100">
                <span className="font-bold">PRODUIT:</span>
                <span className="font-black uppercase">{ticketToPrint.typeCarburant}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100">
                <span className="font-bold">VOLUME:</span>
                <span className="font-black">{ticketToPrint.volume.toFixed(2)} L</span>
              </div>
              <div className="flex justify-between border-b border-gray-100">
                <span className="font-bold">PRIX UNIT:</span>
                <span className="font-black">{formatMAD(ticketToPrint.prixParLitre)}</span>
              </div>
            </div>

            {/* Total Section */}
            <div className="border-y-2 border-black py-2 mb-4 flex justify-between items-center px-1">
              <span className="text-xs font-black uppercase">TOTAL MAD</span>
              <span className="text-lg font-black">{formatMAD(ticketToPrint.coutTotal)}</span>
            </div>

            {/* Signatures Section - Compact signature space */}
            <div className="grid grid-cols-2 gap-3 text-[9px] mb-4">
              <div className="text-center pt-3 border-t border-dashed border-gray-400">
                <p className="font-bold mb-3">CHAUFFEUR</p>
                <div className="h-6" />
              </div>
              <div className="text-center pt-3 border-t border-dashed border-gray-400">
                <p className="font-bold mb-3">MANAGER</p>
                <div className="h-6" />
              </div>
            </div>

            {/* Footer */}
            <div className="text-[7px] text-center italic text-gray-400 pt-1 border-t border-gray-50">
              {ticketToPrint.lieu === 'interne' ? 'Ravitaillé en station interne' : 'Ravitaillé en station externe'}
              <br />
              Merci pour votre professionnalisme.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
