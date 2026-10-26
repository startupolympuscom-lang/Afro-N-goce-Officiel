import React, { useState, useMemo } from 'react';
import { useDispatchGazStore, GlobalStockItem } from '../../../../stores/useDispatchGazStore';
import { 
  Package, Plus, Truck, Calendar, AlertTriangle, CheckCircle2, 
  Trash2, ShieldCheck, Database, History, TrendingUp, Filter, 
  ArrowUpRight, ArrowDownLeft, FileText, BarChart3, Clock, HelpCircle, X, ChevronRight, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DispatchStockPage() {
  const { 
    drivers, 
    brands, 
    stockDispatches, 
    dispatchStockBatch, 
    pointages, 
    globalStock, 
    globalStockHistory, 
    setGlobalStock, 
    validateStockDispatch, 
    dispatchToComptoir, 
    stockActivities,
    comptoirStock 
  } = useDispatchGazStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'operations' | 'audit'>('dashboard');
  const [selectedCompany, setSelectedCompany] = useState<'all' | 'afro_negoce' | 'chakirine_gaz'>('all');

  const [isDispatching, setIsDispatching] = useState(false);
  const [isDispatchingComptoir, setIsDispatchingComptoir] = useState(false);
  const [isSettingGlobal, setIsSettingGlobal] = useState(false);
  const [isDamagedStockModalOpen, setIsDamagedStockModalOpen] = useState(false);

  const [damagedStockForm, setDamagedStockForm] = useState({
    action: 'declare' as 'declare' | 'repair',
    company: 'afro_negoce' as 'afro_negoce' | 'chakirine_gaz',
    brandId: '',
    category: '',
    quantity: 0,
    repairTo: 'empty' as 'empty' | 'full',
    source: 'empty' as 'empty' | 'full'
  });

  const [globalStockForm, setGlobalStockForm] = useState<GlobalStockItem[]>(globalStock);
  const [selectedModalCompany, setSelectedModalCompany] = useState<'all' | 'afro_negoce' | 'chakirine_gaz'>('all');
  const [securityCode, setSecurityCode] = useState("");
  const [validationForm, setValidationForm] = useState<{ [key: string]: { returnedFull: number, returnedEmpty: number } }>({});

  const [formData, setFormData] = useState({
    driverId: '',
    brandId: '',
    items: [{ category: '', quantity: 0 }]
  });

  const [comptoirFormData, setComptoirFormData] = useState({
    brandId: '',
    company: 'afro_negoce' as 'afro_negoce' | 'chakirine_gaz',
    items: [{ category: '', quantity: 0 }]
  });

  // Self-heal: ensure that all default globalStock and comptoirStock items are initialized in the persistent store.
  // This handles situations where previous states without 'chakirine_gaz' entries were cached in the browser.
  React.useEffect(() => {
    const defaultGlobal = [
      { brandId: 'b1', category: '3Kg', full: 100, empty: 50, company: 'afro_negoce' },
      { brandId: 'b1', category: '12Kg', full: 200, empty: 80, company: 'afro_negoce' },
      { brandId: 'b1', category: '34Kg', full: 50, empty: 20, company: 'afro_negoce' },
      { brandId: 'b1', category: '3Kg', full: 120, empty: 40, company: 'chakirine_gaz' },
      { brandId: 'b1', category: '12Kg', full: 180, empty: 60, company: 'chakirine_gaz' },
      { brandId: 'b1', category: '34Kg', full: 40, empty: 15, company: 'chakirine_gaz' }
    ];

    const defaultComptoir = [
      { brandId: 'b1', category: '3Kg', full: 20, empty: 10, company: 'afro_negoce' },
      { brandId: 'b1', category: '12Kg', full: 40, empty: 15, company: 'afro_negoce' },
      { brandId: 'b1', category: '34Kg', full: 10, empty: 5, company: 'afro_negoce' },
      { brandId: 'b1', category: '3Kg', full: 30, empty: 5, company: 'chakirine_gaz' },
      { brandId: 'b1', category: '12Kg', full: 35, empty: 10, company: 'chakirine_gaz' },
      { brandId: 'b1', category: '34Kg', full: 15, empty: 2, company: 'chakirine_gaz' }
    ];

    let updated = false;
    const currentStock = [...globalStock];
    const currentComptoir = [...(comptoirStock || [])];

    defaultGlobal.forEach(defItem => {
      const exists = currentStock.some(
        g => g.brandId === defItem.brandId && 
             g.category === defItem.category && 
             (g.company === defItem.company || (!g.company && defItem.company === 'afro_negoce'))
      );
      if (!exists) {
        currentStock.push(defItem);
        updated = true;
      }
    });

    defaultComptoir.forEach(defItem => {
      const exists = currentComptoir.some(
        g => g.brandId === defItem.brandId && 
             g.category === defItem.category && 
             (g.company === defItem.company || (!g.company && defItem.company === 'afro_negoce'))
      );
      if (!exists) {
        currentComptoir.push(defItem);
        updated = true;
      }
    });

    if (updated) {
      useDispatchGazStore.setState({ globalStock: currentStock, comptoirStock: currentComptoir });
      setGlobalStockForm(currentStock.map(g => ({ ...g, full: 0, empty: 0 })));
    }
  }, [globalStock, comptoirStock]);

  // Ensure we get today's date in local date consistently
  const getLocalDateStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const todayStr = getLocalDateStr();
  const todaysDispatches = stockDispatches.filter(sd => !sd.isValidated || sd.date.includes(todayStr) || sd.date.includes(new Date().toISOString().split('T')[0]));
  const pendingValidations = stockDispatches.filter(sd => !sd.isValidated);

  const isDriverCheckedIn = (driverId: string) => {
    return pointages.some(p => {
      if (p.driverId !== driverId) return false;
      const pointageDate = new Date(p.timestamp || p.date);
      const now = new Date();
      const diffHours = (now.getTime() - pointageDate.getTime()) / (1000 * 60 * 60);
      const isTodayStr = p.date === new Date().toISOString().split('T')[0] || p.date === todayStr;
      return diffHours < 16 || isTodayStr;
    });
  };

  // Submit handers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isDriverCheckedIn(formData.driverId)) {
      toast.warning("Note : Le chauffeur n'a pas encore enregistré son pointage aujourd'hui.");
    }

    if (formData.driverId && formData.brandId) {
      const validItems = formData.items.filter(i => i.category && i.quantity > 0);
      if (validItems.length === 0) {
        toast.error("Veuillez ajouter au moins une catégorie avec une quantité valide.");
        return;
      }

      let insufficient = false;
      const driver = drivers.find(d => d.id === formData.driverId);
      const driverCompany = driver?.company || 'afro_negoce';

      validItems.forEach(item => {
        const gs = globalStock.find(g => g.brandId === formData.brandId && g.category === item.category && (g.company || 'afro_negoce') === driverCompany);
        if (!gs || gs.full < item.quantity) {
          insufficient = true;
          toast.error(`Stock global insuffisant pour ${item.category} (${driverCompany === 'chakirine_gaz' ? 'Chakirine' : 'Afro'})`);
        }
      });

      if (insufficient) return;

      const fullBrand = brands.find(b => b.id === formData.brandId);
      if (fullBrand) {
        const dispatchesToBatch = validItems.map(item => {
          const driver = drivers.find(d => d.id === formData.driverId);
          const comp = driver?.company || 'afro_negoce';
          
          useDispatchGazStore.getState().addStockActivity({
            action: 'dispatch_driver',
            company: comp,
            brandId: formData.brandId,
            category: item.category,
            quantityFull: item.quantity,
            description: `Affectation à ${driver?.prenom} ${driver?.nom}`
          });

          return {
            id: nanoid(),
            driverId: formData.driverId,
            brandId: formData.brandId,
            category: item.category,
            quantity: item.quantity,
            date: new Date().toISOString(),
            sold: 0,
            soldConsigned: 0,
            isValidated: false
          };
        });
        
        dispatchStockBatch(dispatchesToBatch);
      }

      setIsDispatching(false);
      setFormData({ driverId: '', brandId: '', items: [{ category: '', quantity: 0 }] });
      toast.success("Stock affecté avec succès.");
    }
  };

  const handleComptoirSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comptoirFormData.brandId) {
      const validItems = comptoirFormData.items.filter(i => i.category && i.quantity > 0);
      if (validItems.length === 0) {
        toast.error("Veuillez ajouter au moins une catégorie avec une quantité valide.");
        return;
      }

      let insufficient = false;
      const comp = comptoirFormData.company || 'afro_negoce';
      validItems.forEach(item => {
        const gs = globalStock.find(g => g.brandId === comptoirFormData.brandId && g.category === item.category && (g.company || 'afro_negoce') === comp);
        if (!gs || gs.full < item.quantity) {
          insufficient = true;
          toast.error(`Stock global insuffisant pour ${item.category} (${comp === 'chakirine_gaz' ? 'Chakirine' : 'Afro'})`);
        }
      });

      if (insufficient) return;

      const fullBrand = brands.find(b => b.id === comptoirFormData.brandId);
      if (fullBrand) {
        validItems.forEach(item => {
          dispatchToComptoir(comptoirFormData.brandId, item.category, item.quantity, comp);
          
          useDispatchGazStore.getState().addStockActivity({
            action: 'dispatch_comptoir',
            company: comp,
            brandId: comptoirFormData.brandId,
            category: item.category,
            quantityFull: item.quantity,
            description: `Affectation Comptoir`
          });
        });
      }

      setIsDispatchingComptoir(false);
      setComptoirFormData({ brandId: '', company: 'afro_negoce', items: [{ category: '', quantity: 0 }] });
      toast.success("Stock affecté au comptoir avec succès.");
    }
  };

  const handleDamagedStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!damagedStockForm.brandId || !damagedStockForm.category || damagedStockForm.quantity <= 0) {
      toast.error("Veuillez remplir tous les champs correctement.");
      return;
    }

    const { action, company, brandId, category, quantity, repairTo, source } = damagedStockForm;
    const store = useDispatchGazStore.getState();

    if (action === 'declare') {
      const gs = store.globalStock.find(g => g.brandId === brandId && g.category === category && (g.company || 'afro_negoce') === company);
      if (!gs || (source === 'empty' && gs.empty < quantity) || (source === 'full' && gs.full < quantity)) {
        toast.error(`Stock ${source === 'empty' ? 'vide' : 'plein'} insuffisant pour déclarer comme endommagé.`);
        return;
      }
      store.declareDamagedStock(brandId, category, quantity, company, source);
      
      store.addStockActivity({
        action: 'declare_damaged',
        company,
        brandId,
        category,
        quantityDamaged: quantity,
        description: `Déclaration Endommagé depuis ${source === 'empty' ? 'Vide' : 'Plein'}`
      });
      
      toast.success("Stock déclaré comme endommagé.");
    } else {
      const gs = store.globalStock.find(g => g.brandId === brandId && g.category === category && (g.company || 'afro_negoce') === company);
      if (!gs || (gs.damaged || 0) < quantity) {
        toast.error("Stock endommagé insuffisant pour la réparation.");
        return;
      }
      store.repairDamagedStock(brandId, category, quantity, repairTo, company);
      
      store.addStockActivity({
        action: 'repair_damaged',
        company,
        brandId,
        category,
        [repairTo === 'empty' ? 'quantityEmpty' : 'quantityFull']: quantity,
        description: `Réparation / Remplacement vers ${repairTo === 'empty' ? 'Vide' : 'Plein'}`
      });
      
      toast.success("Stock endommagé restauré/réparé.");
    }

    setIsDamagedStockModalOpen(false);
    setDamagedStockForm({
      action: 'declare',
      company: 'afro_negoce',
      brandId: '',
      category: '',
      quantity: 0,
      repairTo: 'empty',
      source: 'empty'
    });
  };

  const handleGlobalStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityCode.toLowerCase().trim() !== "alpha zulu india zulu") {
      toast.error("Code de sécurité invalide.");
      return;
    }

    const historyItems: any[] = [];
    const date = new Date().toISOString();

    const newGlobalStock = globalStock.map((item, idx) => {
      const delta = globalStockForm.find(g => g.brandId === item.brandId && g.category === item.category && g.company === item.company);
      if (delta && (delta.full || delta.empty)) {
        historyItems.push({
          id: nanoid(),
          date,
          brandId: item.brandId,
          category: item.category,
          deltaFull: delta.full || 0,
          deltaEmpty: delta.empty || 0,
          company: item.company || 'afro_negoce'
        });
        
        useDispatchGazStore.getState().addStockActivity({
          action: 'set_global',
          company: item.company || 'afro_negoce',
          brandId: item.brandId,
          category: item.category,
          quantityFull: delta.full || 0,
          quantityEmpty: delta.empty || 0,
          description: `Ajustement Manuel Stock Global`
        });

        return {
          ...item,
          full: Math.max(0, item.full + (delta.full || 0)),
          empty: Math.max(0, item.empty + (delta.empty || 0))
        };
      }
      return item;
    });

    setGlobalStock(newGlobalStock, historyItems);
    setIsSettingGlobal(false);
    setSecurityCode("");
    toast.success("Stock global mis à jour.");
  };

  const generateStockCheckupReport = () => {
    const doc = new jsPDF();
    const todayStr = getLocalDateStr();
    
    const activitiesToday = stockActivities.filter(a => a.date.includes(todayStr) || a.date.includes(new Date().toISOString().split('T')[0]));
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rapport Stock Checkup`, 14, 22);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Date du rapport: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableBody = activitiesToday.map(a => {
      const brand = brands.find(b => b.id === a.brandId)?.name || a.brandId || '-';
      const time = new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const quantityStr = [];
      if (a.quantityFull) quantityStr.push(`${a.quantityFull} Pl`);
      if (a.quantityEmpty) quantityStr.push(`${a.quantityEmpty} Vd`);
      if (a.quantityDamaged) quantityStr.push(`${a.quantityDamaged} Endm`);
      
      const company = a.company === 'chakirine_gaz' ? 'Chakirine' : 'Afro';
      
      let actionStr = a.action;
      if (a.action === 'set_global') actionStr = 'Ajustement Global';
      if (a.action === 'dispatch_driver') actionStr = 'Affectation Chauffeur';
      if (a.action === 'dispatch_comptoir') actionStr = 'Affectation Comptoir';
      if (a.action === 'return_driver') actionStr = 'Retour Chauffeur';
      if (a.action === 'declare_damaged') actionStr = 'Déclaration Endommagé';
      if (a.action === 'repair_damaged') actionStr = 'Réparation Endommagé';

      return [
        time,
        actionStr,
        company,
        `${brand} - ${a.category || '-'}`,
        quantityStr.join(', '),
        a.description || '-'
      ];
    });

    if (tableBody.length > 0) {
      autoTable(doc, {
        startY: 40,
        head: [['Heure', 'Action', 'Société', 'Produit', 'Quantité', 'Description']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2 }
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text("Aucune activité de stock enregistrée aujourd'hui.", 14, 45);
    }
    
    const finalY = (doc as any).lastAutoTable?.finalY || 50;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text("État du Stock Global (Actuel)", 14, finalY + 15);
    
    const stockBody = globalStock.map(gs => {
      const brand = brands.find(b => b.id === gs.brandId)?.name || gs.brandId;
      const company = gs.company === 'chakirine_gaz' ? 'Chakirine' : 'Afro';
      return [
        company,
        brand,
        gs.category,
        gs.full.toString(),
        gs.empty.toString(),
        (gs.damaged || 0).toString()
      ];
    });

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Société', 'Marque', 'Catégorie', 'Pleines', 'Vides', 'Endommagées']],
      body: stockBody,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 }
    });
    
    doc.save(`stock-checkup-${todayStr}.pdf`);
  };

  const selectedBrand = brands.find(b => b.id === formData.brandId);
  const selectedComptoirBrand = brands.find(b => b.id === comptoirFormData.brandId);

  const addItem = () => {
    setFormData(prev => ({...prev, items: [...prev.items, { category: '', quantity: 0 }]}));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev, 
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: 'category' | 'quantity', value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const addComptoirItem = () => {
    setComptoirFormData(prev => ({...prev, items: [...prev.items, { category: '', quantity: 0 }]}));
  };

  const removeComptoirItem = (index: number) => {
    setComptoirFormData(prev => ({
      ...prev, 
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateComptoirItem = (index: number, field: 'category' | 'quantity', value: string | number) => {
    setComptoirFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  // Helper values for current selection inside the Damaged Stock modal
  const activeDamagedGS = useMemo(() => {
    if (!damagedStockForm.brandId || !damagedStockForm.category) return null;
    return globalStock.find(
      g => g.brandId === damagedStockForm.brandId &&
           g.category === damagedStockForm.category &&
           (g.company || 'afro_negoce') === damagedStockForm.company
    );
  }, [damagedStockForm.brandId, damagedStockForm.category, damagedStockForm.company, globalStock]);

  // Compute live statistics filtered by company
  const kpiTotals = useMemo(() => {
    const filteredGlobal = globalStock.filter(
      item => selectedCompany === 'all' || item.company === selectedCompany
    );
    const filteredComptoir = (comptoirStock || []).filter(
      item => selectedCompany === 'all' || item.company === selectedCompany
    );

    const globalFull = filteredGlobal.reduce((sum, item) => sum + item.full, 0);
    const globalEmpty = filteredGlobal.reduce((sum, item) => sum + item.empty, 0);
    const globalDamaged = filteredGlobal.reduce((sum, item) => sum + (item.damaged || 0), 0);

    const comptoirFull = filteredComptoir.reduce((sum, item) => sum + item.full, 0);
    const comptoirEmpty = filteredComptoir.reduce((sum, item) => sum + item.empty, 0);

    return {
      globalFull,
      globalEmpty,
      globalDamaged,
      comptoirFull,
      comptoirEmpty,
      totalFull: globalFull + comptoirFull,
      totalEmpty: globalEmpty + comptoirEmpty
    };
  }, [globalStock, comptoirStock, selectedCompany]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4 py-4 animate-in fade-in duration-300">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600 shadow-inner">
              <Package className="w-6 h-6" />
            </div>
            Gestion des Stocks GPL
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Pilotez vos parcs de bouteilles (Afro Négoce / Chakirine) et validez les retours chauffeurs.
          </p>
        </div>

        {/* Persistent Action Buttons Grid */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={generateStockCheckupReport}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all flex items-center gap-2 border border-slate-200 text-xs shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            Stock Checkup
          </button>
          
          <button 
            onClick={() => setIsDamagedStockModalOpen(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-all flex items-center gap-2 border border-rose-100 text-xs shadow-sm cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Stock Endommagé
          </button>

          <button 
            onClick={() => {
              setGlobalStockForm(globalStock.map(g => ({ ...g, full: 0, empty: 0 })));
              setIsSettingGlobal(true);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-sm cursor-pointer"
          >
            <Database className="w-4 h-4 text-slate-300" />
            Ajuster Stock Global
          </button>

          <button 
            onClick={() => setIsDispatching(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-md shadow-blue-100 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Affecter Chauffeur
          </button>

          <button 
            onClick={() => setIsDispatchingComptoir(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-md shadow-indigo-100 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Affecter Comptoir
          </button>
        </div>
      </div>

      {/* CORE MODULES TAB SELECTOR */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs gap-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 sm:flex-none px-6 py-2.5 font-bold text-xs sm:text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-blue-50 text-blue-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Tableau de Bord
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`flex-1 sm:flex-none px-6 py-2.5 font-bold text-xs sm:text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'operations'
              ? 'bg-blue-50 text-blue-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          Circulation & Retours
          {pendingValidations.length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
              {pendingValidations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 sm:flex-none px-6 py-2.5 font-bold text-xs sm:text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-blue-50 text-blue-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          Historique & Activités
        </button>
      </div>

      {/* TAB CONTENT: 1. DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* COMPANY FILTER & KPI SEGMENT CONTROL */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Filter className="w-4 h-4 text-blue-600" />
              Filtrer par société :
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSelectedCompany('all')}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                  selectedCompany === 'all'
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setSelectedCompany('afro_negoce')}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                  selectedCompany === 'afro_negoce'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Ste. Afro Négoce
              </button>
              <button
                onClick={() => setSelectedCompany('chakirine_gaz')}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                  selectedCompany === 'chakirine_gaz'
                    ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Chakirine Gaz
              </button>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* KPI: PLEINES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Bouteilles Pleines</span>
                <span className="text-3xl font-black text-slate-800 block mt-1">{kpiTotals.totalFull}</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                  {kpiTotals.globalFull} dépôt • {kpiTotals.comptoirFull} comptoir
                </span>
              </div>
            </div>

            {/* KPI: VIDES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Bouteilles Vides</span>
                <span className="text-3xl font-black text-slate-800 block mt-1">{kpiTotals.totalEmpty}</span>
                <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                  {kpiTotals.globalEmpty} dépôt • {kpiTotals.comptoirEmpty} comptoir
                </span>
              </div>
            </div>

            {/* KPI: AVARIES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Bouteilles Avariées</span>
                <span className="text-3xl font-black text-slate-800 block mt-1">{kpiTotals.globalDamaged}</span>
                <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">
                  Nécessitent réparation / retour usine
                </span>
              </div>
            </div>
          </div>

          {/* STOCK GRID PANELS */}
          <div className="space-y-8">
            
            {/* PANEL: AFRO NEGOCE STOCK */}
            {(selectedCompany === 'all' || selectedCompany === 'afro_negoce') && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-5 bg-blue-600 rounded-md inline-block"></span>
                    Stock Principal : Ste. Afro Négoce
                  </h3>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Dépôt Central
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {globalStock
                    .filter(item => item.company === 'afro_negoce' || !item.company)
                    .map((item, idx) => {
                      const brand = brands.find(b => b.id === item.brandId);
                      return (
                        <div key={`an-stock-${idx}`} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 relative overflow-hidden hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">
                              {brand?.name || 'Butagaz'}
                            </span>
                            <span className="text-xl font-black text-slate-800">{item.category}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="bg-emerald-50/75 p-2 rounded-lg border border-emerald-100 flex flex-col items-center">
                              <span className="text-[9px] font-bold text-emerald-600 uppercase">Pleines</span>
                              <span className="text-lg font-black text-emerald-800 mt-1">{item.full}</span>
                            </div>
                            <div className="bg-slate-100/75 p-2 rounded-lg border border-slate-200/60 flex flex-col items-center">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Vides</span>
                              <span className="text-lg font-black text-slate-700 mt-1">{item.empty}</span>
                            </div>
                            <div className={`p-2 rounded-lg border flex flex-col items-center ${item.damaged && item.damaged > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-100/30 border-slate-100/80 opacity-40'}`}>
                              <span className={`text-[9px] font-bold uppercase ${item.damaged && item.damaged > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Avaries</span>
                              <span className={`text-lg font-black mt-1 ${item.damaged && item.damaged > 0 ? 'text-rose-800' : 'text-slate-400'}`}>{item.damaged || 0}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* PANEL: CHAKIRINE GAZ STOCK */}
            {(selectedCompany === 'all' || selectedCompany === 'chakirine_gaz') && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-5 bg-amber-500 rounded-md inline-block"></span>
                    Stock Principal : Chakirine Gaz
                  </h3>
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Dépôt Central
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {globalStock
                    .filter(item => item.company === 'chakirine_gaz')
                    .map((item, idx) => {
                      const brand = brands.find(b => b.id === item.brandId);
                      return (
                        <div key={`cg-stock-${idx}`} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 relative overflow-hidden hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                              {brand?.name || 'Butagaz'}
                            </span>
                            <span className="text-xl font-black text-slate-800">{item.category}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="bg-emerald-50/75 p-2 rounded-lg border border-emerald-100 flex flex-col items-center">
                              <span className="text-[9px] font-bold text-emerald-600 uppercase">Pleines</span>
                              <span className="text-lg font-black text-emerald-800 mt-1">{item.full}</span>
                            </div>
                            <div className="bg-slate-100/75 p-2 rounded-lg border border-slate-200/60 flex flex-col items-center">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Vides</span>
                              <span className="text-lg font-black text-slate-700 mt-1">{item.empty}</span>
                            </div>
                            <div className={`p-2 rounded-lg border flex flex-col items-center ${item.damaged && item.damaged > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-100/30 border-slate-100/80 opacity-40'}`}>
                              <span className={`text-[9px] font-bold uppercase ${item.damaged && item.damaged > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Avaries</span>
                              <span className={`text-lg font-black mt-1 ${item.damaged && item.damaged > 0 ? 'text-rose-800' : 'text-slate-400'}`}>{item.damaged || 0}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* PANEL: COMPTOIR STOCK */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" />
                  Stock Comptoir de Vente Directe
                </h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-1 rounded">
                  Vente immédiate
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* SUB-PANEL: COMPTOIR AFRO */}
                {(selectedCompany === 'all' || selectedCompany === 'afro_negoce') && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-blue-500 rounded-sm"></span>
                      Comptoir : Ste. Afro Négoce
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(comptoirStock || [])
                        .filter(item => item.company === 'afro_negoce' || !item.company)
                        .map((item, idx) => {
                          const brand = brands.find(b => b.id === item.brandId);
                          return (
                            <div key={`comptoir-an-${idx}`} className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-800">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-[9px] font-semibold text-indigo-300 uppercase">{brand?.name}</span>
                                <span className="font-extrabold">{item.category}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 mt-3 text-center">
                                <div className="bg-green-500/10 p-1.5 rounded border border-green-500/20">
                                  <div className="text-[8px] text-green-400 font-bold uppercase">Pleines</div>
                                  <div className="text-sm font-black text-green-300 mt-0.5">{item.full}</div>
                                </div>
                                <div className="bg-slate-700/50 p-1.5 rounded border border-slate-700">
                                  <div className="text-[8px] text-slate-400 font-bold uppercase">Vides</div>
                                  <div className="text-sm font-black text-slate-300 mt-0.5">{item.empty}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* SUB-PANEL: COMPTOIR CHAKIRINE */}
                {(selectedCompany === 'all' || selectedCompany === 'chakirine_gaz') && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-amber-500 rounded-sm"></span>
                      Comptoir : Chakirine Gaz
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(comptoirStock || [])
                        .filter(item => item.company === 'chakirine_gaz')
                        .map((item, idx) => {
                          const brand = brands.find(b => b.id === item.brandId);
                          return (
                            <div key={`comptoir-cg-${idx}`} className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-800">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-[9px] font-semibold text-indigo-300 uppercase">{brand?.name}</span>
                                <span className="font-extrabold">{item.category}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 mt-3 text-center">
                                <div className="bg-green-500/10 p-1.5 rounded border border-green-500/20">
                                  <div className="text-[8px] text-green-400 font-bold uppercase">Pleines</div>
                                  <div className="text-sm font-black text-green-300 mt-0.5">{item.full}</div>
                                </div>
                                <div className="bg-slate-700/50 p-1.5 rounded border border-slate-700">
                                  <div className="text-[8px] text-slate-400 font-bold uppercase">Vides</div>
                                  <div className="text-sm font-black text-slate-300 mt-0.5">{item.empty}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. OPERATIONS & VALIDATIONS */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          
          {/* VALIDATION JOURNALIERE DE RETOURS CHAUFFEURS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-white">
              <div>
                <h2 className="font-bold text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Validation des Retours de Tournées
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Vérifiez la cohérence entre les ventes logicielles déclarées et les bouteilles physiques rapportées au dépôt.
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-white/10 border border-white/10 rounded-full font-black uppercase tracking-wider text-emerald-300">
                {pendingValidations.length} Retours en attente
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wider">Chauffeur / Produit</th>
                    <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wider text-center">Attendu (Logiciel)</th>
                    <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wider text-center bg-blue-50/20">Réel (Retourné au dépôt)</th>
                    <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wider text-right font-black">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingValidations.map((dispatch, idx) => {
                    const driver = drivers.find(d => d.id === dispatch.driverId);
                    const brand = brands.find(b => b.id === dispatch.brandId);
                    
                    const expectedFull = dispatch.quantity - dispatch.sold - (dispatch.soldConsigned || 0);
                    const expectedEmpty = dispatch.sold;

                    return (
                      <tr key={`dispatch-row-${dispatch.id || idx}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-400" />
                            {driver?.prenom} {driver?.nom}
                          </div>
                          <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                            {brand?.name} - <span className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">{dispatch.category}</span>
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {driver?.company === 'chakirine_gaz' ? 'Chakirine' : 'Afro'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-6">
                            <div className="text-center">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">Pleines</div>
                              <div className="text-sm font-black text-slate-700">{expectedFull}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">Vides</div>
                              <div className="text-sm font-black text-slate-700">{expectedEmpty}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 bg-blue-50/10">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Pleines</span>
                              <input 
                                type="number"
                                placeholder="P"
                                className="w-16 px-2.5 py-1.5 text-center border border-slate-300 rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-xs"
                                value={validationForm[dispatch.id]?.returnedFull ?? expectedFull}
                                onChange={e => setValidationForm({
                                  ...validationForm, 
                                  [dispatch.id]: { 
                                    returnedFull: parseInt(e.target.value) || 0, 
                                    returnedEmpty: validationForm[dispatch.id]?.returnedEmpty ?? expectedEmpty 
                                  }
                                })}
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Vides</span>
                              <input 
                                type="number"
                                placeholder="V"
                                className="w-16 px-2.5 py-1.5 text-center border border-slate-300 rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-xs"
                                value={validationForm[dispatch.id]?.returnedEmpty ?? expectedEmpty}
                                onChange={e => setValidationForm({
                                  ...validationForm, 
                                  [dispatch.id]: { 
                                    returnedEmpty: parseInt(e.target.value) || 0, 
                                    returnedFull: validationForm[dispatch.id]?.returnedFull ?? expectedFull 
                                  }
                                })}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => {
                              const data = validationForm[dispatch.id] || { returnedFull: expectedFull, returnedEmpty: expectedEmpty };
                              if (data.returnedFull < expectedFull || data.returnedEmpty < expectedEmpty) {
                                toast.error("Écart de stock détecté ! Rendez-vous en caisse pour arbitrage.");
                                return;
                              }
                              validateStockDispatch(dispatch.id, data.returnedFull, data.returnedEmpty);
                              toast.success("Retour de tournée validé. Stock global incrémenté !");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm shadow-emerald-100 flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            Valider Retour
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pendingValidations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-400 bg-slate-50/50 font-bold text-sm">
                        🎉 Aucun retour en attente. Toutes les tournées sont clôturées et validées !
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* STOCK EN CIRCULATION / CHARGES ACTIVES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Bouteilles en Circulation (Aujourd'hui)
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Suivi des stocks actuellement chargés dans les camions pour la livraison.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-4">Chauffeur</th>
                    <th className="p-4">Produit</th>
                    <th className="p-4 text-center">Session (Total / Ventes)</th>
                    <th className="p-4 text-center">Progression des Ventes</th>
                    <th className="p-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todaysDispatches.map((dispatch, idx) => {
                    const driver = drivers.find(d => d.id === dispatch.driverId);
                    const brand = brands.find(b => b.id === dispatch.brandId);
                    const totalSold = dispatch.sold + (dispatch.soldConsigned || 0);
                    const percentage = dispatch.quantity > 0 ? (totalSold / dispatch.quantity) * 100 : 0;
                    const isLow = (dispatch.quantity - totalSold) <= dispatch.quantity * 0.2;

                    return (
                      <tr key={`disp-val-${dispatch.id || idx}-${idx}`} className={`hover:bg-slate-50/50 transition-colors ${dispatch.isValidated ? 'opacity-65 bg-slate-50/30' : ''}`}>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-400" />
                            {driver?.prenom} {driver?.nom}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            Société: {driver?.company === 'chakirine_gaz' ? 'Chakirine' : 'Afro'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-100">
                            {brand?.name} - {dispatch.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] max-w-xs mx-auto">
                            <div>
                              <div className="text-slate-400 font-bold uppercase">Départ</div>
                              <div className="text-sm font-black text-slate-800 mt-0.5">{dispatch.quantity}</div>
                            </div>
                            <div>
                              <div className="text-green-600 font-bold uppercase">Vendus</div>
                              <div className="text-sm font-black text-green-700 mt-0.5">{dispatch.sold}</div>
                            </div>
                            <div>
                              <div className="text-orange-600 font-bold uppercase">Consignes</div>
                              <div className="text-sm font-black text-orange-700 mt-0.5">{dispatch.soldConsigned || 0}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="w-full max-w-[150px] mx-auto">
                            <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-orange-500' : 'bg-blue-600'}`} 
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              ></div>
                            </div>
                            <div className="text-center text-[10px] font-bold text-slate-500 mt-1.5">
                              {Math.round(percentage)}% écoulé
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {dispatch.isValidated ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full font-black text-[10px] uppercase border border-green-100">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Clôturé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-black text-[10px] uppercase border border-amber-100 animate-pulse">
                              En cours
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {todaysDispatches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 bg-slate-50/50 font-medium">
                        Aucune affectation de stock enregistrée aujourd'hui.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 3. HISTORIQUE & AUDIT */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          
          {/* DAILY STOCK ACTIVITIES LOG */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  Journal d'Activité Journalier (Traçabilité)
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Historique détaillé en temps réel de toutes les entrées, sorties et avaries déclarées.
                </p>
              </div>
              <button 
                onClick={generateStockCheckupReport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-md shadow-indigo-200 cursor-pointer"
              >
                Exporter PDF du jour
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-4">Heure</th>
                    <th className="p-4">Action / Événement</th>
                    <th className="p-4">Société</th>
                    <th className="p-4">Produit</th>
                    <th className="p-4">Quantité impactée</th>
                    <th className="p-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockActivities
                    .filter(a => a.date.includes(todayStr) || a.date.includes(new Date().toISOString().split('T')[0]))
                    .map((a, idx) => {
                      const brand = brands.find(b => b.id === a.brandId)?.name || a.brandId || '-';
                      const time = new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const quantityStr = [];
                      if (a.quantityFull) quantityStr.push(`${a.quantityFull} Pleines`);
                      if (a.quantityEmpty) quantityStr.push(`${a.quantityEmpty} Vides`);
                      if (a.quantityDamaged) quantityStr.push(`${a.quantityDamaged} Avariées`);
                      
                      const company = a.company === 'chakirine_gaz' ? 'Chakirine' : 'Afro';
                      
                      let actionStr = a.action;
                      let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (a.action === 'set_global') {
                        actionStr = 'Ajustement Global';
                        badgeStyle = 'bg-sky-50 text-sky-700 border-sky-100';
                      } else if (a.action === 'dispatch_driver') {
                        actionStr = 'Affectation Chauffeur';
                        badgeStyle = 'bg-blue-50 text-blue-700 border-blue-100';
                      } else if (a.action === 'dispatch_comptoir') {
                        actionStr = 'Affectation Comptoir';
                        badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                      } else if (a.action === 'return_driver') {
                        actionStr = 'Retour de Tournée';
                        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                      } else if (a.action === 'declare_damaged') {
                        actionStr = 'Déclaration Avarie';
                        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-100';
                      } else if (a.action === 'repair_damaged') {
                        actionStr = 'Réparation Stock';
                        badgeStyle = 'bg-teal-50 text-teal-700 border-teal-100';
                      }

                      return (
                        <tr key={`appro-row-${a.id || idx}-${idx}`} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-4 text-slate-400 font-mono text-xs">{time}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${badgeStyle}`}>
                              {actionStr}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-600">{company}</td>
                          <td className="p-4 font-extrabold text-blue-900">{brand} - {a.category || '-'}</td>
                          <td className="p-4 font-bold text-slate-700">{quantityStr.join(', ') || '-'}</td>
                          <td className="p-4 text-slate-500 font-medium text-xs">{a.description || '-'}</td>
                        </tr>
                      );
                    })}
                  {stockActivities.filter(a => a.date.includes(todayStr) || a.date.includes(new Date().toISOString().split('T')[0])).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 bg-slate-50/50 font-medium">
                        Aucun mouvement de stock aujourd'hui.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* HISTORIQUE GENERAL DES MODIFICATIONS STAINLESS */}
          {globalStockHistory && globalStockHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50">
                <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" />
                  Historique Permanent des Ajustements Manuels du Stock Global
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Journal d'audit des ajustements manuels sécurisés de l'état des parcs.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                      <th className="p-4">Date & Heure</th>
                      <th className="p-4">Société</th>
                      <th className="p-4">Marque</th>
                      <th className="p-4">Catégorie</th>
                      <th className="p-4 text-center">Modif. Pleines</th>
                      <th className="p-4 text-center">Modif. Vides</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {globalStockHistory.slice().reverse().map((hLine, idx) => {
                      const brand = brands.find(b => b.id === hLine.brandId);
                      const company = hLine.company === 'chakirine_gaz' ? 'Chakirine' : 'Afro';
                      return (
                        <tr key={`history-row-${hLine.id || idx}-${idx}`} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 text-slate-400 font-mono text-xs">{new Date(hLine.date).toLocaleString('fr-FR')}</td>
                          <td className="p-4 font-bold text-slate-700">{company}</td>
                          <td className="p-4 font-semibold text-slate-700">{brand?.name || hLine.brandId}</td>
                          <td className="p-4 font-mono text-xs text-blue-700">{hLine.category}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block min-w-14 text-center text-xs px-2.5 py-1 rounded-full font-bold ${hLine.deltaFull > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : hLine.deltaFull < 0 ? 'text-rose-700 bg-rose-50 border border-rose-100' : 'text-slate-400 bg-slate-50'}`}>
                              {hLine.deltaFull > 0 ? `+${hLine.deltaFull}` : hLine.deltaFull}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block min-w-14 text-center text-xs px-2.5 py-1 rounded-full font-bold ${hLine.deltaEmpty > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : hLine.deltaEmpty < 0 ? 'text-rose-700 bg-rose-50 border border-rose-100' : 'text-slate-400 bg-slate-50'}`}>
                              {hLine.deltaEmpty > 0 ? `+${hLine.deltaEmpty}` : hLine.deltaEmpty}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* OVERLAY MODAL: DEFINE / AJUSTER STOCK GLOBAL */}
      {isSettingGlobal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600 animate-pulse" />
                Mise à Jour Sécurisée du Stock Global Dépôt
              </h2>
              <button 
                onClick={() => setIsSettingGlobal(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Company selector tabs for defining stock */}
            <div className="px-6 border-b border-slate-100 bg-slate-50/50 flex gap-4 pt-1">
              <button
                type="button"
                onClick={() => setSelectedModalCompany('all')}
                className={`pb-3 pt-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  selectedModalCompany === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Toutes les Sociétés
              </button>
              <button
                type="button"
                onClick={() => setSelectedModalCompany('afro_negoce')}
                className={`pb-3 pt-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  selectedModalCompany === 'afro_negoce'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Ste. Afro Négoce
              </button>
              <button
                type="button"
                onClick={() => setSelectedModalCompany('chakirine_gaz')}
                className={`pb-3 pt-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  selectedModalCompany === 'chakirine_gaz'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Chakirine Gaz
              </button>
            </div>
            
            <form onSubmit={handleGlobalStockSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-xs flex gap-2.5">
                <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block mb-0.5">Note importante sur les ajustements</span>
                  Les valeurs saisies ci-dessous viendront **s'ajouter** ou **se soustraire** directement au stock actuel de chaque marque et catégorie. Utilisez des signes positifs ou négatifs (ex: +20 pour ajouter, -15 pour déduire).
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {globalStockForm
                  .map((item, idx) => ({ item, originalIdx: idx }))
                  .filter(({ item }) => selectedModalCompany === 'all' || item.company === selectedModalCompany)
                  .map(({ item, originalIdx }) => {
                    const brand = brands.find(b => b.id === item.brandId);
                    const companyName = item.company === 'chakirine_gaz' ? 'Chakirine' : 'Afro Négoce';
                    const actualStock = globalStock.find(g => g.brandId === item.brandId && g.category === item.category && g.company === item.company);
                    return (
                      <div key={`stock-grid-${item.brandId}-${item.category}-${item.company}-${originalIdx}`} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-3 relative overflow-hidden group hover:bg-slate-50 transition-colors">
                        <div className="absolute top-0 right-0 bg-slate-200 text-slate-600 px-2 py-0.5 text-[8px] font-black uppercase rounded-bl">
                          {companyName}
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div className="font-extrabold text-slate-900 text-sm">{brand?.name} - {item.category}</div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          Stock actuel : <span className="text-emerald-600 font-black">{actualStock?.full || 0} Pleines</span> / <span className="text-slate-600 font-black">{actualStock?.empty || 0} Vides</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Pleines (+/-)</label>
                            <input 
                              type="number"
                              placeholder="Ex: +10 ou -5"
                              value={item.full || ''}
                              onChange={e => {
                                const newForm = [...globalStockForm];
                                newForm[originalIdx] = { ...newForm[originalIdx], full: parseInt(e.target.value) || 0 };
                                setGlobalStockForm(newForm);
                              }}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vides (+/-)</label>
                            <input 
                              type="number"
                              placeholder="Ex: +10 ou -5"
                              value={item.empty || ''}
                              onChange={e => {
                                const newForm = [...globalStockForm];
                                newForm[originalIdx] = { ...newForm[originalIdx], empty: parseInt(e.target.value) || 0 };
                                setGlobalStockForm(newForm);
                              }}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              <div className="border-t border-slate-100 pt-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
                <div className="w-full md:w-64">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Code de Sécurité Administrateur Requis</label>
                  <input 
                    type="password"
                    placeholder="Saisir le code requis..."
                    required
                    value={securityCode}
                    onChange={e => setSecurityCode(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs font-black focus:ring-2 focus:ring-red-500 focus:outline-none bg-slate-50"
                  />
                </div>
                <div className="flex gap-3 w-full md:w-auto justify-end">
                  <button 
                    type="button" 
                    onClick={() => setIsSettingGlobal(false)} 
                    className="px-5 py-2.5 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-xs shadow-md shadow-blue-100 transition-colors cursor-pointer"
                  >
                    Confirmer les Ajustements
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* OVERLAY MODAL: DAMAGED STOCK MANAGEMENT (AVARIES) */}
      {isDamagedStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                Gestion des Bouteilles Endommagées
              </h2>
              <button 
                onClick={() => setIsDamagedStockModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDamagedStockSubmit} className="p-6 space-y-6">
              
              {/* Form Action & Company selection fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Action</label>
                  <select 
                    value={damagedStockForm.action}
                    onChange={e => setDamagedStockForm({...damagedStockForm, action: e.target.value as any})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="declare">Déclarer comme Endommagé</option>
                    <option value="repair">Réparer / Remplacer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Société concernée</label>
                  <select 
                    value={damagedStockForm.company}
                    onChange={e => setDamagedStockForm({...damagedStockForm, company: e.target.value as any})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="afro_negoce">Afro Négoce</option>
                    <option value="chakirine_gaz">Chakirine Gaz</option>
                  </select>
                </div>
              </div>

              {/* Form Brand & Category selection fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Marque</label>
                  <select 
                    required
                    value={damagedStockForm.brandId}
                    onChange={e => setDamagedStockForm({...damagedStockForm, brandId: e.target.value, category: ''})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Catégorie</label>
                  <select 
                    required
                    value={damagedStockForm.category}
                    onChange={e => setDamagedStockForm({...damagedStockForm, category: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={!damagedStockForm.brandId}
                  >
                    <option value="">Sélectionner...</option>
                    {damagedStockForm.brandId && brands.find(b => b.id === damagedStockForm.brandId)?.categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LIVE QUANTITY HELPER STATS FOR BETTER UX */}
              {activeDamagedGS && (
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider block">État actuel du stock :</span>
                  <div className="grid grid-cols-3 gap-2 text-center mt-1 text-xs">
                    <div className="bg-white p-1.5 rounded border border-slate-100 font-bold">
                      <span className="text-slate-400 block text-[9px]">Pleines</span>
                      <span className="text-slate-700 text-sm font-extrabold">{activeDamagedGS.full || 0}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100 font-bold">
                      <span className="text-slate-400 block text-[9px]">Vides</span>
                      <span className="text-slate-700 text-sm font-extrabold">{activeDamagedGS.empty || 0}</span>
                    </div>
                    <div className="bg-rose-50 p-1.5 rounded border border-rose-100 font-bold">
                      <span className="text-rose-400 block text-[9px]">Avariées</span>
                      <span className="text-rose-700 text-sm font-extrabold">{activeDamagedGS.damaged || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Quantity and Repair parameters fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Quantité</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={damagedStockForm.quantity || ''}
                    onChange={e => setDamagedStockForm({...damagedStockForm, quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                {damagedStockForm.action === 'repair' ? (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Devient après réparation</label>
                    <select 
                      value={damagedStockForm.repairTo}
                      onChange={e => setDamagedStockForm({...damagedStockForm, repairTo: e.target.value as any})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="empty">Bouteilles Vides</option>
                      <option value="full">Bouteilles Pleines</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Prendre depuis le stock</label>
                    <select 
                      value={damagedStockForm.source}
                      onChange={e => setDamagedStockForm({...damagedStockForm, source: e.target.value as any})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="empty">Bouteilles Vides</option>
                      <option value="full">Bouteilles Pleines</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 bg-white">
                <button 
                  type="button" 
                  onClick={() => setIsDamagedStockModalOpen(false)} 
                  className="px-5 py-2.5 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className={`px-6 py-2.5 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
                    damagedStockForm.action === 'declare' 
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' 
                      : 'bg-teal-600 hover:bg-teal-700 shadow-teal-100'
                  }`}
                >
                  {damagedStockForm.action === 'declare' ? 'Déclarer Avarie' : 'Confirmer Réparation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* OVERLAY MODAL: AFFECTER STOCK CHAUFFEUR */}
      {isDispatching && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-blue-600" />
                Chargement / Affectation Stock Chauffeur
              </h2>
              <button 
                onClick={() => setIsDispatching(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Sélectionner Chauffeur</label>
                  <select 
                    required
                    value={formData.driverId}
                    onChange={e => setFormData({...formData, driverId: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.prenom} {d.nom} ({d.company === 'chakirine_gaz' ? 'Chakirine' : 'Afro'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Marque bouteilles</label>
                  <select 
                    required
                    value={formData.brandId}
                    onChange={e => {
                      setFormData({...formData, brandId: e.target.value, items: [{ category: '', quantity: 0 }]});
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wide">
                    Liste des produits à charger
                  </label>
                  <button 
                    type="button" 
                    onClick={addItem} 
                    disabled={!selectedBrand} 
                    className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter Catégorie
                  </button>
                </div>
                
                <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                  {formData.items.map((item, index) => {
                    const driverObj = drivers.find(d => d.id === formData.driverId);
                    const comp = driverObj?.company || 'afro_negoce';
                    const activeGS = globalStock.find(g => g.brandId === formData.brandId && g.category === item.category && (g.company || 'afro_negoce') === comp);
                    
                    return (
                      <div key={`dispatch-form-item-${index}-${item.category || 'cat'}`} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50/75 p-3.5 rounded-xl border border-slate-200/50">
                        <div className="flex-1">
                          <select 
                            required
                            value={item.category}
                            onChange={e => updateItem(index, 'category', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!selectedBrand}
                          >
                            <option value="">Sélectionner catégorie...</option>
                            {selectedBrand?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        
                        <div className="w-32 flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1"
                            placeholder="Qté"
                            required 
                            value={item.quantity || ''} 
                            onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                          />
                        </div>

                        {/* LIVE QUANTITY CAP HELPER */}
                        {item.category && activeGS && (
                          <div className="text-[10px] text-slate-400 font-bold shrink-0 self-center sm:w-28 text-center bg-slate-100 px-2 py-1 rounded">
                            Dispo: <span className="text-emerald-600 font-black">{activeGS.full} Pl</span>
                          </div>
                        )}

                        {formData.items.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeItem(index)} 
                            className="p-2 text-rose-500 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer self-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 bg-white">
                <button 
                  type="button" 
                  onClick={() => setIsDispatching(false)} 
                  className="px-5 py-2.5 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-100 transition-colors cursor-pointer"
                >
                  Confirmer le Chargement
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* OVERLAY MODAL: AFFECTER STOCK COMPTOIR */}
      {isDispatchingComptoir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 bg-indigo-50 flex justify-between items-center">
              <h2 className="font-extrabold text-indigo-950 flex items-center gap-2.5">
                <Package className="w-5 h-5 text-indigo-600" />
                Transfert de Stock vers Comptoir de Vente Directe
              </h2>
              <button 
                onClick={() => setIsDispatchingComptoir(false)} 
                className="p-2 text-indigo-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-100/50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleComptoirSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Marque bouteilles</label>
                  <select 
                    required
                    value={comptoirFormData.brandId}
                    onChange={e => {
                      setComptoirFormData({...comptoirFormData, brandId: e.target.value, items: [{ category: '', quantity: 0 }]});
                    }}
                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Sélectionner une marque...</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Société Comptoir</label>
                  <select 
                    required
                    value={comptoirFormData.company}
                    onChange={e => {
                      setComptoirFormData({...comptoirFormData, company: e.target.value as any});
                    }}
                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="afro_negoce">Ste. Afro Négoce</option>
                    <option value="chakirine_gaz">Chakirine Gaz</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <label className="block text-xs font-black text-indigo-900/80 uppercase tracking-wide">
                    Produits à transférer
                  </label>
                  <button 
                    type="button" 
                    onClick={addComptoirItem} 
                    disabled={!selectedComptoirBrand} 
                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter Catégorie
                  </button>
                </div>
                
                <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                  {comptoirFormData.items.map((item, index) => {
                    const comp = comptoirFormData.company || 'afro_negoce';
                    const activeGS = globalStock.find(g => g.brandId === comptoirFormData.brandId && g.category === item.category && (g.company || 'afro_negoce') === comp);

                    return (
                      <div key={`comptoir-form-item-${index}-${item.category || 'cat'}`} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-indigo-50">
                        <div className="flex-1">
                          <select 
                            required
                            value={item.category}
                            onChange={e => updateComptoirItem(index, 'category', e.target.value)}
                            className="w-full px-4 py-2 border border-indigo-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={!selectedComptoirBrand}
                          >
                            <option value="">Sélectionner catégorie...</option>
                            {selectedComptoirBrand?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        
                        <div className="w-32 flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1"
                            placeholder="Qté"
                            required 
                            value={item.quantity || ''} 
                            onChange={e => updateComptoirItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                            className="w-full px-4 py-2 border border-indigo-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                          />
                        </div>

                        {/* LIVE QUANTITY HELP FOR COMPTOIR */}
                        {item.category && activeGS && (
                          <div className="text-[10px] text-slate-400 font-bold shrink-0 self-center sm:w-28 text-center bg-slate-100 px-2 py-1 rounded">
                            Dispo Dépôt: <span className="text-emerald-600 font-black">{activeGS.full} Pl</span>
                          </div>
                        )}

                        {comptoirFormData.items.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeComptoirItem(index)} 
                            className="p-2 text-rose-500 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer self-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 bg-white">
                <button 
                  type="button" 
                  onClick={() => setIsDispatchingComptoir(false)} 
                  className="px-5 py-2.5 text-indigo-600 font-bold hover:bg-indigo-50 border border-transparent rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-100 transition-colors cursor-pointer"
                >
                  Transférer au Comptoir
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
