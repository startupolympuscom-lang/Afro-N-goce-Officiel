import React, { useState } from 'react';
import { Truck, Store, AlertTriangle, ClipboardList, FileDown } from 'lucide-react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { DISPATCH_COMPANIES } from '../../../../lib/dispatchCompanies';
import { PageHeader, Segmented, Tabs, buttonPrimary, buttonSecondary } from '../../../../components/dispatch/DispatchUI';
import { type CompanyFilter, localDay, matchesCompany } from './stockUtils';
import { generateStockReport } from './stockReport';
import StockOverview from './StockOverview';
import DriverLoads from './DriverLoads';
import StockHistory from './StockHistory';
import LoadDriverModal from './LoadDriverModal';
import ComptoirModal from './ComptoirModal';
import DamagedModal from './DamagedModal';
import AdjustStockModal from './AdjustStockModal';

type Tab = 'stock' | 'chauffeurs' | 'historique';
type Dialog = null | { kind: 'load'; driverId?: string } | { kind: 'comptoir' } | { kind: 'damaged' } | { kind: 'adjust' };

export default function DispatchStockPage() {
  const store = useDispatchGazStore();
  const { drivers, stockDispatches } = store;
  const [company, setCompany] = useState<CompanyFilter>('all');
  const [tab, setTab] = useState<Tab>('stock');
  const [dialog, setDialog] = useState<Dialog>(null);

  const driversOnRoad = new Set(stockDispatches
    .filter((d) => !d.isValidated && matchesCompany(company, drivers.find((x) => x.id === d.driverId)?.company))
    .map((d) => d.driverId)).size;

  const report = () => generateStockReport({
    day: localDay(), company, brands: store.brands, drivers, globalStock: store.globalStock,
    comptoirStock: store.comptoirStock || [], stockDispatches, stockActivities: store.stockActivities || [],
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <PageHeader
        title="Stocks GPL"
        subtitle="Stock du dépôt et du comptoir par société, chargement des chauffeurs et validation de leurs retours."
        actions={<>
          <button type="button" className={buttonPrimary} onClick={() => setDialog({ kind: 'load' })}><Truck className="h-4 w-4" /> Charger un chauffeur</button>
          <button type="button" className={buttonSecondary} onClick={() => setDialog({ kind: 'comptoir' })}><Store className="h-4 w-4" /> Alimenter le comptoir</button>
          <button type="button" className={buttonSecondary} onClick={() => setDialog({ kind: 'damaged' })}><AlertTriangle className="h-4 w-4" /> Avaries</button>
          <button type="button" className={buttonSecondary} onClick={() => setDialog({ kind: 'adjust' })}><ClipboardList className="h-4 w-4" /> Inventaire</button>
          <button type="button" className={buttonSecondary} onClick={report} title="Rapport PDF du jour"><FileDown className="h-4 w-4" /> PDF</button>
        </>}
      />

      <Segmented<CompanyFilter> label="Société" value={company} onChange={setCompany}
        options={[{ id: 'all', label: 'Toutes les sociétés' }, ...DISPATCH_COMPANIES.map((c) => ({ id: c.id, label: c.name }))]} />

      <Tabs<Tab> label="Sections du stock" value={tab} onChange={setTab} tabs={[
        { id: 'stock', label: 'Stock' },
        { id: 'chauffeurs', label: 'Chauffeurs en tournée', count: driversOnRoad },
        { id: 'historique', label: 'Historique' },
      ]} />

      {tab === 'stock' && <StockOverview company={company} onPickCompany={setCompany} onOpenDrivers={() => setTab('chauffeurs')} />}
      {tab === 'chauffeurs' && <DriverLoads company={company} onLoad={(driverId) => setDialog({ kind: 'load', driverId })} />}
      {tab === 'historique' && <StockHistory company={company} />}

      {dialog?.kind === 'load' && <LoadDriverModal company={company} initialDriverId={dialog.driverId} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'comptoir' && <ComptoirModal company={company} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'damaged' && <DamagedModal company={company} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'adjust' && <AdjustStockModal company={company} onClose={() => setDialog(null)} />}
    </div>
  );
}
