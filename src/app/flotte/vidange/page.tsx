import React, { useState, useEffect, useMemo } from 'react';
import { useVidangeStore, Vidange } from '../../../stores/useVidangeStore';
import { useVehiculeStore } from '../../../stores/useVehiculeStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { 
  Plus, 
  Search, 
  Droplet, 
  Trash2,
  Calendar,
  AlertTriangle,
  Edit2,
  Download
} from 'lucide-react';
import { formatMAD, formatDate } from '../../../lib/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { DatePicker } from '../../../components/ui/DatePicker';
import { jsPDF } from 'jspdf';

// PDF Ticket Generator for Vidange
function generateVidangePDF(v: Vidange, vehicule: any, oilTypeName: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160] // receipt roll format
  });

  // Header background
  doc.setFillColor(11, 17, 32);
  doc.rect(0, 0, 80, 25, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FLEETOPS - VIDANGE', 40, 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TICKET D\'ENTRETIEN TECHNIQUE', 40, 16, { align: 'center' });

  // Reset text color to dark
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(8);

  let y = 35;
  const lineSpacing = 5.5;

  // Vehicle Info Section
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS DU VÉHICULE', 5, y);
  doc.line(5, y + 1, 75, y + 1);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Immatriculation :`, 5, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${vehicule?.immatriculation || 'N/A'}`, 35, y);
  y += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text(`Marque / Modèle :`, 5, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${vehicule?.marque || ''} ${vehicule?.modele || ''}`, 35, y);
  y += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text(`Parc :`, 5, y);
  doc.text(`${vehicule?.parc || 'N/A'}`, 35, y);
  y += lineSpacing + 2;

  // Vidange Details Section
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS DE LA VIDANGE', 5, y);
  doc.line(5, y + 1, 75, y + 1);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Date d'exécution :`, 5, y);
  doc.text(`${new Date(v.date).toLocaleDateString('fr-FR')}`, 35, y);
  y += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text(`Type d'huile :`, 5, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${oilTypeName}`, 35, y);
  y += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text(`Kilométrage actuel :`, 5, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${v.kilometrage.toLocaleString()} km`, 35, y);
  y += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text(`Prochaine vidange :`, 5, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(`${v.prochainKilometrage.toLocaleString()} km`, 35, y);
  doc.setTextColor(33, 33, 33);
  y += lineSpacing + 2;

  // Filters Section
  doc.setFont('helvetica', 'bold');
  doc.text('FILTRES REMPLACÉS', 5, y);
  doc.line(5, y + 1, 75, y + 1);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Filtre à Huile :`, 5, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${v.filtreHuile ? `OUI (${v.coutFiltreHuile} MAD)` : 'NON'}`, 35, y);
  y += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text(`Filtre à Gasoil :`, 5, y);
  doc.text(`${v.filtreGasoil ? `OUI (${v.coutFiltreGasoil} MAD)` : 'NON'}`, 35, y);
  y += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text(`Filtre à Air :`, 5, y);
  doc.text(`${v.filtreAir ? `OUI (${v.coutFiltreAir} MAD)` : 'NON'}`, 35, y);
  y += lineSpacing + 4;

  // Cost total
  doc.setFillColor(243, 244, 246);
  doc.rect(4, y - 2, 72, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('COÛT TOTAL :', 6, y + 3.5);
  doc.text(`${v.cout.toLocaleString()} MAD`, 35, y + 3.5);
  y += 12;

  // Signatures
  doc.setFontSize(7);
  doc.text('Signature Technicien', 10, y);
  doc.text('Signature Chef de Parc', 50, y);
  doc.line(10, y + 6, 30, y + 6);
  doc.line(50, y + 6, 70, y + 6);

  // Footer
  doc.setFontSize(6);
  doc.setTextColor(156, 163, 175);
  doc.text('Document généré par FleetOps. Conserver dans le véhicule.', 40, y + 11, { align: 'center' });

  // Save PDF
  doc.save(`Ticket_Vidange_${vehicule?.immatriculation || 'vehicule'}_${v.kilometrage}km.pdf`);
}

export default function VidangePage() {
  const { vidanges, oilTypes, addVidange, updateVidange, deleteVidange } = useVidangeStore();
  const vehicules = useVehiculeStore(s => s.vehicules);
  const user = useAuthStore(s => s.user);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  // Form state
  const [vehiculeId, setVehiculeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [kilometrage, setKilometrage] = useState(0);
  const [prochainKilometrage, setProchainKilometrage] = useState(0);
  const [typeHuileId, setTypeHuileId] = useState('');
  
  const [coutHuile, setCoutHuile] = useState<string>('');
  const [coutFiltreHuile, setCoutFiltreHuile] = useState<string>('');
  const [coutFiltreGasoil, setCoutFiltreGasoil] = useState<string>('');
  const [coutFiltreAir, setCoutFiltreAir] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Checkbox Selection for Filters
  const [hasFiltreHuile, setHasFiltreHuile] = useState(false);
  const [hasFiltreGasoil, setHasFiltreGasoil] = useState(false);
  const [hasFiltreAir, setHasFiltreAir] = useState(false);

  // Alarms: List of vehicles whose current kilometrage exceeds recommended prochainKilometrage
  const exceededVidangeVehicules = useMemo(() => {
    return vehicules.filter(v => {
      const vVidanges = vidanges.filter(vid => vid.vehiculeId === v.id);
      if (vVidanges.length === 0) return false;
      const latest = [...vVidanges].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return v.kilometrageActuel >= latest.prochainKilometrage;
    });
  }, [vehicules, vidanges]);

  useEffect(() => {
    if (typeHuileId && kilometrage) {
      const oil = oilTypes.find(o => o.id === typeHuileId);
      if (oil) {
        setProchainKilometrage(kilometrage + oil.intervalKm);
      }
    }
  }, [typeHuileId, kilometrage, oilTypes]);

  const resetForm = () => {
    setEditingId(null);
    setVehiculeId('');
    setDate(new Date().toISOString());
    setKilometrage(0);
    setProchainKilometrage(0);
    setTypeHuileId('');
    setCoutHuile('');
    setCoutFiltreHuile('');
    setCoutFiltreGasoil('');
    setCoutFiltreAir('');
    setNotes('');
    setHasFiltreHuile(false);
    setHasFiltreGasoil(false);
    setHasFiltreAir(false);
  }

  const openAddForm = () => {
    resetForm();
    setIsDrawerOpen(true);
  }

  const openEditForm = (v: Vidange) => {
    setEditingId(v.id);
    setVehiculeId(v.vehiculeId);
    setDate(v.date);
    setKilometrage(v.kilometrage);
    setProchainKilometrage(v.prochainKilometrage);
    setTypeHuileId(v.typeHuileId || '');
    setCoutHuile(v.coutHuile ? String(v.coutHuile) : '');
    setCoutFiltreHuile(v.coutFiltreHuile ? String(v.coutFiltreHuile) : '');
    setCoutFiltreGasoil(v.coutFiltreGasoil ? String(v.coutFiltreGasoil) : '');
    setCoutFiltreAir(v.coutFiltreAir ? String(v.coutFiltreAir) : '');
    setNotes(v.notes || '');
    setHasFiltreHuile(!!v.filtreHuile);
    setHasFiltreGasoil(!!v.filtreGasoil);
    setHasFiltreAir(!!v.filtreAir);
    setIsDrawerOpen(true);
  }

  const handleSaveVidange = (e: React.FormEvent) => {
    e.preventDefault();
    const ch = parseFloat(coutHuile) || 0;
    const cfh = hasFiltreHuile ? (parseFloat(coutFiltreHuile) || 0) : 0;
    const cfg = hasFiltreGasoil ? (parseFloat(coutFiltreGasoil) || 0) : 0;
    const cfa = hasFiltreAir ? (parseFloat(coutFiltreAir) || 0) : 0;
    
    const totalCout = ch + cfh + cfg + cfa;

    const data = {
      vehiculeId,
      date: new Date(date).toISOString(),
      kilometrage,
      prochainKilometrage,
      typeHuileId,
      coutHuile: ch,
      filtreHuile: hasFiltreHuile,
      coutFiltreHuile: cfh,
      filtreGasoil: hasFiltreGasoil,
      coutFiltreGasoil: cfg,
      filtreAir: hasFiltreAir,
      coutFiltreAir: cfa,
      cout: totalCout,
      notes
    };

    if (editingId) {
      updateVidange(editingId, data);
    } else {
      addVidange(data);
      // Automatically update the vehicle's kilometrageActuel on new vidange
      useVehiculeStore.getState().updateVehicule(vehiculeId, { kilometrageActuel: kilometrage });
    }
    
    setIsDrawerOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vidange ?')) {
      deleteVidange(id);
    }
  };

  const filteredVidanges = vidanges.filter(v => {
    const vehicule = vehicules.find(veh => veh.id === v.vehiculeId);
    const searchLower = search.toLowerCase();
    return vehicule?.immatriculation.toLowerCase().includes(searchLower) ||
           vehicule?.marque.toLowerCase().includes(searchLower);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [capaciteMoyenne, setCapaciteMoyenne] = useState<number>(30); // Default 30L per truck
  const [litersHuileBrulee, setLitersHuileBrulee] = useState<number>(filteredVidanges.length * capaciteMoyenne);

  useEffect(() => {
    setLitersHuileBrulee(filteredVidanges.length * capaciteMoyenne);
  }, [filteredVidanges.length, capaciteMoyenne]);

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Gestion des Vidanges
          </h1>
          <p className="text-text-secondary mt-1">Suivi des changements d'huile et entretiens réguliers</p>
        </div>
        
        <div className="flex items-center gap-3">
          {canManage && (
            <button 
              onClick={openAddForm}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle Vidange</span>
            </button>
          )}
        </div>
      </div>

      {/* ALERTE VIDANGE DÉPASSÉ */}
      {exceededVidangeVehicules.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-top duration-500 shadow-sm">
          <div className="p-2 bg-red-500/20 rounded-lg text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-red-600 uppercase tracking-widest leading-none mb-1.5">🚨 Alerte Vidange Dépassé</h3>
            <p className="text-xs text-text-primary font-bold mb-1.5">
              Les véhicules suivants ont dépassé le kilométrage recommandé pour leur prochaine vidange :
            </p>
            <ul className="text-xs list-disc pl-4 space-y-1 text-text-secondary font-medium">
              {exceededVidangeVehicules.map(v => {
                const vVidanges = vidanges.filter(vid => vid.vehiculeId === v.id);
                const latest = [...vVidanges].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                return (
                  <li key={v.id}>
                    Le camion <span className="font-bold text-red-600">{v.immatriculation}</span> ({v.marque} {v.modele}) - Kilométrage actuel: <span className="font-bold">{v.kilometrageActuel.toLocaleString()} km</span> (Vidange conseillée à: <span className="font-bold text-red-600">{latest?.prochainKilometrage.toLocaleString()} km</span>)
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {canManage && (
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-full text-primary">
            <Droplet className="w-8 h-8" />
          </div>
          <div className="flex-1">
             <h3 className="text-lg font-bold text-text-primary">Calculateur Huile Brûlée</h3>
             <p className="text-sm text-text-secondary">Estimation de la quantité d'huile usagée en stock basée sur le nombre de vidanges filtrées ({filteredVidanges.length} affichées).</p>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:border-l sm:border-border sm:pl-6">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Capacité Moyenne (L/vidange)</label>
              <input 
                type="number"
                value={capaciteMoyenne}
                onChange={e => setCapaciteMoyenne(parseFloat(e.target.value) || 0)}
                className="w-32 h-11 px-3 bg-surface border border-border rounded-lg outline-none focus:border-primary text-sm font-medium"
              />
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-text-secondary mb-1">Stock Estimé</div>
              <div className="text-2xl font-bold text-primary">{litersHuileBrulee.toLocaleString()} L</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col h-[calc(100vh-17rem)]">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-2/50 rounded-t-xl">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Rechercher par immatriculation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Véhicule</th>
                <th className="px-6 py-4">Détails</th>
                <th className="px-6 py-4">Kilométrage</th>
                <th className="px-6 py-4">Prochaine Vidange</th>
                <th className="px-6 py-4 text-right">Coût Total</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVidanges.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-6 py-12 text-center text-text-secondary">
                    <Droplet className="w-12 h-12 mx-auto text-border-strong mb-4" />
                    <p className="text-lg font-medium text-text-primary">Aucune vidange enregistrée</p>
                    <p className="text-sm">Créez une nouvelle vidange pour commencer le suivi.</p>
                  </td>
                </tr>
              ) : (
                filteredVidanges.map(v => {
                  const vehicule = vehicules.find(veh => veh.id === v.vehiculeId);
                  const oilType = oilTypes.find(o => o.id === v.typeHuileId);
                  
                  // Check if close to next vidange (less than 1000km away)
                  const isCloseToNext = vehicule && v.prochainKilometrage && 
                    (vehicule.kilometrageActuel >= v.prochainKilometrage - 1000);
                  const isOverdue = vehicule && v.prochainKilometrage && 
                    (vehicule.kilometrageActuel >= v.prochainKilometrage);

                  return (
                    <tr key={v.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-6 py-4 text-text-secondary">{formatDate(v.date)}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-primary">{vehicule?.immatriculation}</div>
                        <div className="text-text-muted text-xs">{vehicule?.marque} {vehicule?.modele}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-text-primary font-medium">{oilType?.name || 'Standard'}</div>
                        <div className="text-xs text-text-muted flex gap-1 mt-0.5">
                          {v.filtreHuile && <span className="px-1.5 bg-surface-2 rounded">F.Huile</span>}
                          {v.filtreGasoil && <span className="px-1.5 bg-surface-2 rounded">F.Gas</span>}
                          {v.filtreAir && <span className="px-1.5 bg-surface-2 rounded">F.Air</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{v.kilometrage.toLocaleString()} km</td>
                      <td className="px-6 py-4">
                        <div className={`font-bold inline-flex items-center gap-1.5 ${isOverdue ? 'text-danger' : isCloseToNext ? 'text-warning' : 'text-success'}`}>
                          {v.prochainKilometrage.toLocaleString()} km
                          {(isCloseToNext || isOverdue) && <AlertTriangle className="w-4 h-4" />}
                        </div>
                        {vehicule && (isCloseToNext || isOverdue) && (
                           <div className="text-xs text-text-muted mt-0.5 whitespace-nowrap">
                             (Actuel: {vehicule.kilometrageActuel.toLocaleString()})
                           </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-text-primary">
                        {formatMAD(v.cout)}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => generateVidangePDF(v, vehicule, oilType?.name || 'Standard')}
                              className="p-2 text-text-muted hover:text-success hover:bg-success/10 rounded-lg transition-colors"
                              title="Télécharger Ticket PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                             <button
                              onClick={() => openEditForm(v)}
                              className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(v.id)}
                              className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
                  <Droplet className="w-5 h-5 text-primary" />
                  {editingId ? 'Modifier Vidange' : 'Nouvelle Vidange'}
                </h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form id="add-vidange-form" onSubmit={handleSaveVidange} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Véhicule</label>
                    <select 
                      required
                      value={vehiculeId}
                      onChange={e => setVehiculeId(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="">Sélectionner un véhicule...</option>
                      {vehicules.map(v => (
                        <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Type d'huile</label>
                     <select 
                      value={typeHuileId}
                      onChange={e => setTypeHuileId(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="">Standard (Sans intervalle auto)</option>
                      {oilTypes.map(o => (
                        <option key={o.id} value={o.id}>{o.name} ({o.intervalKm} km)</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Kilométrage actuel</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={kilometrage}
                        onChange={e => setKilometrage(parseInt(e.target.value) || 0)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Prochaine vidange (km)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={prochainKilometrage}
                        onChange={e => setProchainKilometrage(parseInt(e.target.value) || 0)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                     <h3 className="text-sm font-bold text-text-primary mb-3">Sélection des Filtres à Remplacer</h3>
                     
                     <div className="space-y-4 mb-4">
                       {/* Preset buttons: Filtre Huile Uniquement OR Tous les Filtres */}
                       <div className="grid grid-cols-2 gap-2">
                         <button
                           type="button"
                           onClick={() => {
                             setHasFiltreHuile(true);
                             setHasFiltreGasoil(false);
                             setHasFiltreAir(false);
                             setCoutFiltreGasoil('');
                             setCoutFiltreAir('');
                           }}
                           className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                             hasFiltreHuile && !hasFiltreGasoil && !hasFiltreAir
                               ? 'border-primary bg-primary/10 text-primary'
                               : 'border-border bg-surface text-text-secondary hover:bg-surface-2'
                           }`}
                         >
                           Filtre Huile Uniquement
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             setHasFiltreHuile(true);
                             setHasFiltreGasoil(true);
                             setHasFiltreAir(true);
                           }}
                           className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                             hasFiltreHuile && hasFiltreGasoil && hasFiltreAir
                               ? 'border-primary bg-primary/10 text-primary'
                               : 'border-border bg-surface text-text-secondary hover:bg-surface-2'
                           }`}
                         >
                           Tous les Filtres
                         </button>
                       </div>

                       {/* Individual Checkbox Grid */}
                       <div className="grid grid-cols-3 gap-2">
                         <label className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                           hasFiltreHuile ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface hover:bg-surface-2 text-text-secondary'
                         }`}>
                           <input 
                             type="checkbox" 
                             checked={hasFiltreHuile} 
                             onChange={e => {
                               setHasFiltreHuile(e.target.checked);
                               if (!e.target.checked) setCoutFiltreHuile('');
                             }}
                             className="sr-only" 
                           />
                           <span className="text-[11px] font-bold text-center">Filtre Huile</span>
                         </label>
                         
                         <label className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                           hasFiltreGasoil ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface hover:bg-surface-2 text-text-secondary'
                         }`}>
                           <input 
                             type="checkbox" 
                             checked={hasFiltreGasoil} 
                             onChange={e => {
                               setHasFiltreGasoil(e.target.checked);
                               if (!e.target.checked) setCoutFiltreGasoil('');
                             }}
                             className="sr-only" 
                           />
                           <span className="text-[11px] font-bold text-center">Filtre Gasoil</span>
                         </label>
                         
                         <label className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                           hasFiltreAir ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface hover:bg-surface-2 text-text-secondary'
                         }`}>
                           <input 
                             type="checkbox" 
                             checked={hasFiltreAir} 
                             onChange={e => {
                               setHasFiltreAir(e.target.checked);
                               if (!e.target.checked) setCoutFiltreAir('');
                             }}
                             className="sr-only" 
                           />
                           <span className="text-[11px] font-bold text-center">Filtre Air</span>
                         </label>
                       </div>
                     </div>

                     <h3 className="text-sm font-bold text-text-primary mb-3 pt-2 border-t border-border/50">Saisie des Coûts</h3>
                     <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Huile Vidange (MAD)</label>
                          <input 
                            type="number" 
                            step="any"
                            value={coutHuile}
                            onChange={e => setCoutHuile(e.target.value)}
                            placeholder="0.00" 
                            className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                          />
                        </div>

                        {/* Conditional Price Inputs based on checked filters */}
                        <AnimatePresence>
                          {hasFiltreHuile && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pb-1">
                                <label className="block text-xs font-medium text-text-secondary mb-1">Coût Filtre Huile (MAD)</label>
                                <input 
                                  type="number" 
                                  step="any"
                                  required
                                  value={coutFiltreHuile}
                                  onChange={e => setCoutFiltreHuile(e.target.value)}
                                  placeholder="0.00" 
                                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                                />
                              </div>
                            </motion.div>
                          )}

                          {hasFiltreGasoil && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pb-1">
                                <label className="block text-xs font-medium text-text-secondary mb-1">Coût Filtre Gasoil (MAD)</label>
                                <input 
                                  type="number" 
                                  step="any"
                                  required
                                  value={coutFiltreGasoil}
                                  onChange={e => setCoutFiltreGasoil(e.target.value)}
                                  placeholder="0.00" 
                                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                                />
                              </div>
                            </motion.div>
                          )}

                          {hasFiltreAir && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pb-1">
                                <label className="block text-xs font-medium text-text-secondary mb-1">Coût Filtre Air (MAD)</label>
                                <input 
                                  type="number" 
                                  step="any"
                                  required
                                  value={coutFiltreAir}
                                  onChange={e => setCoutFiltreAir(e.target.value)}
                                  placeholder="0.00" 
                                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Notes (optionnel)</label>
                    <textarea 
                      rows={2} 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full p-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-sm" 
                      placeholder="Remarques..."
                    ></textarea>
                  </div>
                  
                  <div className="p-3 bg-surface-2 rounded-lg border border-border flex justify-between items-center">
                    <span className="text-sm font-medium text-text-secondary">Total Estimé</span>
                    <span className="text-lg font-bold text-primary">
                      {formatMAD(
                        (parseFloat(coutHuile) || 0) + 
                        (hasFiltreHuile ? (parseFloat(coutFiltreHuile) || 0) : 0) + 
                        (hasFiltreGasoil ? (parseFloat(coutFiltreGasoil) || 0) : 0) + 
                        (hasFiltreAir ? (parseFloat(coutFiltreAir) || 0) : 0)
                      )}
                    </span>
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
                  form="add-vidange-form"
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
