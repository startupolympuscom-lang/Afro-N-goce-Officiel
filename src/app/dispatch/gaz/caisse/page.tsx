import React, { useState, useMemo } from 'react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { ArrowDownRight, ArrowUpRight, Plus, FileText, Lock, Printer, X, ShieldAlert, Wallet, Camera, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AfroNegoceLogo } from '../../../../components/Logo';
import { formatMAD, formatDatetime } from '../../../../lib/formatters';
import { toast } from 'sonner';
import { CaissePnLView } from './CaissePnLView';

export default function DispatchCaissePage() {
  const [mainView, setMainView] = useState<'journal' | 'pnl'>('journal');
  const { 
    sales, 
    expenses = [], 
    drivers, 
    addExpense, 
    brands, 
    clients, 
    updateSaleStatus,
    addSale,
    caisseSecuritaire,
    caisseNoir,
    caisseTransfers,
    addCaisseTransfer,
    caisseAlimentations = [],
    addCaisseAlimentation,
    deleteCaisseAlimentation,
    sortieCaisseLimit = 2000,
    setSortieCaisseLimit
  } = useDispatchGazStore();
  
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseData, setExpenseData] = useState({ 
    amount: '', 
    reasonMode: 'Avance sur salaire', 
    reasonCustom: '', 
    driverId: '',
    sourceAccount: 'principale' as 'principale' | 'securitaire' | 'noir'
  });
  const [isAddingTransfer, setIsAddingTransfer] = useState(false);
  const [transferData, setTransferData] = useState({ amount: '', toAccount: 'securitaire' as 'securitaire' | 'noir', reason: '' });
  
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
  const [limitCode, setLimitCode] = useState('');
  const [newLimitValue, setNewLimitValue] = useState('');
  const [ticketToPrint, setTicketToPrint] = useState<any>(null);
  const [isAddingAlimentation, setIsAddingAlimentation] = useState(false);
  const [alimentationData, setAlimentationData] = useState({ amount: '', byWhom: '', reason: '', date: new Date().toISOString().split('T')[0], type: 'normal' as 'normal' | 'pret' });
  const [entreeTab, setEntreeTab] = useState<'sales' | 'alimentations'>('sales');
  const [expenseToPrint, setExpenseToPrint] = useState<any>(null);
  const [isOcrValidating, setIsOcrValidating] = useState(false);
  const [ocrData, setOcrData] = useState<any>(null);

  const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info("Analyse du bon en cours, veuillez patienter...", { duration: 5000 });
      
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64 = reader.result as string;
          
          const response = await fetch('/api/ocr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageBase64: base64 })
          });
          
          if (!response.ok) throw new Error("Erreur serveur lors de l'OCR");
          
          const data = await response.json();
          
          setOcrData({
            date: new Date().toISOString(),
            quantity: data.quantity || 0,
            unitPrice: data.unitPrice || 0,
            totalPrice: data.totalPrice || 0,
            driverId: drivers.length > 0 ? drivers[0].id : '',
            brandId: brands.length > 0 ? brands[0].id : '',
            category: brands.length > 0 ? brands[0].categories[0] : '',
            paymentMethod: data.paymentMethod || 'espece'
          });
          setIsOcrValidating(true);
          toast.success("Extraction réussie, veuillez valider.");
        };
        reader.onerror = () => {
          toast.error("Erreur de lecture de l'image");
        };
      } catch (err) {
        toast.error("L'analyse OCR a échoué.");
      }
    }
  };

  const handleOCRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ocrData) {
      addSale({
        ...ocrData,
        id: 'sale_' + Math.random().toString(36).substr(2, 9),
        clientId: clients.find(c => c.type === 'POS')?.id || 'client_comptoir',
      });
      setIsOcrValidating(false);
      setOcrData(null);
      toast.success("Vente ajoutée via OCR !");
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const [selectedCompany, setSelectedCompany] = useState<'afro_negoce' | 'chakirine_gaz'>('afro_negoce');

  const salesToday = useMemo(() => {
    return sales.filter(s => s.date.startsWith(today));
  }, [sales, today]);

  const expensesToday = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(today));
  }, [expenses, today]);

  const alimentationsToday = useMemo(() => {
    return (caisseAlimentations || []).filter(a => a.date.startsWith(today) || a.date === today);
  }, [caisseAlimentations, today]);

  const transfersToday = useMemo(() => {
    return (caisseTransfers || []).filter(t => t.date.startsWith(today));
  }, [caisseTransfers, today]);

  // Company Specific Filtering
  const salesTodayCompany = useMemo(() => {
    return salesToday.filter(s => {
      const driver = drivers.find(d => d.id === s.driverId);
      const saleCompany = s.company || driver?.company || 'afro_negoce';
      return saleCompany === selectedCompany;
    });
  }, [salesToday, drivers, selectedCompany]);

  const expensesTodayCompany = useMemo(() => {
    return expensesToday.filter(e => {
      const driver = drivers.find(d => d.id === e.driverId);
      const expCompany = driver?.company || 'afro_negoce';
      return expCompany === selectedCompany;
    });
  }, [expensesToday, drivers, selectedCompany]);

  const alimentationsTodayCompany = useMemo(() => {
    return alimentationsToday.filter(a => {
      const alCompany = a.company || 'afro_negoce';
      return alCompany === selectedCompany;
    });
  }, [alimentationsToday, selectedCompany]);

  const transfersTodayCompany = useMemo(() => {
    return transfersToday.filter(t => {
      const trCompany = t.company || 'afro_negoce';
      return trCompany === selectedCompany;
    });
  }, [transfersToday, selectedCompany]);

  // Company Specific Calculations
  const totalSalesEntreesCompany = useMemo(() => {
    return salesTodayCompany.reduce((sum, s) => {
      if (s.status === 'non payé') return sum;
      return sum + s.totalPrice;
    }, 0);
  }, [salesTodayCompany]);

  const totalAlimentationsCompany = useMemo(() => {
    return alimentationsTodayCompany.reduce((sum, a) => sum + a.amount, 0);
  }, [alimentationsTodayCompany]);

  const totalPretsTodayCompany = useMemo(() => {
    return alimentationsTodayCompany
      .filter(a => a.type === 'pret')
      .reduce((sum, a) => sum + a.amount, 0);
  }, [alimentationsTodayCompany]);

  const totalAlimentationsNormalTodayCompany = useMemo(() => {
    return alimentationsTodayCompany
      .filter(a => a.type !== 'pret')
      .reduce((sum, a) => sum + a.amount, 0);
  }, [alimentationsTodayCompany]);

  const totalEntreesCompany = totalSalesEntreesCompany + totalAlimentationsCompany;
  const totalSortiesCompany = useMemo(() => {
    return expensesTodayCompany
      .filter(e => !e.sourceAccount || e.sourceAccount === 'principale')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expensesTodayCompany]);
  const soldeCompany = totalEntreesCompany - totalSortiesCompany;

  const totalTransferredSecuritaireTodayCompany = useMemo(() => {
    return transfersTodayCompany.filter(t => t.toAccount === 'securitaire').reduce((sum, t) => sum + t.amount, 0);
  }, [transfersTodayCompany]);

  const totalTransferredNoirTodayCompany = useMemo(() => {
    return transfersTodayCompany.filter(t => t.toAccount === 'noir').reduce((sum, t) => sum + t.amount, 0);
  }, [transfersTodayCompany]);

  const totalTransferredTodayCompany = totalTransferredSecuritaireTodayCompany + totalTransferredNoirTodayCompany;
  const soldeDisponibleCompany = soldeCompany - totalTransferredTodayCompany;

  const caisseSecuritaireCompany = useMemo(() => {
    const transfers = (caisseTransfers || [])
      .filter(t => (t.company || 'afro_negoce') === selectedCompany && t.toAccount === 'securitaire')
      .reduce((sum, t) => sum + t.amount, 0);
    const spent = (expenses || [])
      .filter(e => e.sourceAccount === 'securitaire' && (e.company || drivers.find(d => d.id === e.driverId)?.company || 'afro_negoce') === selectedCompany)
      .reduce((sum, e) => sum + e.amount, 0);
    return Math.max(0, transfers - spent);
  }, [caisseTransfers, expenses, drivers, selectedCompany]);

  const caisseNoirCompany = useMemo(() => {
    const transfers = (caisseTransfers || [])
      .filter(t => (t.company || 'afro_negoce') === selectedCompany && t.toAccount === 'noir')
      .reduce((sum, t) => sum + t.amount, 0);
    const spent = (expenses || [])
      .filter(e => e.sourceAccount === 'noir' && (e.company || drivers.find(d => d.id === e.driverId)?.company || 'afro_negoce') === selectedCompany)
      .reduce((sum, e) => sum + e.amount, 0);
    return Math.max(0, transfers - spent);
  }, [caisseTransfers, expenses, drivers, selectedCompany]);

  // Group sales by driver
  const salesByDriver = useMemo(() => {
    const grouped: Record<string, { driverName: string, total: number, sales: any[] }> = {};
    
    salesTodayCompany.forEach(sale => {
      if (!grouped[sale.driverId]) {
        const driver = drivers.find(d => d.id === sale.driverId);
        grouped[sale.driverId] = {
          driverName: driver ? `${driver.prenom} ${driver.nom}` : (sale.status ? 'Vente Comptoir' : 'Auteur inconnu'),
          total: 0,
          sales: []
        };
      }
      if (sale.status !== 'non payé') {
        grouped[sale.driverId].total += sale.totalPrice;
      }
      grouped[sale.driverId].sales.push(sale);
    });
    
    return Object.entries(grouped);
  }, [salesTodayCompany, drivers]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();
    
    const renderReportForCompany = (comp: 'afro_negoce' | 'chakirine_gaz' | 'global', isFirstPage: boolean) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      
      const compSales = comp === 'global' ? salesToday : salesToday.filter(s => {
        const driver = drivers.find(d => d.id === s.driverId);
        const saleCompany = s.company || driver?.company || 'afro_negoce';
        return saleCompany === comp;
      });
      
      const compExpenses = comp === 'global' ? expensesToday : expensesToday.filter(e => {
        const driver = drivers.find(d => d.id === e.driverId);
        const expCompany = driver?.company || 'afro_negoce';
        return expCompany === comp;
      });
      
      const compAlimentations = comp === 'global' ? alimentationsToday : alimentationsToday.filter(a => {
        const alCompany = a.company || 'afro_negoce';
        return alCompany === comp;
      });
      
      const compTransfers = comp === 'global' ? transfersToday : transfersToday.filter(t => {
        const trCompany = t.company || 'afro_negoce';
        return trCompany === comp;
      });

      const totalSales = compSales.reduce((sum, s) => s.status === 'non payé' ? sum : sum + s.totalPrice, 0);
      const totalAlim = compAlimentations.reduce((sum, a) => sum + a.amount, 0);
      const totalSorties = compExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalEntrees = totalSales + totalAlim;
      const solde = totalEntrees - totalSorties;
      
      const totalTransSec = compTransfers.filter(t => t.toAccount === 'securitaire').reduce((sum, t) => sum + t.amount, 0);
      const totalTransNoir = compTransfers.filter(t => t.toAccount === 'noir').reduce((sum, t) => sum + t.amount, 0);
      const soldeDispo = solde - (totalTransSec + totalTransNoir);

      const title = comp === 'global' ? 'RAPPORT DE CAISSE GLOBAL (AFRO + CHAKIRINE)' : (comp === 'chakirine_gaz' ? 'CHAKIRINE GAZ - Rapport de Caisse' : 'STE. AFRO NÉGOCE - Rapport de Caisse');

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 22);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Date du rapport: ${now}`, 14, 30);
      doc.text(`Période: ${today}`, 14, 35);

      // Summary section
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Récapitulatif de Caisse', 14, 50);
      
      autoTable(doc, {
        startY: 55,
        head: [['Désignation', 'Montant (MAD)']],
        body: [
          ['Total Ventes du jour (Entrées)', totalSales.toLocaleString() + ' MAD'],
          ['Total Alimentations (Hors-ventes)', totalAlim.toLocaleString() + ' MAD'],
          ['Total Brut Entré de Caisse', totalEntrees.toLocaleString() + ' MAD'],
          ['Total Sorties (Dépenses)', totalSorties.toLocaleString() + ' MAD'],
          ['Allocation Caisse Sécuritaire (aujourd\'hui)', totalTransSec.toLocaleString() + ' MAD'],
          ['Allocation Caisse Noir (aujourd\'hui)', totalTransNoir.toLocaleString() + ' MAD'],
          ['CASH DISPONIBLE EN CAISSE (Solde Principal)', soldeDispo.toLocaleString() + ' MAD'],
          ['SOLDE GLOBAL BRUT', solde.toLocaleString() + ' MAD'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 2 }
      });

      // Detailed Individual Sales Section
      const salesTableY = (doc as any).lastAutoTable.finalY + 15;
      doc.text('Journal Détaillé des Ventes', 14, salesTableY);
      
      const detailedSalesBody = compSales.map(s => {
        const driver = drivers.find(d => d.id === s.driverId);
        const brand = brands.find(b => b.id === s.brandId);
        const client = clients.find(c => c.id === s.clientId);
        return [
          new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          driver ? `${driver.prenom} ${driver.nom}` : 'N/A',
          client?.name || 'Vente Directe',
          `${brand?.name || ''} - ${s.category}`,
          s.quantity.toString(),
          s.totalPrice.toLocaleString()
        ];
      });

      autoTable(doc, {
        startY: salesTableY + 5,
        head: [['Heure', 'Chauffeur', 'Client', 'Produit', 'Qté', 'Total (MAD)']],
        body: detailedSalesBody,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 1.5 }
      });

      // Expenses section
      if (compExpenses.length > 0) {
        const expTableY = (doc as any).lastAutoTable.finalY + 15;
        if (expTableY > 250) doc.addPage();
        
        doc.text('Détail des Sorties de Caisse', 14, expTableY > 250 ? 22 : expTableY);
        const expensesBody = compExpenses.map(e => {
          const driver = drivers.find(d => d.id === e.driverId);
          return [
            new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            driver ? `${driver.prenom} ${driver.nom}` : 'N/A',
            e.reason,
            e.amount.toLocaleString()
          ];
        });

        autoTable(doc, {
          startY: expTableY > 250 ? 27 : expTableY + 5,
          head: [['Heure', 'Chauffeur', 'Motif', 'Montant (MAD)']],
          body: expensesBody,
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38], fontSize: 8 },
          styles: { fontSize: 7, cellPadding: 1.5 }
        });
      }

      // Signatures
      const finalY = (doc as any).lastAutoTable.finalY + 30;
      if (finalY > 260) doc.addPage();
      
      const signAreaY = finalY > 260 ? 40 : finalY;
      doc.setFontSize(8);
      doc.text('Signature Caissier', 14, signAreaY);
      doc.line(14, signAreaY + 2, 60, signAreaY + 2);
      
      doc.text('Signature Responsable', 140, signAreaY);
      doc.line(140, signAreaY + 2, 186, signAreaY + 2);
    };

    renderReportForCompany('global', true);
    renderReportForCompany('afro_negoce', false);
    renderReportForCompany('chakirine_gaz', false);

    doc.save(`rapport-caisse-complet-${today}.pdf`);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = expenseData.reasonMode === 'Autre' 
      ? expenseData.reasonCustom 
      : expenseData.reasonMode;

    const amountVal = parseFloat(expenseData.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Veuillez saisir un montant de sortie valide.");
      return;
    }

    // Sortie de caisse limit validation
    const currentLimit = sortieCaisseLimit || 2000;
    if (amountVal > currentLimit) {
      toast.error(`Le montant de la sortie (${amountVal.toLocaleString()} MAD) dépasse la limite de sortie de caisse autorisée (${currentLimit.toLocaleString()} MAD). Veuillez demander à l'administrateur d'augmenter ou de redéfinir la limite.`);
      return;
    }

    // Fund source validation
    const source = expenseData.sourceAccount || 'principale';
    if (source === 'principale' && amountVal > soldeDisponibleCompany) {
      toast.error(`Fonds insuffisants dans la caisse principale. Disponible: ${soldeDisponibleCompany.toLocaleString()} MAD.`);
      return;
    }
    if (source === 'securitaire' && amountVal > caisseSecuritaireCompany) {
      toast.error(`Fonds insuffisants dans la caisse sécuritaire. Disponible: ${caisseSecuritaireCompany.toLocaleString()} MAD.`);
      return;
    }
    if (source === 'noir' && amountVal > caisseNoirCompany) {
      toast.error(`Fonds insuffisants dans la caisse noire. Disponible: ${caisseNoirCompany.toLocaleString()} MAD.`);
      return;
    }

    if (amountVal && finalReason && expenseData.driverId) {
      addExpense({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        driverId: expenseData.driverId,
        amount: amountVal,
        reason: finalReason,
        sourceAccount: source,
        company: selectedCompany
      });
      setIsAddingExpense(false);
      setExpenseData({ 
        amount: '', 
        reasonMode: 'Avance sur salaire', 
        reasonCustom: '', 
        driverId: '',
        sourceAccount: 'principale'
      });
      toast.success("Sortie de caisse enregistrée.");
    }
  };

  const handleAddTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(transferData.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Veuillez saisir un montant de transfert valide.");
      return;
    }
    if (amountVal > soldeDisponibleCompany) {
      toast.error("Le montant du transfert dépasse le cash disponible pour cette société.");
      return;
    }

    addCaisseTransfer({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: amountVal,
      toAccount: transferData.toAccount,
      reason: transferData.reason.trim() || (transferData.toAccount === 'securitaire' ? 'Ventilation Caisse Sécuritaire' : 'Ventilation Caisse Noir'),
      company: selectedCompany
    });
    
    setIsAddingTransfer(false);
    setTransferData({ amount: '', toAccount: 'securitaire', reason: '' });
    toast.success("Transfert de solde effectué avec succès.");
  };

  const handleAddAlimentation = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(alimentationData.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }
    if (!alimentationData.byWhom.trim()) {
      toast.error("Veuillez spécifier l'auteur de cette alimentation.");
      return;
    }

    addCaisseAlimentation({
      id: 'al-' + Date.now().toString(),
      date: alimentationData.date || new Date().toISOString().split('T')[0],
      amount: amountVal,
      byWhom: alimentationData.byWhom.trim(),
      reason: alimentationData.reason.trim() || (alimentationData.type === 'pret' ? 'Prêt reçu (Emprunt)' : 'Alimentation de Caisse (Hors-vente)'),
      type: alimentationData.type || 'normal',
      company: selectedCompany
    });

    setIsAddingAlimentation(false);
    setAlimentationData({ amount: '', byWhom: '', reason: '', date: new Date().toISOString().split('T')[0], type: 'normal' });
    toast.success("Alimentation de caisse enregistrée avec succès.");
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Wallet className="w-7 h-7" />
            </div>
            Gestion de la Caisse
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-2">Date: {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            id="ocr-upload" 
            onChange={handleOCRUpload} 
          />
          <button 
            onClick={() => document.getElementById('ocr-upload')?.click()}
            className="bg-purple-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-xl shadow-purple-900/10"
          >
            <Camera className="w-5 h-5" />
            Scanner Bon (OCR)
          </button>

          <button 
            onClick={generatePDF}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-xl shadow-blue-900/10"
          >
            <FileText className="w-5 h-5" />
            Rapport PDF
          </button>
          <button 
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir arrêter la caisse pour aujourd\'hui ?')) {
                generatePDF();
              }
            }}
            className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xl shadow-slate-900/10"
          >
            <Lock className="w-5 h-5" />
            Arrêt Caisse
          </button>
          <button 
            onClick={() => setIsAddingAlimentation(true)}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-xl shadow-emerald-900/10"
          >
            <ArrowDownRight className="w-5 h-5 animate-bounce" />
            Alimentation de caisse
          </button>
          <button 
            onClick={() => setIsAddingTransfer(true)}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-xl shadow-indigo-900/10"
          >
            <ArrowUpRight className="w-5 h-5" />
            Transférer solde
          </button>
          <button 
            onClick={() => setIsAddingExpense(true)}
            className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2 shadow-xl shadow-red-900/10"
          >
            <Plus className="w-5 h-5" />
            Sortie de caisse
          </button>
        </div>
      </div>

      {/* Top View Mode Navigation: Journal vs P&L */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setMainView('journal')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              mainView === 'journal'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-900/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-blue-600" />
            Journal & Opérations de Caisse
          </button>
          <button
            type="button"
            onClick={() => setMainView('pnl')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              mainView === 'pnl'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-900/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Vue P&L (Compte de Résultat)
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800">
              P&L
            </span>
          </button>
        </div>

        {mainView === 'journal' && (
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto max-w-md border border-slate-200/50">
            <button
              onClick={() => setSelectedCompany('afro_negoce')}
              className={`flex-1 sm:flex-none px-6 py-2 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                selectedCompany === 'afro_negoce'
                  ? 'bg-blue-650 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ste. Afro Négoce
            </button>
            <button
              onClick={() => setSelectedCompany('chakirine_gaz')}
              className={`flex-1 sm:flex-none px-6 py-2 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                selectedCompany === 'chakirine_gaz'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chakirine Gaz
            </button>
          </div>
        )}
      </div>

      {mainView === 'pnl' ? (
        <CaissePnLView initialCompany={selectedCompany} />
      ) : (
        <>
      {/* Caisse Limit Admin Control Info Banner */}
      <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              Contrôle de Sécurité : Limite de Sortie de Caisse
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Le montant maximum autorisé par sortie de caisse est actuellement fixé à <span className="font-extrabold text-red-600">{(sortieCaisseLimit || 2000).toLocaleString()} MAD</span>.
              Toute sortie dépassant cette limite nécessite l'augmentation de la limite avec le code d'autorisation administrateur.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setLimitCode('');
            setNewLimitValue((sortieCaisseLimit || 2000).toString());
            setIsUpdatingLimit(true);
          }}
          className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 shrink-0 cursor-pointer"
        >
          <Lock className="w-4 h-4 text-slate-400" />
          Définir / Modifier la limite
        </button>
      </div>

      {isUpdatingLimit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">Sécurité Administrateur</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsUpdatingLimit(false)} 
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const trimmedCode = limitCode.trim().toLowerCase();
              if (trimmedCode !== "alpha zulu india zulu" && trimmedCode !== "aziz") {
                toast.error("Code d'autorisation incorrect ! Modification refusée.");
                return;
              }
              const val = parseFloat(newLimitValue);
              if (isNaN(val) || val < 0) {
                toast.error("Veuillez saisir une limite valide.");
                return;
              }
              setSortieCaisseLimit(val);
              setIsUpdatingLimit(false);
              setLimitCode('');
              toast.success(`La limite de sortie de caisse a été redéfinie à ${val.toLocaleString()} MAD.`);
            }} className="p-6 space-y-4 font-sans">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Pour modifier la limite maximale par sortie de caisse, veuillez saisir le code d'autorisation administrateur requis et le nouveau montant limite.
              </p>
              
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Code d'autorisation</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Entrez le code requis..." 
                  value={limitCode}
                  onChange={(e) => setLimitCode(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 transition-all font-mono text-center text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nouvelle limite (MAD)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="ex: 3000" 
                  value={newLimitValue}
                  onChange={(e) => setNewLimitValue(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 transition-all font-bold text-center text-lg"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 font-medium">
                <button 
                  type="button" 
                  onClick={() => setIsUpdatingLimit(false)} 
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/15 cursor-pointer"
                >
                  Valider la limite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-slate-300/60 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
            <ArrowDownRight className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Entrées Globales</h3>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900 mb-2">{totalEntreesCompany.toLocaleString()} MAD</p>
          </div>
          <div className="border-t border-slate-100 pt-2 text-[10px] font-bold text-slate-500 space-y-1 relative z-10">
            <div className="flex justify-between">
              <span>Ventes Chauffeurs :</span>
              <span className="text-slate-800">{totalSalesEntreesCompany.toLocaleString()} MAD</span>
            </div>
            <div className="flex justify-between">
              <span>Alimentations Std :</span>
              <span className="text-emerald-600">+{totalAlimentationsNormalTodayCompany.toLocaleString()} MAD</span>
            </div>
            <div className="flex justify-between text-amber-600">
              <span>Prêts (Emprunts) :</span>
              <span>+{totalPretsTodayCompany.toLocaleString()} MAD</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-slate-300/60 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
            <ArrowUpRight className="w-24 h-24 text-red-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Sorties (Dépenses)</h3>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900 mb-2">{totalSortiesCompany.toLocaleString()} MAD</p>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest relative z-10">{expensesTodayCompany.length} opérations</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-emerald-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-emerald-300/60 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
            <Wallet className="w-24 h-24 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <h3 className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest">Cash Disponible</h3>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-xl font-black text-emerald-900 relative z-10">{soldeDisponibleCompany.toLocaleString()} MAD</p>
          </div>
          <div className="border-t border-emerald-100 pt-2 text-[10px] font-bold text-emerald-700/80 space-y-1 relative z-10 mt-3">
            <div className="flex justify-between">
              <span>Propres (Ventes+Alim Std) :</span>
              <span className="text-emerald-900">{(soldeDisponibleCompany - totalPretsTodayCompany).toLocaleString()} MAD</span>
            </div>
            <div className="flex justify-between items-center text-amber-600">
              <span>⚠️ Prêts à rembourser :</span>
              <span>{totalPretsTodayCompany.toLocaleString()} MAD</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-indigo-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-indigo-300/60 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
            <Lock className="w-24 h-24 text-indigo-600" />
          </div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <h3 className="text-indigo-700 font-bold text-[10px] uppercase tracking-widest">Caisse Sécuritaire</h3>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-indigo-900 relative z-10">{(caisseSecuritaireCompany || 0).toLocaleString()} MAD</p>
            <p className="text-[10px] text-slate-500 font-medium relative z-10 mt-1">Fonds de sécurité cumulé</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-purple-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-purple-300/60 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
            <ShieldAlert className="w-24 h-24 text-purple-600" />
          </div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <h3 className="text-purple-700 font-bold text-[10px] uppercase tracking-widest">Caisse Noir</h3>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-purple-900 relative z-10">{(caisseNoirCompany || 0).toLocaleString()} MAD</p>
            <p className="text-[10px] text-slate-500 font-medium relative z-10 mt-1">Compte de réserve confidentiel</p>
          </div>
        </div>
      </div>

      {isAddingExpense && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-black text-slate-900 mb-6 font-display uppercase tracking-tight">Nouvelle Sortie de Caisse</h2>
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Source des fonds</label>
              <select 
                required 
                value={expenseData.sourceAccount || 'principale'} 
                onChange={e => setExpenseData({...expenseData, sourceAccount: e.target.value as 'principale' | 'securitaire' | 'noir'})} 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 transition-all font-medium"
              >
                <option value="principale">Caisse Principale ({soldeDisponibleCompany.toLocaleString()} MAD)</option>
                <option value="securitaire">Caisse Sécuritaire ({caisseSecuritaireCompany.toLocaleString()} MAD)</option>
                <option value="noir">Caisse Noir ({caisseNoirCompany.toLocaleString()} MAD)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Chauffeur concerné</label>
              <select required value={expenseData.driverId} onChange={e => setExpenseData({...expenseData, driverId: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 transition-all font-medium">
                <option value="">Sélectionner</option>
                {drivers.map((d, dIdx) => <option key={`driver-opt-${d.id || dIdx}-${dIdx}`} value={d.id}>{d.prenom} {d.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Montant (MAD)</label>
              <input type="number" required value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 transition-all font-medium" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Motif</label>
              <select 
                required 
                value={expenseData.reasonMode} 
                onChange={e => setExpenseData({...expenseData, reasonMode: e.target.value})} 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 transition-all font-medium mb-3"
              >
                <option value="Avance sur salaire">Avance sur salaire</option>
                <option value="Carburant">Carburant</option>
                <option value="Entretien / Réparation">Entretien / Réparation</option>
                <option value="Autre">Autre (Préciser)</option>
              </select>
              {expenseData.reasonMode === 'Autre' && (
                <input 
                   type="text" 
                   required 
                   value={expenseData.reasonCustom} 
                   onChange={e => setExpenseData({...expenseData, reasonCustom: e.target.value})} 
                   placeholder="Précisez le motif..." 
                   className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 transition-all font-medium animate-in fade-in slide-in-from-top-2" 
                />
              )}
            </div>
            <div className="md:col-span-4 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddingExpense(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">Annuler</button>
              <button type="submit" className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/10">Enregistrer la sortie</button>
            </div>
          </form>
        </div>
      )}

      {isAddingTransfer && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-black text-slate-900 mb-6 font-display uppercase tracking-tight">Nouveau Transfert de Solde</h2>
          <form onSubmit={handleAddTransfer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Sous-compte de Destination</label>
              <select required value={transferData.toAccount} onChange={e => setTransferData({...transferData, toAccount: e.target.value as 'securitaire' | 'noir'})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
                <option value="securitaire">Caisse Sécuritaire</option>
                <option value="noir">Caisse Noir</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Montant (MAD) (Max: {soldeDisponibleCompany} MAD)</label>
              <input type="number" required min="0.01" step="any" max={soldeDisponibleCompany} value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder={`Max: ${soldeDisponibleCompany}`} />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Motif / Description</label>
              <input type="text" value={transferData.reason} onChange={e => setTransferData({...transferData, reason: e.target.value})} placeholder="ex: Alimentation fonds de secours" className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddingTransfer(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all font-medium">Annuler</button>
              <button type="submit" disabled={soldeDisponibleCompany <= 0} className="px-8 py-3 bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/10 font-medium font-medium">Valider le transfert</button>
            </div>
          </form>
        </div>
      )}

      {isAddingAlimentation && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-black text-slate-900 mb-6 font-display uppercase tracking-tight text-emerald-700">Nouvelle Alimentation de Caisse</h2>
          <form onSubmit={handleAddAlimentation} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Type / Catégorie</label>
              <select 
                required 
                value={alimentationData.type} 
                onChange={e => setAlimentationData({...alimentationData, type: e.target.value as 'normal' | 'pret'})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              >
                <option value="normal">Standard (Normal)</option>
                <option value="pret">Prêt (Emprunt à rembourser)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Montant (MAD)</label>
              <input 
                type="number" 
                required 
                min="0.01" 
                step="any" 
                value={alimentationData.amount} 
                onChange={e => setAlimentationData({...alimentationData, amount: e.target.value})} 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
                placeholder="Montant apporté" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Par qui ? (Auteur / Prêteur)</label>
              <input 
                type="text" 
                required 
                value={alimentationData.byWhom} 
                onChange={e => setAlimentationData({...alimentationData, byWhom: e.target.value})} 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
                placeholder="ex: Admin, Prêteur, etc." 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Date du versement</label>
              <input 
                type="date" 
                required 
                value={alimentationData.date} 
                onChange={e => setAlimentationData({...alimentationData, date: e.target.value})} 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Motif / Commentaire</label>
              <input 
                type="text" 
                value={alimentationData.reason} 
                onChange={e => setAlimentationData({...alimentationData, reason: e.target.value})} 
                placeholder="ex: Apport personnel ou prêt à court terme" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
              />
            </div>
            <div className="md:col-span-5 flex justify-end gap-3 pt-4 border-t border-slate-100 font-medium">
              <button type="button" onClick={() => setIsAddingAlimentation(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">Annuler</button>
              <button type="submit" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10">Confirmer l'alimentation</button>
            </div>
          </form>
        </div>
      )}

      {isOcrValidating && ocrData && (
        <div className="bg-purple-50 appearance-none p-8 rounded-3xl border border-purple-200 shadow-xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-black text-purple-900 mb-6 font-display uppercase tracking-tight flex items-center gap-2">
            <Camera className="w-5 h-5" /> Validation de Lecture (OCR)
          </h2>
          <form onSubmit={handleOCRSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-black text-purple-700 uppercase tracking-widest mb-2">Quantité Produit</label>
              <input type="number" required value={ocrData.quantity} onChange={e => setOcrData({...ocrData, quantity: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-black text-purple-700 uppercase tracking-widest mb-2">Prix Unitaire</label>
              <input type="number" required value={ocrData.unitPrice} onChange={e => setOcrData({...ocrData, unitPrice: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-black text-purple-700 uppercase tracking-widest mb-2">Total Extrait MAD</label>
              <input type="number" required value={ocrData.totalPrice} onChange={e => setOcrData({...ocrData, totalPrice: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-black text-purple-700 uppercase tracking-widest mb-2">Mode Paiement</label>
              <select required value={ocrData.paymentMethod} onChange={e => setOcrData({...ocrData, paymentMethod: e.target.value})} className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium">
                <option value="espece">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="credit">Crédit</option>
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end gap-3 pt-4 border-t border-purple-200 font-medium mt-2">
              <button type="button" onClick={() => { setIsOcrValidating(false); setOcrData(null); }} className="px-6 py-3 text-purple-600 font-bold hover:bg-purple-100 rounded-xl transition-all">Annuler / Ignorer</button>
              <button type="submit" className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg">Enregistrer Vente</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entrées */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-slate-900 uppercase tracking-widest text-xs">Entrées de Caisse</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full uppercase font-medium">Flux Entrant</span>
            </div>
            {/* Tab selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-200/50 p-1 rounded-xl">
              <button 
                type="button"
                onClick={() => setEntreeTab('sales')}
                className={`text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  entreeTab === 'sales' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Ventes Chauffeurs ({salesTodayCompany.length})
              </button>
              <button 
                type="button"
                onClick={() => setEntreeTab('alimentations')}
                className={`text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  entreeTab === 'alimentations' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Alimentations ({alimentationsTodayCompany.length})
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar">
            {entreeTab === 'sales' ? (
              <>
                {salesByDriver.map(([driverId, data], gIdx) => (
                  <div key={`driver-group-${driverId || gIdx}-${gIdx}`} className="space-y-3">
                    <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur pb-2 border-b border-slate-100 z-10 pt-2">
                      <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          {data.driverName.charAt(0)}
                        </div>
                        {data.driverName}
                      </h3>
                      <span className="font-black text-blue-600 text-sm">{data.total.toLocaleString()} MAD</span>
                    </div>
                    <div className="space-y-2 pl-2 sm:pl-10">
                      {data.sales.map((sale: any, sIdx: number) => {
                        const brand = brands.find(b => b.id === sale.brandId);
                        const client = clients.find(c => c.id === sale.clientId);
                        return (
                          <div key={`sale-row-${sale.id || sIdx}-${sIdx}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-black text-slate-900 truncate">{client?.name || 'Vente directe'}</span>
                                <span className="text-[9px] font-bold text-blue-500 uppercase px-1.5 py-0.5 bg-blue-50 rounded italic">{brand?.name}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                {sale.category} • {sale.quantity} unités • {new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-end">
                                <p className="text-xs font-black text-slate-900">+{sale.totalPrice} MAD</p>
                                {sale.status === 'non payé' ? (
                                  <button 
                                    onClick={() => updateSaleStatus(sale.id, 'payé')}
                                    className="mt-1 text-[9px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                  >
                                    Valider Paiement
                                  </button>
                                ) : sale.status === 'payé' ? (
                                  <span className="mt-1 text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded font-medium">
                                    Payé
                                  </span>
                                ) : null}
                              </div>
                              <button 
                                onClick={() => setTicketToPrint(sale)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {salesByDriver.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                    <ArrowDownRight className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-bold text-sm font-medium">Aucune entrée aujourd'hui.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {alimentationsTodayCompany.map((a, aIdx) => (
                  <div key={`alim-row-${a.id || aIdx}-${aIdx}`} className={`p-4 rounded-2xl border transition-all flex items-start justify-between ${
                    a.type === 'pret' 
                      ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300' 
                      : 'bg-emerald-50/50 border-emerald-100/80 hover:border-emerald-200'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-slate-900 line-clamp-1">{a.reason || 'Alimentation de Caisse'}</h4>
                        {a.type === 'pret' ? (
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded uppercase">
                            Prêt / Emprunt
                          </span>
                        ) : (
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-150 text-emerald-800 rounded uppercase">
                            Standard
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                        Auteur/Prêteur: <span className="text-emerald-750">{a.byWhom}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Date: {a.date} • Réf: {a.id.slice(-6)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span className={`font-black text-sm ${a.type === 'pret' ? 'text-amber-600' : 'text-emerald-600'}`}>+{a.amount.toLocaleString()} MAD</span>
                      <button 
                        onClick={() => {
                          if (window.confirm('Voulez-vous supprimer cette alimentation de caisse ?')) {
                            deleteCaisseAlimentation(a.id);
                            toast.success("Alimentation supprimée.");
                          }
                        }}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer l'alimentation"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {alimentationsTodayCompany.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                    <ArrowDownRight className="w-12 h-12 mb-4 opacity-10 text-emerald-600" />
                    <p className="font-bold text-sm font-medium">Aucune alimentation aujourd'hui.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sorties */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-black text-slate-900 uppercase tracking-widest text-xs">Détail des Sorties</h2>
            <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full uppercase font-medium">Pertes / Dépenses</span>
          </div>
          <div className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar font-display">
            {expensesTodayCompany.slice().reverse().map((expense, eIdx) => {
              const driver = drivers.find(d => d.id === expense.driverId);
              return (
                <div key={`expense-row-${expense.id || eIdx}-${eIdx}`} className="flex items-start justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100 hover:border-red-300 transition-all">
                  <div className="flex gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0">
                      {driver?.prenom.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm text-slate-900 mb-0.5 truncate">{expense.reason}</p>
                      <p className="text-[10px] text-slate-500 font-bold truncate flex flex-wrap items-center gap-1.5 mt-1">
                        <span>{driver?.prenom} {driver?.nom}</span>
                        <span>•</span>
                        <span>{new Date(expense.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {expense.sourceAccount && expense.sourceAccount !== 'principale' && (
                          <>
                            <span>•</span>
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              expense.sourceAccount === 'securitaire' 
                                ? 'bg-indigo-100 text-indigo-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              Caisse {expense.sourceAccount === 'securitaire' ? 'Sécuritaire' : 'Noir'}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="font-black text-red-600 text-sm">-{expense.amount} MAD</p>
                    </div>
                    <button 
                      onClick={() => setExpenseToPrint(expense)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Imprimer le ticket de sortie"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {expensesTodayCompany.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                <ArrowUpRight className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-bold text-sm font-medium">Aucune sortie aujourd'hui.</p>
              </div>
            )}
          </div>
        </div>

        {/* Allocations Sub Accounts */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-black text-slate-900 uppercase tracking-widest text-xs">Allocations aux Sous-Comptes</h2>
            <span className="text-[10px] font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase font-medium">Répartition</span>
          </div>
          <div className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar font-display">
            {transfersTodayCompany.slice().reverse().map((transfer, tIdx) => (
              <div key={`transfer-row-${transfer.id || tIdx}-${tIdx}`} className="flex items-start justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 hover:border-indigo-300 transition-all">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                    <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 mb-0.5">{transfer.reason}</p>
                    <p className="text-[10px] text-slate-500 font-bold">
                      Vers: <span className="text-indigo-600 font-black uppercase">{transfer.toAccount === 'securitaire' ? 'Caisse Sécuritaire' : 'Caisse Noir'}</span> • {new Date(transfer.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-black text-indigo-600 text-sm">-{transfer.amount} MAD</p>
                </div>
              </div>
            ))}
            {transfersTodayCompany.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                <Lock className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-bold text-sm font-medium">Aucun transfert effectué aujourd'hui.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      {/* Thermal Ticket Printer Modal for Sales */}
      {ticketToPrint && (
        <div className="print-ticket-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Aperçu du Ticket</h3>
              <button onClick={() => setTicketToPrint(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              {/* This is the printable ticket section */}
              <div id="printable-ticket" className="bg-white p-4 border border-dashed border-slate-300 rounded font-mono text-black">
                <div className="text-center pb-4 border-b border-dashed border-slate-300 mb-4">
                  <div className="flex justify-center mb-2">
                    <AfroNegoceLogo className="w-10 h-10" />
                  </div>
                  <h4 className="text-sm font-black uppercase">AFRO NÉGOCE</h4>
                  <p className="text-[9px] text-gray-500">TICKET DE REÇU - GAZ</p>
                </div>
                
                <div className="space-y-1.5 text-[10px] mb-4">
                  <div className="flex justify-between font-black border-b border-gray-100 pb-1">
                    <span>REÇU N°:</span>
                    <span>{ticketToPrint.id.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{formatDatetime(ticketToPrint.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLIENT:</span>
                    <span className="font-bold">{clients.find(c => c.id === ticketToPrint.clientId)?.name?.toUpperCase() || 'CLIENT DIRECT'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CHAUFFEUR:</span>
                    <span className="font-bold">
                      {(() => {
                        const d = drivers.find(dr => dr.id === ticketToPrint.driverId);
                        return d ? `${d.prenom.charAt(0)}. ${d.nom}`.toUpperCase() : 'N/A';
                      })()}
                    </span>
                  </div>
                </div>
                
                <div className="text-[10px] border-y border-dashed border-slate-300 py-2 mb-4">
                  <div className="flex justify-between font-black mb-1">
                    <span>PRODUIT</span>
                    <span>MONTANT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{brands.find(b => b.id === ticketToPrint.brandId)?.name} {ticketToPrint.category} x {ticketToPrint.quantity}</span>
                    <span>{ticketToPrint.totalPrice} DH</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-4 px-1">
                  <span className="text-xs font-black">TOTAL MAD:</span>
                  <span className="text-base font-black">{formatMAD(ticketToPrint.totalPrice)}</span>
                </div>
                
                <div className="text-[9px] text-center italic border-t border-dashed border-slate-300 pt-4">
                  Merci de votre confiance.
                  <br />
                  www.afro-negoce.com
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setTicketToPrint(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white transition-all text-sm"
              >
                Fermer
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Ticket Printer Modal for Expenses */}
      {expenseToPrint && (
        <div className="print-ticket-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Aperçu du Ticket Sortie</h3>
              <button onClick={() => setExpenseToPrint(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              {/* This is the printable ticket section */}
              <div id="printable-ticket" className="bg-white p-4 border border-dashed border-slate-300 rounded font-mono text-black">
                <div className="text-center pb-4 border-b border-dashed border-slate-300 mb-4">
                  <div className="flex justify-center mb-2">
                    <AfroNegoceLogo className="w-10 h-10" />
                  </div>
                  <h4 className="text-sm font-black uppercase">AFRO NÉGOCE</h4>
                  <p className="text-[9px] text-red-650 font-bold border border-red-200 px-2 py-1 bg-red-50 rounded mt-1 uppercase">TICKET DE SORTIE CAISSE</p>
                </div>
                
                <div className="space-y-1.5 text-[10px] mb-4">
                  <div className="flex justify-between font-black border-b border-gray-100 pb-1">
                    <span>PIÈCE N°:</span>
                    <span>{expenseToPrint.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{formatDatetime(expenseToPrint.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BÉNÉFICIAIRE:</span>
                    <span className="font-bold">
                      {(() => {
                        const d = drivers.find(dr => dr.id === expenseToPrint.driverId);
                        return d ? `${d.prenom} ${d.nom}`.toUpperCase() : 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>MOTIF:</span>
                    <span className="font-bold text-right truncate max-w-[150px]">{expenseToPrint.reason.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-6 px-1 border-t border-dashed border-slate-300 pt-4">
                  <span className="text-xs font-black">SOLDE DÉBITÉ:</span>
                  <span className="text-base font-black text-red-650">-{formatMAD(expenseToPrint.amount)}</span>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-6 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-[8px] text-center">
                    <div>
                      <p className="border-b border-slate-200 pb-8 mb-1 uppercase font-bold">Signature Bénéficiaire</p>
                      <br />
                    </div>
                    <div>
                      <p className="border-b border-slate-200 pb-8 mb-1 uppercase font-bold">Signature Caissier</p>
                      <br />
                    </div>
                  </div>
                </div>
                
                <div className="text-[9px] text-center italic mt-6 pt-4 border-t border-slate-100">
                  Validation de caisse Afro Negoce.
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setExpenseToPrint(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white transition-all text-sm"
              >
                Fermer
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 text-sm flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Imprimer Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          /* Reset general html/body for printing and let it grow naturally based on content only */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #fff !important;
          }

          /* Hide everything in the system by default so they take exactly zero layout space */
          body * {
            visibility: hidden !important;
          }
          
          /* Collapse everything else to zero size so there are no empty gaps or multiple pages */
          body *:not(.print-ticket-overlay):not(.print-ticket-overlay *) {
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: hidden !important;
            display: none !important;
          }

          /* Make print-ticket-overlay act as the absolute outer container on print */
          .print-ticket-overlay {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 76mm !important;
            height: auto !important;
            background: transparent !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            display: block !important;
          }

          /* Reset children inside print-ticket-overlay to be transparent with no outer padding / close buttons */
          .print-ticket-overlay > div {
            visibility: visible !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 76mm !important;
            height: auto !important;
            display: block !important;
          }

          /* Hide interactive header and footers inside the print-ticket modal */
          .print-ticket-overlay > div > div:not(:nth-child(2)) {
            display: none !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
          }

          /* Let's make sure the inner scroll div is fully expanded and visible */
          .print-ticket-overlay > div > div:nth-child(2) {
            visibility: visible !important;
            display: block !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Render printable-ticket perfectly as a pure white card with no borders or extra padding */
          #printable-ticket, #printable-ticket * {
            visibility: visible !important;
            display: block !important;
          }

          #printable-ticket {
            background: #fff !important;
            border: none !important;
            padding: 2mm !important;
            margin: 0 !important;
            width: 72mm !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }

          /* Ensure all nested inline elements display properly */
          #printable-ticket span,
          #printable-ticket p,
          #printable-ticket svg,
          #printable-ticket h4,
          #printable-ticket img,
          #printable-ticket hr,
          #printable-ticket div {
            display: revert !important;
          }
        }
      `}</style>
    </div>
  );
}
