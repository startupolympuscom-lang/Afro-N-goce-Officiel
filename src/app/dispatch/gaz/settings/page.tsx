import React, { useRef, useState } from 'react';
import { Plus, Trash2, Pencil, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatchGazStore, type GazBrand } from '../../../../stores/useDispatchGazStore';
import { Card, EmptyState, Modal, PageHeader, Tabs, buttonPrimary, buttonSecondary, inputClass } from '../../../../components/dispatch/DispatchUI';

type Tab = 'produits' | 'prix' | 'consigne' | 'donnees';
const RESET_CODE = 'delta alpha hotel india mike';
const sortCats = (cats: string[]) => [...cats].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0) || a.localeCompare(b));

/** Price-like input that writes to the store as soon as a valid number is typed (empty keeps the saved value). */
function MoneyInput({ value, onSave, label, step = 1, missing }: { value: number | undefined; onSave: (v: number) => void; label: string; step?: number; missing?: boolean }) {
  return (
    <input
      type="number" inputMode="decimal" min={0} step={step} aria-label={label}
      defaultValue={value ?? ''}
      key={value ?? 'empty'}
      onBlur={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v) && v !== value) onSave(v); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      placeholder="—"
      className={`${inputClass} w-24 text-right tabular-nums ${missing ? 'border-amber-300! bg-amber-50!' : ''}`}
    />
  );
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('lecture'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('image'));
      img.onload = () => {
        const max = 150;
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function BrandCard({ brand }: { brand: GazBrand }) {
  const { updateBrand, deleteBrand } = useDispatchGazStore();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadFor, setUploadFor] = useState<string | null>(null);

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const names = newProduct.split(',').map((c) => c.trim()).filter(Boolean).filter((c) => !brand.categories.includes(c));
    if (!names.length) return;
    updateBrand(brand.id, { categories: [...brand.categories, ...names] });
    setNewProduct('');
    toast.success(`${names.join(', ')} ajouté(s) à ${brand.name}.`);
  };
  const removeProduct = (cat: string) => {
    if (!window.confirm(`Retirer ${brand.name} ${cat} des produits ? Les ventes et le stock déjà enregistrés sont conservés.`)) return;
    const productImages = { ...(brand.productImages || {}) };
    delete productImages[cat];
    updateBrand(brand.id, { categories: brand.categories.filter((c) => c !== cat), productImages });
  };
  const onFile = async (file: File) => {
    if (!uploadFor) return;
    try {
      const data = await resizeImage(file);
      updateBrand(brand.id, { productImages: { ...(useDispatchGazStore.getState().brands.find((b) => b.id === brand.id)?.productImages || {}), [uploadFor]: data } });
      toast.success(`Photo ajoutée pour ${brand.name} ${uploadFor}.`);
    } catch {
      toast.error("Cette image n'a pas pu être lue.");
    }
  };

  return (
    <Card
      title={renaming === null ? brand.name : (
        <form onSubmit={(e) => { e.preventDefault(); if (renaming.trim()) updateBrand(brand.id, { name: renaming.trim() }); setRenaming(null); }} className="flex items-center gap-2">
          <input autoFocus value={renaming} onChange={(e) => setRenaming(e.target.value)} aria-label="Nom de la marque" className={`${inputClass} w-48`} />
          <button type="submit" className={buttonPrimary}>OK</button>
        </form>
      )}
      subtitle={`${brand.categories.length} produit(s)`}
      actions={renaming === null && (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setRenaming(brand.name)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`Renommer ${brand.name}`} title="Renommer"><Pencil className="h-4 w-4" /></button>
          <button type="button" onClick={() => { if (window.confirm(`Supprimer la marque ${brand.name} ? Elle ne sera plus proposée à la vente ni au chargement.`)) deleteBrand(brand.id); }}
            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Supprimer ${brand.name}`} title="Supprimer"><Trash2 className="h-4 w-4" /></button>
        </div>
      )}
    >
      <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {sortCats(brand.categories).map((cat) => (
          <li key={cat} className="group relative flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-3">
            <button type="button" onClick={() => { setUploadFor(cat); fileRef.current?.click(); }} title="Changer la photo" aria-label={`Photo de ${brand.name} ${cat}`}
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-50 text-slate-400 ring-1 ring-slate-200 hover:ring-blue-400">
              {brand.productImages?.[cat] ? <img src={brand.productImages[cat]} alt="" className="h-full w-full object-contain" /> : <ImagePlus className="h-5 w-5" />}
            </button>
            <span className="text-sm font-semibold text-slate-800">{cat}</span>
            <button type="button" onClick={() => removeProduct(cat)} aria-label={`Retirer ${cat}`} title="Retirer ce produit"
              className="absolute right-1.5 top-1.5 rounded-md p-1 text-slate-300 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={addProduct} className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
        <input value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="Nouveau produit, ex : 6Kg" aria-label={`Nouveau produit ${brand.name}`} className={`${inputClass} w-56`} />
        <button type="submit" className={buttonSecondary} disabled={!newProduct.trim()}><Plus className="h-4 w-4" /> Ajouter un produit</button>
      </form>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </Card>
  );
}

export default function DispatchSettingsPage() {
  const { brands, addBrand, zones, addZone, updateZone, deleteZone, prices, setPrice, commissions, setCommission, gplConfig, updateGPLConfig, clients, resetData } = useDispatchGazStore();
  const [tab, setTab] = useState<Tab>('produits');
  const [brandName, setBrandName] = useState('');
  const [brandProducts, setBrandProducts] = useState('3Kg, 12Kg, 34Kg');
  const [zoneName, setZoneName] = useState('');
  const [renamingZone, setRenamingZone] = useState<{ id: string; name: string } | null>(null);
  const [reset, setReset] = useState<null | 'code' | 'confirm'>(null);
  const [code, setCode] = useState('');

  const priceOf = (brandId: string, cat: string, zoneId: string) => prices.find((p) => p.brandId === brandId && p.category === cat && p.zoneId === zoneId)?.price;
  const savePrice = (brandId: string, category: string, zoneId: string, price: number) => setPrice({ id: `${brandId}-${category}-${zoneId}`, brandId, category, zoneId, price });
  const missingPrices = brands.reduce((n, b) => n + b.categories.reduce((m, c) => m + zones.filter((z) => priceOf(b.id, c, z.id) === undefined).length, 0), 0);

  const submitBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const name = brandName.trim();
    const categories = brandProducts.split(',').map((c) => c.trim()).filter(Boolean);
    if (!name || !categories.length) return;
    addBrand({ id: Date.now().toString(), name, categories });
    setBrandName('');
    toast.success(`Marque ${name} ajoutée. Pensez à renseigner ses prix et sa consigne.`);
  };
  const submitZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;
    addZone({ id: Date.now().toString(), name: zoneName.trim() });
    setZoneName('');
  };
  const removeZone = (id: string, name: string) => {
    const used = clients.filter((c) => c.zoneId === id).length;
    if (!window.confirm(used ? `${used} client(s) utilisent la zone ${name} : leurs ventes n'auront plus de prix. Supprimer quand même ?` : `Supprimer la zone ${name} ?`)) return;
    deleteZone(id);
  };
  const copyFirstZone = (brandId: string, cat: string) => {
    const first = zones[0] && priceOf(brandId, cat, zones[0].id);
    if (first === undefined) { toast.error(`Renseignez d'abord le prix de ${zones[0]?.name ?? 'la première zone'}.`); return; }
    zones.slice(1).forEach((z) => savePrice(brandId, cat, z.id, first));
    toast.success('Prix copié sur toutes les zones.');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
      <PageHeader title="Paramètres GPL" subtitle="Marques, produits, prix de vente par zone, consigne et commissions. Chaque modification est enregistrée dès que vous quittez le champ." />
      <Tabs<Tab> label="Sections des paramètres" value={tab} onChange={setTab} tabs={[
        { id: 'produits', label: 'Marques et produits' },
        { id: 'prix', label: 'Prix de vente', count: missingPrices },
        { id: 'consigne', label: 'Consigne et commissions' },
        { id: 'donnees', label: 'Réinitialisation' },
      ]} />

      {tab === 'produits' && (
        <div className="space-y-5">
          <Card title="Ajouter une marque" bodyClass="p-4">
            <form onSubmit={submitBrand} className="flex flex-wrap items-end gap-3">
              <label className="block text-xs font-medium text-slate-500">Nom<input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="ex : Afriquia Gaz" className={`${inputClass} mt-1 block w-56`} /></label>
              <label className="block text-xs font-medium text-slate-500">Produits (séparés par des virgules)<input value={brandProducts} onChange={(e) => setBrandProducts(e.target.value)} className={`${inputClass} mt-1 block w-64`} /></label>
              <button type="submit" className={buttonPrimary} disabled={!brandName.trim()}><Plus className="h-4 w-4" /> Ajouter la marque</button>
            </form>
          </Card>
          {brands.length === 0 ? <Card><EmptyState>Aucune marque. Ajoutez-en une ci-dessus.</EmptyState></Card> : brands.map((b) => <BrandCard key={b.id} brand={b} />)}
        </div>
      )}

      {tab === 'prix' && (
        <div className="space-y-5">
          <Card title="Zones de prix" subtitle="Chaque client est rattaché à une zone ; le prix de vente dépend de la zone." bodyClass="p-4">
            <div className="flex flex-wrap items-center gap-2">
              {zones.map((z) => (
                renamingZone?.id === z.id ? (
                  <form key={z.id} onSubmit={(e) => { e.preventDefault(); if (renamingZone.name.trim()) updateZone(z.id, { name: renamingZone.name.trim() }); setRenamingZone(null); }} className="flex items-center gap-1">
                    <input autoFocus value={renamingZone.name} onChange={(e) => setRenamingZone({ id: z.id, name: e.target.value })} aria-label="Nom de la zone" className={`${inputClass} w-40`} />
                    <button type="submit" className={buttonPrimary}>OK</button>
                  </form>
                ) : (
                  <span key={z.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 py-1 pl-3 pr-1 text-sm text-slate-800">
                    {z.name}
                    <span className="ml-1 text-xs text-slate-400">{clients.filter((c) => c.zoneId === z.id).length} cl.</span>
                    <button type="button" onClick={() => setRenamingZone({ id: z.id, name: z.name })} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Renommer ${z.name}`}><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => removeZone(z.id, z.name)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Supprimer ${z.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>
                )
              ))}
              <form onSubmit={submitZone} className="flex items-center gap-1">
                <input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="Nouvelle zone" aria-label="Nouvelle zone" className={`${inputClass} w-40`} />
                <button type="submit" className={buttonSecondary} disabled={!zoneName.trim()}><Plus className="h-4 w-4" /> Ajouter</button>
              </form>
            </div>
          </Card>
          {missingPrices > 0 && <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900">{missingPrices} prix manquant(s), en jaune ci-dessous : sans prix, un produit ne peut pas être vendu aux clients de cette zone.</p>}
          {brands.length === 0 || zones.length === 0 ? <Card><EmptyState>Ajoutez au moins une marque et une zone pour saisir les prix.</EmptyState></Card> : brands.map((b) => (
            <Card key={b.id} title={`${b.name} : prix de vente (MAD par bouteille)`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/60 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Produit</th>
                      {zones.map((z) => <th key={z.id} className="px-3 py-2.5 text-right font-semibold">{z.name}</th>)}
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortCats(b.categories).map((cat) => (
                      <tr key={cat}>
                        <td className="px-4 py-2 font-medium text-slate-900">{cat}</td>
                        {zones.map((z) => {
                          const v = priceOf(b.id, cat, z.id);
                          return <td key={z.id} className="px-3 py-2 text-right"><MoneyInput value={v} missing={v === undefined} label={`Prix ${b.name} ${cat} ${z.name}`} onSave={(p) => savePrice(b.id, cat, z.id, p)} /></td>;
                        })}
                        <td className="px-3 py-2 text-right">
                          {zones.length > 1 && <button type="button" onClick={() => copyFirstZone(b.id, cat)} className="whitespace-nowrap text-xs font-medium text-blue-600 hover:text-blue-700" title={`Copier le prix de ${zones[0].name} sur les autres zones`}>Copier partout</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'consigne' && (
        <div className="space-y-5">
          <p className="text-sm text-slate-600">
            <strong className="text-slate-900">Consigne</strong> : prix payé par le client qui achète la bouteille (il ne rend pas de vide).{' '}
            <strong className="text-slate-900">Commission</strong> : montant versé au chauffeur pour chaque bouteille vendue, repris dans les bulletins de paie.
          </p>
          {brands.length === 0 ? <Card><EmptyState>Ajoutez une marque pour définir la consigne et les commissions.</EmptyState></Card> : brands.map((b) => (
            <Card key={b.id} title={b.name}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/60 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Produit</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Consigne de la bouteille (MAD)</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Commission chauffeur (MAD / bouteille)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortCats(b.categories).map((cat) => {
                      const consigne = gplConfig?.consignationPrices?.[b.id]?.[cat];
                      const commission = commissions.find((c) => c.brandId === b.id && c.category === cat)?.rate;
                      return (
                        <tr key={cat}>
                          <td className="px-4 py-2 font-medium text-slate-900">{cat}</td>
                          <td className="px-4 py-2 text-right">
                            <MoneyInput value={consigne} missing={consigne === undefined} label={`Consigne ${b.name} ${cat}`}
                              onSave={(v) => updateGPLConfig({ consignationPrices: { ...gplConfig.consignationPrices, [b.id]: { ...(gplConfig.consignationPrices?.[b.id] || {}), [cat]: v } } })} />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <MoneyInput value={commission} step={0.05} missing={commission === undefined} label={`Commission ${b.name} ${cat}`}
                              onSave={(v) => setCommission({ id: `${b.id}-${cat}-comm`, brandId: b.id, category: cat, rate: v })} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'donnees' && (
        <Card title="Remettre les compteurs à zéro" subtitle="À utiliser seulement pour repartir d'une page blanche (par exemple après une période de test).">
          <div className="space-y-3 p-5 text-sm text-slate-700">
            <p><strong className="text-slate-900">Effacé :</strong> ventes, dépenses, pointages, positions des camions, chargements chauffeurs et comptoir, stock (remis à 0), commandes, caisses et bulletins de paie.</p>
            <p><strong className="text-slate-900">Conservé :</strong> clients, chauffeurs, convoyeurs, zones, marques, prix, consignes et commissions.</p>
            <button type="button" onClick={() => { setCode(''); setReset('code'); }} className="inline-flex h-9 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">Réinitialiser les données…</button>
          </div>
        </Card>
      )}

      {reset && (
        <Modal title="Réinitialisation des données" subtitle="Action définitive et irréversible" onClose={() => setReset(null)}
          footer={reset === 'code' ? (
            <>
              <button type="button" className={buttonSecondary} onClick={() => setReset(null)}>Annuler</button>
              <button type="button" className="inline-flex h-9 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                onClick={() => { if (code.trim().toLowerCase() === RESET_CODE) setReset('confirm'); else toast.error('Code de sécurité incorrect.'); }}>Suivant</button>
            </>
          ) : (
            <>
              <button type="button" className={buttonSecondary} onClick={() => setReset('code')}>Retour</button>
              <button type="button" className="inline-flex h-9 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                onClick={() => { resetData(); setReset(null); toast.success('Données réinitialisées : les compteurs sont à 0.'); }}>Oui, tout réinitialiser</button>
            </>
          )}>
          <div className="space-y-3 p-5 text-sm text-slate-700">
            {reset === 'code' ? (
              <>
                <p>Pour continuer, saisissez le code de sécurité : <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold uppercase text-slate-900">{RESET_CODE}</span></p>
                <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} aria-label="Code de sécurité" placeholder="Code de sécurité" className={`${inputClass} w-full`} />
              </>
            ) : (
              <p className="font-medium text-slate-900">Êtes-vous sûr de vouloir réinitialiser ? Les ventes, chargements de stock et soldes de caisse seront remis à zéro.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
