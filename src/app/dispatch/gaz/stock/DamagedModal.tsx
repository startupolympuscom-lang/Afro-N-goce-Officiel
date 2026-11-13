import React, { useState } from 'react';
import { toast } from 'sonner';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { DISPATCH_COMPANIES, DEFAULT_COMPANY, type CompanyId } from '../../../../lib/dispatchCompanies';
import { Modal, NumberField, Segmented, buttonPrimary, buttonSecondary, inputClass, nf } from '../../../../components/dispatch/DispatchUI';
import { type CompanyFilter, findStock, productList } from './stockUtils';

type Action = 'declare' | 'repair';
type Kind = 'empty' | 'full';

export default function DamagedModal({ company: initial, onClose }: { company: CompanyFilter; onClose: () => void }) {
  const { brands, globalStock, declareDamagedStock, repairDamagedStock, addStockActivity } = useDispatchGazStore();
  const products = productList(brands);
  const [action, setAction] = useState<Action>('declare');
  const [company, setCompany] = useState<CompanyId>(initial === 'all' ? DEFAULT_COMPANY : initial);
  const [product, setProduct] = useState(products[0]?.key || '');
  const [kind, setKind] = useState<Kind>('empty');
  const [quantity, setQuantity] = useState(0);

  const p = products.find((x) => x.key === product);
  const gs = p ? findStock(globalStock, p.brandId, p.category, company) : undefined;
  const available = action === 'declare' ? (kind === 'empty' ? gs?.empty || 0 : gs?.full || 0) : gs?.damaged || 0;

  const submit = () => {
    if (!p || quantity <= 0) { toast.error('Choisissez un produit et une quantité.'); return; }
    if (quantity > available) {
      toast.error(action === 'declare' ? `Stock ${kind === 'empty' ? 'vide' : 'plein'} insuffisant pour déclarer comme endommagé.` : 'Stock endommagé insuffisant pour la réparation.');
      return;
    }
    if (action === 'declare') {
      declareDamagedStock(p.brandId, p.category, quantity, company, kind);
      addStockActivity({ action: 'declare_damaged', company, brandId: p.brandId, category: p.category, quantityDamaged: quantity, description: `Déclaration Endommagé depuis ${kind === 'empty' ? 'Vide' : 'Plein'}` });
      toast.success(`${quantity} bouteille(s) ${p.brand.name} ${p.category} déclarée(s) avariée(s).`);
    } else {
      repairDamagedStock(p.brandId, p.category, quantity, kind, company);
      addStockActivity({ action: 'repair_damaged', company, brandId: p.brandId, category: p.category, [kind === 'empty' ? 'quantityEmpty' : 'quantityFull']: quantity, description: `Réparation / Remplacement vers ${kind === 'empty' ? 'Vide' : 'Plein'}` });
      toast.success(`${quantity} bouteille(s) ${p.brand.name} ${p.category} remise(s) en service.`);
    }
    onClose();
  };

  return (
    <Modal title="Bouteilles avariées" subtitle="Sortez du stock les bouteilles abîmées, puis remettez-les en service après réparation ou échange." onClose={onClose}
      footer={<>
        <button type="button" className={buttonSecondary} onClick={onClose}>Annuler</button>
        <button type="button" className={buttonPrimary} onClick={submit} disabled={!p || quantity <= 0 || quantity > available}>{action === 'declare' ? 'Déclarer avariées' : 'Remettre en service'}</button>
      </>}>
      <div className="space-y-4 p-5">
        <Segmented<Action> label="Opération" value={action} onChange={(a) => { setAction(a); setQuantity(0); }}
          options={[{ id: 'declare', label: 'Déclarer des avaries' }, { id: 'repair', label: 'Remettre en service' }]} />
        <label className="block text-xs font-medium text-slate-500">Société
          <select value={company} onChange={(e) => setCompany(e.target.value as CompanyId)} className={`${inputClass} mt-1 block w-full`}>
            {DISPATCH_COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-500">Produit
          <select value={product} onChange={(e) => setProduct(e.target.value)} className={`${inputClass} mt-1 block w-full`}>
            {products.map((x) => <option key={x.key} value={x.key}>{x.brand.name} {x.category}</option>)}
          </select>
        </label>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">{action === 'declare' ? 'Bouteilles prises dans le stock' : 'Remettre dans le stock'}</p>
          <Segmented<Kind> label={action === 'declare' ? 'Origine' : 'Destination'} value={kind} onChange={setKind}
            options={[{ id: 'empty', label: `Vides${action === 'declare' ? ` (${nf(gs?.empty || 0)})` : ''}` }, { id: 'full', label: `Pleines${action === 'declare' ? ` (${nf(gs?.full || 0)})` : ''}` }]} />
        </div>
        <label className="block text-xs font-medium text-slate-500">Quantité
          <NumberField value={quantity || ''} max={available} placeholder="0" onChange={(v) => setQuantity(Math.max(0, Math.round(v)))} className="mt-1 block w-32" />
          <span className={`mt-1 block ${quantity > available ? 'text-red-600' : 'text-slate-500'}`}>
            {action === 'declare' ? `${nf(available)} ${kind === 'empty' ? 'vide(s)' : 'pleine(s)'} disponible(s)` : `${nf(available)} avariée(s) en stock`}
          </span>
        </label>
      </div>
    </Modal>
  );
}
