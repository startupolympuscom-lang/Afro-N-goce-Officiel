import React, { useState } from 'react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useDispatchGazStore, type GlobalStockHistoryItem } from '../../../../stores/useDispatchGazStore';
import { DISPATCH_COMPANIES, DEFAULT_COMPANY, companyOf, getCompany, type CompanyId } from '../../../../lib/dispatchCompanies';
import { Modal, Segmented, buttonPrimary, buttonSecondary, inputClass, nf } from '../../../../components/dispatch/DispatchUI';
import { type CompanyFilter, findStock, productList } from './stockUtils';

const SECURITY_CODE = 'alpha zulu india zulu';
type Mode = 'delta' | 'count';
type Raw = { full?: string; empty?: string };
const parse = (s?: string) => { if (s === undefined || s.trim() === '') return undefined; const v = parseInt(s, 10); return Number.isFinite(v) ? v : undefined; };

export default function AdjustStockModal({ company: initial, onClose }: { company: CompanyFilter; onClose: () => void }) {
  const { brands, globalStock, setGlobalStock, addStockActivity } = useDispatchGazStore();
  const [company, setCompany] = useState<CompanyId>(initial === 'all' ? DEFAULT_COMPANY : initial);
  const [mode, setMode] = useState<Mode>('count');
  const [raw, setRaw] = useState<Record<string, Raw>>({}); // key: company|brand|category
  const [code, setCode] = useState('');

  /** Signed change for one stock line, or 0 when nothing was typed. */
  const deltaOf = (key: string, current: { full: number; empty: number }) => {
    const r = raw[key] || {};
    const f = parse(r.full); const e = parse(r.empty);
    return mode === 'delta'
      ? { full: f ?? 0, empty: e ?? 0 }
      : { full: f === undefined ? 0 : Math.max(0, f) - current.full, empty: e === undefined ? 0 : Math.max(0, e) - current.empty };
  };
  const changes = globalStock
    .map((g) => ({ g, key: `${companyOf(g.company)}|${g.brandId}|${g.category}` }))
    .map(({ g, key }) => ({ g, d: deltaOf(key, g) }))
    .filter(({ d }) => d.full !== 0 || d.empty !== 0);
  const changedFor = (c: CompanyId) => changes.filter(({ g }) => companyOf(g.company) === c).length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.toLowerCase().trim() !== SECURITY_CODE) { toast.error('Code de sécurité invalide.'); return; }
    if (!changes.length) { toast.error('Aucune modification saisie.'); return; }
    const date = new Date().toISOString();
    const history: GlobalStockHistoryItem[] = [];
    const next = globalStock.map((item) => {
      const d = deltaOf(`${companyOf(item.company)}|${item.brandId}|${item.category}`, item);
      if (!d.full && !d.empty) return item;
      const comp = companyOf(item.company);
      history.push({ id: nanoid(), date, brandId: item.brandId, category: item.category, deltaFull: d.full, deltaEmpty: d.empty, company: comp });
      addStockActivity({ action: 'set_global', company: comp, brandId: item.brandId, category: item.category, quantityFull: d.full, quantityEmpty: d.empty, description: mode === 'count' ? 'Inventaire (stock compté)' : 'Ajustement Manuel Stock Global' });
      return { ...item, full: Math.max(0, item.full + d.full), empty: Math.max(0, item.empty + d.empty) };
    });
    setGlobalStock(next, history);
    toast.success(`Stock mis à jour : ${history.length} ligne(s) modifiée(s).`);
    onClose();
  };

  const rows = productList(brands).map((p) => {
    const g = findStock(globalStock, p.brandId, p.category, company);
    const current = { full: g?.full || 0, empty: g?.empty || 0 };
    const key = `${company}|${p.brandId}|${p.category}`;
    const d = deltaOf(key, current);
    return { ...p, key, current, d, exists: !!g };
  });
  const cellInput = (key: string, field: keyof Raw, label: string) => (
    <input type="number" inputMode="numeric" step={1} min={mode === 'count' ? 0 : undefined} value={raw[key]?.[field] ?? ''} aria-label={label}
      placeholder={mode === 'count' ? 'compté' : '+ / −'}
      onChange={(e) => setRaw((r) => ({ ...r, [key]: { ...r[key], [field]: e.target.value } }))}
      className={`${inputClass} w-20 text-right tabular-nums`} />
  );
  const after = (v: number, d: number) => (
    <td className={`px-3 py-2 text-right tabular-nums ${d ? 'font-semibold text-slate-900' : 'text-slate-300'}`}>
      {nf(Math.max(0, v + d))}{d ? <span className={`ml-1 text-xs ${d > 0 ? 'text-emerald-700' : 'text-red-600'}`}>({d > 0 ? '+' : ''}{d})</span> : null}
    </td>
  );

  return (
    <Modal title="Inventaire et ajustement du stock" subtitle="Corrige le stock du dépôt. Chaque modification est tracée dans l'historique." onClose={onClose} size="xl"
      footer={
        <form onSubmit={submit} className="flex w-full flex-wrap items-center justify-end gap-2">
          <span className="mr-auto text-sm text-slate-600">{changes.length ? `${changes.length} ligne(s) modifiée(s)` : 'Aucune modification'}</span>
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code de sécurité" aria-label="Code de sécurité administrateur" className={`${inputClass} w-52`} />
          <button type="button" className={buttonSecondary} onClick={onClose}>Annuler</button>
          <button type="submit" className={buttonPrimary} disabled={!changes.length || !code.trim()}>Enregistrer</button>
        </form>
      }>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<CompanyId> label="Société" value={company} onChange={setCompany}
            options={DISPATCH_COMPANIES.map((c) => ({ id: c.id, label: changedFor(c.id) ? `${c.short} (${changedFor(c.id)})` : c.name }))} />
          <Segmented<Mode> label="Mode de saisie" value={mode} onChange={(m) => { setMode(m); setRaw({}); }}
            options={[{ id: 'count', label: 'Saisir le stock compté' }, { id: 'delta', label: 'Ajouter ou retirer' }]} />
        </div>
        <p className="text-sm text-slate-600">
          {mode === 'count'
            ? 'Saisissez le nombre de bouteilles comptées au dépôt ; l’écart avec le stock actuel est calculé pour vous. Laissez vide ce qui n’a pas été compté.'
            : 'Saisissez la quantité à ajouter (ex : 20) ou à retirer (ex : -5). Laissez vide ce qui ne change pas.'}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-100">
                <th rowSpan={2} className="py-2 pr-3 text-left align-bottom font-semibold">Produit · {getCompany(company).name}</th>
                <th colSpan={3} className="border-l border-slate-100 px-3 pt-2 text-center font-semibold text-slate-600">Pleines</th>
                <th colSpan={3} className="border-l border-slate-100 px-3 pt-2 text-center font-semibold text-slate-600">Vides</th>
              </tr>
              <tr className="border-b border-slate-100">
                <th className="border-l border-slate-100 px-3 pb-2 text-right font-medium">Actuel</th>
                <th className="px-3 pb-2 text-right font-medium">{mode === 'count' ? 'Compté' : 'Modifier'}</th>
                <th className="px-3 pb-2 text-right font-medium">Après</th>
                <th className="border-l border-slate-100 px-3 pb-2 text-right font-medium">Actuel</th>
                <th className="px-3 pb-2 text-right font-medium">{mode === 'count' ? 'Compté' : 'Modifier'}</th>
                <th className="px-3 pb-2 text-right font-medium">Après</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.filter((r) => r.exists).map((r) => (
                <tr key={r.key}>
                  <td className="py-2 pr-3 font-medium text-slate-900">{r.brand.name} <span className="text-slate-500">{r.category}</span></td>
                  <td className="border-l border-slate-100 px-3 py-2 text-right tabular-nums text-slate-500">{nf(r.current.full)}</td>
                  <td className="px-3 py-1.5 text-right">{cellInput(r.key, 'full', `Pleines ${r.brand.name} ${r.category}`)}</td>
                  {after(r.current.full, r.d.full)}
                  <td className="border-l border-slate-100 px-3 py-2 text-right tabular-nums text-slate-500">{nf(r.current.empty)}</td>
                  <td className="px-3 py-1.5 text-right">{cellInput(r.key, 'empty', `Vides ${r.brand.name} ${r.category}`)}</td>
                  {after(r.current.empty, r.d.empty)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
