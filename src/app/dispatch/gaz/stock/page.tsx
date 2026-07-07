import React, { useState, useMemo } from 'react';
import { useDispatchGazStore, GlobalStockItem } from '../../../../stores/useDispatchGazStore';
import { Package, Plus, Truck, Calendar, AlertTriangle, CheckCircle2, QrCode, Trash2, Settings, ShieldCheck, Database, History } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DispatchStockPage() {
  const { drivers, brands, stockDispatches, dispatchStockBatch, pointages, globalStock, globalStockHistory, setGlobalStock, validateStockDispatch, dispatchToComptoir, stockActivities } = useDispatchGazStore();
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

  const [validationForm, setValidationForm] = useState<{ [key: string]: { returnedFull: number, returnedEmpty: number } }>({});

  // Ensure we get today's date in local date consistently to match pointage
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
      // Check if pointage was within the last 16 hours OR matches today's string
      const diffHours = (now.getTime() - pointageDate.getTime()) / (1000 * 60 * 60);
      const isTodayStr = p.date === new Date().toISOString().split('T')[0] || p.date === todayStr;
      
      return diffHours < 16 || isTodayStr;
    });
  };

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

      // Check global stock availability for driver's company
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
            date: new Date().toISOString(),
            driverId: formData.driverId,
            brandId: formData.brandId,
            category: item.category,
            quantity: item.quantity,
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

      // Check global stock availability for chosen company
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

  const [securityCode, setSecurityCode] = useState("");

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

  const handleValidation = (dispatchId: string) => {
    const data = validationForm[dispatchId];
    if (!data) {
      toast.error("Veuillez remplir les champs de retour.");
      return;
    }
    validateStockDispatch(dispatchId, data.returnedFull, data.returnedEmpty);
    toast.success("Validation effectuée.");
  };

  const generateStockCheckupReport = () => {
    const doc = new jsPDF();
    const todayStr = getLocalDateStr();
    
    // Filter activities for today
    const activitiesToday = stockActivities.filter(a => a.date.includes(todayStr) || a.date.includes(new Date().toISOString().split('T')[0]));
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rapport Stock Checkup`, 14, 22);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Date du rapport: ${new Date().toLocaleString()}`, 14, 30);
    
    // Summary of activities
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
    
    // Current Global Stock state
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Gestion des Stocks GPL
        </h1>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <button 
            onClick={generateStockCheckupReport}
            className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold hover:bg-emerald-200 transition-colors flex items-center gap-2 shadow-sm"
          >
            <History className="w-5 h-5" />
            Stock Checkup
          </button>
          <button 
            onClick={() => setIsDamagedStockModalOpen(true)}
            className="bg-rose-100 text-rose-700 px-4 py-2 rounded-xl font-bold hover:bg-rose-200 transition-colors flex items-center gap-2 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5" />
            Stock Endommagé
          </button>
          <button 
            onClick={() => {
              setGlobalStockForm(globalStock.map(g => ({ ...g, full: 0, empty: 0 })));
              setIsSettingGlobal(true);
            }}
            className="bg-slate-800 text-white px-4 py-2 rounded-xl font-medium hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Database className="w-5 h-5" />
            Définir Stock Global
          </button>
          <button 
            onClick={() => setIsDispatching(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Affectation
          </button>
          <button 
            onClick={() => setIsDispatchingComptoir(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            Affecter Comptoir
          </button>
        </div>
      </div>

      {/* Global Stock Stats */}
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-3">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block"></span>
            Stock Global : Ste. Afro Négoce
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalStock.filter(item => item.company === 'afro_negoce' || !item.company).map((item, idx) => {
              const brand = brands.find(b => b.id === item.brandId);
              return (
                <div key={`an-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-md uppercase">
                      {brand?.name}
                    </div>
                    <div className="text-2xl font-black text-slate-900">{item.category}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
                    <div className="bg-green-50 p-2.5 rounded-xl border border-green-100 flex flex-col items-center">
                      <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Pleines</div>
                      <div className="text-2xl font-black text-green-700">{item.full}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vides</div>
                      <div className="text-2xl font-black text-slate-700">{item.empty}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border flex flex-col items-center ${item.damaged && item.damaged > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${item.damaged && item.damaged > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Avaries</div>
                      <div className={`text-2xl font-black ${item.damaged && item.damaged > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{item.damaged || 0}</div>
                    </div>
                  </div>
                  {/* subtle decorative background */}
                  <div className="absolute -bottom-4 -right-4 opacity-[0.03] text-slate-900 z-0">
                    <Database size={100} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-3">
            <span className="w-2.5 h-5 bg-amber-500 rounded-full inline-block"></span>
            Stock Global : Chakirine Gaz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalStock.filter(item => item.company === 'chakirine_gaz').map((item, idx) => {
              const brand = brands.find(b => b.id === item.brandId);
              return (
                <div key={`cg-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-md uppercase">
                      {brand?.name}
                    </div>
                    <div className="text-2xl font-black text-slate-900">{item.category}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
                    <div className="bg-green-50 p-2.5 rounded-xl border border-green-100 flex flex-col items-center">
                      <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Pleines</div>
                      <div className="text-2xl font-black text-green-700">{item.full}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vides</div>
                      <div className="text-2xl font-black text-slate-700">{item.empty}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border flex flex-col items-center ${item.damaged && item.damaged > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${item.damaged && item.damaged > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Avaries</div>
                      <div className={`text-2xl font-black ${item.damaged && item.damaged > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{item.damaged || 0}</div>
                    </div>
                  </div>
                  {/* subtle decorative background */}
                  <div className="absolute -bottom-4 -right-4 opacity-[0.03] text-slate-900 z-0">
                    <Database size={100} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden text-white mt-6">
        <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Stock Comptoir
          </h2>
        </div>
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-4 bg-indigo-500 rounded-full inline-block"></span>
              Comptoir : Ste. Afro Négoce
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(useDispatchGazStore.getState().comptoirStock || []).filter(item => item.company === 'afro_negoce' || !item.company).map((item, idx) => {
                const brand = brands.find(b => b.id === item.brandId);
                return (
                  <div key={`comptoir-an-${idx}`} className="bg-slate-700 p-4 rounded-xl border border-slate-600 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black rounded-md uppercase">
                        {brand?.name}
                      </div>
                      <div className="text-xl font-black">{item.category}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/20">
                        <div className="text-[10px] font-bold text-green-400 uppercase">Pleines</div>
                        <div className="text-lg font-black text-green-300">{item.full}</div>
                      </div>
                      <div className="bg-slate-800 p-2 rounded-xl border border-slate-600">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Vides</div>
                        <div className="text-lg font-black text-slate-300">{item.empty}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!(useDispatchGazStore.getState().comptoirStock || []).some(item => item.company === 'afro_negoce' || !item.company) && (
                <div className="col-span-full py-2 text-slate-400 text-xs">Aucun stock pour Afro Négoce.</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-4 bg-amber-500 rounded-full inline-block"></span>
              Comptoir : Chakirine Gaz
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(useDispatchGazStore.getState().comptoirStock || []).filter(item => item.company === 'chakirine_gaz').map((item, idx) => {
                const brand = brands.find(b => b.id === item.brandId);
                return (
                  <div key={`comptoir-cg-${idx}`} className="bg-slate-700 p-4 rounded-xl border border-slate-600 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black rounded-md uppercase">
                        {brand?.name}
                      </div>
                      <div className="text-xl font-black">{item.category}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/20">
                        <div className="text-[10px] font-bold text-green-400 uppercase">Pleines</div>
                        <div className="text-lg font-black text-green-300">{item.full}</div>
                      </div>
                      <div className="bg-slate-800 p-2 rounded-xl border border-slate-600">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Vides</div>
                        <div className="text-lg font-black text-slate-300">{item.empty}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!(useDispatchGazStore.getState().comptoirStock || []).some(item => item.company === 'chakirine_gaz') && (
                <div className="col-span-full py-2 text-slate-400 text-xs">Aucun stock pour Chakirine Gaz.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Stock Change History Section */}
      {globalStockHistory && globalStockHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Historique des Modifications du Stock Global (Stainless)
            </h2>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-3">Date</th>
                    <th className="p-3">Marque</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3 text-center">Modif. Pleines</th>
                    <th className="p-3 text-center">Modif. Vides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {globalStockHistory.slice().reverse().map((hLine, idx) => {
                    const brand = brands.find(b => b.id === hLine.brandId);
                    return (
                      <tr key={hLine.id || idx} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-500 text-xs font-medium">{new Date(hLine.date).toLocaleString('fr-FR')}</td>
                        <td className="p-3 font-semibold text-slate-700">{brand?.name || hLine.brandId}</td>
                        <td className="p-3 font-mono text-xs text-slate-600">{hLine.category}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block min-w-12 text-center text-xs px-2.5 py-1 rounded-full font-bold ${hLine.deltaFull > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : hLine.deltaFull < 0 ? 'text-rose-700 bg-rose-50 border border-rose-100' : 'text-slate-400 bg-slate-50'}`}>
                            {hLine.deltaFull > 0 ? `+${hLine.deltaFull}` : hLine.deltaFull}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block min-w-12 text-center text-xs px-2.5 py-1 rounded-full font-bold ${hLine.deltaEmpty > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : hLine.deltaEmpty < 0 ? 'text-rose-700 bg-rose-50 border border-rose-100' : 'text-slate-400 bg-slate-50'}`}>
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
        </div>
      )}

      {isSettingGlobal && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Mise à jour du Stock Global de la Société
            </h2>
            <button onClick={() => setIsSettingGlobal(false)} className="text-slate-400 hover:text-slate-600">
              Fermer
            </button>
          </div>
          
          <form onSubmit={handleGlobalStockSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalStockForm.map((item, idx) => {
                const brand = brands.find(b => b.id === item.brandId);
                const companyName = item.company === 'chakirine_gaz' ? 'Chakirine' : 'Afro Négoce';
                const actualStock = globalStock.find(g => g.brandId === item.brandId && g.category === item.category && g.company === item.company);
                return (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-slate-200 text-slate-600 px-2 py-1 text-[10px] font-black uppercase rounded-bl-lg">
                      {companyName}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="font-bold text-slate-900">{brand?.name} - {item.category}</div>
                      <div className="text-xs font-medium text-slate-500">Actuel: {actualStock?.full || 0} Pl / {actualStock?.empty || 0} Vd</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-blue-500 uppercase mb-1">Ajouter/Déduire Pleines</label>
                        <input 
                          type="number"
                          placeholder="Ex: +10 ou -5"
                          value={item.full || ''}
                          onChange={e => {
                            const newForm = [...globalStockForm];
                            newForm[idx] = { ...newForm[idx], full: parseInt(e.target.value) || 0 };
                            setGlobalStockForm(newForm);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-500 uppercase mb-1">Ajouter/Déduire Vides</label>
                        <input 
                          type="number"
                          placeholder="Ex: +10 ou -5"
                          value={item.empty || ''}
                          onChange={e => {
                            const newForm = [...globalStockForm];
                            newForm[idx] = { ...newForm[idx], empty: parseInt(e.target.value) || 0 };
                            setGlobalStockForm(newForm);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="w-64">
                <input 
                  type="password"
                  placeholder="Code de sécurité requis"
                  required
                  value={securityCode}
                  onChange={e => setSecurityCode(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsSettingGlobal(false)} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">Enregistrer les Modifications</button>
              </div>
            </div>
          </form>

          {globalStockHistory && globalStockHistory.length > 0 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Historique des modifications</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto w-full">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-100 text-slate-500 font-bold uppercase sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Marque</th>
                      <th className="px-4 py-3">Catégorie</th>
                      <th className="px-4 py-3">Modif. Pleines</th>
                      <th className="px-4 py-3">Modif. Vides</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {globalStockHistory.map((hLine, idx) => {
                      const brand = brands.find(b => b.id === hLine.brandId);
                      return (
                        <tr key={hLine.id || idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2 font-medium">{new Date(hLine.date).toLocaleString('fr-FR')}</td>
                          <td className="px-4 py-2">{brand?.name || hLine.brandId}</td>
                          <td className="px-4 py-2">{hLine.category}</td>
                          <td className="px-4 py-2">
                            <span className={hLine.deltaFull > 0 ? 'text-emerald-600 font-bold' : hLine.deltaFull < 0 ? 'text-rose-600 font-bold' : ''}>
                              {hLine.deltaFull > 0 ? `+${hLine.deltaFull}` : hLine.deltaFull}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={hLine.deltaEmpty > 0 ? 'text-emerald-600 font-bold' : hLine.deltaEmpty < 0 ? 'text-rose-600 font-bold' : ''}>
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

      {isDispatching && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Affecter du stock à un chauffeur</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chauffeur</label>
              <select 
                required
                value={formData.driverId}
                onChange={e => setFormData({...formData, driverId: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg transition-all"
              >
                <option value="">Sélectionner...</option>
                {drivers.map(d => {
                  return (
                    <option key={d.id} value={d.id}>
                      {d.prenom} {d.nom} ({d.company === 'chakirine_gaz' ? 'Chakirine Gaz' : 'Ste. Afro Négoce'})
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marque</label>
              <select 
                required
                value={formData.brandId}
                onChange={e => {
                  setFormData({...formData, brandId: e.target.value, items: [{ category: '', quantity: 0 }]});
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Sélectionner...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Produits (Catégories et Quantités)</label>
                <button type="button" onClick={addItem} disabled={!selectedBrand} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus className="w-3 h-3" /> Ajouter Produit
                </button>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <select 
                      required
                      value={item.category}
                      onChange={e => updateItem(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      disabled={!selectedBrand}
                    >
                      <option value="">Catégorie...</option>
                      {selectedBrand?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-32">
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Qté"
                      required 
                      value={item.quantity || ''} 
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="md:col-span-4 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsDispatching(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Affecter le stock
              </button>
            </div>
          </form>
        </div>
      )}

      {isDispatchingComptoir && (
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <h2 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Affecter du stock au Comptoir
          </h2>
          <form onSubmit={handleComptoirSubmit} className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-indigo-900 mb-1">Marque</label>
                <select 
                  required
                  value={comptoirFormData.brandId}
                  onChange={e => {
                    setComptoirFormData({...comptoirFormData, brandId: e.target.value, items: [{ category: '', quantity: 0 }]});
                  }}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="">Sélectionner une marque...</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-900 mb-1">Société Comptoir</label>
                <select 
                  required
                  value={comptoirFormData.company}
                  onChange={e => {
                    setComptoirFormData({...comptoirFormData, company: e.target.value as any});
                  }}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="afro_negoce">Ste. Afro Négoce</option>
                  <option value="chakirine_gaz">Chakirine Gaz</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-indigo-900">Produits pour le comptoir</label>
                <button type="button" onClick={addComptoirItem} disabled={!selectedComptoirBrand} className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus className="w-3 h-3" /> Ajouter Produit
                </button>
              </div>
              
              {comptoirFormData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100">
                  <div className="flex-1">
                    <select 
                      required
                      value={item.category}
                      onChange={e => updateComptoirItem(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm"
                      disabled={!selectedComptoirBrand}
                    >
                      <option value="">Catégorie...</option>
                      {selectedComptoirBrand?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-32">
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Qté"
                      required 
                      value={item.quantity || ''} 
                      onChange={e => updateComptoirItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm" 
                    />
                  </div>
                  {comptoirFormData.items.length > 1 && (
                    <button type="button" onClick={() => removeComptoirItem(index)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsDispatchingComptoir(false)} className="px-4 py-2 text-indigo-600 font-bold hover:bg-indigo-100 rounded-lg">Annuler</button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-indigo-600 font-bold text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200"
              >
                Transférer au Stock Comptoir
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            Stock en circulation (Aujourd'hui)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-medium text-slate-600 border-r border-slate-200">Chauffeur</th>
                <th className="p-4 font-medium text-slate-600 border-r border-slate-200">Produit</th>
                <th className="p-4 font-medium text-slate-600 text-center border-r border-slate-200">Session</th>
                <th className="p-4 font-medium text-slate-600 text-center border-r border-slate-200">Progression</th>
                <th className="p-4 font-medium text-slate-600 text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {todaysDispatches.map(dispatch => {
                const driver = drivers.find(d => d.id === dispatch.driverId);
                const brand = brands.find(b => b.id === dispatch.brandId);
                const totalSold = dispatch.sold + (dispatch.soldConsigned || 0);
                const remaining = dispatch.quantity - totalSold;
                const percentage = dispatch.quantity > 0 ? (totalSold / dispatch.quantity) * 100 : 0;
                const isLow = remaining <= dispatch.quantity * 0.2;

                return (
                  <tr key={dispatch.id} className={`border-b border-slate-100 hover:bg-slate-50 ${dispatch.isValidated ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <td className="p-4 border-r border-slate-200">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        {driver?.prenom} {driver?.nom}
                      </div>
                    </td>
                    <td className="p-4 border-r border-slate-200">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {brand?.name} - {dispatch.category}
                      </span>
                    </td>
                    <td className="p-4 border-r border-slate-200">
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div>
                          <div className="text-slate-500 font-bold uppercase">Initial</div>
                          <div className="text-sm font-black text-slate-900">{dispatch.quantity}</div>
                        </div>
                        <div>
                          <div className="text-green-600 font-bold uppercase">Vendus</div>
                          <div className="text-sm font-black text-green-700">{dispatch.sold}</div>
                        </div>
                        <div>
                          <div className="text-orange-600 font-bold uppercase">Consignes</div>
                          <div className="text-sm font-black text-orange-700">{dispatch.soldConsigned || 0}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r border-slate-200">
                      <div className="w-full max-w-[120px] mx-auto bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-blue-500'}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-center text-[10px] text-slate-500 mt-1">{Math.round(percentage)}% chargé</div>
                    </td>
                    <td className="p-4 text-right">
                      {dispatch.isValidated ? (
                        <div className="flex items-center justify-end gap-1 text-green-600 font-black text-xs uppercase">
                          <CheckCircle2 className="w-4 h-4" /> Validé
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-orange-600 font-black text-xs uppercase">
                           En Cours
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Journalière Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-900 flex justify-between items-center text-white">
          <h2 className="font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            Validation Journalière des Retours Chauffeurs
          </h2>
          <span className="text-xs px-3 py-1 bg-white/10 rounded-full font-bold uppercase tracking-widest text-white/70">
            {pendingValidations.length} Attentes
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Chauffeur / Produit</th>
                <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Logiciel (Attendu)</th>
                <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Réel (Retourné)</th>
                <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right font-black">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingValidations.map(dispatch => {
                const driver = drivers.find(d => d.id === dispatch.driverId);
                const brand = brands.find(b => b.id === dispatch.brandId);
                
                // Expected logic:
                // Returned Full = Initial - Sold(Exchange) - Sold(Consignment)
                // Returned Empty = Sold(Exchange)
                const expectedFull = dispatch.quantity - dispatch.sold - (dispatch.soldConsigned || 0);
                const expectedEmpty = dispatch.sold;

                return (
                  <tr key={dispatch.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{driver?.prenom} {driver?.nom}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{brand?.name} - {dispatch.category}</div>
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
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-4">
                        <div>
                          <input 
                            type="number"
                            placeholder="F"
                            className="w-16 px-2 py-1 text-center border border-slate-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-blue-500"
                            value={validationForm[dispatch.id]?.returnedFull ?? expectedFull}
                            onChange={e => setValidationForm({...validationForm, [dispatch.id]: { ...validationForm[dispatch.id], returnedFull: parseInt(e.target.value) || 0, returnedEmpty: validationForm[dispatch.id]?.returnedEmpty ?? expectedEmpty }})}
                          />
                        </div>
                        <div>
                          <input 
                            type="number"
                            placeholder="E"
                            className="w-16 px-2 py-1 text-center border border-slate-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-blue-500"
                            value={validationForm[dispatch.id]?.returnedEmpty ?? expectedEmpty}
                            onChange={e => setValidationForm({...validationForm, [dispatch.id]: { ...validationForm[dispatch.id], returnedEmpty: parseInt(e.target.value) || 0, returnedFull: validationForm[dispatch.id]?.returnedFull ?? expectedFull }})}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => {
                          const data = validationForm[dispatch.id] || { returnedFull: expectedFull, returnedEmpty: expectedEmpty };
                          if (data.returnedFull < expectedFull || data.returnedEmpty < expectedEmpty) {
                            toast.error("RDV à la caisse pour consultation");
                            return;
                          }
                          validateStockDispatch(dispatch.id, data.returnedFull, data.returnedEmpty);
                          toast.success("Retour validé et stock global mis à jour.");
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
                      >
                        Valider Retours
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pendingValidations.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 bg-slate-50 font-medium">Tous les retours ont été validés.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Checkup Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
          <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            Stock Checkup (Aujourd'hui)
          </h2>
          <button 
            onClick={generateStockCheckupReport}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            Exporter PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                <th className="p-4">Heure</th>
                <th className="p-4">Action</th>
                <th className="p-4">Société</th>
                <th className="p-4">Produit</th>
                <th className="p-4">Quantité</th>
                <th className="p-4">Description</th>
              </tr>
            </thead>
            <tbody>
              {stockActivities.filter(a => a.date.includes(todayStr) || a.date.includes(new Date().toISOString().split('T')[0])).map(a => {
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

                return (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4 text-slate-500 font-mono text-xs">{time}</td>
                    <td className="p-4 font-bold text-slate-700">{actionStr}</td>
                    <td className="p-4 font-medium text-slate-600">{company}</td>
                    <td className="p-4 font-bold text-blue-700">{brand} - {a.category || '-'}</td>
                    <td className="p-4 font-medium text-slate-700">{quantityStr.join(', ') || '-'}</td>
                    <td className="p-4 text-slate-500">{a.description || '-'}</td>
                  </tr>
                );
              })}
              {stockActivities.filter(a => a.date.includes(todayStr) || a.date.includes(new Date().toISOString().split('T')[0])).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 bg-slate-50 font-medium">Aucune activité enregistrée aujourd'hui.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Damaged Stock Modal */}
      {isDamagedStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Gestion des Bouteilles Endommagées
              </h2>
              <button onClick={() => setIsDamagedStockModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDamagedStockSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Action</label>
                  <select 
                    value={damagedStockForm.action}
                    onChange={e => setDamagedStockForm({...damagedStockForm, action: e.target.value as any})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-sm"
                  >
                    <option value="declare">Déclarer comme Endommagé</option>
                    <option value="repair">Réparer / Remplacer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Société</label>
                  <select 
                    value={damagedStockForm.company}
                    onChange={e => setDamagedStockForm({...damagedStockForm, company: e.target.value as any})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-sm"
                  >
                    <option value="afro_negoce">Afro Négoce</option>
                    <option value="chakirine_gaz">Chakirine Gaz</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Marque</label>
                  <select 
                    value={damagedStockForm.brandId}
                    onChange={e => setDamagedStockForm({...damagedStockForm, brandId: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-sm"
                  >
                    <option value="">Sélectionner</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Catégorie</label>
                  <select 
                    value={damagedStockForm.category}
                    onChange={e => setDamagedStockForm({...damagedStockForm, category: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-sm"
                  >
                    <option value="">Sélectionner</option>
                    {damagedStockForm.brandId && brands.find(b => b.id === damagedStockForm.brandId)?.categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Quantité</label>
                  <input 
                    type="number"
                    min="1"
                    value={damagedStockForm.quantity || ''}
                    onChange={e => setDamagedStockForm({...damagedStockForm, quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-sm"
                    placeholder="0"
                  />
                </div>
                {damagedStockForm.action === 'repair' ? (
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Devient</label>
                    <select 
                      value={damagedStockForm.repairTo}
                      onChange={e => setDamagedStockForm({...damagedStockForm, repairTo: e.target.value as any})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-sm"
                    >
                      <option value="empty">Vides</option>
                      <option value="full">Pleines</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Source (Endommagé depuis)</label>
                    <select 
                      value={damagedStockForm.source}
                      onChange={e => setDamagedStockForm({...damagedStockForm, source: e.target.value as any})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-sm"
                    >
                      <option value="empty">Vides</option>
                      <option value="full">Pleines</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsDamagedStockModalOpen(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                  Annuler
                </button>
                <button type="submit" className={`px-8 py-3 text-white font-bold rounded-xl transition-colors shadow-sm ${damagedStockForm.action === 'declare' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>
                  {damagedStockForm.action === 'declare' ? 'Déclarer' : 'Appliquer Retour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
