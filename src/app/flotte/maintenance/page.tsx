import React, { useState, useMemo } from 'react';
import { useMaintenanceStore, MaintenanceType, MaintenanceStatus, MaintenancePiece, getNumeroCommande, getDateCommande, getNumerosBL } from '../../../stores/useMaintenanceStore';
import { useVehiculeStore } from '../../../stores/useVehiculeStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { usePrestataireStore } from '../../../stores/usePrestataireStore';
import { useMagasinStore } from '../../../stores/useMagasinStore';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  FileText,
  Download,
  PlusCircle,
  ShoppingBag,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { formatMAD, formatDate, toDayKey, dayKeyToISO } from '../../../lib/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { DatePicker } from '../../../components/ui/DatePicker';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { MaintenanceReferencesModal, MaintenanceReferences } from './MaintenanceReferencesModal';

const EMPTY_FILTERS = {
  vehiculeId: '',
  numeroBL: '',
  dateFrom: '',
  dateTo: '',
  commandeFrom: '',
  commandeTo: '',
  factureFrom: '',
  factureTo: '',
};

// Inclusive day range; an unset bound is open. A missing date only matches when no bound is set.
const isInDayRange = (value: string | undefined, from: string, to: string) => {
  if (!from && !to) return true;
  const day = toDayKey(value);
  return day !== '' && (!from || day >= from) && (!to || day <= to);
};

function DateRangeFilter({ label, from, to, onChange }: {
  label: string;
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  return (
    <div>
      <span className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <DatePicker value={from} onChange={value => onChange(value, to)} placeholder="Du" />
        <DatePicker value={to} onChange={value => onChange(from, value)} placeholder="Au" />
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const { maintenances, spareParts, addMaintenance, deleteMaintenance, updateMaintenance } = useMaintenanceStore();
  const vehicules = useVehiculeStore(s => s.vehicules);
  const updateVehicule = useVehiculeStore(s => s.updateVehicule);
  const prestataires = usePrestataireStore(s => s.prestataires);
  const magasinItems = useMagasinStore(s => s.items);
  const removeStock = useMagasinStore(s => s.removeStock);
  const user = useAuthStore(s => s.user);
  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referencesTargetId, setReferencesTargetId] = useState<string | null>(null);

  // Form state
  const [vehiculeId, setVehiculeId] = useState('');
  const [type, setType] = useState<MaintenanceType>('preventive');
  const [description, setDescription] = useState('');
  const [datePrevue, setDatePrevue] = useState('');
  const [kilometrage, setKilometrage] = useState(0);
  const [coutEstime, setCoutEstime] = useState(0); // This acts as base/labor cost
  const [numeroCommande, setNumeroCommande] = useState('');
  const [dateCommande, setDateCommande] = useState(() => toDayKey(new Date().toISOString()));
  const [numeroBL, setNumeroBL] = useState('');
  const [numeroFacture, setNumeroFacture] = useState('');
  const [dateFacture, setDateFacture] = useState('');

  // Curative parts selection state
  const [piecesList, setPiecesList] = useState<{ partId: string; nom: string; quantite: number; prixUnitaire: number; source: 'magasin' | 'externe'; magasinItemId?: string }[]>([]);
  const [partSource, setPartSource] = useState<'magasin' | 'externe'>('externe');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partPrice, setPartPrice] = useState(0);

  // Documents state
  const [documentsList, setDocumentsList] = useState<{ id: string; nom: string; reference: string }[]>([]);
  const [docName, setDocName] = useState('');
  const [docRef, setDocRef] = useState('');

  // Suppliers state
  const [fournisseurPieceId, setFournisseurPieceId] = useState('');
  const [fournisseurMaintenanceId, setFournisseurMaintenanceId] = useState('');

  const setFilter = (changes: Partial<typeof EMPTY_FILTERS>) => setFilters(prev => ({ ...prev, ...changes }));
  const activeFilterCount = [
    filters.vehiculeId,
    filters.numeroBL,
    filters.dateFrom || filters.dateTo,
    filters.commandeFrom || filters.commandeTo,
    filters.factureFrom || filters.factureTo,
  ].filter(Boolean).length;

  const sortedVehicules = useMemo(
    () => [...vehicules].sort((a, b) => a.immatriculation.localeCompare(b.immatriculation)),
    [vehicules]
  );

  const filteredMaintenances = useMemo(() => {
    const query = search.toLowerCase();
    const blQuery = filters.numeroBL.trim().toLowerCase();
    return maintenances.filter(m => {
      const vehicule = vehicules.find(v => v.id === m.vehiculeId);
      if (!vehicule) return false;
      if (filters.vehiculeId && m.vehiculeId !== filters.vehiculeId) return false;
      const numerosBL = getNumerosBL(m);
      if (blQuery && !numerosBL.some(n => n.toLowerCase().includes(blQuery))) return false;
      if (!isInDayRange(m.datePrevue, filters.dateFrom, filters.dateTo)) return false;
      if (!isInDayRange(getDateCommande(m), filters.commandeFrom, filters.commandeTo)) return false;
      if (!isInDayRange(m.dateFacture, filters.factureFrom, filters.factureTo)) return false;
      const searchString = [
        vehicule.immatriculation,
        vehicule.marque,
        m.description,
        getNumeroCommande(m),
        m.numeroFacture,
        ...numerosBL,
        ...(m.documents ?? []).map(d => d.reference),
      ].join(' ').toLowerCase();
      return searchString.includes(query);
    }).sort((a, b) => new Date(b.datePrevue).getTime() - new Date(a.datePrevue).getTime());
  }, [maintenances, vehicules, search, filters]);

  const referencesTarget = referencesTargetId ? maintenances.find(m => m.id === referencesTargetId) : undefined;

  const handleSaveReferences = (references: MaintenanceReferences) => {
    if (!referencesTarget) return;
    updateMaintenance(referencesTarget.id, references);
    setReferencesTargetId(null);
    toast.success('Références BC / BL / facture enregistrées');
  };

  // PDF Purchase Order generator
  const handleDownloadBC = (m: any, typeBC: 'piece' | 'maintenance' | 'combine') => {
    const vehicule = vehicules.find(v => v.id === m.vehiculeId);
    const fPiece = prestataires.find(p => p.id === m.fournisseurPieceId);
    const fMaint = prestataires.find(p => p.id === m.fournisseurMaintenanceId);
    
    const supplier = typeBC === 'piece' ? fPiece : fMaint;
    const finalSupplier = supplier || fMaint || fPiece;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Dark slate banner
    doc.setFillColor(11, 17, 32);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('FLEETOPS - BON DE COMMANDE', 15, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Réf BC: ${getNumeroCommande(m)}`, 15, 26);
    doc.text(`Date: ${new Date(getDateCommande(m)).toLocaleDateString('fr-FR')}`, 150, 26);

    doc.setTextColor(0, 0, 0);

    // Supplier Box
    doc.setDrawColor(220, 225, 230);
    doc.setFillColor(245, 247, 250);
    doc.rect(15, 45, 85, 40, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('FOURNISSEUR :', 20, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(finalSupplier?.nom || 'Non spécifié', 20, 58);
    doc.setFontSize(9);
    doc.text(`Tél: ${finalSupplier?.telephone || 'N/A'}`, 20, 64);
    doc.text(`Email: ${finalSupplier?.email || 'N/A'}`, 20, 70);
    doc.text(`Adresse: ${finalSupplier?.adresse || 'N/A'}`, 20, 76);

    // Vehicle Box
    doc.rect(110, 45, 85, 40, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('VÉHICULE & PARC :', 115, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(`Immatriculation: ${vehicule?.immatriculation || 'N/A'}`, 115, 58);
    doc.setFontSize(9);
    doc.text(`Marque / Modèle: ${vehicule ? `${vehicule.marque} ${vehicule.modele}` : 'N/A'}`, 115, 64);
    doc.text(`Kilométrage: ${m.kilometrage?.toLocaleString() || 'N/A'} km`, 115, 70);
    doc.text(`Type: ${getTypeLabel(m.type)}`, 115, 76);

    // Table Header
    let y = 95;
    doc.setFillColor(11, 17, 32);
    doc.rect(15, y, 180, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('DÉSIGNATION / PRESTATION', 20, y + 5.5);
    doc.text('QTÉ', 125, y + 5.5);
    doc.text('P.U (MAD)', 145, y + 5.5);
    doc.text('TOTAL (MAD)', 170, y + 5.5);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    y += 8;

    let grandTotal = 0;

    // Render Parts
    if ((typeBC === 'piece' || typeBC === 'combine') && m.pieces && m.pieces.length > 0) {
      m.pieces.forEach((p: any) => {
        const lineTotal = p.quantite * p.prixUnitaire;
        grandTotal += lineTotal;

        doc.setDrawColor(230, 235, 240);
        doc.line(15, y + 7, 195, y + 7);
        
        doc.text(p.nom, 20, y + 5);
        doc.text(String(p.quantite), 125, y + 5);
        doc.text(p.prixUnitaire.toFixed(2), 145, y + 5);
        doc.text(lineTotal.toFixed(2), 170, y + 5);
        
        y += 8;
      });
    }

    // Render Maintenance Service
    if (typeBC === 'maintenance' || typeBC === 'combine') {
      const serviceTotal = m.coutEstime;
      grandTotal += serviceTotal;

      doc.setDrawColor(230, 235, 240);
      doc.line(15, y + 7, 195, y + 7);

      doc.setFont('helvetica', 'bold');
      doc.text(`Prestation de maintenance : ${m.description}`, 20, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text('1', 125, y + 5);
      doc.text(m.coutEstime.toFixed(2), 145, y + 5);
      doc.text(serviceTotal.toFixed(2), 170, y + 5);
      
      y += 8;
    }

    y += 5;
    // Summary block
    doc.setDrawColor(11, 17, 32);
    doc.setLineWidth(0.5);
    doc.line(130, y, 195, y);
    
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('MONTANT TOTAL :', 130, y);
    doc.text(`${grandTotal.toFixed(2)} MAD`, 165, y);

    // Signatures
    y += 30;
    doc.setFontSize(9);
    doc.text('Cachet et Signature Fournisseur', 25, y);
    doc.text('Directeur Flotte FleetOps', 130, y);
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(20, y + 4, 60, 25);
    doc.rect(125, y + 4, 60, 25);

    const titlePrefix = typeBC === 'combine' ? 'BC_Combine' : typeBC === 'piece' ? 'BC_Pieces' : 'BC_Service_Maintenance';
    doc.save(`${titlePrefix}_${vehicule?.immatriculation || 'camion'}_${m.id.substring(0,6)}.pdf`);
  };

  const handleAddPartToForm = () => {
    if (!selectedPartId && partSource === 'externe') return;
    if (partSource === 'magasin' && !selectedPartId) return;

    let nom = '';
    let prix = partPrice;
    let magasinItemId = undefined;

    if (partSource === 'magasin') {
      const item = magasinItems.find(i => i.id === selectedPartId);
      if (!item) return;
      nom = item.name;
      prix = item.unitPrice;
      magasinItemId = item.id;
    } else {
      const part = spareParts.find(sp => sp.id === selectedPartId);
      nom = part ? part.nom : selectedPartId; // allow custom names if not found
    }

    setPiecesList([
      ...piecesList,
      {
        partId: partSource === 'magasin' ? `magasin-${selectedPartId}` : selectedPartId,
        nom,
        quantite: partQty,
        prixUnitaire: prix,
        source: partSource,
        magasinItemId
      }
    ]);

    setSelectedPartId('');
    setPartQty(1);
    setPartPrice(0);
  };

  const handleRemovePartFromForm = (idx: number) => {
    setPiecesList(piecesList.filter((_, i) => i !== idx));
  };

  const handleAddDocumentToForm = () => {
    if (!docName.trim() || !docRef.trim()) return;
    setDocumentsList([
      ...documentsList,
      {
        id: Math.random().toString(36).substring(2, 9),
        nom: docName.trim(),
        reference: docRef.trim()
      }
    ]);
    setDocName('');
    setDocRef('');
  };

  const handleRemoveDocumentFromForm = (idx: number) => {
    setDocumentsList(documentsList.filter((_, i) => i !== idx));
  };

  const totalPiecesCost = useMemo(() => {
    return piecesList.reduce((acc, p) => acc + (p.quantite * p.prixUnitaire), 0);
  }, [piecesList]);

  const totalGlobalCost = useMemo(() => {
    return coutEstime + totalPiecesCost;
  }, [coutEstime, totalPiecesCost]);

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    const finalPieces = type === 'curative' ? piecesList : [];
    const finalTotalPieces = type === 'curative' ? totalPiecesCost : 0;
    const finalTotalGlobal = type === 'curative' ? totalGlobalCost : coutEstime;

    const maintenanceData = {
      vehiculeId,
      type,
      description,
      datePrevue: new Date(datePrevue).toISOString(),
      kilometrage,
      coutEstime, // Labor/base cost
      coutTotalPieces: finalTotalPieces,
      coutTotalGlobal: finalTotalGlobal,
      fournisseurPieceId: type === 'curative' && finalPieces.length > 0 ? fournisseurPieceId : undefined,
      fournisseurMaintenanceId: fournisseurMaintenanceId || undefined,
      status: 'planifiee' as MaintenanceStatus,
      pieces: finalPieces,
      documents: documentsList,
      numeroCommande: numeroCommande.trim() || undefined,
      dateCommande: dayKeyToISO(dateCommande),
      numeroBL: numeroBL.trim() || undefined,
      numeroFacture: numeroFacture.trim() || undefined,
      dateFacture: dayKeyToISO(dateFacture)
    };

    const createdRecord = addMaintenance(maintenanceData);
    // Automatically update the vehicle's status to 'immobilise'
    updateVehicule(vehiculeId, { status: 'immobilise' });
    
    // Deduct stock
    if (type === 'curative') {
      finalPieces.forEach(p => {
        if (p.source === 'magasin' && p.magasinItemId) {
           removeStock(p.magasinItemId, p.quantite, `Maintenance ${createdRecord.description} sur ${vehicules.find(v => v.id === vehiculeId)?.immatriculation}`, vehiculeId);
        }
      });
    }

    setIsModalOpen(false);

    // Trigger Purchase Orders (Bons de commande)
    if (type === 'curative') {
      if (finalPieces.length > 0 && fournisseurPieceId === fournisseurMaintenanceId) {
        // Combined Purchase Order
        handleDownloadBC(createdRecord, 'combine');
        toast.success('Bon de commande unique (Pièces + Prestation) généré et téléchargé !');
      } else if (finalPieces.length > 0) {
        // Two separate Purchase Orders
        handleDownloadBC(createdRecord, 'piece');
        handleDownloadBC(createdRecord, 'maintenance');
        toast.success('Deux bons de commande distincts générés et téléchargés !');
      } else {
        // Service only
        handleDownloadBC(createdRecord, 'maintenance');
        toast.success('Bon de commande prestation généré et téléchargé !');
      }
    } else {
      // Non curative (preventive, inspection), trigger standard labor PO if supplier is specified
      if (fournisseurMaintenanceId) {
        handleDownloadBC(createdRecord, 'maintenance');
        toast.success('Bon de commande prestation généré et téléchargé !');
      }
    }

    // Reset form states
    setVehiculeId('');
    setType('preventive');
    setDescription('');
    setDatePrevue('');
    setKilometrage(0);
    setCoutEstime(0);
    setNumeroCommande('');
    setDateCommande(toDayKey(new Date().toISOString()));
    setNumeroBL('');
    setNumeroFacture('');
    setDateFacture('');
    setPiecesList([]);
    setDocumentsList([]);
    setDocName('');
    setDocRef('');
    setFournisseurPieceId('');
    setFournisseurMaintenanceId('');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canManage) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) {
      deleteMaintenance(id);
    }
  };

  const handleReturnToPark = (mId: string, vId: string) => {
    updateMaintenance(mId, { status: 'terminee', dateRealisation: new Date().toISOString() });
    updateVehicule(vId, { status: 'disponible' });
    toast.success("Véhicule retourné au parc et prêt à travailler !");
  };

  const getStatusIcon = (status: MaintenanceStatus) => {
    switch (status) {
      case 'terminee': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'en_cours': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'planifiee': return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'annulee': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusLabel = (status: MaintenanceStatus) => {
    switch (status) {
      case 'terminee': return 'Terminée';
      case 'en_cours': return 'En cours';
      case 'planifiee': return 'Planifiée';
      case 'annulee': return 'Annulée';
    }
  };

  const getTypeLabel = (mtype: MaintenanceType) => {
    switch (mtype) {
      case 'preventive': return 'Préventive';
      case 'curative': return 'Curative';
      case 'inspection': return 'Inspection';
    }
  };

  const triggerDownloadForExisting = (m: any) => {
    if (m.type === 'curative' && m.pieces && m.pieces.length > 0 && m.fournisseurPieceId === m.fournisseurMaintenanceId) {
      handleDownloadBC(m, 'combine');
    } else if (m.type === 'curative' && m.pieces && m.pieces.length > 0) {
      handleDownloadBC(m, 'piece');
      handleDownloadBC(m, 'maintenance');
    } else {
      handleDownloadBC(m, 'maintenance');
    }
    toast.success('Bons de commande téléchargés !');
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Maintenance
          </h1>
          <p className="text-text-secondary mt-1">Suivi des entretiens, pièces rechanges et réparations curatives</p>
        </div>
        
        <div className="flex items-center gap-3">
          {canManage && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle maintenance</span>
              <span className="sm:hidden">Nouvelle</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher par véhicule, description, n° BC, BL, facture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(open => !open)}
          aria-expanded={showFilters}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors font-medium',
            showFilters || activeFilterCount > 0
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-surface border-border hover:bg-surface-2 text-text-primary'
          )}
        >
          <Filter className="w-4 h-4" />
          <span>Filtres</span>
          {activeFilterCount > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface p-4 rounded-xl border border-border shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="filter-matricule" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Matricule</label>
                  <select
                    id="filter-matricule"
                    value={filters.vehiculeId}
                    onChange={e => setFilter({ vehiculeId: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Tous les véhicules</option>
                    {sortedVehicules.map(v => (
                      <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-bl" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">N° de BL</label>
                  <input
                    id="filter-bl"
                    type="text"
                    value={filters.numeroBL}
                    onChange={e => setFilter({ numeroBL: e.target.value })}
                    placeholder="Ex: BL-2026-0451"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <DateRangeFilter
                  label="Date de maintenance"
                  from={filters.dateFrom}
                  to={filters.dateTo}
                  onChange={(dateFrom, dateTo) => setFilter({ dateFrom, dateTo })}
                />
                <DateRangeFilter
                  label="Date du bon de commande"
                  from={filters.commandeFrom}
                  to={filters.commandeTo}
                  onChange={(commandeFrom, commandeTo) => setFilter({ commandeFrom, commandeTo })}
                />
                <DateRangeFilter
                  label="Date de facture"
                  from={filters.factureFrom}
                  to={filters.factureTo}
                  onChange={(factureFrom, factureTo) => setFilter({ factureFrom, factureTo })}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                <span className="text-xs text-text-secondary">
                  {filteredMaintenances.length} maintenance{filteredMaintenances.length > 1 ? 's' : ''} trouvée{filteredMaintenances.length > 1 ? 's' : ''}
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-sm text-text-secondary">
                <th className="p-4 font-medium">Véhicule</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Prestation / Pièces</th>
                <th className="p-4 font-medium">Fournisseurs</th>
                <th className="p-4 font-medium">Date Prévue</th>
                <th className="p-4 font-medium">BC / BL / Facture</th>
                <th className="p-4 font-medium">Coût Total</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMaintenances.map((m) => {
                const vehicule = vehicules.find(v => v.id === m.vehiculeId);
                const fPiece = prestataires.find(p => p.id === m.fournisseurPieceId);
                const fMaint = prestataires.find(p => p.id === m.fournisseurMaintenanceId);
                
                const numerosBL = getNumerosBL(m);

                // Calculate display total cost
                const displayTotal = m.coutTotalGlobal || (m.coutEstime + (m.pieces?.reduce((a, b) => a + (b.quantite * b.prixUnitaire), 0) || 0));

                return (
                  <tr key={m.id} className="hover:bg-surface-2/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-text-primary whitespace-nowrap">{vehicule?.immatriculation}</div>
                          <div className="text-xs text-text-secondary">{vehicule?.marque} {vehicule?.modele}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        m.type === 'curative' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-surface-2 border border-border text-text-secondary'
                      }`}>
                        {getTypeLabel(m.type)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-text-primary max-w-xs truncate" title={m.description}>
                        {m.description}
                      </div>
                      {m.pieces && m.pieces.length > 0 && (
                        <div className="text-xs text-text-muted mt-1 flex flex-wrap gap-1">
                          {m.pieces.map((p, pi) => (
                            <span key={pi} className="bg-surface border border-border px-1.5 py-0.5 rounded text-[10px]">
                              {p.nom} (x{p.quantite})
                            </span>
                          ))}
                        </div>
                      )}
                      {m.documents && m.documents.length > 0 && (
                        <div className="text-xs text-text-muted mt-1 flex flex-col gap-0.5">
                          {m.documents.map((doc, di) => (
                            <span key={di} className="flex items-center gap-1 text-[10px] text-primary">
                              <FileText className="w-3 h-3" />
                              {doc.nom}: {doc.reference}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-xs space-y-0.5 text-text-primary">
                        {fMaint && (
                          <div>
                            <span className="text-text-secondary font-medium">Main-d'oeuvre:</span> <span className="font-bold">{fMaint.nom}</span>
                          </div>
                        )}
                        {fPiece && (
                          <div>
                            <span className="text-text-secondary font-medium">Pièces:</span> <span className="font-bold">{fPiece.nom}</span>
                          </div>
                        )}
                        {!fMaint && !fPiece && <span className="text-text-muted italic">Non spécifié</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-text-primary font-medium whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        {formatDate(m.datePrevue)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs space-y-0.5 text-text-primary whitespace-nowrap">
                        <div>
                          <span className="text-text-secondary font-medium">BC:</span> <span className="font-bold">{getNumeroCommande(m)}</span>
                          <span className="text-text-muted"> · {formatDate(getDateCommande(m))}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary font-medium">BL:</span>{' '}
                          {numerosBL.length > 0
                            ? <span className="font-bold">{numerosBL.join(', ')}</span>
                            : <span className="text-text-muted italic">—</span>}
                        </div>
                        <div>
                          <span className="text-text-secondary font-medium">Facture:</span>{' '}
                          {m.numeroFacture || m.dateFacture ? (
                            <>
                              <span className="font-bold">{m.numeroFacture || 'Sans n°'}</span>
                              {m.dateFacture && <span className="text-text-muted"> · {formatDate(m.dateFacture)}</span>}
                            </>
                          ) : (
                            <span className="text-text-muted italic">—</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-text-primary">
                        {formatMAD(displayTotal)}
                      </div>
                      {m.type === 'curative' && m.pieces && m.pieces.length > 0 && (
                        <div className="text-[10px] text-text-muted">
                          (Svc: {formatMAD(m.coutEstime)} | Pièces: {formatMAD(displayTotal - m.coutEstime)})
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(m.status)}
                        <span className="text-sm font-semibold text-text-primary">
                          {getStatusLabel(m.status)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canManage && m.status !== 'terminee' && m.status !== 'annulee' && (
                          <button
                            onClick={() => handleReturnToPark(m.id, m.vehiculeId)}
                            className="px-2 py-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                            title="Retourner au parc (Prêt à travailler)"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Retour au parc</span>
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => setReferencesTargetId(m.id)}
                            className="p-1.5 bg-surface-2 text-text-secondary hover:bg-primary hover:text-white rounded transition-colors"
                            title="Saisir BC / BL / facture"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => triggerDownloadForExisting(m)}
                          className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                          title="Télécharger Bon de Commande (PDF)"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        {canManage && (
                          <button 
                            onClick={(e) => handleDelete(e, m.id)}
                            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMaintenances.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-text-secondary">
                    <Wrench className="w-12 h-12 mx-auto text-border-strong mb-4" />
                    {maintenances.length > 0 ? (
                      <>
                        <p className="text-lg font-bold text-text-primary">Aucune maintenance ne correspond à votre recherche</p>
                        <p className="text-sm">Modifiez la recherche ou réinitialisez les filtres.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-text-primary">Aucune maintenance planifiée</p>
                        <p className="text-sm">Cliquez sur nouvelle maintenance pour enregistrer un entretien.</p>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      <AnimatePresence>
        {isModalOpen && canManage && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-surface rounded-2xl shadow-2xl z-50 border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  Nouvelle maintenance
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
                <form id="add-maintenance-form" onSubmit={handleAddMaintenance} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Véhicule</label>
                      <select 
                        required
                        value={vehiculeId}
                        onChange={e => setVehiculeId(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        <option value="">Sélectionner...</option>
                        {vehicules.map(v => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Type d'entretien</label>
                      <select 
                        required
                        value={type}
                        onChange={e => {
                          setType(e.target.value as MaintenanceType);
                          if (e.target.value !== 'curative') {
                            setPiecesList([]);
                          }
                        }}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        <option value="preventive">Préventive</option>
                        <option value="curative">Curative (Corrective)</option>
                        <option value="inspection">Inspection</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date Prévue</label>
                      <DatePicker
                        value={datePrevue}
                        onChange={setDatePrevue}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Kilométrage actuel (km)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={kilometrage}
                        onChange={e => setKilometrage(parseInt(e.target.value) || 0)}
                        placeholder="Ex: 145000" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Description / Motif</label>
                    <textarea 
                      required
                      rows={2}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Ex: Réparation alternateur, Changement des freins..."
                      className="w-full p-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">N° Bon de Commande</label>
                      <input 
                        type="text" 
                        value={numeroCommande}
                        onChange={e => setNumeroCommande(e.target.value)}
                        placeholder="Vide = auto-généré" 
                        className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date du Bon de Commande</label>
                      <DatePicker
                        value={dateCommande}
                        onChange={setDateCommande}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">N° BL (Optionnel)</label>
                      <input 
                        type="text" 
                        value={numeroBL}
                        onChange={e => setNumeroBL(e.target.value)}
                        placeholder="Ex: BL-0451" 
                        className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">N° Facture</label>
                      <input 
                        type="text" 
                        value={numeroFacture}
                        onChange={e => setNumeroFacture(e.target.value)}
                        placeholder="Ex: FAC-145" 
                        className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date Facture</label>
                      <DatePicker
                        value={dateFacture}
                        onChange={setDateFacture}
                      />
                    </div>
                  </div>

                  {/* Section: MAIN D'OEUVRE / PRESTATION LABOR */}
                  <div className="p-4 bg-surface-2 rounded-xl border border-border space-y-4">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Prestation & Labor
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Coût Estimé Service (MAD)</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          step="0.01"
                          value={coutEstime}
                          onChange={e => setCoutEstime(parseFloat(e.target.value) || 0)}
                          placeholder="Coût MO" 
                          className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Fournisseur Service</label>
                        <select 
                          required
                          value={fournisseurMaintenanceId}
                          onChange={e => setFournisseurMaintenanceId(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        >
                          <option value="">Sélectionner un garage...</option>
                          {prestataires.map(p => (
                            <option key={p.id} value={p.id}>{p.nom} ({p.type})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CURATIVE: SPARE PARTS SECTION */}
                  {type === 'curative' && (
                    <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 space-y-4">
                      <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Pièces de Rechange Changées
                      </h3>
                      
                      {/* Form inputs to add a part to the list */}
                      <div className="grid grid-cols-12 gap-2 items-end mb-4">
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-text-secondary mb-1">Source</label>
                          <select
                            value={partSource}
                            onChange={e => {
                               setPartSource(e.target.value as 'magasin' | 'externe');
                               setSelectedPartId('');
                            }}
                            className="w-full h-10 px-2 rounded border border-border bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                            <option value="externe">Achat Externe</option>
                            <option value="magasin">Depuis Magasin</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          <label className="block text-xs font-medium text-text-secondary mb-1">Pièce</label>
                          {partSource === 'externe' ? (
                            <input
                               type="text"
                               list="spare-parts-list"
                               value={selectedPartId}
                               onChange={e => {
                                 setSelectedPartId(e.target.value);
                                 const part = spareParts.find(sp => sp.nom === e.target.value);
                                 if (part) setPartPrice(part.prixDefaut);
                               }}
                               placeholder="Saisir ou choisir..."
                               className="w-full h-10 px-2 rounded border border-border bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          ) : (
                            <select
                               value={selectedPartId}
                               onChange={e => setSelectedPartId(e.target.value)}
                               className="w-full h-10 px-2 rounded border border-border bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                               <option value="">Sélectionner en stock...</option>
                               {magasinItems.map(item => (
                                 <option key={item.id} value={item.id}>{item.name} ({item.quantity} en stock) - {item.unitPrice} MAD</option>
                               ))}
                            </select>
                          )}
                          <datalist id="spare-parts-list">
                             {spareParts.map(sp => (
                               <option key={sp.id} value={sp.nom}>{sp.prixDefaut} MAD</option>
                             ))}
                          </datalist>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-text-secondary mb-1">Qté</label>
                          <input
                            type="number"
                            min="1"
                            value={partQty}
                            onChange={e => setPartQty(parseInt(e.target.value) || 1)}
                            className="w-full h-10 px-2 rounded border border-border bg-surface text-xs font-bold text-center outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-text-secondary mb-1">Prix</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={partSource === 'magasin' ? magasinItems.find(i => i.id === selectedPartId)?.unitPrice || 0 : partPrice}
                            onChange={e => setPartPrice(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            disabled={partSource === 'magasin'}
                            className="w-full h-10 px-2 rounded border border-border bg-surface text-xs font-bold outline-none disabled:opacity-50"
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            disabled={!selectedPartId}
                            onClick={handleAddPartToForm}
                            className="w-full h-10 bg-primary hover:bg-primary-hover text-white rounded flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <PlusCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Display added pieces */}
                      {piecesList.length > 0 ? (
                        <div className="border border-border rounded-lg bg-surface overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-2 text-text-secondary border-b border-border">
                              <tr>
                                <th className="p-2">Pièce</th>
                                <th className="p-2 text-center">Qté</th>
                                <th className="p-2 text-right">P.U</th>
                                <th className="p-2 text-right">Sous-total</th>
                                <th className="p-2 w-8 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {piecesList.map((p, idx) => (
                                <tr key={idx} className="hover:bg-surface-2/20">
                                  <td className="p-2 font-semibold text-text-primary">{p.nom}</td>
                                  <td className="p-2 text-center font-bold">{p.quantite}</td>
                                  <td className="p-2 text-right">{p.prixUnitaire.toLocaleString()} MAD</td>
                                  <td className="p-2 text-right font-bold text-primary">{(p.quantite * p.prixUnitaire).toLocaleString()} MAD</td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePartFromForm(idx)}
                                      className="text-text-muted hover:text-danger p-1"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-2 bg-surface-2 border-t border-border flex justify-between items-center text-xs">
                            <span className="font-semibold text-text-secondary">Somme prix des pièces:</span>
                            <span className="font-bold text-primary">{totalPiecesCost.toLocaleString()} MAD</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-text-muted italic text-center py-2">Aucune pièce sélectionnée pour cet entretien curative.</p>
                      )}

                      {/* Supplier for Parts */}
                      {piecesList.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1">Fournisseur d'achat des pièces</label>
                          <select 
                            required
                            value={fournisseurPieceId}
                            onChange={e => setFournisseurPieceId(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                          >
                            <option value="">Sélectionner le fournisseur de pièces...</option>
                            {prestataires.map(p => (
                              <option key={p.id} value={p.id}>{p.nom} ({p.type})</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ADDITIONAL DOCUMENTS SECTION */}
                  <div className="p-4 bg-surface-2 rounded-xl border border-border space-y-4">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Documents Additionnels
                    </h3>
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-text-secondary mb-1">Type de Document</label>
                        <input
                          type="text"
                          value={docName}
                          onChange={e => setDocName(e.target.value)}
                          placeholder="Ex: Facture, Devis..."
                          className="w-full h-10 px-2 rounded border border-border bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-text-secondary mb-1">Référence</label>
                        <input
                          type="text"
                          value={docRef}
                          onChange={e => setDocRef(e.target.value)}
                          placeholder="Ex: FAC-2023-145"
                          className="w-full h-10 px-2 rounded border border-border bg-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          type="button"
                          disabled={!docName.trim() || !docRef.trim()}
                          onClick={handleAddDocumentToForm}
                          className="w-full h-10 bg-primary hover:bg-primary-hover text-white rounded flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {documentsList.length > 0 && (
                      <div className="border border-border rounded-lg bg-surface overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-surface-2 text-text-secondary border-b border-border">
                            <tr>
                              <th className="p-2">Type</th>
                              <th className="p-2">Référence</th>
                              <th className="p-2 w-8 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {documentsList.map((doc, idx) => (
                              <tr key={idx} className="hover:bg-surface-2/20">
                                <td className="p-2 font-semibold text-text-primary">{doc.nom}</td>
                                <td className="p-2 text-text-secondary">{doc.reference}</td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDocumentFromForm(idx)}
                                    className="text-text-muted hover:text-danger p-1"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Summary Cost Block */}
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-text-secondary uppercase">Coût Estimé Maintenance</div>
                      <div className="text-xs text-text-muted mt-0.5">
                        Labor ({coutEstime.toLocaleString()} MAD) + Pièces ({type === 'curative' ? totalPiecesCost.toLocaleString() : '0'} MAD)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        {type === 'curative' ? totalGlobalCost.toLocaleString() : coutEstime.toLocaleString()} MAD
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-border bg-surface-2 flex gap-3 justify-end">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  form="add-maintenance-form"
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  Créer & Générer Bons de Commande
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {referencesTarget && canManage && (
          <MaintenanceReferencesModal
            key={referencesTarget.id}
            maintenance={referencesTarget}
            immatriculation={vehicules.find(v => v.id === referencesTarget.vehiculeId)?.immatriculation}
            onClose={() => setReferencesTargetId(null)}
            onSave={handleSaveReferences}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
