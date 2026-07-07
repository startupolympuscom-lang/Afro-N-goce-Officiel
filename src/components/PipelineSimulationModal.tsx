import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Home, Factory, Tractor, Activity, Droplets, Flame, GitCommit, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function PipelineSimulationModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [type, setType] = useState<'household' | 'industry' | 'agriculture' | null>(null);

  // Household States
  const [stories, setStories] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [kitchens, setKitchens] = useState(1);
  const [bathroomLocations, setBathroomLocations] = useState<number[]>([0]); // 0 = RDC, 1 = Etage 1, etc.
  const [kitchenLocations, setKitchenLocations] = useState<number[]>([0]);
  const [people, setPeople] = useState(4);
  const [showHouseholdViz, setShowHouseholdViz] = useState(false);

  // Agriculture States
  const [hectares, setHectares] = useState(10);
  const [produceType, setProduceType] = useState('serre');
  const [showAgriResult, setShowAgriResult] = useState(false);

  // Industry States (just placeholder for now)
  const [industryType, setIndustryType] = useState('metallurgie');
  const [showIndustryResult, setShowIndustryResult] = useState(false);

  const resetState = () => {
    setShowHouseholdViz(false);
    setShowAgriResult(false);
    setShowIndustryResult(false);
  };

  const handleTypeSelect = (t: 'household' | 'industry' | 'agriculture') => {
    setType(t);
    resetState();
  };

  const handleHouseholdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowHouseholdViz(true);
  };

  const handleAgriSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAgriResult(true);
  };

  const handleIndustrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowIndustryResult(true);
  };

  const getAgriCylinders = () => {
    let multiplier = 5;
    if (produceType === 'serre') multiplier = 45; // Serres chauffées nécessitent beaucoup de gaz
    if (produceType === 'sechage') multiplier = 30; // Séchage de fruits/tabac
    if (produceType === 'elevage') multiplier = 20; // Aviculture (chauffage des poussins)
    return Math.ceil(hectares * multiplier);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-slate-800">Simulateur d'Installation Pipeline</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Estimez vos besoins et visualisez votre réseau de gaz.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          
          {/* Type Selection */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { id: 'household', label: 'Ménage / Résidentiel', icon: <Home className="w-6 h-6 mb-2" /> },
              { id: 'industry', label: 'Industrie', icon: <Factory className="w-6 h-6 mb-2" /> },
              { id: 'agriculture', label: 'Agriculture', icon: <Tractor className="w-6 h-6 mb-2" /> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => handleTypeSelect(t.id as any)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${type === t.id ? 'border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm' : 'border-slate-100 hover:border-slate-300 text-slate-500 hover:bg-slate-50'}`}
              >
                {t.icon}
                <span className="font-bold text-sm">{t.label}</span>
              </button>
            ))}
          </div>

          {!type && (
            <div className="text-center py-12 text-slate-400">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium text-lg">Sélectionnez un profil pour commencer la simulation</p>
            </div>
          )}

          {/* HOUSEHOLD SIMULATION */}
          {type === 'household' && (
            <div className="space-y-8">
              {!showHouseholdViz ? (
                <form onSubmit={handleHouseholdSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nombre d'étages (RDC = 0)</label>
                      <input type="number" min="0" max="5" value={stories} onChange={(e) => setStories(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nombre d'occupants</label>
                      <input type="number" min="1" max="20" value={people} onChange={(e) => setPeople(parseInt(e.target.value) || 1)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de Salles de Bain</label>
                      <input type="number" min="0" max="10" value={bathrooms} onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setBathrooms(val);
                        setBathroomLocations(Array(val).fill(0));
                      }} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de Cuisines</label>
                      <input type="number" min="0" max="5" value={kitchens} onChange={(e) => {
                         const val = parseInt(e.target.value) || 0;
                         setKitchens(val);
                         setKitchenLocations(Array(val).fill(0));
                      }} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white" />
                    </div>
                  </div>

                  {/* Locations Mapping */}
                  {(bathrooms > 0 || kitchens > 0) && (
                    <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                      <h3 className="font-bold text-blue-900 mb-4">Localisation des Équipements</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {bathroomLocations.map((loc, idx) => (
                          <div key={`bath-${idx}`}>
                            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Salle de bain {idx + 1} (Chauffe-eau)</label>
                            <select value={loc} onChange={(e) => {
                                const newLocs = [...bathroomLocations];
                                newLocs[idx] = parseInt(e.target.value);
                                setBathroomLocations(newLocs);
                            }} className="w-full px-4 py-2.5 rounded-lg border border-blue-200 bg-white text-sm">
                              {Array.from({length: stories + 1}).map((_, i) => (
                                <option key={i} value={i}>{i === 0 ? 'Rez-de-chaussée' : `Étage ${i}`}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                        {kitchenLocations.map((loc, idx) => (
                          <div key={`kit-${idx}`}>
                            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Cuisine {idx + 1} (Plaque/Four)</label>
                            <select value={loc} onChange={(e) => {
                                const newLocs = [...kitchenLocations];
                                newLocs[idx] = parseInt(e.target.value);
                                setKitchenLocations(newLocs);
                            }} className="w-full px-4 py-2.5 rounded-lg border border-blue-200 bg-white text-sm">
                              {Array.from({length: stories + 1}).map((_, i) => (
                                <option key={i} value={i}>{i === 0 ? 'Rez-de-chaussée' : `Étage ${i}`}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                    Générer la Représentation 3D du Réseau
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    
                    <div className="relative z-10 flex flex-col gap-6 items-center">
                      <div className="w-full max-w-lg mb-4 text-center">
                        <h3 className="text-white font-display text-2xl font-bold tracking-tight">Schéma d'Installation d'Appoint</h3>
                        <p className="text-slate-400 text-sm mt-1">Conduite montante et raccordements intérieurs</p>
                      </div>

                      {/* 3D Isometric Representation */}
                      <div className="w-full flex justify-center pt-24 pb-32 perspective-[1500px]">
                        <div 
                          className="relative w-[280px]" 
                          style={{ 
                             height: `${stories * 140 + 60}px`, 
                             transformStyle: 'preserve-3d', 
                             transform: 'rotateX(60deg) rotateZ(-45deg)' 
                          }}
                        >
                          
                          {/* Vertical Main Pipe */}
                          <div 
                            className="absolute left-[40px] bottom-[40px] w-[6px] bg-gradient-to-t from-amber-600 to-amber-300 rounded-t-full shadow-[0_0_20px_rgba(245,158,11,0.8)]"
                            style={{ 
                              height: `${Math.max(1, stories) * 140 + 60}px`, 
                              transformOrigin: 'bottom', 
                              transform: 'rotateX(-90deg) translateZ(0)' // stands up vertically 
                            }}
                          >
                            <div 
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 bg-amber-600/10 border-[6px] border-amber-500/50 rounded-full flex items-center justify-center"
                              style={{ transform: 'rotateX(90deg)' }}
                            >
                               <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                                  <Activity className="w-3 h-3 text-amber-500" />
                               </div>
                            </div>
                          </div>

                          {Array.from({length: stories + 1}).map((_, level) => {
                            const levelBathrooms = bathroomLocations.filter(l => l === level).length;
                            const levelKitchens = kitchenLocations.filter(l => l === level).length;
                            
                            return (
                              <div 
                                key={level} 
                                className="absolute inset-x-0 bottom-0 aspect-square"
                                style={{ transform: `translateZ(${level * 140}px)`, transformStyle: 'preserve-3d' }}
                              >
                                {/* Floor layer */}
                                <div className="w-full h-full bg-slate-800/80 backdrop-blur-md border-2 border-slate-700/80 hover:border-blue-500/50 transition-colors duration-500 rounded-3xl p-6 grid grid-cols-2 grid-rows-2 gap-4 shadow-[0_30px_50px_rgba(0,0,0,0.5)] relative">
                                  
                                  {/* Pipe hole indicator */}
                                  <div className="absolute left-[38px] bottom-[38px] w-[10px] h-[10px] rounded-full shadow-inner bg-slate-950 border border-slate-700"></div>

                                  {(levelBathrooms === 0 && levelKitchens === 0) ? (
                                    <div className="col-span-2 row-span-2 border-2 border-slate-700/50 border-dashed rounded-2xl flex items-center justify-center relative">
                                       <span className="text-slate-500 font-black uppercase tracking-widest text-sm" style={{transform: 'rotateX(-60deg) rotateZ(45deg)'}}>Aires de vie</span>
                                    </div>
                                  ) : (
                                    <>
                                       {Array.from({length: levelBathrooms}).map((_, i) => (
                                          <div key={`bath-${i}`} className="bg-blue-900/20 border border-blue-500/30 rounded-2xl flex items-center justify-center relative">
                                              <Droplets className="w-8 h-8 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" style={{ transform: 'translateZ(40px) rotateX(-60deg) rotateZ(45deg)' }} />
                                              {/* Horizontal Pipe connection */}
                                              <div className="absolute top-1/2 -left-6 w-12 h-[3px] bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)]"></div>
                                          </div>
                                        ))}
                                        {Array.from({length: levelKitchens}).map((_, i) => (
                                          <div key={`kit-${i}`} className="bg-orange-900/20 border border-orange-500/30 rounded-2xl flex items-center justify-center relative">
                                              <Flame className="w-8 h-8 text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]" style={{ transform: 'translateZ(40px) rotateX(-60deg) rotateZ(45deg)' }} />
                                              {/* Horizontal Pipe connection */}
                                              <div className="absolute bottom-1/2 -left-6 w-12 h-[3px] bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)]"></div>
                                          </div>
                                        ))}
                                    </>
                                  )}

                                  {/* Floor Label */}
                                  <div 
                                     className="absolute right-0 -top-12 bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-xl border border-slate-700 uppercase tracking-widest whitespace-nowrap shadow-xl flex items-center gap-2"
                                     style={{ transform: 'translateZ(20px) rotateX(-60deg) rotateZ(45deg)' }}
                                  >
                                    {level === 0 ? 'RDC' : `ÉTG ${level}`}
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex gap-6 mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Conduite Cuivre/Acier</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sanitaire</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gaz de cuisine</span>
                        </div>
                      </div>

                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                    <div>
                        <h4 className="font-bold text-blue-900">Estimation de la Consommation</h4>
                        <p className="text-sm text-blue-700/70 mt-1">Pour {people} occupants, {(kitchens + bathrooms) > 0 ? 'utilisation mixte' : 'usage standard'}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-blue-600 tracking-tighter">~{Math.max(1, Math.ceil(people * 0.8))} Bouteilles</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Butane / Mois</div>
                    </div>
                  </div>

                  <button onClick={() => setShowHouseholdViz(false)} className="px-6 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    Modifier les paramètres
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AGRICULTURE SIMULATION */}
          {type === 'agriculture' && (
             <div className="space-y-8">
               {!showAgriResult ? (
                 <form onSubmit={handleAgriSubmit} className="space-y-6 bg-emerald-50/50 p-6 sm:p-8 rounded-[2rem] border border-emerald-100/50">
                    <h3 className="font-bold text-emerald-900 mb-2">Paramètres de l'Exploitation Agricole</h3>
                    <p className="text-sm text-emerald-700/60 mb-6">Évaluez vos besoins énergétiques basés sur la superficie et le type de culture.</p>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-emerald-800 mb-2">Superficie (Hectares)</label>
                        <input type="number" min="0.5" step="0.5" value={hectares} onChange={(e) => setHectares(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-white" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-emerald-800 mb-2">Type d'Activité / Culture</label>
                        <select value={produceType} onChange={(e) => setProduceType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-white">
                          <option value="serre">Cultures sous Serre (Tomate, Poivron...)</option>
                          <option value="elevage">Élevage / Aviculture</option>
                          <option value="sechage">Séchage Agricole (Fruits, Tabac...)</option>
                          <option value="plein_champ">Production Plein Champ (Mécanisée)</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 mt-4">
                      Calculer les besoins en Gaz Naturel / Propane
                    </button>
                 </form>
               ) : (
                 <div className="space-y-6">
                   <div className="bg-emerald-900 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl border border-emerald-800 flex items-center justify-center flex-col min-h-[300px]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-800 via-emerald-950 to-slate-950 mix-blend-overlay"></div>
                      
                      <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-6 relative z-10" />
                      <h3 className="text-3xl font-display font-black text-white relative z-10 text-center tracking-tighter">Besoins Estimés</h3>
                      
                      <div className="mt-8 bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-center w-full max-w-md relative z-10">
                         <div className="text-5xl font-black text-emerald-300 tracking-tighter mb-2">{getAgriCylinders()} <span className="text-2xl text-emerald-200/50">Cylindres</span></div>
                         <div className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Bouteilles B12 / Propane Pro par mois</div>
                         
                         <div className="mt-6 pt-6 border-t border-white/10 flex justify-between text-left">
                            <div>
                                <div className="text-[10px] text-emerald-200/70 font-bold uppercase tracking-widest">Culture / Activité</div>
                                <div className="text-white font-medium capitalize">{produceType.replace('_', ' ')}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-emerald-200/70 font-bold uppercase tracking-widest">Superficie</div>
                                <div className="text-white font-medium">{hectares} Hectares</div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <button onClick={() => setShowAgriResult(false)} className="px-6 py-3 border-2 border-emerald-200 text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-colors">
                      Nouveau Calcul
                   </button>
                 </div>
               )}
             </div>
          )}

          {/* INDUSTRY SIMULATION (Minimal Placeholder) */}
          {type === 'industry' && (
             <div className="space-y-8">
               {!showIndustryResult ? (
                 <form onSubmit={handleIndustrySubmit} className="space-y-6 bg-slate-50 p-6 sm:p-8 rounded-[2rem] border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-2">Besoins Industriels</h3>
                    <p className="text-sm text-slate-500 mb-6">Les installations industrielles nécessitent une étude technique approfondie par notre bureau d'études.</p>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2">Secteur d'Activité</label>
                        <select value={industryType} onChange={(e) => setIndustryType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white shadow-sm">
                          <option value="metallurgie">Métallurgie & Fonderie</option>
                          <option value="ceramique">Céramique & Verre</option>
                          <option value="chimie">Chimie & Pétrochimie</option>
                          <option value="agro">Agroalimentaire</option>
                          <option value="autre">Autre usage intensif</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg mt-4">
                      Obtenir une estimation de faisabilité
                    </button>
                 </form>
               ) : (
                 <div className="bg-slate-900 p-8 sm:p-12 rounded-[2.5rem] relative overflow-hidden shadow-xl border border-slate-800 text-center flex flex-col items-center">
                    <Factory className="w-16 h-16 text-blue-400 mb-6" />
                    <h3 className="text-2xl font-display font-black text-white tracking-tighter mb-4">Étude Nécessaire</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-8">Votre secteur nécessite une infrastructure de stockage et une tuyauterie HP/BP (Haute et Basse Pression) spécifique. Une visite sur site est recommandée.</p>
                    <button onClick={() => onClose()} className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors">
                        Contacter notre Bureau d'Études
                    </button>
                 </div>
               )}
             </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
