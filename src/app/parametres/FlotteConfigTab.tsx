import { useState } from 'react';
import { useVehiculeStore } from '../../stores/useVehiculeStore';
import { useVidangeStore } from '../../stores/useVidangeStore';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { nanoid } from 'nanoid';

export function FlotteConfigTab() {
  const { parcs, addParc, updateParc, deleteParc } = useVehiculeStore();
  const { oilTypes, addOilType, updateOilType, deleteOilType } = useVidangeStore();

  const [newParc, setNewParc] = useState('');
  const [editingParcId, setEditingParcId] = useState<string | null>(null);
  const [editingParcName, setEditingParcName] = useState('');

  const [newOilName, setNewOilName] = useState('');
  const [newOilInterval, setNewOilInterval] = useState('');
  
  const [editingOilId, setEditingOilId] = useState<string | null>(null);
  const [editingOilName, setEditingOilName] = useState('');
  const [editingOilInterval, setEditingOilInterval] = useState('');

  const handleAddParc = () => {
    if (newParc.trim()) {
      addParc(newParc.trim());
      setNewParc('');
    }
  };

  const handleAddOil = () => {
    if (newOilName.trim() && newOilInterval) {
      addOilType({ name: newOilName.trim(), intervalKm: Number(newOilInterval) });
      setNewOilName('');
      setNewOilInterval('');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Configuration des Parcs */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-text-primary mb-4">Parcs d'Affectation</h3>
        <p className="text-sm text-text-secondary mb-4">Gérez les parcs auxquels vos véhicules peuvent être affectés.</p>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Nouveau parc (ex: Agadir Nord)" 
            value={newParc}
            onChange={(e) => setNewParc(e.target.value)}
            className="flex-1 h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
          />
          <button 
            onClick={handleAddParc}
            className="px-4 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {parcs.map(parc => (
            <div key={parc.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border">
              {editingParcId === parc.id ? (
                <div className="flex-1 flex gap-2 mr-2">
                  <input 
                    type="text" 
                    value={editingParcName}
                    onChange={(e) => setEditingParcName(e.target.value)}
                    className="flex-1 h-9 px-3 rounded text-sm border border-border outline-none focus:border-primary"
                  />
                  <button onClick={() => { updateParc(parc.id, editingParcName); setEditingParcId(null); }} className="p-1.5 bg-success/10 text-success rounded">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingParcId(null)} className="p-1.5 bg-danger/10 text-danger rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className="font-medium text-text-primary">{parc.name}</span>
              )}
              
              {!editingParcId && (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingParcId(parc.id); setEditingParcName(parc.name); }} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteParc(parc.id)} className="p-1.5 text-text-muted hover:text-danger transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {parcs.length === 0 && <p className="text-sm text-text-muted">Aucun parc configuré.</p>}
        </div>
      </div>

      {/* Configuration des Types d'Huile */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-text-primary mb-4">Types d'Huile</h3>
        <p className="text-sm text-text-secondary mb-4">Définissez les types d'huile de vidange et l'intervalle kilométrique recommandé pour chacun.</p>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Type d'huile (ex: 5W-40)" 
            value={newOilName}
            onChange={(e) => setNewOilName(e.target.value)}
            className="flex-1 h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
          />
          <input 
            type="number" 
            placeholder="Intervalle (km)" 
            value={newOilInterval}
            onChange={(e) => setNewOilInterval(e.target.value)}
            className="w-32 h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
          />
          <button 
            onClick={handleAddOil}
            className="px-4 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {oilTypes.map(oil => (
            <div key={oil.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border">
              {editingOilId === oil.id ? (
                <div className="flex-1 flex gap-2 mr-2">
                  <input 
                    type="text" 
                    value={editingOilName}
                    onChange={(e) => setEditingOilName(e.target.value)}
                    className="flex-1 h-9 px-3 rounded text-sm border border-border outline-none focus:border-primary"
                  />
                  <input 
                    type="number" 
                    value={editingOilInterval}
                    onChange={(e) => setEditingOilInterval(e.target.value)}
                    className="w-24 h-9 px-3 rounded text-sm border border-border outline-none focus:border-primary"
                  />
                  <button onClick={() => { updateOilType(oil.id, { name: editingOilName, intervalKm: Number(editingOilInterval) }); setEditingOilId(null); }} className="p-1.5 bg-success/10 text-success rounded">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingOilId(null)} className="p-1.5 bg-danger/10 text-danger rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex justify-between pr-4">
                  <span className="font-medium text-text-primary">{oil.name}</span>
                  <span className="text-sm text-text-secondary bg-surface border border-border px-2 py-0.5 rounded shadow-sm">{oil.intervalKm.toLocaleString()} km</span>
                </div>
              )}
              
              {!editingOilId && (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingOilId(oil.id); setEditingOilName(oil.name); setEditingOilInterval(String(oil.intervalKm)); }} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteOilType(oil.id)} className="p-1.5 text-text-muted hover:text-danger transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {oilTypes.length === 0 && <p className="text-sm text-text-muted">Aucun type d'huile configuré.</p>}
        </div>
      </div>
    </div>
  );
}
