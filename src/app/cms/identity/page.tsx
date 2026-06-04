import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Image as ImageIcon, Save, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Brand {
  id: string;
  name: string;
  mascot_url: string;
  logo_url: string;
}

export default function IdentityManagerPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands');
      if (!response.ok) throw new Error('Erreur lors du chargement des marques');
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (brandId: string, type: 'mascot' | 'logo', file: File) => {
    if (!file) return;
    
    // Validate file size and type
    if (file.size > 2 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        setLoading(true);
        const response = await fetch(`/api/brands/${brandId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [type === 'mascot' ? 'mascot_url' : 'logo_url']: base64
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Erreur lors de la mise à jour');
        }
        
        setSuccess(`${type === 'mascot' ? 'Mascotte' : 'Logo'} mis à jour avec succès pour ${brands.find(b => b.id === brandId)?.name}`);
        await fetchBrands();
        
        setTimeout(() => setSuccess(null), 5000);
      } catch (err) {
        console.error("Update error:", err);
        setError(err instanceof Error ? err.message : 'Échec de la mise à jour');
        setTimeout(() => setError(null), 5000);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier");
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold">Chargement...</div>;

  return (
    <div className="max-w-5xl">
      <header className="mb-12">
        <Link to="/cms" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 mb-6 transition-colors font-display">
          <ArrowLeft className="w-4 h-4" />
          Retour au CMS
        </Link>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">Identité Visuelle</h1>
        <p className="text-slate-500 mt-2">Gérez les assets graphiques des marques officielles.</p>
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
          className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 font-bold text-sm"
        >
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {brands.map(brand => (
          <div key={brand.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                {brand.name}
              </h3>
            </div>
            
            <div className="p-8 space-y-10">
              {/* Mascot Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mascotte (Ours Bleu)</label>
                  <span className="text-[10px] font-bold text-blue-600">Recommandé: PNG transparent</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {brand.mascot_url ? (
                      <img src={brand.mascot_url} alt="Mascot" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <label className="cursor-pointer flex-1 group">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files && handleFileUpload(brand.id, 'mascot', e.target.files[0])}
                    />
                    <div className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-blue-600 group-hover:bg-blue-50 transition-all">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                      <span className="text-xs font-black text-slate-500 group-hover:text-blue-900 uppercase tracking-widest">Choisir un fichier</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Logo Section */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logo de la Marque</label>
                  <span className="text-[10px] font-bold text-blue-600">Recommandé: SVG ou PNG</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt="Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <label className="cursor-pointer flex-1 group">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files && handleFileUpload(brand.id, 'logo', e.target.files[0])}
                    />
                    <div className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-blue-600 group-hover:bg-blue-50 transition-all">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                      <span className="text-xs font-black text-slate-500 group-hover:text-blue-900 uppercase tracking-widest">Choisir un fichier</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
