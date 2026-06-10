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
          
          <form onSubmit={handleAddBrand} className="mb-6 flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Nom de la marque</label>
              <input type="text" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="ex: Butagaz" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Catégories (séparées par virgule)</label>
              <input type="text" value={newBrandCategories} onChange={e => setNewBrandCategories(e.target.value)} placeholder="ex: 3Kg, 12Kg, 34Kg" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" />
            </button>
          </form>

          <div className="space-y-3">
            {brands.map(brand => (
              <div key={brand.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">{brand.name}</p>
                  <p className="text-xs text-slate-500">{brand.categories.join(', ')}</p>
                </div>
                <button onClick={() => deleteBrand(brand.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
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
          <AlertTriangle className="w-5 h-5" />
          Zone Dangereuse : Réinitialisation
        </h2>
        <p className="text-red-700 text-sm mb-4">
          Cette action permet de rendre de compte a rebour a 0, comme si ni achat ni vente n'a été fait dans afro dispatch. 
          Elle effacera : les ventes, dépenses, pointages, localisations des camions, dispatch de stock (y compris comptoir), 
          stock global (remis à 0), commandes, caisses et fiches de paies. 
          <br /><br />
          Les listes de clients, chauffeurs, convoyeurs, zones, marques, prix et commissions seront conservées.
        </p>
        <button 
          onClick={() => {
            if(window.confirm('Êtes-vous sûr de vouloir remettre tous les compteurs à 0 ? Cette action est irréversible.')) {
              resetData();
              toast.success('Données réinitialisées avec succès. Les compteurs sont à 0.');
            }
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Remettre à zèro les données
        </button>
      </div>
    </div>
  );
}
