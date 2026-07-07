import React from 'react';
import { useLandingStore } from '../../stores/useLandingStore';
import { Save, Upload, Image as ImageIcon, Trash2, Plus } from 'lucide-react';

export function SiteWebTab() {
  const { 
    heroImage, setHeroImage, 
    partnerLogos, addPartnerLogo, removePartnerLogo, updatePartnerLogoName,
    historyImages, addHistoryImage, removeHistoryImage,
    productImages, addProductImage, updateProductImage, removeProductImage
  } = useLandingStore();
  
  const PREDEFINED_PRODUCTS = [
    { id: 'butane-3', name: 'Butane 3KG', brand: 'Butagaz', defaultUrl: 'https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_2.png' },
    { id: 'butane-12', name: 'Butane 12KG', brand: 'Butagaz', defaultUrl: 'https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_1.png' },
    { id: 'propane-34', name: 'Propane 34KG', brand: 'Butagaz', defaultUrl: 'https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_0.png' },
    { id: 'oxygene-ind', name: 'Oxygène Industriel', brand: 'Air Liquide', defaultUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800' },
    { id: 'azote-ind', name: 'Azote Industriel', brand: 'Air Liquide', defaultUrl: 'https://images.unsplash.com/photo-1532187875302-1df92d47ed17?auto=format&fit=crop&q=80&w=800' },
    { id: 'argon-ind', name: 'Argon Pur', brand: 'Air Liquide', defaultUrl: 'https://images.unsplash.com/photo-1544725121-be3b5088f171?auto=format&fit=crop&q=80&w=800' },
    { id: 'co2-ind', name: 'Dioxyde de Carbone', brand: 'Air Liquide', defaultUrl: 'https://images.unsplash.com/photo-1581093458622-0f45391e3e7e?auto=format&fit=crop&q=80&w=800' },
    { id: 'aligal-1', name: 'ALIGAL™ 1', brand: 'Air Liquide', defaultUrl: 'https://images.unsplash.com/photo-1543253687-c934c2e01861?auto=format&fit=crop&q=80&w=800' },
    { id: 'aligal-2', name: 'ALIGAL™ 2', brand: 'Air Liquide', defaultUrl: 'https://images.unsplash.com/photo-1627483262769-04d4a11bf333?auto=format&fit=crop&q=80&w=800' }
  ];

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>, productInfo: typeof PREDEFINED_PRODUCTS[0]) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const existing = productImages.find(p => p.id === productInfo.id);
        if (existing) {
          updateProductImage(productInfo.id, { url: reader.result as string });
        } else {
          addProductImage({
            id: productInfo.id,
            brand: productInfo.brand as 'Butagaz' | 'Air Liquide',
            url: reader.result as string,
            title: productInfo.name
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSingleUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        addPartnerLogo({
          id: Date.now().toString(),
          url: reader.result as string,
          name: 'Nouveau Partenaire'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHistoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        addHistoryImage({
          id: Date.now().toString(),
          url: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-2">Personnalisation du Site Web</h3>
        <p className="text-text-secondary mb-6">Modifiez les images et logos affichés sur la page d'accueil et la page histoire. Les images sont sauvegardées dans la base de données.</p>
        
        <div className="space-y-8">
          {/* Hero Image */}
          <div className="p-6 border border-border rounded-xl bg-surface-2/30">
            <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Image de Couverture (Hero)
            </h4>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-full sm:w-1/2 aspect-video bg-surface border border-border rounded-lg overflow-hidden flex items-center justify-center relative">
                {heroImage ? (
                  <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-text-muted text-sm">Aucune image personnalisée</span>
                )}
              </div>
              <div className="flex-1 w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-surface-2 hover:border-primary transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-text-muted mb-2" />
                    <p className="text-sm text-text-secondary"><span className="font-semibold text-primary">Cliquez pour uploader</span></p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSingleUpload(e, setHeroImage)} />
                </label>
                <button 
                  onClick={() => setHeroImage('')}
                  className="mt-3 text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Réinitialiser l'image par défaut
                </button>
              </div>
            </div>
          </div>

          {/* Partner Logos */}
          <div className="p-6 border border-border rounded-xl bg-surface-2/30">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-text-primary flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Logos des Partenaires
              </h4>
              <label className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer text-sm">
                <Plus className="w-4 h-4" />
                Ajouter un logo
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            
            {partnerLogos.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-text-muted text-sm">
                Aucun logo personnalisé. Les logos par défaut seront affichés.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {partnerLogos.map((logo) => (
                  <div key={logo.id} className="flex items-center gap-4 p-3 border border-border rounded-lg bg-surface">
                    <div className="w-16 h-16 bg-white border border-border rounded flex items-center justify-center p-2 shrink-0">
                      <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={logo.name}
                        onChange={(e) => updatePartnerLogoName(logo.id, e.target.value)}
                        className="w-full text-sm px-2 py-1 border border-border rounded bg-surface focus:ring-1 focus:ring-primary outline-none"
                        placeholder="Nom du partenaire"
                      />
                    </div>
                    <button 
                      onClick={() => removePartnerLogo(logo.id)}
                      className="p-2 text-text-muted hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History Images */}
          <div className="p-6 border border-border rounded-xl bg-surface-2/30">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-text-primary flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Images "Notre Histoire"
              </h4>
              <label className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer text-sm">
                <Plus className="w-4 h-4" />
                Ajouter une image
                <input type="file" className="hidden" accept="image/*" onChange={handleHistoryImageUpload} />
              </label>
            </div>
            
            {historyImages.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-text-muted text-sm">
                Aucune image pour la page histoire.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {historyImages.map((img) => (
                  <div key={img.id} className="relative group aspect-video rounded-lg overflow-hidden border border-border">
                    <img src={img.url} alt="Histoire" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => removeHistoryImage(img.id)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Images */}
          <div className="p-6 border border-border rounded-xl bg-surface-2/30">
            <div className="mb-6">
              <h4 className="font-bold text-text-primary flex items-center gap-2 mb-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Images des Produits (Butagaz & Air Liquide)
              </h4>
              <p className="text-sm text-text-secondary">
                Personnalisez les images affichées pour chaque produit sur la page d'accueil.
              </p>
            </div>
            
            <div className="space-y-8">
              {['Butagaz', 'Air Liquide'].map(brand => (
                <div key={brand}>
                  <h5 className="font-bold text-text-primary mb-4 pb-2 border-b border-border">{brand}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PREDEFINED_PRODUCTS.filter(p => p.brand === brand).map((product) => {
                      const customImage = productImages.find(p => p.id === product.id);
                      const currentUrl = customImage ? customImage.url : product.defaultUrl;
                      
                      return (
                        <div key={product.id} className="border border-border rounded-lg bg-surface overflow-hidden flex flex-col">
                          <div className="aspect-[4/3] bg-surface-2 relative group">
                            <img src={currentUrl} alt={product.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <label className="p-2 bg-white text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shadow-lg" title="Mettre à jour l'image">
                                <Upload className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProductImageUpload(e, product)} />
                              </label>
                              {customImage && (
                                <button 
                                  onClick={() => removeProductImage(product.id)}
                                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                  title="Réinitialiser"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="p-3 border-t border-border">
                            <div className="text-sm font-bold text-text-primary">{product.name}</div>
                            <div className="text-xs text-text-secondary mt-1">
                              {customImage ? <span className="text-green-500 font-medium">Image personnalisée</span> : <span>Image par défaut</span>}
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

        </div>
      </div>
    </div>
  );
}
