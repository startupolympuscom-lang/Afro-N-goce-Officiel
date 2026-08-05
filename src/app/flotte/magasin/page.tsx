import React, { useState, useMemo } from 'react';
import { useMagasinStore, MagasinItemType } from '../../../stores/useMagasinStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { usePrestataireStore } from '../../../stores/usePrestataireStore';
import { Package, Plus, Search, Filter, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MagasinPage() {
  const { items, addItem, updateItem, deleteItem, addStock } = useMagasinStore();
  const fournisseurs = usePrestataireStore(s => s.prestataires);
  const user = useAuthStore(s => s.user);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isStockDrawerOpen, setIsStockDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MagasinItemType | ''>('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<MagasinItemType>('piece_rechange');
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState('');
  const [reference, setReference] = useState('');

  // Stock Form State
  const [stockItemId, setStockItemId] = useState('');
  const [stockQty, setStockQty] = useState(1);
  const [stockReason, setStockReason] = useState('Nouvel arrivage');

  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setType('piece_rechange');
    setQuantity(0);
    setUnitPrice('');
    setSupplierId('');
    setReference('');
  };

  const openAddForm = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const openEditForm = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setType(item.type);
    setQuantity(item.quantity);
    setUnitPrice(item.unitPrice);
    setSupplierId(item.supplierId || '');
    setReference(item.reference || '');
    setIsDrawerOpen(true);
  };
  
  const openStockForm = (item: any) => {
    setStockItemId(item.id);
    setStockQty(1);
    setStockReason('Nouvel arrivage');
    setIsStockDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      type,
      quantity,
      unitPrice: Number(unitPrice),
      supplierId: supplierId || undefined,
      reference: reference || undefined,
    };

    if (editingId) {
      updateItem(editingId, data);
    } else {
      addItem(data);
    }
    
    setIsDrawerOpen(false);
    resetForm();
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockItemId && stockQty > 0) {
      addStock(stockItemId, stockQty, stockReason);
    }
    setIsStockDrawerOpen(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (typeFilter && item.type !== typeFilter) return false;
      const searchStr = search.toLowerCase();
      if (search && !item.name.toLowerCase().includes(searchStr) && !item.reference?.toLowerCase().includes(searchStr)) {
        return false;
      }
      return true;
    });
  }, [items, search, typeFilter]);

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Magasin & Stock
          </h1>
          <p className="text-text-secondary mt-1">Gestion de l'inventaire des pièces et consommables</p>
        </div>
        
        <div className="flex items-center gap-3">
          {canManage && (
            <button 
              onClick={openAddForm}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvel Article</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-surface-50 rounded-t-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Rechercher une pièce, réf..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="h-11 pl-9 pr-8 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium appearance-none"
              >
                <option value="">Tous les types</option>
                <option value="filtre_air">Filtre à air</option>
                <option value="filtre_gasoil">Filtre à gasoil</option>
                <option value="filtre_huile">Filtre à huile</option>
                <option value="filtre_habitacle">Filtre habitacle</option>
                <option value="huile">Huile moteur/frein</option>
                <option value="pneu">Pneu</option>
                <option value="piece_rechange">Pièce de rechange</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 text-text-secondary uppercase text-xs font-bold tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4">Article</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Prix Unitaire</th>
                <th className="px-6 py-4">Fournisseur</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                    <Package className="w-12 h-12 mx-auto text-border-strong mb-4" />
                    <p className="text-lg font-medium text-text-primary">Aucun article trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const supplier = fournisseurs.find(f => f.id === item.supplierId);
                  const isLowStock = item.quantity <= 2;
                  
                  return (
                    <tr key={item.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-primary">{item.name}</div>
                        {item.reference && <div className="text-text-muted text-xs">Réf: {item.reference}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-surface-2 rounded-md text-text-secondary text-xs font-medium capitalize">
                          {item.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-bold ${isLowStock ? 'text-danger' : 'text-success'} flex items-center gap-1.5`}>
                          {item.quantity} unités
                          {isLowStock && <AlertTriangle className="w-4 h-4" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-text-primary">
                        {item.unitPrice.toLocaleString()} MAD
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {supplier?.nom || '-'}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openStockForm(item)}
                              className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Ajouter au stock"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                             <button
                              onClick={() => openEditForm(item)}
                              className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Supprimer cet article ?')) deleteItem(item.id);
                              }}
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
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  {editingId ? 'Modifier Article' : 'Nouvel Article'}
                </h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary rounded-md"
                >✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSave} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom de la pièce</label>
                    <input 
                      required value={name} onChange={e => setName(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border bg-surface outline-none focus:border-primary" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Référence (Optionnel)</label>
                    <input 
                      value={reference} onChange={e => setReference(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border bg-surface outline-none focus:border-primary" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select 
                      required value={type} onChange={e => setType(e.target.value as any)}
                      className="w-full h-11 px-4 rounded-lg border bg-surface outline-none focus:border-primary"
                    >
                      <option value="piece_rechange">Pièce de rechange</option>
                      <option value="filtre_air">Filtre à air</option>
                      <option value="filtre_gasoil">Filtre à gasoil</option>
                      <option value="filtre_huile">Filtre à huile</option>
                      <option value="filtre_habitacle">Filtre habitacle</option>
                      <option value="huile">Huile</option>
                      <option value="pneu">Pneu</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  {!editingId && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantité Initiale</label>
                      <input 
                        type="number" required min="0" value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                        className="w-full h-11 px-4 rounded-lg border bg-surface outline-none focus:border-primary" 
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Prix Unitaire (MAD)</label>
                    <input 
                      type="number" required min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))}
                      className="w-full h-11 px-4 rounded-lg border bg-surface outline-none focus:border-primary" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fournisseur</label>
                    <select 
                      value={supplierId} onChange={e => setSupplierId(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border bg-surface outline-none focus:border-primary"
                    >
                      <option value="">Sélectionner un fournisseur...</option>
                      {fournisseurs.map(f => (
                        <option key={f.id} value={f.id}>{f.nom}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-6 border-t flex gap-3">
                    <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex-1 px-4 py-3 border rounded-xl font-bold">Annuler</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover">Enregistrer</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stock Drawer */}
      <AnimatePresence>
        {isStockDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsStockDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface shadow-2xl z-50 flex flex-col border-l border-border"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Entrée en Stock</h2>
                <button onClick={() => setIsStockDrawerOpen(false)}>✕</button>
              </div>
              <div className="p-6">
                <form onSubmit={handleAddStock} className="space-y-4">
                  <div>
                    <label className="block font-medium mb-1">Quantité à ajouter</label>
                    <input type="number" min="1" required value={stockQty} onChange={e=>setStockQty(Number(e.target.value))} className="w-full h-11 px-4 rounded border bg-surface focus:border-primary" />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Motif / Facture</label>
                    <input required value={stockReason} onChange={e=>setStockReason(e.target.value)} className="w-full h-11 px-4 rounded border bg-surface focus:border-primary" />
                  </div>
                  <button type="submit" className="w-full bg-success text-white py-3 rounded-lg font-bold">Ajouter</button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
