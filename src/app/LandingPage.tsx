import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { 
  Droplets, 
  Settings, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Truck,
  Wrench,
  ChevronRight,
  Globe,
  Zap,
  Activity,
  Cpu,
  BarChart3,
  Menu,
  X,
  Newspaper,
  Compass,
  Command
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AfroNegoceLogo, AestheticFlame } from '../components/Logo';
import { useLandingStore } from '../stores/useLandingStore';

const GridBackground = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#1e3a8a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
  </div>
);

const ParallaxImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div 
      style={{ x: mousePos.x, y: mousePos.y }}
      className={className}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover transition-transform duration-[2s]" referrerPolicy="no-referrer" />
    </motion.div>
  );
};

const Marquee = ({ children, reverse = false }: { children: React.ReactNode, reverse?: boolean }) => (
  <div className="flex overflow-hidden select-none gap-12 group">
    <div className={`flex flex-none gap-12 py-4 animate-marquee ${reverse ? 'animate-reverse' : ''}`}>
      {children}
      {children}
    </div>
  </div>
);

export default function LandingPage() {
  const { 
    heroImage, 
    heroTitle, 
    heroSubtitle, 
    heroDescription,
    aboutTitle,
    aboutDescription,
    servicesTitle,
    servicesDescription,
    pipelineImage,
    contactPhone,
    contactEmail,
    contactAddress,
    butagazCardImage,
    airLiquideCardImage,
    contactBgImage,
    partnerLogos 
  } = useLandingStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [butagazMascot, setButagazMascot] = useState("https://static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_0.png");
  const [news, setNews] = useState<any[]>([]);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => {
        const butagaz = data.find((b: any) => b.id === 'b1');
        if (butagaz && butagaz.mascot_url) {
          setButagazMascot(butagaz.mascot_url);
        }
      })
      .catch(() => {});

    fetch('/api/news')
      .then(res => res.json())
      .then(data => setNews(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  const defaultHero = "https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&q=80&w=1000";
  const defaultButagaz = "https://upload.wikimedia.org/wikipedia/fr/thumb/3/3d/Logo_Butagaz.svg/1200px-Logo_Butagaz.svg.png";
  const defaultAirLiquide = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Air_Liquide_logo.svg/2560px-Air_Liquide_logo.svg.png";

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl z-[100] border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-4 group">
              <span className="text-xl font-black tracking-tighter text-slate-900 uppercase font-display">AFRO Négoce</span>
            </Link>
            
            <div className="hidden lg:flex items-center gap-10">
              <div className="flex items-center gap-8">
                <a href="#about" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-blue-600 transition-colors">À Propos</a>
                <Link to="/notre-histoire" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-blue-600 transition-colors">Notre Histoire</Link>
                <a href="#products" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-blue-600 transition-colors">Produits</a>
                <Link to="/ecom" className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 hover:text-blue-700 transition-colors">Pièces de Gaz</Link>
              </div>
              
              <div className="h-6 w-px bg-slate-200" />
              
              <Link 
                to="/afro-digital" 
                className="group relative inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 overflow-hidden"
              >
                <span className="relative z-10">Afro Digital</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="lg:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">À Propos</a>
                <Link to="/notre-histoire" onClick={() => setIsMenuOpen(false)} className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Notre Histoire</Link>
                <a href="#products" onClick={() => setIsMenuOpen(false)} className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Produits</a>
                <Link to="/ecom" onClick={() => setIsMenuOpen(false)} className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Pièces de Gaz</Link>
                <div className="h-px bg-slate-100 my-2" />
                <Link 
                  to="/afro-digital" 
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-full"
                >
                  Afro Digital <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section - Editorial Mega Layout */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden bg-white">
        <GridBackground />
        
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1],
              x: [0, -40, 0],
              y: [0, 60, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[140px]"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-8 flex flex-col justify-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/5 backdrop-blur-sm border border-slate-900/5 mb-10 overflow-hidden group">
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 relative">
                    <span className="animate-ping absolute inset-0 rounded-full bg-blue-600 opacity-75"></span>
                  </span>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">{heroSubtitle}</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 leading-[0.95] tracking-[-0.02em] mb-10 font-display uppercase">
                  {heroTitle.split(' ').map((word, i) => {
                    const isHighlight = ['DISTRIBUTION', 'GAZ'].includes(word);
                    return (
                      <React.Fragment key={i}>
                        {isHighlight ? (
                          <span className="text-blue-600 inline-flex items-center gap-4">
                            {word}
                            {word === 'GAZ' && (
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "80px" }}
                                transition={{ delay: 0.5, duration: 1 }}
                                className="hidden lg:block h-2 bg-blue-600/10 rounded-full"
                              />
                            )}
                          </span>
                        ) : word}
                        {i !== heroTitle.split(' ').length - 1 && ' '}
                      </React.Fragment>
                    );
                  })}
                </h1>
                
                <div className="flex flex-col md:flex-row items-start gap-12 mb-12">
                  <p className="text-lg text-slate-500 max-w-sm leading-[1.4] font-medium border-l-2 border-blue-600 pl-6">
                    {heroDescription}
                  </p>
                  
                  <div className="flex flex-col gap-4">
                    <a href="#products" className="group relative px-8 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30 flex items-center gap-4 overflow-hidden">
                      <span className="relative z-10">Explorer le catalogue</span>
                      <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/10 to-blue-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </a>
                    <Link to="/afro-digital" className="px-8 py-4 bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-slate-200 hover:border-slate-900 transition-all flex items-center gap-4">
                      Portail Digital
                      <Compass className="w-4 h-4 text-blue-600" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="lg:col-span-4 relative group">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Main Hero Card */}
                <div className="w-full aspect-[3/4] rounded-[3rem] overflow-hidden relative shadow-[0_50px_100px_-20px_rgba(30,58,138,0.25)] border border-slate-100 bg-slate-50">
                  <img 
                    src={heroImage || defaultHero} 
                    alt="Hero" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent" />
                </div>

                {/* Butagaz Floating Badge - Position BOTTOM LEFT */}
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                  className="absolute -bottom-8 -left-8 z-20 w-28 h-28 md:w-36 md:h-36 drop-shadow-2xl hover:scale-110 transition-transform duration-500 cursor-pointer"
                >
                  <img src={butagazMascot} alt="Butagaz" className="w-full h-auto" />
                </motion.div>
                
                {/* Experience Badge - Position TOP RIGHT */}
                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 z-20 bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 hidden md:block text-center"
                >
                  <div className="text-2xl font-black font-display tracking-tighter mb-1">50</div>
                  <div className="text-[6px] font-black uppercase tracking-[0.3em] opacity-60">Years / Exp</div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


      {/* Partners - Marquee */}
      <section className="py-12 bg-white border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Marquee>
            <div className="flex items-center gap-24">
              {partnerLogos.length > 0 ? (
                <>
                  {partnerLogos.map((logo) => (
                    <img 
                      key={logo.id} 
                      src={logo.url} 
                      alt={logo.name} 
                      className="h-8 md:h-10 object-contain grayscale hover:grayscale-0 transition-all duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                  ))}
                  <img src="https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_0.png" onError={(e) => { e.currentTarget.src = 'https://logo.clearbit.com/somap.fr'; }} alt="SOMAP" className="h-8 md:h-10 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                </>
              ) : (
                <>
                  <img src={defaultButagaz} alt="Butagaz" className="h-8 md:h-10 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <img src={defaultAirLiquide} alt="Air Liquide" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Campingaz_logo.svg/2560px-Campingaz_logo.svg.png" alt="Campingaz" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <img src="https://logo.clearbit.com/gurtner.fr" alt="Gurtner" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <img src="https://logo.clearbit.com/nurgaz.com.tr" alt="Nurgaz" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <img src="https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_0.png" onError={(e) => { e.currentTarget.src = 'https://logo.clearbit.com/somap.fr'; }} alt="SOMAP" className="h-8 md:h-10 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                </>
              )}
              
              {partnerLogos.length === 0 && (
                <>
                  <img src={defaultButagaz} alt="Butagaz" className="h-8 md:h-10 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <img src={defaultAirLiquide} alt="Air Liquide" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Campingaz_logo.svg/2560px-Campingaz_logo.svg.png" alt="Campingaz" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <img src="https://logo.clearbit.com/gurtner.fr" alt="Gurtner" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <img src="https://logo.clearbit.com/nurgaz.com.tr" alt="Nurgaz" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <img src="https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_0.png" onError={(e) => { e.currentTarget.src = 'https://logo.clearbit.com/somap.fr'; }} alt="SOMAP" className="h-8 md:h-10 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                </>
              )}
            </div>
          </Marquee>
        </div>
      </section>

      {/* Features - Bento Grid Style */}
      <section id="about" className="py-24 lg:py-40 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start mb-24 lg:mb-32">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.6em] mb-8 font-mono">Expertise System.01</h2>
              <h3 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.9] mb-10 font-display uppercase">
                {aboutTitle.split(' ').map((word, i) => (
                  <React.Fragment key={i}>
                    {word === 'et' ? (
                      <span className="text-blue-600 italic font-serif font-light lowercase"> {word} </span>
                    ) : word}
                    {i === 0 && <br />}
                  </React.Fragment>
                ))}
              </h3>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:pt-10"
            >
              <p className="text-xl text-slate-500 leading-tight font-medium max-w-xl font-sans">
                {aboutDescription}
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 lg:gap-8">
            {[
              { 
                title: "Dépositaire Butagaz", 
                desc: "Dépositaire exclusif de la marque Butagaz depuis 1976.",
                icon: <ShieldCheck className="w-6 h-6" />,
                color: "bg-blue-600",
              },
              { 
                title: "Premium Air Liquide", 
                desc: "Partenaire premium pour la distribution de gaz industriels.",
                icon: <CheckCircle2 className="w-6 h-6" />,
                color: "bg-slate-900",
              },
              { 
                title: "Logistique Domicile", 
                desc: "Un service de livraison optimisé pour tous les secteurs.",
                icon: <Truck className="w-6 h-6" />,
                color: "bg-slate-800",
              },
              { 
                title: "Installation Pipeline", 
                desc: "Conception et réalisation de réseaux fluides complexes.",
                icon: <Wrench className="w-6 h-6" />,
                color: "bg-blue-500",
              },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 lg:p-10 rounded-[2.5rem] bg-white border border-slate-100 group hover:shadow-[0_30px_60px_-15px_rgba(30,58,138,0.1)] transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  {React.cloneElement(feature.icon as React.ReactElement<any>, { className: "w-24 h-24" })}
                </div>
                <div className={`mb-8 w-14 h-14 ${feature.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  {feature.icon}
                </div>
                <h4 className="text-[9px] font-black text-slate-400 mb-4 tracking-[0.3em] uppercase">{feature.title}</h4>
                <p className="text-slate-900 leading-[1.2] font-black text-xl lg:text-2xl tracking-tighter uppercase">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products - Editorial Style */}
      <section id="products" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 lg:mb-24 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-6">Notre Catalogue</h2>
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none font-display">PRODUITS DE <br /><span className="font-serif italic font-light">classe</span> MONDIALE.</h3>
            </div>
            <Link to="/ecom" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 transition-colors">
              Voir tout le catalogue
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Butagaz Card */}
            <Link to="/butagaz">
              <motion.div 
                whileHover={{ y: -10 }}
                className="group relative bg-slate-900 rounded-[2.5rem] lg:rounded-[60px] overflow-hidden aspect-[4/5] md:aspect-square lg:aspect-[4/5] shadow-2xl shadow-slate-200"
              >
                <img 
                  src={butagazCardImage} 
                  alt="Butagaz" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                  <div className="relative mb-6">
                    <motion.img 
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      src={butagazMascot} 
                      alt="Butagaz Mascot" 
                      className="w-32 lg:w-40 h-auto drop-shadow-2xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest mb-4 font-serif italic">Partenaire Butagaz</div>
                  <h4 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4 font-display">BUTANE & PROPANE</h4>
                  <p className="text-slate-300 mb-8 font-medium max-w-sm text-base lg:text-lg">Solutions Butagaz pour le chauffage, la cuisson et les besoins industriels.</p>
                  <div className="flex flex-wrap gap-2 lg:gap-3">
                    {['Bouteilles', 'Chauffage'].map((tag) => (
                      <span key={tag} className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest border border-white/10">{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Air Liquide Card */}
            <Link to="/air-liquide">
              <motion.div 
                whileHover={{ y: -10 }}
                className="group relative bg-blue-600 rounded-[2.5rem] lg:rounded-[60px] overflow-hidden aspect-[4/5] md:aspect-square lg:aspect-[4/5] shadow-2xl shadow-blue-200"
              >
                <img 
                  src={airLiquideCardImage} 
                  alt="Air Liquide" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4 font-serif italic">Partenaire Air Liquide</div>
                  <h4 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4 font-display">AIR LIQUIDE</h4>
                  <p className="text-blue-100 mb-8 font-medium max-w-sm text-base lg:text-lg">Gamme complète Air Liquide pour l'industrie et la maintenance.</p>
                  <div className="flex flex-wrap gap-2 lg:gap-3">
                    {['Oxygène', 'Azote', 'Soudage'].map((tag) => (
                      <span key={tag} className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest border border-white/10">{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* News & Events - Modern Editorial */}
      {news.length > 0 && (
        <section className="py-24 lg:py-40 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-24 gap-default">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-2xl"
              >
                <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.6em] mb-8 font-mono">System Intel.03</h2>
                <h3 className="text-5xl md:text-6xl lg:text-8xl font-black text-slate-900 tracking-[-0.04em] leading-[0.9] mb-10 font-display uppercase">
                  FLASH <br />
                  <span className="text-blue-600 italic font-serif font-light lowercase">info</span> RÉSEAU.
                </h3>
              </motion.div>
              <Link to="/cms/news" className="group inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 hover:text-blue-600 transition-all mb-4 lg:mb-10">
                Archives complètes
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
              {news.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.8 }}
                  className="group relative bg-white rounded-[3rem] overflow-hidden border border-slate-100 hover:shadow-[0_50px_100px_-20px_rgba(30,58,138,0.15)] transition-all duration-700"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-50">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Newspaper className="w-16 h-16 text-slate-300 opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-6 left-6">
                      <span className="px-4 py-1.5 bg-white/90 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 border border-white/20 shadow-xl">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-10 lg:p-12">
                    <div className="text-[10px] font-black text-blue-600 mb-6 uppercase tracking-[0.3em] font-mono">
                      {new Date(item.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <h4 className="text-2xl lg:text-3xl font-black text-slate-900 mb-6 line-clamp-2 leading-[1.1] tracking-tight group-hover:text-blue-600 transition-colors uppercase">
                      {item.title}
                    </h4>
                    <p className="text-slate-500 text-lg mb-10 line-clamp-3 leading-relaxed font-medium">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 group-hover:gap-6 transition-all duration-500">
                      Explorer le rapport <ArrowRight className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services - Hardware/Technical Precision */}
      <section id="services" className="py-24 lg:py-40 bg-slate-950 text-white overflow-hidden relative border-y border-white/5">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ 
          backgroundImage: 'linear-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.1) 1px, transparent 1px)', 
          backgroundSize: '100px 100px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black, transparent)'
        }} />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            <div className="lg:col-span-12 mb-8 lg:mb-12">
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 1 }}
                className="h-px w-full bg-gradient-to-r from-transparent via-blue-900 to-transparent mb-8 lg:mb-12"
              />
            </div>

            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-blue-600/5 border border-blue-600/10 mb-8 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.3em] font-mono">Precision System v2.0</span>
              </div>
              
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-8 font-display uppercase text-white">
                {servicesTitle}
              </h3>

              <p className="text-lg lg:text-2xl text-slate-400 leading-relaxed font-light max-w-2xl mb-16 lg:mb-20">
                {servicesDescription.split('.').map((part, i) => (
                  <span key={i} className={i === 1 ? "text-white font-medium block mt-2" : ""}>
                    {part}{part && '.'}
                  </span>
                ))}
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "INDUSTRIEL", value: "HP/BP", detail: "Réseaux Inox/Acier", icon: <Cpu className="w-6 h-6" /> },
                  { title: "TERTIAIRE", value: "FLUX", detail: "Cuisines & Chauffage", icon: <Droplets className="w-6 h-6" /> },
                  { title: "SÉCURITÉ", value: "DRV", detail: "Détection & Coupure", icon: <ShieldCheck className="w-6 h-6" /> }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -5 }}
                    className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group"
                  >
                    <div className="text-blue-500 mb-6 group-hover:scale-110 transition-transform">{stat.icon}</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">{stat.title}</div>
                    <div className="text-4xl font-black mb-1 font-display tracking-tighter text-white">{stat.value}</div>
                    <div className="text-xs text-slate-400 font-medium">{stat.detail}</div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-5 relative mt-8 lg:mt-0">
              <div className="aspect-[4/5] rounded-[60px] overflow-hidden relative group">
                <img 
                  src={pipelineImage} 
                  alt="Gas Pipeline Installation" 
                  className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay group-hover:bg-transparent transition-colors" />
                <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                      <p className="text-sm font-bold text-white uppercase tracking-tighter">Certifié Conforme</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Technical markers */}
              <div className="absolute -top-6 -right-6 w-32 h-32 border-t-2 border-r-2 border-blue-600/30 rounded-tr-[40px] hidden lg:block" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border-b-2 border-l-2 border-blue-600/30 rounded-bl-[40px] hidden lg:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 lg:py-32 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
          <img src={contactBgImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-600/90 to-blue-600/50" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-6 border border-white/20 backdrop-blur-md">
                Assistance 24/7
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none mb-6 lg:mb-8 font-display">
                BESOIN <br />D'ASSISTANCE ?
              </h2>
              <p className="text-blue-100 text-lg lg:text-xl font-medium max-w-md mb-10 lg:mb-12">
                Notre centre d'appels est à votre disposition pour toute commande ou demande d'intervention.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="group flex items-center justify-between w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-900 rounded-[2rem] lg:rounded-[32px] p-2 pr-6 lg:pr-8 shadow-2xl transition-all">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white mr-4 lg:mr-6 group-hover:scale-105 transition-transform shadow-lg shadow-blue-200">
                    <Phone className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <div className="text-left font-mono text-xl lg:text-2xl font-black tracking-tight">
                    {contactPhone}
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimalist */}
      <footer className="bg-white text-slate-900 pt-20 lg:pt-32 pb-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-16 lg:mb-24">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-6 lg:mb-8">
                <span className="text-xl font-black tracking-tighter uppercase font-display text-slate-900">AFRO Négoce</span>
              </div>
              <p className="text-base lg:text-lg text-slate-500 max-w-sm mb-8 lg:mb-10 font-medium leading-relaxed">
                Votre partenaire énergétique de confiance au Maroc. Distribution de gaz Butagaz et Air Liquide.
              </p>
              <div className="flex gap-4">
                <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                  <Phone className="w-5 h-5" />
                </a>
                <a href={`mailto:${contactEmail}`} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 lg:mb-8">Navigation</h4>
              <ul className="space-y-4 text-[10px] font-black uppercase tracking-[0.2em]">
                <li><a href="#about" className="hover:text-blue-600 transition-colors">À Propos</a></li>
                <li><Link to="/notre-histoire" className="hover:text-blue-600 transition-colors">Notre Histoire</Link></li>
                <li><a href="#products" className="hover:text-blue-600 transition-colors">Produits</a></li>
                <li><Link to="/afro-digital" className="hover:text-blue-600 transition-colors">Afro Digital</Link></li>
              </ul>
            </div>
            
            <div className="md:col-span-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 lg:mb-8">Contact</h4>
              <ul className="space-y-4 lg:space-y-6 text-sm font-medium text-slate-500">
                <li className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="font-serif italic">{contactAddress}</span>
                </li>
                <li className="flex items-center gap-4">
                  <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="font-mono">{contactPhone}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 lg:pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center md:text-left">
            <p>© 2026 AFRO Négoce. Tous droits réservés.</p>
            <div className="flex flex-wrap justify-center gap-6 lg:gap-10">
              <a href="#" className="hover:text-blue-600 transition-colors">Mentions Légales</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
