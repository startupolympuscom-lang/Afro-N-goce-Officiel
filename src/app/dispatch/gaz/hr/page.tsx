import React, { useState, useMemo } from 'react';
import { useDispatchGazStore, GazPaySlip } from '../../../../stores/useDispatchGazStore';
import { Users, FileText, Download, Calculator, Search, Filter, CheckCircle2, Trash2, QrCode, UserPlus, ChevronRight } from 'lucide-react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function DispatchHRPage() {
  const { drivers, sales, commissions, brands, paySlips, addPaySlip, deletePaySlip } = useDispatchGazStore();
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // History states
  const [historySearch, setHistorySearch] = useState('');
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const calculatePayroll = (driverId: string, targetMonth: string) => {
    const driverSales = sales.filter(s => 
      s.driverId === driverId && 
      s.date.startsWith(targetMonth)
    );

    let totalCommission = 0;
    const details: { brandName: string, category: string, quantity: number, commissionRate: number, total: number }[] = [];

    const salesSummary: Record<string, number> = {};
    driverSales.forEach(sale => {
      const key = `${sale.brandId}_${sale.category}`;
      salesSummary[key] = (salesSummary[key] || 0) + sale.quantity;
    });

    Object.entries(salesSummary).forEach(([key, quantity]) => {
      const [brandId, category] = key.split('_');
      const commission = commissions.find(c => c.brandId === brandId && c.category === category);
      const brand = brands.find(b => b.id === brandId);
      
      const rate = commission ? commission.rate : 0;
      const total = quantity * rate;
      totalCommission += total;

      details.push({
        brandName: brand?.name || 'Inconnu',
        category,
        quantity,
        commissionRate: rate,
        total
      });
    });

    return {
      totalCommission,
      details,
      salesCount: driverSales.length,
      totalVolume: driverSales.reduce((sum, s) => sum + s.quantity, 0)
    };
  };

  const payrollData = useMemo(() => {
    if (!selectedDriverId || !month) return null;
    return calculatePayroll(selectedDriverId, month);
  }, [selectedDriverId, month, sales, commissions, brands]);

  const handleSavePaySlip = () => {
    if (!payrollData || !selectedDriverId) return;

    // Check if already exists
    const existing = paySlips.find(p => p.driverId === selectedDriverId && p.month === month);
    if (existing) {
      toast.error('Une fiche de paie existe déjà pour ce chauffeur et ce mois.');
      return;
    }

    const newPaySlip: GazPaySlip = {
      id: nanoid(),
      driverId: selectedDriverId,
      month,
      totalCommission: payrollData.totalCommission,
      details: payrollData.details,
      generatedAt: new Date().toISOString()
    };

    addPaySlip(newPaySlip);
    toast.success('Fiche de paie enregistrée avec succès.');
  };

  const historyData = useMemo(() => {
    if (activeTab !== 'history') return [];

    // We can show both saved pay slips AND calculated ones (as drafts)
    // Or just saved ones. The user said "browse past fiche de paie generated".
    // I'll show saved ones as "Validée" and others as "Non validée" if they have sales.

    const results: any[] = [];

    if (historySearch) {
      const matchingDrivers = drivers.filter(d => 
        `${d.prenom} ${d.nom}`.toLowerCase().includes(historySearch.toLowerCase())
      );

      matchingDrivers.forEach(driver => {
        // Get saved ones
        const saved = paySlips.filter(p => p.driverId === driver.id);
        saved.forEach(p => {
          results.push({
            driver,
            month: p.month,
            totalCommission: p.totalCommission,
            salesCount: '-', // We don't store this in paySlip yet, but could
            totalVolume: '-',
            status: 'validée',
            paySlipId: p.id
          });
        });

        // Find months with sales that are NOT saved
        const driverSales = sales.filter(s => s.driverId === driver.id);
        const months = Array.from(new Set(driverSales.map(s => s.date.slice(0, 7)))) as string[];
        
        months.forEach(m => {
          if (!saved.find(p => p.month === m)) {
            const payroll = calculatePayroll(driver.id, m);
            if (payroll.totalCommission > 0) {
              results.push({
                driver,
                month: m,
                ...payroll,
                status: 'brouillon'
              });
            }
          }
        });
      });
    } else {
      // Show all for selected month
      drivers.forEach(driver => {
        const saved = paySlips.find(p => p.driverId === driver.id && p.month === historyMonth);
        if (saved) {
          results.push({
            driver,
            month: historyMonth,
            totalCommission: saved.totalCommission,
            salesCount: '-',
            totalVolume: '-',
            status: 'validée',
            paySlipId: saved.id
          });
        } else {
          const payroll = calculatePayroll(driver.id, historyMonth);
          if (payroll.totalCommission > 0) {
            results.push({
              driver,
              month: historyMonth,
              ...payroll,
              status: 'brouillon'
            });
          }
        }
      });
    }

    return results.sort((a, b) => b.month.localeCompare(a.month));
  }, [activeTab, historySearch, historyMonth, drivers, sales, commissions, brands, paySlips]);

  const isAlreadySaved = useMemo(() => {
    return paySlips.some(p => p.driverId === selectedDriverId && p.month === month);
  }, [selectedDriverId, month, paySlips]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          to="/dispatch/gaz/hr/pointage"
          className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 uppercase tracking-tight">Suivi Pointage</h3>
              <p className="text-xs text-slate-500">QR Code & Présences quotidiennes</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </Link>

        <Link 
          to="/dispatch/gaz/hr/convoyeurs"
          className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 uppercase tracking-tight">Convoyeurs</h3>
              <p className="text-xs text-slate-500">Liste des accompagnateurs</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-600" />
          Paie & Commissions
        </h1>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'generator' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Générateur
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'history' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Historique
          </button>
        </div>
      </div>

      {activeTab === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                Sélection
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chauffeur / Vendeur</label>
                  <select 
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Sélectionner un chauffeur...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.prenom} {d.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mois de paie</label>
                  <input 
                    type="month" 
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {selectedDriver && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Informations Chauffeur</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Nom complet</span>
                    <span className="font-medium text-slate-900">{selectedDriver.prenom} {selectedDriver.nom}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">CIN</span>
                    <span className="font-medium text-slate-900">{selectedDriver.cin || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">N° CNSS</span>
                    <span className="font-medium text-slate-900">{selectedDriver.cnss || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Téléphone</span>
                    <span className="font-medium text-slate-900">{selectedDriver.phone || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Adresse</span>
                    <span className="font-medium text-slate-900">{selectedDriver.address || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {payrollData ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">Fiche de Paie Estimée</h2>
                      {isAlreadySaved && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Validée
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">Période: {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex gap-2">
                    {!isAlreadySaved && (
                      <button 
                        onClick={handleSavePaySlip}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Valider la paie
                      </button>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Exporter PDF
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-1">
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Salaire Net (Commissions)</p>
                      <p className="text-2xl font-black text-blue-700">{payrollData.totalCommission.toFixed(2)} MAD</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Volume Vendu</p>
                      <p className="text-2xl font-black text-slate-700">{payrollData.totalVolume} unités</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transactions</p>
                      <p className="text-2xl font-black text-slate-700">{payrollData.salesCount}</p>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-slate-400" />
                    Détail des Commissions
                  </h3>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-3 font-medium text-slate-600">Produit</th>
                          <th className="p-3 font-medium text-slate-600 text-right">Quantité</th>
                          <th className="p-3 font-medium text-slate-600 text-right">Taux Commission</th>
                          <th className="p-3 font-medium text-slate-600 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payrollData.details.map((detail, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-900">{detail.brandName} - {detail.category}</td>
                            <td className="p-3 text-right text-slate-600">{detail.quantity}</td>
                            <td className="p-3 text-right text-slate-600">{detail.commissionRate.toFixed(2)} MAD</td>
                            <td className="p-3 text-right font-medium text-slate-900">{detail.total.toFixed(2)} MAD</td>
                          </tr>
                        ))}
                        {payrollData.details.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500">Aucune vente enregistrée pour cette période.</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        <tr>
                          <td colSpan={3} className="p-3 text-right text-slate-700">Total Commissions:</td>
                          <td className="p-3 text-right text-blue-600 text-lg">{payrollData.totalCommission.toFixed(2)} MAD</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800 flex items-start gap-3">
                    <FileText className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>
                      <strong>Note:</strong> Ce chauffeur est rémunéré exclusivement à la commission. 
                      Les taux de commission sont définis dans les paramètres GPL par marque et catégorie de produit.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <FileText className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Générateur de Fiche de Paie</h3>
                <p className="text-slate-500 max-w-md">
                  Sélectionnez un chauffeur et un mois dans le panneau latéral pour calculer les commissions et générer la fiche de paie.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Rechercher un employé</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nom ou prénom..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <label className="block text-sm font-medium text-slate-700 mb-1">Mois (si pas de recherche)</label>
                <input
                  type="month"
                  value={historyMonth}
                  onChange={(e) => setHistoryMonth(e.target.value)}
                  disabled={!!historySearch}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                {historySearch 
                  ? `Historique pour "${historySearch}"` 
                  : `Fiches de paie - ${new Date(historyMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                }
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-medium text-slate-600">Employé</th>
                    <th className="p-4 font-medium text-slate-600">Période</th>
                    <th className="p-4 font-medium text-slate-600 text-right">Volume</th>
                    <th className="p-4 font-medium text-slate-600 text-right">Transactions</th>
                    <th className="p-4 font-medium text-slate-600 text-right">Total Net</th>
                    <th className="p-4 font-medium text-slate-600 text-center">Statut</th>
                    <th className="p-4 font-medium text-slate-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{item.driver.prenom} {item.driver.nom}</div>
                        <div className="text-xs text-slate-500">CIN: {item.driver.cin || '-'}</div>
                      </td>
                      <td className="p-4 text-slate-600">
                        {new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right text-slate-600">{item.totalVolume}</td>
                      <td className="p-4 text-right text-slate-600">{item.salesCount}</td>
                      <td className="p-4 text-right font-bold text-blue-600">{item.totalCommission.toFixed(2)} MAD</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'validée' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => {
                              setSelectedDriverId(item.driver.id);
                              setMonth(item.month);
                              setActiveTab('generator');
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {item.status === 'validée' && (
                            <button 
                              onClick={() => {
                                if (confirm('Supprimer cette fiche de paie validée ?')) {
                                  deletePaySlip(item.paySlipId);
                                  toast.success('Fiche de paie supprimée.');
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500">
                        Aucun résultat trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
