import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Flame, 
  ShieldCheck, 
  Truck, 
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AfroNegoceLogo } from '../components/Logo';
import { useLandingStore } from '../stores/useLandingStore';

const GridBackground = () => (
  <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e3a8a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
);

export default function ButagazPage() {
  const { productImages } = useLandingStore();
  const [butagazMascot, setButagazMascot] = React.useState("https://static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_0.png");

  React.useEffect(() => {
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => {
        const butagaz = data.find((b: any) => b.id === 'b1');
        if (butagaz && butagaz.mascot_url) {
          setButagazMascot(butagaz.mascot_url);
        }
      })
      .catch(() => {});
  }, []);

  const getProductImage = (id: string, defaultImage: string) => {
    const customImage = productImages.find(img => img.id === id);
    return customImage ? customImage.url : defaultImage;
  };

  const products = [
    {
      id: 'butane-3',
      name: 'Butane 3KG',
      type: 'Butane',
      weight: '3 KG',
      use: 'Idéal pour le camping et le petit bricolage.',
      color: 'bg-blue-500',
      image: getProductImage('butane-3', 'https://images.unsplash.com/photo-1585011664466-b7bcc14ef36c?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'butane-12',
      name: 'Butane 12KG',
      type: 'Butane',
      weight: '12 KG',
      use: 'Pour la cuisine et le chauffage d\'appoint intérieur.',
      color: 'bg-blue-600',
      image: getProductImage('butane-12', 'https://images.unsplash.com/photo-1521220475344-933618451f21?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'propane-34',
      name: 'Propane 34KG',
      type: 'Propane',
      weight: '34 KG',
      use: 'Pour les besoins énergétiques élevés et le stockage extérieur.',
      color: 'bg-red-600',
      image: getProductImage('propane-34', 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&q=80&w=800')
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl z-50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <AfroNegoceLogo className="w-10 h-10 transition-transform group-hover:scale-110" />
              <span className="text-xl font-black tracking-tighter text-blue-950 uppercase font-display">AFRO Négoce</span>
            </Link>
            
            <Link 
              to="/" 
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden bg-white">
        <GridBackground />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] font-serif italic">Partenaire Officiel</span>
                </div>
                <h1 className="text-6xl lg:text-[112px] font-black text-slate-900 leading-[0.85] tracking-tighter mb-10 font-display">
                  BUTAGAZ <br />
                  <span className="font-serif italic font-light text-blue-600">énergie.</span>
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl leading-relaxed font-medium mb-12">
                  Depuis 1976, nous sommes fidèles à la marque Butagaz, apportant confort et énergie à des milliers de foyers et d'entreprises à travers le pays.
                </p>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <div className="flex items-center gap-3 px-6 py-4 bg-slate-900 rounded-2xl text-white">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-bold tracking-tight">Qualité Garantie</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold tracking-tight text-slate-900">Livraison Rapide</span>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="flex-1 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="relative z-10"
              >
                <img 
                  src={butagazMascot} 
                  alt="Butagaz Mascot" 
                  className="w-full max-w-md mx-auto drop-shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-32 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-6">Notre Gamme</h2>
            <h3 className="text-6xl font-black text-slate-900 tracking-tighter leading-none font-display">SOLUTIONS <br /><span className="font-serif italic font-light">gaz conditionné.</span></h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="group bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50 hover:border-blue-600/20 transition-all flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className={`absolute top-6 left-6 px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest ${product.color}`}>
                    {product.type}
                  </div>
                </div>
                
                <div className="p-10 flex-1 flex flex-col">
                  <span className="text-4xl font-black text-slate-900 mb-2 font-display tracking-tighter">{product.weight}</span>
                  <h4 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-widest text-xs">{product.name}</h4>
                  <p className="text-slate-500 font-medium leading-relaxed mb-8">
                    {product.use}
                  </p>
                  
                  <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       En Stock
                    </span>
                    <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Identity / Mascot Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#1e3a8a 2px, transparent 2px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 order-2 lg:order-1 text-center lg:text-left">
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-6">Identité Iconique</h2>
              <h3 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-10 font-display">
                L'OURS BLEU <br />
                <span className="font-serif italic font-light text-blue-600">symbole de</span> CONFIANCE.
              </h3>
              <p className="text-xl text-slate-500 leading-relaxed font-medium mb-12 max-w-xl">
                Plus qu'un logo, l'ours Butagaz incarne la chaleur, la sécurité et la proximité. Présent dans le coeur des Marocains depuis des décennies, il est le gage de notre engagement envers votre confort.
              </p>
              <div className="flex justify-center lg:justify-start gap-12">
                <div>
                  <p className="text-3xl font-black text-slate-900 font-display">1976</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Début du partenariat</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 font-display">1M+</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Bouteilles livrées</p>
                </div>
              </div>
            </div>
            <div className="flex-1 order-1 lg:order-2">
              <motion.div
                initial={{ rotate: -10, scale: 0.9, opacity: 0 }}
                whileInView={{ rotate: 5, scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-600/5 blur-[100px] rounded-full -z-10" />
                <img 
                  src={butagazMascot} 
                  alt="Butagaz Mascot - L'Ours Bleu" 
                  className="w-full max-w-md mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-700 cursor-help"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-32 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <div className="max-w-3xl mx-auto">
            <Flame className="w-16 h-16 text-blue-500 mx-auto mb-10" />
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] mb-12 font-display">
              POURQUOI CHOISIR <br /> <span className="text-blue-500 italic font-serif font-light">Butagaz ?</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-12 text-left">
              <div className="space-y-4">
                <h4 className="text-xl font-bold flex items-center gap-3">
                  <Zap className="w-5 h-5 text-blue-400" /> Rendement Élevé
                </h4>
                <p className="text-slate-400 font-medium leading-relaxed">
                  Le gaz Butagaz offre une combustion propre et un pouvoir calorifique exceptionnel pour toutes vos applications.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-400" /> Sécurité Maximale
                </h4>
                <p className="text-slate-400 font-medium leading-relaxed">
                  Chaque bouteille subit des contrôles rigoureux pour garantir une utilisation en toute sérénité.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-blue-600 rounded-[40px] p-12 lg:p-24 relative overflow-hidden text-center text-white">
            <div className="relative z-10">
              <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] mb-10 font-display">
                BESOIN D'UNE <br /> LIVRAISON ?
              </h2>
              <p className="text-xl text-blue-100 max-w-xl mx-auto mb-12 font-medium">
                Notre service de logistique assure une distribution fiable et ponctuelle sur l'ensemble du territoire.
              </p>
              <Link to="/#contact" className="inline-flex items-center gap-4 px-10 py-5 bg-white text-blue-600 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform">
                Nous contacter
              </Link>
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-700/50 to-transparent -z-0" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-slate-900 pt-32 pb-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <Link to="/" className="flex items-center justify-center gap-3 mb-10 group">
            <AfroNegoceLogo className="w-10 h-10 transition-transform group-hover:scale-110" />
            <span className="text-2xl font-black tracking-tighter uppercase font-display">AFRO Négoce</span>
          </Link>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 AFRO Négoce. Partenaire Butagaz depuis 1976.</p>
        </div>
      </footer>
    </div>
  );
}
