import React, { useState } from 'react';
import { motion } from 'motion/react';
import { History, Plus, Edit2, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';
import { useLandingStore, HistoryMilestone } from '../../../stores/useLandingStore';

export default function CMSHistoryPage() {
  const { milestones, addMilestone, updateMilestone, removeMilestone } = useLandingStore();
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<HistoryMilestone>>({});

  const handleEdit = (milestone: HistoryMilestone) => {
    setIsEditing(milestone.id);
    setFormData(milestone);
  };

  const handleAddNew = () => {
    const newId = `m${Date.now()}`;
    const newMilestone = {
      id: newId,
      year: new Date().getFullYear().toString(),
      title: 'Nouvel Événement',
      description: 'Description de l\'événement',
    };
    addMilestone(newMilestone);
    setIsEditing(newId);
    setFormData(newMilestone);
  };

  const handleSave = () => {
    if (isEditing) {
      updateMilestone(isEditing, formData);
    }
    setIsEditing(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet événement ?')) {
      removeMilestone(id);
      if (isEditing === id) {
        setIsEditing(null);
        setFormData({});
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="w-5 h-5 text-blue-600" />
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-500">CMS</h1>
          </div>
          <h2 className="text-4xl font-black text-slate-900 font-display">Notre Histoire</h2>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          Ajouter une période
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Liste des Evénements */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 mb-4 px-1">Frise Chronologique</h3>
          {milestones.sort((a, b) => parseInt(a.year) - parseInt(b.year)).map((m) => (
            <div 
              key={m.id} 
              className={`p-6 bg-white border rounded-2xl transition-all ${
                isEditing === m.id ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm mb-3">
                    {m.year}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{m.title}</h4>
                  <p className="text-slate-500 text-sm line-clamp-2">{m.description}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(m)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(m.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Formulaire d'édition */}
        <div className="sticky top-8">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Modifier l'événement</h3>
                <button 
                  onClick={() => setIsEditing(null)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Année</label>
                  <input
                    type="text"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Titre</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Image</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                  {formData.image && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video relative group">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setFormData({ ...formData, image: undefined })}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white text-rose-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer l'image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 text-slate-400">
              <Edit2 className="w-8 h-8 mb-4 opacity-50" />
              <p className="text-sm font-medium">Sélectionnez un événement pour le modifier</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
