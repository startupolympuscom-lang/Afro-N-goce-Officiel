import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft,
  Calendar,
  Award,
  Users,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AfroNegoceLogo, AestheticFlame } from '../components/Logo';
import { useLandingStore } from '../stores/useLandingStore';

const GridBackground = () => (
  <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e3a8a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
);

export default function HistoryPage() {
  const { historyImages, milestones } = useLandingStore();

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
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden bg-white">
        <GridBackground />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8">
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] font-serif italic">Héritage & Vision</span>
            </div>
            <h1 className="text-6xl lg:text-[112px] font-black text-slate-900 leading-[0.85] tracking-tighter mb-10 font-display">
              NOTRE <br />
              <span className="font-serif italic font-light text-blue-600">histoire.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
              Plus de 25 ans d'engagement, d'innovation et de service au cœur du développement énergétique du Maroc.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-32 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-slate-200 hidden md:block"></div>
            
            <div className="space-y-32">
              {milestones.map((milestone, i) => (
                <motion.div 
                  key={milestone.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`relative flex flex-col md:flex-row items-center gap-12 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Year Bubble */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border border-slate-200 shadow-2xl z-10 hidden md:flex items-center justify-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 w-full">
                    <div className={`group p-12 rounded-[40px] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 hover:border-blue-600/20 transition-all ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                      <span className="text-blue-600 font-black text-6xl mb-4 block font-display tracking-tighter">{milestone.year}</span>
                      <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight uppercase tracking-widest text-xs">{milestone.title}</h3>
                      <p className="text-slate-500 leading-relaxed font-medium text-lg mb-6">{milestone.description}</p>
                      {milestone.image && (
                        <div className={`w-full overflow-hidden rounded-2xl ${i % 2 === 0 ? 'mr-auto' : 'ml-auto'}`}>
                          <img src={milestone.image} alt={milestone.title} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Spacer for the other side */}
                  <div className="flex-1 hidden md:block"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* History Images Gallery */}
      {historyImages.length > 0 && (
        <section className="py-32 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-24">
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-6">Archives</h2>
              <h3 className="text-6xl font-black text-slate-900 tracking-tighter leading-none font-display">L'HISTOIRE EN <br /><span className="font-serif italic font-light">images.</span></h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {historyImages.map((img, i) => (
                <motion.div 
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200 aspect-video group relative"
                >
                  <img 
                    src={img.url} 
                    alt="Histoire AFRO Négoce" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Values Section */}
      <section className="py-32 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-6">Nos Piliers</h2>
            <h3 className="text-6xl font-black tracking-tighter leading-none font-display">VALEURS <br /><span className="text-blue-500">FONDAMENTALES.</span></h3>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: <ShieldCheck className="w-8 h-8" />, title: "INTÉGRITÉ", desc: "La transparence totale dans toutes nos relations commerciales." },
              { icon: <Award className="w-8 h-8" />, title: "EXCELLENCE", desc: "La recherche constante de la meilleure qualité de service." },
              { icon: <Users className="w-8 h-8" />, title: "PROXIMITÉ", desc: "Être toujours à l'écoute et proche de nos clients." },
              { icon: <TrendingUp className="w-8 h-8" />, title: "INNOVATION", desc: "Adopter les technologies de pointe pour l'avenir." }
            ].map((value, i) => (
              <div key={i} className="group p-10 rounded-[40px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-900/20 group-hover:scale-110 transition-transform">
                  {value.icon}
                </div>
                <h4 className="text-[10px] font-black tracking-[0.2em] uppercase mb-4">{value.title}</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">{value.desc}</p>
              </div>
            ))}
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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 AFRO Négoce. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
