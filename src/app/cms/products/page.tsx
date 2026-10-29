import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, Image as ImageIcon, Save, CheckCircle2, ArrowLeft, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLandingStore } from '../../../stores/useLandingStore';

export default function CMSProductsPage() {
  const { productImages, addProductImage, removeProductImage } = useLandingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Lists of product IDs
  const butagazIds = ['butane-3', 'butane-12', 'propane-34'];
  const airLiquideIds = ['oxygene-ind', 'azote-ind', 'argon-ind', 'co2-ind', 'aligal-1', 'aligal-2', 'o2-med', 'n2o-med'];

  const allProductOptions = [
    { id: 'butane-3', name: 'Butane 3KG (Butagaz)', brand: 'Butagaz' as const },
    { id: 'butane-12', name: 'Butane 12KG (Butagaz)', brand: 'Butagaz' as const },
    { id: 'propane-34', name: 'Propane 34KG (Butagaz)', brand: 'Butagaz' as const },
    { id: 'oxygene-ind', name: 'Oxygène Industriel (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'azote-ind', name: 'Azote Industriel (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'argon-ind', name: 'Argon Pur (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'co2-ind', name: 'Dioxyde de Carbone (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'aligal-1', name: 'ALIGAL™ 1 (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'aligal-2', name: 'ALIGAL™ 2 (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'o2-med', name: 'Oxygène Médical (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'n2o-med', name: 'Protoxyde d\'Azote (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'arcal-prime', name: 'ARCAL™ Prime (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'arcal-chrome', name: 'ARCAL™ Chrome (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'arcal-speed', name: 'ARCAL™ Speed (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'arcal-force', name: 'ARCAL™ Force (Air Liquide)', brand: 'Air Liquide' as const },
    { id: 'solaire-principal', name: 'Visuel principal (section solaire)', brand: 'Solaire' as const },
    { id: 'solaire-industrie', name: 'Secteur : sites industriels', brand: 'Solaire' as const },
    { id: 'solaire-agriculture', name: 'Secteur : agriculture', brand: 'Solaire' as const },
    { id: 'solaire-habitat', name: 'Secteur : habitat', brand: 'Solaire' as const },
  ];

  const imageGroups = [
    { brand: 'Butagaz' as const, title: 'Butagaz', hint: '' },
    { brand: 'Air Liquide' as const, title: 'Air Liquide', hint: '' },
    { brand: 'Solaire' as const, title: 'Énergie solaire', hint: "Sans photo, la page d'accueil affiche les illustrations AFRO Négoce. Format paysage conseillé." },
  ];

  const handleFileUpload = (productId: string, file: File) => {
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 2MB)");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const option = allProductOptions.find(o => o.id === productId);
      
      if (option) {
        // If image for this product exists, remove it first
        const exists = productImages.find(p => p.id === productId);
        if (exists) {
          removeProductImage(productId);
        }
        
        addProductImage({
          id: productId,
          brand: option.brand,
          url: base64,
          title: option.name
        });
        
        setSuccess(`Image mise à jour pour ${option.name}`);
        setTimeout(() => setSuccess(null), 3000);
      }
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-5xl">
      <header className="mb-12">
        <Link to="/cms" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 mb-6 transition-colors font-display">
          <ArrowLeft className="w-4 h-4" />
          Retour au CMS
        </Link>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">Images des Produits</h1>
        <p className="text-slate-500 mt-2">Gérez les images affichées pour les gammes Butagaz et Air Liquide et la section énergie solaire.</p>
      </header>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm"
        >
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 font-bold text-sm"
        >
          <CheckCircle2 className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {imageGroups.map(group => (
          <div key={group.brand} className={`bg-white rounded-3xl p-8 border border-slate-200 ${group.brand === 'Solaire' ? 'md:col-span-2' : ''}`}>
            <h2 className="text-2xl font-black text-slate-900 mb-6 font-display">{group.title}</h2>
            {group.hint && <p className="-mt-4 mb-6 text-sm text-slate-500">{group.hint}</p>}
            <div className={group.brand === 'Solaire' ? 'grid gap-6 md:grid-cols-2' : 'space-y-6'}>
              {allProductOptions.filter(p => p.brand === group.brand).map(product => {
                const currentImage = productImages.find(img => img.id === product.id);
                return (
                  <div key={product.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 relative group">
                    <h3 className="font-bold text-slate-900 mb-3">{product.name}</h3>
                    <div className="flex gap-4 items-start">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center relative">
                        {currentImage ? (
                          <img src={currentImage.url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-bold">
                          <Upload className="w-4 h-4" />
                          Choisir une image
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(product.id, e.target.files[0]);
                            }}
                          />
                        </label>
                        <p className="text-xs text-slate-400 mt-2">Max 2MB. Format PNG/JPG.</p>
                    
                        {currentImage && (
                          <button 
                            onClick={() => removeProductImage(product.id)}
                            className="mt-3 text-xs text-red-500 font-bold flex items-center gap-1 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                            Supprimer l'image (utilisera l'image par défaut)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
