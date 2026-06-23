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
  Command,
  Headset,
  Building2,
  Factory
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AfroNegoceLogo, AestheticFlame } from '../components/Logo';
import { useLandingStore } from '../stores/useLandingStore';
import { PipelineSimulationModal } from '../components/PipelineSimulationModal';

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
    partnerLogos,
    productImages,
    logoImage,
    logoText,
    mascotImage
  } = useLandingStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

  const defaultHero = "https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&q=80&w=1000";
  const defaultButagaz = "https://upload.wikimedia.org/wikipedia/fr/thumb/3/3d/Logo_Butagaz.svg/1200px-Logo_Butagaz.svg.png";
  const defaultAirLiquide = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Air_Liquide_logo.svg/2560px-Air_Liquide_logo.svg.png";

  const getProductImage = (id: string, defaultImage: string) => {
    const customImage = productImages?.find(img => img.id === id);
    return customImage ? customImage.url : defaultImage;
  };

  const butagazProducts = [
    {
      id: 'butane-3',
      name: 'Butane 3KG',
      type: 'Butane',
      weight: '3 KG',
      use: 'Idéal pour le camping et le petit bricolage.',
      color: 'bg-blue-500',
      image: getProductImage('butane-3', 'https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_2.png')
    },
    {
      id: 'butane-12',
      name: 'Butane 12KG',
      type: 'Butane',
      weight: '12 KG',
      use: 'Pour la cuisine et le chauffage d\'appoint intérieur.',
      color: 'bg-blue-600',
      image: getProductImage('butane-12', 'https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_1.png')
    },
    {
      id: 'propane-34',
      name: 'Propane 34KG',
      type: 'Propane',
      weight: '34 KG',
      use: 'Pour les besoins énergétiques élevés et le stockage extérieur.',
      color: 'bg-red-600',
      image: getProductImage('propane-34', 'https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_0.png')
    }
  ];

  const industrialGases = [
    {
      id: 'oxygene-ind',
      name: 'Oxygène Industriel',
      desc: 'Haute pureté pour les procédés de combustion et d\'oxydation.',
      formula: 'O₂',
      tag: 'Industrie',
      specs: { taille: 'M20 / L50 / Cadre', pression: '200 bar', chapeau: 'Standard / SMARTOP™' },
      image: getProductImage('oxygene-ind', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'azote-ind',
      name: 'Azote Industriel',
      desc: 'Idéal pour l\'inertage, le dégazage et les tests de pression.',
      formula: 'N₂',
      tag: 'Inerte',
      specs: { taille: 'L50 / Cadre', pression: '200 bar', chapeau: 'Standard' },
      image: getProductImage('azote-ind', 'https://images.unsplash.com/photo-1532187875302-1df92d47ed17?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'argon-ind',
      name: 'Argon Pur',
      desc: 'Protection optimale pour les procédés haute température.',
      formula: 'Ar',
      tag: 'Protection',
      specs: { taille: 'M20 / L50', pression: '200 bar', chapeau: 'SMARTOP™' },
      image: getProductImage('argon-ind', 'https://images.unsplash.com/photo-1544725121-be3b5088f171?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'co2-ind',
      name: 'Dioxyde de Carbone',
      desc: 'Utilisé dans la métallurgie, le traitement des eaux et la chimie.',
      formula: 'CO₂',
      tag: 'Polyvalent',
      specs: { taille: 'L50 / B50', pression: '50 bar', chapeau: 'Standard' },
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
      specs: { taille: 'M20 / L50', pression: '50 bar', chapeau: 'ALIGAL™ Valve' },
      image: getProductImage('aligal-1', 'https://images.unsplash.com/photo-1543253687-c934c2e01861?auto=format&fit=crop&q=80&w=800')
    },
    {
      id: 'aligal-2',
      name: 'ALIGAL™ 2',
      formula: 'N₂',
      desc: 'Azote de qualité alimentaire pour le conditionnement sous atmosphère.',
      usage: 'Conditionnement',
      specs: { taille: 'L50', pression: '200 bar', chapeau: 'Standard' },
      image: getProductImage('aligal-2', 'https://images.unsplash.com/photo-1627483262769-04d4a11bf333?auto=format&fit=crop&q=80&w=800')
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="w-full bg-white border-b border-gray-100 z-[100] relative drop-shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {logoImage ? (
              <img src={logoImage} alt={logoText} className="h-10 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xl font-bold tracking-tight uppercase text-slate-900 font-display">
                {logoText || "AFRO NÉGOCE"}
              </span>
            )}
          </Link>
          
          {/* Nav Links */}
          <div className="hidden xl:flex items-center gap-5">
            <a href="#accueil" className="text-[11px] font-bold text-[#0B5C9C] border-b-[3px] border-[#0B5C9C] py-2 tracking-wide">ACCUEIL</a>
            <a href="#about" className="text-[11px] font-bold text-gray-600 hover:text-[#0B5C9C] py-2 tracking-wide transition-colors">À PROPOS</a>
            <a href="#solutions" className="text-[11px] font-bold text-gray-600 hover:text-[#0B5C9C] py-2 tracking-wide transition-colors">NOS SOLUTIONS</a>
            <a href="#products" className="text-[11px] font-bold text-gray-600 hover:text-[#0B5C9C] py-2 tracking-wide transition-colors">PRODUITS</a>
            <a href="#industries" className="text-[11px] font-bold text-gray-600 hover:text-[#0B5C9C] py-2 tracking-wide transition-colors">INDUSTRIES</a>
            <a href="#news" className="text-[11px] font-bold text-gray-600 hover:text-[#0B5C9C] py-2 tracking-wide transition-colors">ACTUALITÉS</a>
            <a href="#contact" className="text-[11px] font-bold text-gray-600 hover:text-[#0B5C9C] py-2 tracking-wide transition-colors">CONTACT</a>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-r border-slate-200 pr-4">
              <Phone className="w-4 h-4 text-slate-800" />
              <span>05 22 123 456</span>
            </div>
            <Link to="/afro-digital" className="text-[#0B5C9C] hover:text-blue-800 text-[11px] font-bold tracking-widest uppercase transition-colors">
              AFRO DIGITAL
            </Link>
            <Link to="/ecom" className="bg-[#0B5C9C] text-white px-5 py-2.5 text-xs font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors uppercase">
              Pièces & Matériel de Gaz <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="xl:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="xl:hidden bg-white border-t border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-6 flex flex-col gap-4">
                <a href="#accueil" onClick={() => setIsMenuOpen(false)} className="text-[11px] font-bold text-[#0B5C9C] py-2">ACCUEIL</a>
                <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-[11px] font-bold text-gray-600 py-2">À PROPOS</a>
                <a href="#solutions" onClick={() => setIsMenuOpen(false)} className="text-[11px] font-bold text-gray-600 py-2">NOS SOLUTIONS</a>
                <a href="#products" onClick={() => setIsMenuOpen(false)} className="text-[11px] font-bold text-gray-600 py-2">PRODUITS</a>
                <a href="#industries" onClick={() => setIsMenuOpen(false)} className="text-[11px] font-bold text-gray-600 py-2">INDUSTRIES</a>
                <a href="#news" onClick={() => setIsMenuOpen(false)} className="text-[11px] font-bold text-gray-600 py-2">ACTUALITÉS</a>
                <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-[11px] font-bold text-gray-600 py-2">CONTACT</a>
                <div className="h-px bg-slate-100 my-2" />
                <Link to="/afro-digital" onClick={() => setIsMenuOpen(false)} className="mx-auto block text-center w-full bg-slate-50 text-[#0B5C9C] px-6 py-3 border border-slate-200 text-xs font-bold uppercase tracking-widest">
                  AFRO DIGITAL
                </Link>
                <Link to="/ecom" onClick={() => setIsMenuOpen(false)} className="bg-[#0B5C9C] text-white px-6 py-3 text-xs font-bold flex items-center justify-center gap-2">
                  Pièces & Matériel de Gaz <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="accueil" className="relative min-h-[500px] lg:min-h-[700px] bg-white flex flex-col lg:flex-row overflow-hidden">
        {/* Left Content */}
        <div className="w-full lg:w-[50%] flex items-center px-6 lg:pl-[10%] lg:pr-10 relative z-10 pt-12 pb-12 lg:pt-16 lg:pb-24">
          <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            <h1 className="text-[2rem] leading-[1.1] md:text-5xl lg:text-[64px] font-black text-slate-900 lg:leading-[1.05] mb-6 font-display uppercase tracking-tight">
              L'ÉNERGIE POUR AUJOURD'HUI,<br />
              <span className="text-[#0B5C9C]">LES SOLUTIONS<br className="hidden lg:block" /> POUR DEMAIN.</span>
            </h1>
            <div className="w-12 h-1 bg-[#8CC63F] mx-auto lg:mx-0 mb-6 lg:mb-8"></div>
            
            <p className="text-sm md:text-base lg:text-lg text-slate-700 max-w-[500px] mx-auto lg:mx-0 leading-[1.6] font-medium mb-8 lg:mb-12">
              Afro Négoce fournit des solutions énergétiques fiables et durables : 
              gaz LPG, gaz industriels et solutions énergétiques pour l'industrie
              et les professionnels.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center lg:justify-start">
              <a href="#solutions" className="px-6 lg:px-8 py-3 lg:py-4 bg-[#0B5C9C] text-white text-[10px] lg:text-xs font-bold tracking-widest flex items-center justify-center gap-3 hover:bg-blue-800 transition-colors uppercase">
                Découvrir Nos Solutions <ChevronRight className="w-4 h-4" />
              </a>
              <a href="#about" className="px-6 lg:px-8 py-3 lg:py-4 bg-white text-[#0B5C9C] border border-[#0B5C9C] lg:border-2 text-[10px] lg:text-xs font-bold tracking-widest flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors uppercase">
                Qui Sommes-Nous ? <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Right curved image container */}
        <div className="w-full h-80 sm:h-[400px] lg:h-auto lg:w-[60%] lg:absolute lg:top-0 lg:right-0 lg:bottom-0 relative overflow-hidden mt-8 lg:mt-0">
          {/* Curve background */}
          <div className="absolute inset-0 z-0 bg-[#0B5C9C] hidden lg:block lg:[clip-path:ellipse(70%_120%_at_80%_0%)]"></div>
          {/* Main image */}
          <div className="absolute inset-x-4 lg:inset-x-0 inset-y-0 lg:inset-y-0 z-10 lg:pl-4 overflow-hidden rounded-2xl lg:rounded-none lg:[clip-path:ellipse(72%_100%_at_85%_-10%)]">
            <img 
              src={heroImage || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1600"} 
              alt="Industrial Gas Solutions" 
              className="w-full h-full object-cover object-center lg:object-[center_10%]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>


      {/* Partners */}
      <section className="py-12 bg-white border-y border-slate-100 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-24 opacity-70">
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
              </>
            ) : (
              <>
                <img src={defaultButagaz} alt="Butagaz" className="h-8 md:h-10 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                <img src={defaultAirLiquide} alt="Air Liquide" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Campingaz_logo.svg/2560px-Campingaz_logo.svg.png" alt="Campingaz" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                <img src="https://logo.clearbit.com/gurtner.fr" alt="Gurtner" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                <img src="https://logo.clearbit.com/nurgaz.com.tr" alt="Nurgaz" className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Value Prepositions / Features Bar */}
      <section className="bg-white border-b border-t border-gray-100 py-12 relative z-20 shadow-[0_4px_30px_rgb(0,0,0,0.03)] -mt-2 lg:mt-0">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-12 divide-x-0 lg:divide-x divide-gray-200">
            {[
              { title: "FIABILITÉ", desc: "Des produits de qualité et un service fiable au quotidien.", icon: <ShieldCheck className="w-8 h-8 text-[#0B5C9C]" /> },
              { title: "SÉCURITÉ", desc: "La sécurité est au cœur de toutes nos opérations et engagements.", icon: <CheckCircle2 className="w-8 h-8 text-[#0B5C9C]" /> },
              { title: "PERFORMANCE", desc: "Des solutions performantes pour optimiser vos processus industriels.", icon: <Zap className="w-8 h-8 text-[#0B5C9C]" /> },
              { title: "SOLUTIONS DURABLES", desc: "Nous innovons pour une énergie plus propre et un avenir plus durable.", icon: <Zap className="w-8 h-8 text-[#0B5C9C]" /> }, // Ideally Leaf
              { title: "PROXIMITÉ", desc: "Un réseau de proximité pour être toujours plus proche de vous.", icon: <MapPin className="w-8 h-8 text-[#0B5C9C]" /> },
              { title: "ACCOMPAGNEMENT", desc: "Nos experts vous accompagnent à chaque étape de vos projets.", icon: <Headset className="w-8 h-8 text-[#0B5C9C]" /> }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center px-4">
                <div className="mb-4 text-[#0B5C9C]">
                  {item.icon}
                </div>
                <h4 className="text-[11px] font-black text-[#0B5C9C] uppercase tracking-[0.2em] mb-3">
                  {item.title}
                </h4>
                <p className="text-[12px] text-gray-600 leading-[1.6] font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOS SOLUTIONS ÉNERGÉTIQUES */}
      <section id="solutions" className="py-20 lg:py-24 bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col items-center mb-16 relative">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#0B5C9C] uppercase tracking-wider mb-6 font-display text-center relative z-10 bg-[#FAFAFA] px-6">
              NOS SOLUTIONS <span className="text-slate-900">ÉNERGÉTIQUES</span>
            </h2>
            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 z-0 hidden md:block"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "GAZ LPG", 
                subtitle: "Solutions pour les professionnels et les collectivités.",
                img: "https://images.unsplash.com/photo-1542744173-05336fcc7ad4?auto=format&fit=crop&q=80&w=800"
              },
              { 
                title: "GAZ INDUSTRIELS", 
                subtitle: "CO2, O2, N2 et autres gaz pour vos applications industrielles.",
                img: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800"
              },
              { 
                title: "SOLUTIONS ÉNERGÉTIQUES", 
                subtitle: "Des solutions innovantes pour une énergie plus propre.",
                img: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=800"
              },
              { 
                title: "LIVRAISON & DISTRIBUTION", 
                subtitle: "Un service logistique fiable et réactif partout au Maroc.",
                img: "https://images.unsplash.com/photo-1586528116311-ad8ed7c50a63?auto=format&fit=crop&q=80&w=800"
              }
            ].map((sol, i) => (
              <div key={i} className="group relative rounded-xl hover:rounded-2xl overflow-hidden aspect-[4/3] md:aspect-auto md:h-[350px] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer border border-slate-100">
                <img src={sol.img} alt={sol.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-8 flex items-end justify-between">
                  <div>
                    <h3 className="text-white font-black text-xl leading-tight mb-2 uppercase tracking-wide">{sol.title}</h3>
                    <p className="text-white/80 text-sm font-medium leading-relaxed max-w-[220px] opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">{sol.subtitle}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white flex-shrink-0 group-hover:bg-[#0B5C9C] group-hover:scale-110 transition-all duration-300">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blue Stats Banner */}
      <section className="bg-[#0B5C9C] text-white py-12 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4 divide-y lg:divide-y-0 lg:divide-x divide-white/20">
            
            <div className="flex flex-col lg:flex-row items-center gap-4 lg:justify-center pt-4 lg:pt-0 text-center lg:text-left">
              <ShieldCheck className="w-10 h-10 lg:w-12 lg:h-12 text-white/50" />
              <div>
                <div className="text-3xl lg:text-4xl font-black text-[#8CC63F] tracking-tighter mb-1">+15</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Années d'Expertise</div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4 lg:justify-center pt-4 lg:pt-0 text-center lg:text-left">
              <Building2 className="w-10 h-10 lg:w-12 lg:h-12 text-white/50" />
              <div>
                <div className="text-3xl lg:text-4xl font-black text-[#8CC63F] tracking-tighter mb-1">+1 000</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Clients Satisfaits</div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4 lg:justify-center pt-4 lg:pt-0 text-center lg:text-left">
              <MapPin className="w-10 h-10 lg:w-12 lg:h-12 text-white/50" />
              <div>
                <div className="text-3xl lg:text-4xl font-black text-[#8CC63F] tracking-tighter mb-1">+20</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Villes Couvertes</div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4 lg:justify-center pt-4 lg:pt-0 text-center lg:text-left">
              <CheckCircle2 className="w-10 h-10 lg:w-12 lg:h-12 text-white/50" />
              <div>
                <div className="text-3xl lg:text-4xl font-black text-[#8CC63F] tracking-tighter mb-1">+50</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Collaborateurs</div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4 lg:justify-center pt-4 lg:pt-0 text-center lg:text-left">
              <ShieldCheck className="w-10 h-10 lg:w-12 lg:h-12 text-white/50" />
              <div>
                <div className="text-3xl lg:text-4xl font-black text-[#8CC63F] tracking-tighter mb-1">100%</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Sécurité & Qualité</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20 lg:py-24 bg-white border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col items-center mb-16 relative">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#0B5C9C] uppercase tracking-wider mb-6 font-display text-center relative z-10 bg-white px-6">
              NOTRE <span className="text-slate-900">CATALOGUE PRODUITS</span>
            </h2>
            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 z-0 hidden md:block"></div>
          </div>

          {/* BUTAGAZ GAMME */}
          <div className="mb-24">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
              <div>
                 <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">
                    GAMME <span className="text-[#0B5C9C]">BUTAGAZ</span>
                 </h3>
                 <p className="text-slate-600 font-medium text-lg max-w-2xl">
                    Revendeur exclusif, nous proposons des solutions Butagaz pour le chauffage, la cuisson et les besoins industriels. La confiance d'une marque iconique depuis 1976.
                 </p>
              </div>
              <div className="shrink-0 flex items-center justify-center bg-[#FAFAFA] border border-slate-100 rounded-xl p-4">
                 <img src={mascotImage || "https://static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_0.png"} alt="Mascot" className="w-24 lg:w-32 h-auto" referrerPolicy="no-referrer" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {butagazProducts.map((product, i) => (
                <div 
                  key={product.id}
                  className="bg-[#FAFAFA] rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:border-[#0B5C9C]/30 transition-all flex flex-col"
                >
                  <div className="aspect-[4/3] bg-white p-6 relative">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded text-white text-[10px] font-bold uppercase tracking-widest ${product.color}`}>
                      {product.type}
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col border-t border-slate-100">
                    <span className="text-2xl font-black text-[#0B5C9C] mb-2">{product.weight}</span>
                    <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-widest">{product.name}</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                      {product.use}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#8CC63F] uppercase tracking-widest flex items-center gap-2">
                         <CheckCircle2 className="w-4 h-4" /> En Stock
                      </span>
                      <button className="text-[#0B5C9C] hover:text-blue-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        Détails <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AIR LIQUIDE GAMME */}
          <div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
              <div>
                 <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">
                    GAMME <span className="text-[#0B5C9C]">AIR LIQUIDE</span>
                 </h3>
                 <p className="text-slate-600 font-medium text-lg max-w-2xl">
                    Gamme complète de gaz industriels et alimentaires pour répondre aux exigences de chaque secteur d'activité.
                 </p>
              </div>
            </div>

            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Gaz Industriels</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {industrialGases.map((gas, i) => (
                <div 
                  key={gas.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-[#0B5C9C]/30 transition-all"
                >
                  <div className="w-12 h-12 bg-[#0B5C9C]/10 text-[#0B5C9C] rounded flex items-center justify-center font-black text-xl mb-4">
                     {gas.formula}
                  </div>
                  <h5 className="font-bold text-slate-900 mb-2 uppercase text-sm tracking-wide">{gas.name}</h5>
                  <p className="text-sm text-slate-500 mb-4">{gas.desc}</p>
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded">
                     {gas.tag}
                  </span>
                </div>
              ))}
            </div>

            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Gaz Alimentaires (ALIGAL™)</h4>
            <div className="grid md:grid-cols-2 gap-6">
              {foodGases.map((gas, i) => (
                <div 
                  key={gas.id}
                  className="flex flex-col sm:flex-row items-center gap-6 bg-[#FAFAFA] border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-[#0B5C9C]/30 transition-all"
                >
                  <div className="w-24 h-24 shrink-0 bg-white rounded-lg border border-slate-100 overflow-hidden flex items-center justify-center p-2">
                     <img src={gas.image} alt={gas.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                       <h5 className="font-black text-slate-900 text-lg uppercase">{gas.name}</h5>
                       <span className="px-2 py-1 bg-[#0B5C9C]/10 text-[#0B5C9C] text-[10px] font-bold uppercase rounded">{gas.formula}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{gas.desc}</p>
                    <div className="text-[11px] font-bold text-[#8CC63F] uppercase tracking-wider">
                       Usage : {gas.usage}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
               <Link to="/ecom" className="inline-flex items-center justify-center px-8 py-4 bg-[#8CC63F] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#7ab033] transition-colors rounded">
                 VOIR TOUS LES PRODUITS <ArrowRight className="ml-2 w-4 h-4" />
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services - Installation Pipeline */}
      <section id="industries" className="py-20 lg:py-24 bg-[#FAFAFA] border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col items-center mb-16 relative">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#0B5C9C] uppercase tracking-wider mb-6 font-display text-center relative z-10 bg-[#FAFAFA] px-6">
              INSTALLATION & <span className="text-slate-900">INGÉNIERIE</span>
            </h2>
            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 z-0 hidden md:block"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
             <div className="relative order-2 lg:order-1 space-y-6">
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">
                  Réseaux de gaz <span className="text-[#0B5C9C]">industriels et tertiaires</span>
               </h3>
               <p className="text-slate-600 font-medium text-lg leading-relaxed mb-8">
                  Conception, réalisation et maintenance de réseaux d'installations de gaz complexes. Nous garantissons la sécurité, la rigueur technique et la conformité totale de vos installations.
               </p>

               <div className="space-y-4">
                 {[
                   { title: "Réseaux Industriels", desc: "Réseaux en Inox et Acier carbone (soudure TIG), certifiés Haute/Basse Pression.", icon: <Factory className="w-5 h-5" /> },
                   { title: "Secteur Tertiaire", desc: "Alimentation de cuisines professionnelles, chaudières, et réseaux Cuivre/Acier.", icon: <Building2 className="w-5 h-5" /> },
                   { title: "Systèmes de Sécurité", desc: "Mise en place d'électrovannes, détecteurs et systèmes de coupure d'urgence.", icon: <ShieldCheck className="w-5 h-5" /> }
                 ].map((feature, i) => (
                   <div key={i} className="flex gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:shadow-md hover:border-[#0B5C9C]/30 transition-all">
                     <div className="w-12 h-12 rounded bg-[#0B5C9C]/10 text-[#0B5C9C] flex items-center justify-center shrink-0">
                       {feature.icon}
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-900 uppercase tracking-wide text-sm mb-1">{feature.title}</h4>
                       <p className="text-sm text-slate-500">{feature.desc}</p>
                     </div>
                   </div>
                 ))}
               </div>
               
               <div className="pt-6">
                 <button 
                    onClick={() => setIsSimulationModalOpen(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-[#0B5C9C] hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-3"
                 >
                    <Activity className="w-4 h-4" />
                    Simulateur de Capacité (Pipeline)
                 </button>
               </div>
             </div>

             <div className="relative order-1 lg:order-2">
               <div className="aspect-[4/3] rounded-2xl overflow-hidden relative group shadow-xl">
                 <img 
                   src={pipelineImage} 
                   alt="Gas Pipeline Installation" 
                   className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                   referrerPolicy="no-referrer"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                 
                 <div className="absolute bottom-6 left-6">
                    <div className="flex items-center gap-3 bg-white/95 backdrop-blur rounded p-3 shadow-lg">
                      <div className="w-10 h-10 bg-[#8CC63F]/20 text-[#8CC63F] rounded flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Qualité Assurée</p>
                        <p className="text-xs font-black text-slate-900 uppercase">Certifié ISO 9001</p>
                      </div>
                    </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* News & Events */}
      {news.length > 0 && (
        <section id="news" className="py-20 lg:py-24 bg-white border-t border-slate-100">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex flex-col items-center mb-16 relative">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#0B5C9C] uppercase tracking-wider mb-6 font-display text-center relative z-10 bg-white px-6">
                ACTUALITÉS <span className="text-slate-900">& ÉVÉNEMENTS</span>
              </h2>
              <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 z-0 hidden md:block"></div>
            </div>

            <div className="flex justify-end mb-8">
              <Link to="/cms/news" className="text-[#0B5C9C] hover:text-blue-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-colors">
                Voir toutes les actualités <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative bg-[#FAFAFA] rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:border-[#0B5C9C]/30 transition-all flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 border-b border-slate-100">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Newspaper className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white text-[#0B5C9C] text-[10px] font-bold uppercase tracking-widest rounded shadow-sm">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">
                      {new Date(item.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-[#0B5C9C] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>
                    <div className="mt-auto">
                      <button className="text-[#0B5C9C] font-bold text-[11px] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                        Lire la suite <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}



      {/* Contact Section */}
      <section id="contact" className="py-20 lg:py-24 bg-[#FAFAFA] border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="bg-[#0B5C9C] rounded-2xl overflow-hidden relative shadow-2xl">
            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-10" style={{ 
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
              backgroundSize: '24px 24px'
            }} />
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#0A4B82] to-transparent z-0"></div>
            
            <div className="relative z-10 p-8 md:p-16 lg:p-20 flex flex-col xl:flex-row items-center justify-between gap-12">
              <div className="max-w-2xl text-center xl:text-left">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#8CC63F]/20 text-[#8CC63F] border border-[#8CC63F]/30 mb-6 text-[10px] font-bold uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#8CC63F] animate-pulse"></div>
                   Assistance Réactive
                 </div>
                 
                 <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight mb-6 font-display">
                    BESOIN D'UNE ASSISTANCE <span className="text-[#8CC63F]">IMMÉDIATE ?</span>
                 </h2>
                 
                 <p className="text-blue-100 text-lg font-medium mb-10 max-w-xl mx-auto xl:mx-0">
                    Notre équipe d'experts est disponible pour vos besoins en approvisionnement ou pour toute intervention technique d'urgence.
                 </p>
                 
                 <div className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-6">
                    <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="group w-full sm:w-auto bg-white hover:bg-slate-50 text-[#0B5C9C] rounded flex items-center p-2 pr-6 transition-all shadow-lg">
                       <div className="w-12 h-12 bg-[#0B5C9C]/10 rounded flex items-center justify-center shrink-0 mr-4">
                          <Phone className="w-5 h-5 text-[#0B5C9C]" />
                       </div>
                       <span className="font-bold text-xl tracking-wider">{contactPhone}</span>
                    </a>
                    
                    <a href={`mailto:${contactEmail}`} className="flex items-center gap-4 text-blue-200 hover:text-white transition-colors">
                       <div className="w-12 h-12 rounded border border-blue-400/30 flex items-center justify-center bg-white/5">
                          <Mail className="w-5 h-5" />
                       </div>
                       <div className="text-left">
                         <span className="block text-[10px] font-bold uppercase tracking-widest text-[#8CC63F] mb-0.5">Écrivez-nous</span>
                         <span className="block text-sm font-medium">{contactEmail}</span>
                       </div>
                    </a>
                 </div>
              </div>
              
              <div className="w-full max-w-sm shrink-0">
                 <div className="bg-white rounded-xl p-8 text-center shadow-2xl relative">
                   <div className="w-16 h-16 bg-[#0B5C9C]/10 text-[#0B5C9C] rounded-full flex items-center justify-center mx-auto mb-6">
                     <Headset className="w-8 h-8" />
                   </div>
                   <h3 className="text-[#0B5C9C] font-black text-xl mb-2 uppercase">Service Client</h3>
                   <p className="text-slate-500 text-sm mb-6">Lundi - Samedi <br /> 08:00 - 18:00</p>
                   <p className="text-xs font-bold text-slate-700 bg-slate-100 py-2 px-4 rounded-full inline-block">
                     Temps de réponse &lt; 2h
                   </p>
                 </div>
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

      <PipelineSimulationModal isOpen={isSimulationModalOpen} onClose={() => setIsSimulationModalOpen(false)} />
    </div>
  );
}
