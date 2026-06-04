import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Trash2, Edit2, X, Save, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string;
  category: string;
  date: string;
}

export default function CMSNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenModal = (item?: NewsItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        content: item.content,
        image_url: item.image_url,
        category: item.category,
        date: new Date(item.date).toISOString().split('T')[0]
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        content: '',
        image_url: '',
        category: 'Actualité',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 2) {
      alert("Fichier trop volumineux (max 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({ ...formData, image_url: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/news/${editingItem.id}` : '/api/news';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchNews();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error saving news:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) return;
    try {
      const response = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchNews();
      }
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Newspaper className="w-5 h-5 text-blue-600" />
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-500">CMS News</h1>
          </div>
          <h2 className="text-4xl font-black text-slate-900 font-display">Actualités & Événements</h2>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Publication
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 animate-pulse">
              <div className="aspect-video bg-slate-100 rounded-2xl mb-4" />
              <div className="h-6 bg-slate-100 rounded-lg w-3/4 mb-2" />
              <div className="h-4 bg-slate-100 rounded-lg w-full mb-1" />
              <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {news.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-slate-900 border border-white/20">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">
                    {new Date(item.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                    {item.content}
                  </p>
                  
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Edit/Create */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingItem ? 'Modifier l\'actualité' : 'Nouvelle actualité'}
                  </h3>
                  <p className="text-sm text-slate-500">Configurez les détails de votre publication</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Titre</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                      placeholder="Ex: Inauguration du nouveau terminal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Catégorie</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                      >
                        <option value="Actualité">Actualité</option>
                        <option value="Événement">Événement</option>
                        <option value="Projet">Projet</option>
                        <option value="Presse">Presse</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Date</label>
                      <input
                        required
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Contenu</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium resize-none"
                      placeholder="Décrivez l'actualité ou l'événement en détail..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Image de couverture</label>
                    <div className="grid grid-cols-[1fr,2fr] gap-4 items-start">
                      <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative">
                        {formData.image_url ? (
                          <img src={formData.image_url} alt="Aperçu" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-xs"
                          placeholder="Ou entrez l'URL de l'image"
                        />
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                          Format recommandé : PNG, JPG ou WEBP. <br />
                          Taille max : 2MB. Ratio 16:9 recommandé.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  {editingItem ? 'Mettre à jour' : 'Publier'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
