import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Beaker, 
  ShieldCheck, 
  Truck, 
  Wind,
  ChevronRight,
  Settings,
  Atom,
  Gauge,
  Ruler,
  CircleDot,
  Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AfroNegoceLogo } from '../components/Logo';
import { useLandingStore } from '../stores/useLandingStore';

const IndustrialGrid = () => (
  <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
);

export default function AirLiquidePage() {
  const { productImages } = useLandingStore();

  const getProductImage = (id: string, defaultImage: string) => {
    const customImage = productImages.find(img => img.id === id);
    return customImage ? customImage.url : defaultImage;
  };

  const industrialGases = [
    {
      id: 'oxygene-ind',
      name: 'Oxygène Industriel',
      desc: 'Haute pureté pour les procédés de combustion et d\'oxydation.',
      formula: 'O₂',
      tag: 'Industrie',
      specs: {
        taille: 'M20 / L50 / Cadre',
        pression: '200 bar',
        chapeau: 'Standard / SMARTOP™'
      },
      image: getProductImage('oxygene-ind', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'azote-ind',
      name: 'Azote Industriel',
      desc: 'Idéal pour l\'inertage, le dégazage et les tests de pression.',
      formula: 'N₂',
      tag: 'Inerte',
      specs: {
        taille: 'L50 / Cadre (x16)',
        pression: '200 bar',
        chapeau: 'Standard'
      },
      image: getProductImage('azote-ind', 'https://images.unsplash.com/photo-1532187875302-1df92d47ed17?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'argon-ind',
      name: 'Argon Pur',
      desc: 'Protection optimale pour les procédés haute température.',
      formula: 'Ar',
      tag: 'Protection',
      specs: {
        taille: 'M20 / L50',
        pression: '200 bar',
        chapeau: 'SMARTOP™'
      },
      image: getProductImage('argon-ind', 'https://images.unsplash.com/photo-1544725121-be3b5088f171?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'co2-ind',
      name: 'Dioxyde de Carbone',
      desc: 'Utilisé dans la métallurgie, le traitement des eaux et la chimie.',
      formula: 'CO₂',
      tag: 'Polyvalent',
      specs: {
        taille: 'L50 / B50',
        pression: '50 bar (Liquide)',
        chapeau: 'Standard'
      },
      image: getProductImage('co2-ind', 'https://images.unsplash.com/photo-1581093458622-0f45391e3e7e?auto=format&fit=crop&q=80&w=800')
    }
  ];

  const foodGases = [
    {
      id: 'aligal-1',
      name: 'ALIGAL™ 1',
      formula: 'CO₂',
      desc: 'Dioxyde de carbone pour la carbonatation des boissons.',
      usage: 'Boissons & Conservation',
      specs: {
        taille: 'M20 / L50',
        pression: '50 bar',
        chapeau: 'ALIGAL™ Valve'
      },
      image: getProductImage('aligal-1', 'https://images.unsplash.com/photo-1543253687-c934c2e01861?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'aligal-2',
      name: 'ALIGAL™ 2',
      formula: 'N₂',
      desc: 'Azote de qualité alimentaire pour l\'inertage des produits.',
      usage: 'Snacking & Laitiers',
      specs: {
        taille: 'L50 / Cadre',
        pression: '200 bar',
        chapeau: 'ALIGAL™ Valve'
      },
      image: getProductImage('aligal-2', 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=800')
    }
  ];

  const medicalGases = [
    {
      id: 'medical-o2',
      name: 'Oxygène Médical',
      formula: 'O₂',
      desc: 'Gaz médicinal pour l\'oxygénothérapie.',
      usage: 'Urgences & Soins',
      specs: {
        taille: 'B2 / B5 / B15 / L50',
        pression: '200 bar',
        chapeau: 'O2 Medical'
      },
      image: getProductImage('o2-med', 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'medical-n2o',
      name: 'Protoxyde d\'Azote',
      formula: 'N₂O',
      desc: 'Médicament pour l\'anesthésie et l\'analgésie.',
      usage: 'Anesthésie',
      specs: {
        taille: 'B5 / B15 / M20',
        pression: '45 bar',
        chapeau: 'N2O Valve'
      },
      image: getProductImage('n2o-med', 'https://images.unsplash.com/photo-1579154238328-1c32b050ae96?auto=format&fit=crop&q=80&w=800')
    }
  ];

  const weldingGases = [
    {
      id: 'arcal-prime',
      name: 'ARCAL™ Prime',
      desc: 'Gaz de protection TIG et MIG haute performance (Argon pur).',
      specs: {
        taille: 'S11 / M20 / L50',
        pression: '200 bar',
        chapeau: 'SMARTOP™'
      },
      image: getProductImage('arcal-prime', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'arcal-chrome',
      name: 'ARCAL™ Chrome',
      desc: 'Idéal pour le soudage MAG des aciers inoxydables.',
      specs: {
        taille: 'M20 / L50',
        pression: '200 bar',
        chapeau: 'EXELTOP™'
      },
      image: getProductImage('arcal-chrome', 'https://images.unsplash.com/photo-1535813548-6601f69c176a?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'arcal-speed',
      name: 'ARCAL™ Speed',
      desc: 'Conçu pour le soudage MAG haute vitesse des aciers carbone.',
      specs: {
        taille: 'L50 / Cadre (x16)',
        pression: '200 bar',
        chapeau: 'SMARTOP™'
      },
      image: getProductImage('arcal-speed', 'https://images.unsplash.com/photo-1581094751579-450f6811466a?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'arcal-force',
      name: 'ARCAL™ Force',
      desc: 'Performance maximale pour les fortes épaisseurs en MAG.',
      specs: {
        taille: 'L50 / Cadre (x16)',
        pression: '200 bar',
        chapeau: 'EXELTOP™'
      },
      image: getProductImage('arcal-force', 'https://images.unsplash.com/photo-1565193298357-15e44849ec79?auto=format&fit=crop&q=80&w=800')
    }
  ];

  const weldingMachines = [
    {
      id: 'saf-presto',
      name: 'PRESTO 160 PFC',
      brand: 'SAF-FRO',
      type: 'Poste MMA / TIG',
      desc: 'Léger et puissant, idéal pour la maintenance sur site.',
      image: 'https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'saf-digipuls',
      name: 'DIGIPULS III 420',
      brand: 'SAF-FRO',
      type: 'Poste MIG/MAG Double Pulsé',
      desc: 'Technologie numérique avancée pour un contrôle parfait de l\'arc.',
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'saf-plasma',
      name: 'PRESTOJET 45',
      brand: 'SAF-FRO',
      type: 'Découpeur Plasma',
      desc: 'Coupe précise et rapide jusqu\'à 15mm d\'épaisseur.',
      image: 'https://images.unsplash.com/photo-1581093458622-0f45391e3e7e?auto=format&fit=crop&q=80&w=800'
    }
  ];

  const weldingRods = [
    {
      id: 'saf-safer',
      name: 'SAFER G 48 N',
      brand: 'SAF-FRO',
      type: 'Électrode Rutile',
      desc: 'Électrode universelle toutes positions pour le soudage des aciers courants.',
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'oer-fincord',
      name: 'FINCORD',
      brand: 'OERLIKON',
      type: 'Électrode Rutile',
      desc: 'Excellente maniabilité, bel aspect de cordon et laitier autodétachable.',
      image: 'https://images.unsplash.com/photo-1544725121-be3b5088f171?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'oer-supracit',
      name: 'SUPRACIT',
      brand: 'OERLIKON',
      type: 'Électrode Basique',
      desc: 'Pour assemblages de haute sécurité soumis à de fortes sollicitations.',
      image: 'https://images.unsplash.com/photo-1581093458622-0f45391e3e7e?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'al-baguette-tig',
      name: 'TIG ALMG 5',
      brand: 'Air Liquide',
      type: 'Baguette TIG',
      desc: 'Métal d\'apport pour le soudage des alliages Aluminium - Magnésium.',
      image: 'https://images.unsplash.com/photo-1535813548-6601f69c176a?auto=format&fit=crop&q=80&w=800'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-950/70 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <AfroNegoceLogo className="w-10 h-10 transition-transform group-hover:scale-110" />
              <span className="text-xl font-black tracking-tighter text-white uppercase font-display">AFRO Négoce</span>
            </Link>
            
            <Link 
              to="/" 
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 overflow-hidden">
        <IndustrialGrid />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/20 mb-8">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Excellence Industrielle</span>
              </div>
              <h1 className="text-6xl lg:text-[140px] font-black leading-[0.8] tracking-tighter mb-10 font-display">
                AIR LIQUIDE <br />
                <span className="text-blue-600 italic">solutions.</span>
              </h1>
              <p className="text-2xl text-slate-400 max-w-2xl leading-relaxed font-light mb-12">
                Partenaire premium d'Air Liquide. Nous fournissons des solutions de gaz de haute pureté pour l'industrie, la santé et la recherche.
              </p>
              
              <div className="flex flex-wrap gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Standards</span>
                  <span className="text-3xl font-black font-display tracking-tight text-white">QUALITÉ ISO</span>
                </div>
                <div className="w-px h-16 bg-white/10 hidden md:block" />
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Support</span>
                  <span className="text-3xl font-black font-display tracking-tight text-white">24/7 EXPERT</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-32 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div>
              <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6">Catalogue Gaz</h2>
              <h3 className="text-5xl font-black text-white tracking-tighter leading-none font-display uppercase tracking-widest">FLUX INDUSTRIELS</h3>
            </div>
            <p className="text-slate-400 max-w-md font-medium text-sm leading-relaxed">
              Une gamme scientifique d'atomes et de molécules pour propulser votre performance industrielle au niveau supérieur.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {industrialGases.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="group relative h-[550px] rounded-[32px] overflow-hidden bg-slate-900 border border-white/5"
              >
                <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-3xl font-black font-display text-blue-500">{product.formula}</span>
                    <span className="text-[10px] font-black bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-white/60 uppercase tracking-widest">{product.tag}</span>
                  </div>
                  
                  <div>
                    <h4 className="text-3xl font-black text-white mb-2 font-display uppercase tracking-tighter">{product.name}</h4>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6 group-hover:text-slate-200 transition-colors">
                      {product.desc}
                    </p>

                    <div className="space-y-3 pt-6 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                      <div className="flex items-center gap-3">
                        <Ruler className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.specs.taille}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Gauge className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.specs.pression}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CircleDot className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.specs.chapeau}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Food and Medical Sections */}
      <section className="py-32 bg-[#0A0A0A] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Food Section */}
            <div>
              <div className="mb-12">
                <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Gaz Alimentaire</h2>
                <h3 className="text-5xl font-black text-white tracking-tighter font-display uppercase leading-none">GAMME <br />ALIGAL™</h3>
                <p className="text-slate-400 mt-6 max-w-md font-medium text-lg leading-relaxed">Solutions dédiées à la préservation de la fraîcheur, à la protection des aliments et à la carbonatation des boissons.</p>
              </div>
              <div className="space-y-6">
                {foodGases.map((gas, i) => (
                  <motion.div 
                    key={gas.id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className="group bg-slate-900 border border-white/5 rounded-[32px] overflow-hidden hover:border-blue-500/30 transition-all flex flex-col md:flex-row shadow-2xl"
                  >
                    <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden flex-shrink-0">
                      <img src={gas.image} alt={gas.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h4 className="text-2xl font-black text-white tracking-tight font-display uppercase">{gas.name}</h4>
                          <span className="text-sm font-bold text-blue-500 font-mono tracking-widest">{gas.formula}</span>
                        </div>
                        <span className="text-[8px] font-black bg-blue-600/10 text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-600/20">{gas.usage}</span>
                      </div>
                      
                      <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">{gas.desc}</p>
                      
                      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Taille</span>
                          <span className="text-[10px] font-black text-white uppercase">{gas.specs.taille}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Pression</span>
                          <span className="text-[10px] font-black text-white uppercase">{gas.specs.pression}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Chapeau</span>
                          <span className="text-[10px] font-black text-white uppercase">{gas.specs.chapeau}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Medical Section */}
            <div>
              <div className="mb-12">
                <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Gaz Médical</h2>
                <h3 className="text-5xl font-black text-white tracking-tighter font-display uppercase leading-none">SANTÉ & <br />SOINS EXTRÊMES</h3>
                <p className="text-slate-400 mt-6 max-w-md font-medium text-lg leading-relaxed">Gaz médicaux certifiés conformes à la pharmacopée pour les établissements de santé au Maroc.</p>
              </div>
              <div className="space-y-6">
                {medicalGases.map((gas, i) => (
                  <motion.div 
                    key={gas.id}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className="group bg-slate-900 border border-white/5 rounded-[32px] overflow-hidden hover:border-blue-500/30 transition-all flex flex-col md:flex-row shadow-2xl"
                  >
                    <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden flex-shrink-0">
                      <img src={gas.image} alt={gas.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h4 className="text-2xl font-black text-white tracking-tight font-display uppercase">{gas.name}</h4>
                          <span className="text-sm font-bold text-blue-500 font-mono tracking-widest">{gas.formula}</span>
                        </div>
                        <span className="text-[8px] font-black bg-blue-600/10 text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-600/20">{gas.usage}</span>
                      </div>
                      
                      <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">{gas.desc}</p>
                      
                      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Taille</span>
                          <span className="text-[10px] font-black text-white uppercase">{gas.specs.taille}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Pression</span>
                          <span className="text-[10px] font-black text-white uppercase">{gas.specs.pression}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Chapeau</span>
                          <span className="text-[10px] font-black text-white uppercase">{gas.specs.chapeau}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Section */}
      <section className="py-32 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 mix-blend-overlay opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.8] mb-10 font-display uppercase">
                Poste et materiel <br /> de soudage.
              </h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex-shrink-0 flex items-center justify-center">
                    <Wind className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 uppercase tracking-tighter">Gaz de de soudage : Gamme ARCAL™</h4>
                    <p className="text-blue-100 font-medium opacity-90">La solution de référence Air Liquide : ARCAL Prime, ARCAL Chrome, ARCAL Speed et ARCAL Force.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex-shrink-0 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 uppercase tracking-tighter">Matériel de soudage : SAF-FRO</h4>
                    <p className="text-blue-100 font-medium opacity-90">Distributeur officiel SAF-FRO : Postes à souder MIG/MAG, TIG, Plasma et consommables de haute qualité.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-white shadow-2xl shadow-blue-900/50 rounded-[60px] p-12 flex flex-col justify-center text-slate-900 border-4 border-slate-950">
                <Atom className="w-16 h-16 text-blue-600 mb-8 animate-spin-slow" />
                <h3 className="text-4xl font-black font-display tracking-tighter mb-4 uppercase">EXPERTISE SOUDAGE & COUPE</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Bénéficiez de l'accompagnement d'AFRO Négoce pour le choix de vos gaz protecteurs ARCAL™ et de vos équipements SAF-FRO. Nous optimisons vos paramètres de soudage pour une productivité maximale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Welding Gases Section - ARCAL™ */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-slate-900">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div>
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-6">Expertise Gaz</h2>
              <h3 className="text-6xl font-black tracking-tighter leading-none font-display uppercase">GAMME ARCAL™</h3>
            </div>
            <p className="text-slate-500 max-w-sm font-medium">La référence mondiale pour le soudage à l'arc. Gaz certifiés, haute pureté et productivité accrue.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {weldingGases.map((gas, i) => (
              <motion.div 
                key={gas.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="group bg-slate-50 rounded-[40px] overflow-hidden border border-slate-200 hover:border-blue-600 transition-all flex flex-col hover:shadow-xl"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={gas.image} alt={gas.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest">
                    Solution ARCAL™
                  </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <h4 className="text-2xl font-black text-slate-900 mb-4 font-display uppercase tracking-tighter">{gas.name}</h4>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-1">
                    {gas.desc}
                  </p>
                  
                  <div className="space-y-4 pt-8 border-t border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                        <Ruler className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Taille</p>
                        <p className="text-xs font-black text-slate-900 uppercase">{gas.specs.taille}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                        <Gauge className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pression</p>
                        <p className="text-xs font-black text-slate-900 uppercase">{gas.specs.pression}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                        <CircleDot className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Chapeau</p>
                        <p className="text-xs font-black text-slate-900 uppercase">{gas.specs.chapeau}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Welding Machines Section - SAF-FRO */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-slate-900">
          <div className="mb-24">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-6">Matériel Haut de Gamme</h2>
            <h3 className="text-6xl font-black tracking-tighter leading-none font-display uppercase tracking-widest">POSTES <br /><span className="text-blue-600 font-serif italic font-light">SAF-FRO.</span></h3>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {weldingMachines.map((machine, i) => (
              <motion.div 
                key={machine.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-white rounded-[60px] p-10 border border-slate-200 hover:shadow-2xl transition-all h-full flex flex-col"
              >
                <div className="aspect-square rounded-[40px] overflow-hidden mb-10 bg-slate-100 flex items-center justify-center relative">
                  <img src={machine.image} alt={machine.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                  <div className="absolute top-6 right-6">
                    <Cpu className="w-8 h-8 text-white/50 backdrop-blur-sm" />
                  </div>
                </div>
                
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">{machine.type}</span>
                <h4 className="text-3xl font-black text-slate-900 mb-4 font-display uppercase tracking-tighter group-hover:text-blue-600 transition-colors leading-[0.9]">{machine.name}</h4>
                <p className="text-slate-500 font-medium leading-relaxed text-sm mb-12 flex-1">
                  {machine.desc}
                </p>
                
                <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Marque</span>
                    <span className="text-xs font-black text-slate-900 uppercase">{machine.brand}</span>
                  </div>
                  <Link to="/#contact" className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/20">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Welding Rods Section - Air Liquide & Partners */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-slate-900">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div>
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-6">Consommables Industriels</h2>
              <h3 className="text-6xl font-black tracking-tighter leading-none font-display uppercase">ÉLECTRODES & <br />BAGUETTES.</h3>
            </div>
            <p className="text-slate-500 max-w-sm font-medium">Baguettes de soudage et électrodes enrobées Air Liquide, SAF-FRO et OERLIKON pour toutes vos applications critiques.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {weldingRods.map((rod, i) => (
              <motion.div 
                key={rod.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="group relative rounded-[40px] overflow-hidden border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-2xl transition-all p-8 flex flex-col"
              >
                <div className="aspect-video rounded-[24px] overflow-hidden mb-8 relative">
                  <img src={rod.image} alt={rod.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 left-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{rod.brand}</span>
                <h4 className="text-2xl font-black text-slate-900 mb-2 font-display uppercase tracking-tighter leading-none">{rod.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{rod.type}</p>
                <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8 flex-1">
                  {rod.desc}
                </p>
                
                <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Norme Qualité</span>
                  <div className="flex gap-1">
                    {[1,2,3].map(s => <div key={s} className="w-1.5 h-1.5 rounded-full bg-blue-500/20 group-hover:bg-blue-600 transition-colors" />)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <footer className="bg-slate-950 text-white pt-32 pb-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <Link to="/" className="flex items-center justify-center gap-3 mb-10 group">
            <AfroNegoceLogo className="w-10 h-10 transition-transform group-hover:scale-110" />
            <span className="text-2xl font-black tracking-tighter uppercase font-display">AFRO Négoce</span>
          </Link>
          <div className="flex justify-center gap-12 mb-12">
            <div className="text-center">
              <span className="block text-2xl font-black font-display tracking-tight">30+</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gaz Différents</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-black font-display tracking-tight">100%</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sécurité</span>
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">© 2026 AFRO Négoce. Partenaire Premium Air Liquide.</p>
        </div>
      </footer>
    </div>
  );
}
