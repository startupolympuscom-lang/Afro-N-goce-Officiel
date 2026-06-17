import React, { useState } from 'react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function DispatchSettingsPage() {
  const { 
    brands, addBrand, deleteBrand,
    zones, addZone, deleteZone,
    prices, setPrice,
    commissions, setCommission,
    gplConfig, updateGPLConfig,
    resetData
  } = useDispatchGazStore();

  const handleConsignationChange = (brandId: string, category: string, value: string) => {
    const price = parseFloat(value);
    if (!isNaN(price)) {
      const newPrices = { ...gplConfig.consignationPrices };
      if (!newPrices[brandId]) {
        newPrices[brandId] = {};
      }
      newPrices[brandId][category] = price;
      updateGPLConfig({ consignationPrices: newPrices });
    }
  };

  const getConsignationPrice = (brandId: string, category: string) => {
    return gplConfig?.consignationPrices?.[brandId]?.[category] ?? '';
  };

  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCategories, setNewBrandCategories] = useState('');
  const [newZoneName, setNewZoneName] = useState('');

  // Security reset states
  const [showResetModal, setShowResetModal] = useState(false);
  const [securityCodeInput, setSecurityCodeInput] = useState('');
  const [confirmStepVisible, setConfirmStepVisible] = useState(false);

  const handleImageUpload = (brandId: string, category: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64String = canvas.toDataURL('image/webp', 0.8);
          
          const brand = brands.find(b => b.id === brandId);
          if (brand) {
            useDispatchGazStore.getState().updateBrand(brandId, {
              productImages: {
                ...(brand.productImages || {}),
                [category]: base64String
              }
            });
            toast.success(`Image ajoutée pour ${brand.name} - ${category}`);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBrandName && newBrandCategories) {
      addBrand({
        id: Date.now().toString(),
        name: newBrandName,
        categories: newBrandCategories.split(',').map(c => c.trim()).filter(c => c)
      });
      setNewBrandName('');
      setNewBrandCategories('');
    }
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (newZoneName) {
      addZone({
        id: Date.now().toString(),
        name: newZoneName
      });
      setNewZoneName('');
    }
  };

  const handlePriceChange = (brandId: string, category: string, zoneId: string, value: string) => {
    const price = parseFloat(value);
    if (!isNaN(price)) {
      setPrice({
        id: `${brandId}-${category}-${zoneId}`,
        brandId,
        category,
        zoneId,
        price
      });
    }
  };

  const getPrice = (brandId: string, category: string, zoneId: string) => {
    const p = prices.find(p => p.brandId === brandId && p.category === category && p.zoneId === zoneId);
    return p ? p.price : '';
  };

  const handleCommissionChange = (brandId: string, category: string, value: string) => {
    const rate = parseFloat(value);
    if (!isNaN(rate)) {
      setCommission({
        id: `${brandId}-${category}-comm`,
        brandId,
        category,
        rate
      });
    }
  };

  const getCommission = (brandId: string, category: string) => {
    const c = commissions.find(c => c.brandId === brandId && c.category === category);
    return c ? c.rate : '';
  };


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Paramètres GPL</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brands & Categories */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Marques et Catégories</h2>
          
          <form onSubmit={handleAddBrand} className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Nom de la marque</label>
              <input type="text" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="ex: Butagaz" className="w-full px-4 py-3 sm:py-2 border border-slate-300 rounded-xl sm:rounded-lg text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Catégories (séparées par virgule)</label>
              <input type="text" value={newBrandCategories} onChange={e => setNewBrandCategories(e.target.value)} placeholder="ex: 3Kg, 12Kg, 34Kg" className="w-full px-4 py-3 sm:py-2 border border-slate-300 rounded-xl sm:rounded-lg text-sm" />
            </div>
            <button type="submit" className="bg-blue-600 text-white p-3 sm:p-2 rounded-xl sm:rounded-lg hover:bg-blue-700 flex justify-center mt-2 sm:mt-0">
              <Plus className="w-5 h-5 sm:w-5 sm:h-5" />
              <span className="ml-2 font-bold sm:hidden">Ajouter Marque</span>
            </button>
          </form>

          <div className="space-y-4">
            {brands.map(brand => (
              <div key={brand.id} className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-lg uppercase tracking-wide">{brand.name}</p>
                  <button onClick={() => deleteBrand(brand.id)} className="text-red-500 p-2 hover:bg-red-100 rounded-lg transition-colors" title="Supprimer la marque">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-100">
                  {brand.categories.map(cat => (
                    <div key={cat} className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200">
                      <p className="text-sm font-bold text-slate-700 mb-3">{cat}</p>
                      {brand.productImages?.[cat] ? (
                        <div className="relative group flex items-center justify-center">
                          <img src={brand.productImages[cat]} alt={cat} className="w-16 h-16 object-contain" />
                          <button 
                            title="Changer l'image"
                            className="absolute -top-2 -right-2 bg-slate-800 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => document.getElementById(`img-upload-${brand.id}-${cat}`)?.click()}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => document.getElementById(`img-upload-${brand.id}-${cat}`)?.click()}
                          className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-slate-400 hover:text-blue-500"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      )}
                      <input 
                        type="file" 
                        id={`img-upload-${brand.id}-${cat}`}
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(brand.id, cat, file);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zones */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Zones de Tarification</h2>
          
          <form onSubmit={handleAddZone} className="mb-6 flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Nom de la zone</label>
              <input type="text" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="ex: Zone 0" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" />
            </button>
          </form>

          <div className="space-y-3">
            {zones.map(zone => (
              <div key={zone.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-900">{zone.name}</p>
                <button onClick={() => deleteZone(zone.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Grille Tarifaire (MAD)</h2>
        
        {brands.length > 0 && zones.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 font-medium text-slate-600">Marque</th>
                <th className="p-3 font-medium text-slate-600">Catégorie</th>
                {zones.map(zone => (
                  <th key={zone.id} className="p-3 font-medium text-slate-600">{zone.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brands.map(brand => (
                brand.categories.map((cat, idx) => (
                  <tr key={`${brand.id}-${cat}`} className="border-b border-slate-100 hover:bg-slate-50">
                    {idx === 0 && (
                      <td className="p-3 font-bold text-slate-900" rowSpan={brand.categories.length}>
                        {brand.name}
                      </td>
                    )}
                    <td className="p-3 text-slate-700">{cat}</td>
                    {zones.map(zone => (
                      <td key={zone.id} className="p-3">
                        <input 
                          type="number" 
                          value={getPrice(brand.id, cat, zone.id)}
                          onChange={(e) => handlePriceChange(brand.id, cat, zone.id, e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
                          placeholder="Prix"
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-sm">Ajoutez au moins une marque et une zone pour définir les prix.</p>
        )}
      </div>

      {/* Commission Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Commissions par Catégorie (MAD)</h2>
        
        {brands.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 font-medium text-slate-600">Marque</th>
                <th className="p-3 font-medium text-slate-600">Catégorie</th>
                <th className="p-3 font-medium text-slate-600">Commission (DHS)</th>
              </tr>
            </thead>
            <tbody>
              {brands.map(brand => (
                brand.categories.map((cat, idx) => (
                  <tr key={`${brand.id}-${cat}-comm`} className="border-b border-slate-100 hover:bg-slate-50">
                    {idx === 0 && (
                      <td className="p-3 font-bold text-slate-900" rowSpan={brand.categories.length}>
                        {brand.name}
                      </td>
                    )}
                    <td className="p-3 text-slate-700">{cat}</td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        step="0.01"
                        value={getCommission(brand.id, cat)}
                        onChange={(e) => handleCommissionChange(brand.id, cat, e.target.value)}
                        className="w-32 px-2 py-1 border border-slate-300 rounded text-sm"
                        placeholder="Commission"
                      />
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-sm">Ajoutez au moins une marque pour définir les commissions.</p>
        )}
      </div>
      {/* Consignation Prices Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Prix de Consignation des Bouteilles (MAD)</h2>
        
        {brands.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 font-medium text-slate-600">Marque</th>
                <th className="p-3 font-medium text-slate-600">Catégorie</th>
                <th className="p-3 font-medium text-slate-600">Prix Consigne (DHS)</th>
              </tr>
            </thead>
            <tbody>
              {brands.map(brand => (
                brand.categories.map((cat, idx) => (
                  <tr key={`${brand.id}-${cat}-cons`} className="border-b border-slate-100 hover:bg-slate-50">
                    {idx === 0 && (
                      <td className="p-3 font-bold text-slate-900" rowSpan={brand.categories.length}>
                        {brand.name}
                      </td>
                    )}
                    <td className="p-3 text-slate-700">{cat}</td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        value={getConsignationPrice(brand.id, cat)}
                        onChange={(e) => handleConsignationChange(brand.id, cat, e.target.value)}
                        className="w-32 px-2 py-1 border border-slate-300 rounded text-sm"
                        placeholder="Prix Consigne"
                      />
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-sm">Ajoutez au moins une marque pour définir les prix de consignation.</p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 p-6 rounded-2xl border border-red-200 shadow-sm">
        <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          Zone Dangereuse : Réinitialisation
        </h2>
        <p className="text-red-700 text-sm mb-4 bg-white/55 p-4 rounded-xl border border-red-100/50">
          Cette action permet de rendre de compte a rebour a 0, comme si ni achat ni vente n'a été fait dans afro dispatch. 
          Elle effacera : les ventes, dépenses, pointages, localisations des camions, dispatch de stock (y compris comptoir), 
          stock global (remis à 0), commandes, caisses et fiches de paies. 
          <br /><br />
          Les listes de clients, chauffeurs, convoyeurs, zones, marques, prix et commissions seront conservées.
        </p>
        <button 
          onClick={() => {
            setSecurityCodeInput('');
            setConfirmStepVisible(false);
            setShowResetModal(true);
          }}
          className="bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-red-200 uppercase text-xs tracking-wider"
        >
          Remettre à zèro les données
        </button>
      </div>

      {/* Security reset flow pop up modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header banner */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white text-center relative">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 text-white">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Réinitialisation Sécurisée</h3>
              <p className="text-red-100 text-xs mt-1">Vérification de sécurité requise</p>
            </div>

            {/* Step 1: Input Code */}
            {!confirmStepVisible && (
              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-600 leading-relaxed text-center">
                  Pour déverrouiller la réinitialisation, veuillez saisir le code de sécurité suivant :
                  <br />
                  <span className="font-mono bg-slate-100 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-[8px] text-xs font-black block mt-2 tracking-wide uppercase">
                    delta alpha hotel India mike
                  </span>
                </p>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Saisir le Code</label>
                  <input
                    type="text"
                    required
                    placeholder="Entrez le code ici..."
                    value={securityCodeInput}
                    onChange={(e) => setSecurityCodeInput(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-center font-bold outline-none ring-2 ring-transparent focus:ring-red-500/20 text-slate-900 uppercase tracking-tight transition-all"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (securityCodeInput.trim().toLowerCase() === 'delta alpha hotel india mike') {
                        setConfirmStepVisible(true);
                      } else {
                        toast.error("Code de sécurité incorrect. Veuillez réessayer.");
                      }
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-lg shadow-red-900/10 text-xs"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Confirmation question (Êtes-vous sûr de vouloir réinitialiser) */}
            {confirmStepVisible && (
              <div className="p-6 space-y-4 text-center">
                <p className="text-slate-800 font-extrabold text-base leading-snug uppercase tracking-tight">
                  eye vous sure de vouloir réinitialiser ?
                </p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Cette action est absolument définitive et irréversible. Les ventes de l'équipe, livraisons de stock et balances de caisses seront rétablies à zéro.
                </p>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setConfirmStepVisible(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      resetData();
                      setShowResetModal(false);
                      setConfirmStepVisible(false);
                      setSecurityCodeInput('');
                      toast.success('Données réinitialisées avec succès. Les compteurs sont à 0.');
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-lg shadow-red-900/10 text-xs uppercase tracking-wide"
                  >
                    Oui, Réinitialiser
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
