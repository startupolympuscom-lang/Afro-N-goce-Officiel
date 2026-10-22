import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Zap,
  Leaf,
  Activity,
  Menu,
  X,
  Newspaper,
  Headset,
  Building2,
  Factory,
  Award,
  Users,
  HardHat,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLandingStore } from '../stores/useLandingStore';
import { usePageMeta, SITE_URL, SITE_NAME, HOME_TITLE, HOME_DESCRIPTION } from '../lib/seo';
import { formatPhoneMA, toInternationalPhoneMA } from '../lib/formatters';

const PipelineSimulationModal = lazy(() =>
  import('../components/PipelineSimulationModal').then((m) => ({ default: m.PipelineSimulationModal })),
);

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  category?: string;
  date: string;
}

const NAV_ITEMS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'about', label: 'À propos' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'products', label: 'Produits' },
  { id: 'installation', label: 'Installation' },
  { id: 'news', label: 'Actualités' },
  { id: 'contact', label: 'Contact' },
];

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1600';
const DEFAULT_MASCOT = 'https://static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_0.png';
const DEFAULT_PARTNERS = [
  { id: 'butagaz', name: 'Butagaz', url: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3d/Logo_Butagaz.svg/1200px-Logo_Butagaz.svg.png' },
  { id: 'air-liquide', name: 'Air Liquide', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Air_Liquide_logo.svg/2560px-Air_Liquide_logo.svg.png' },
  { id: 'campingaz', name: 'Campingaz', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Campingaz_logo.svg/2560px-Campingaz_logo.svg.png' },
  { id: 'gurtner', name: 'Gurtner', url: 'https://logo.clearbit.com/gurtner.fr' },
  { id: 'nurgaz', name: 'Nurgaz', url: 'https://logo.clearbit.com/nurgaz.com.tr' },
];

const VALUES = [
  { title: 'Fiabilité', desc: 'Des produits de qualité et un service fiable au quotidien.', icon: ShieldCheck },
  { title: 'Sécurité', desc: 'La sécurité est au cœur de toutes nos opérations et engagements.', icon: CheckCircle2 },
  { title: 'Performance', desc: 'Des solutions performantes pour optimiser vos processus industriels.', icon: Zap },
  { title: 'Solutions durables', desc: 'Nous innovons pour une énergie plus propre et un avenir plus durable.', icon: Leaf },
  { title: 'Proximité', desc: 'Un réseau de proximité pour être toujours plus proche de vous.', icon: MapPin },
  { title: 'Accompagnement', desc: 'Nos experts vous accompagnent à chaque étape de vos projets.', icon: Headset },
];

const STATS = [
  { value: '+15', label: "Années d'expertise", icon: Award },
  { value: '+1\u00a0000', label: 'Clients satisfaits', icon: Users },
  { value: '+20', label: 'Villes couvertes', icon: MapPin },
  { value: '+50', label: 'Collaborateurs', icon: HardHat },
  { value: '100%', label: 'Sécurité & qualité', icon: ShieldCheck },
];

const SOLUTIONS = [
  {
    title: 'Gaz LPG',
    subtitle: 'Solutions pour les professionnels et les collectivités.',
    href: '#gamme-butagaz',
    img: 'https://images.unsplash.com/photo-1542744173-05336fcc7ad4?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Gaz industriels',
    subtitle: 'CO₂, O₂, N₂ et autres gaz pour vos applications industrielles.',
    href: '#gamme-air-liquide',
    img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Solutions énergétiques',
    subtitle: 'Des solutions innovantes pour une énergie plus propre.',
    href: '#installation',
    img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Livraison & distribution',
    subtitle: 'Un service logistique fiable et réactif partout au Maroc.',
    href: '#contact',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8ed7c50a63?auto=format&fit=crop&q=80&w=800',
  },
];

const BUTAGAZ_PRODUCTS = [
  {
    id: 'butane-3',
    name: 'Butane 3 kg',
    type: 'Butane',
    weight: '3 kg',
    use: 'Idéal pour le camping et le petit bricolage.',
    badge: 'bg-afro-blue',
    image: 'https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_2.png',
  },
  {
    id: 'butane-12',
    name: 'Butane 12 kg',
    type: 'Butane',
    weight: '12 kg',
    use: "Pour la cuisine et le chauffage d'appoint intérieur.",
    badge: 'bg-afro-blue',
    image: 'https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_1.png',
  },
  {
    id: 'propane-34',
    name: 'Propane 34 kg',
    type: 'Propane',
    weight: '34 kg',
    use: 'Pour les besoins énergétiques élevés et le stockage extérieur.',
    badge: 'bg-red-600',
    image: 'https://static.antigravity.dev/ais-dev-l24zxqwrtw5n27s2s44wm6-94120260995/input_file_0.png',
  },
];

const INDUSTRIAL_GASES = [
  {
    id: 'oxygene-ind',
    name: 'Oxygène industriel',
    desc: "Haute pureté pour les procédés de combustion et d'oxydation.",
    formula: 'O₂',
    tag: 'Industrie',
    specs: { taille: 'M20 / L50 / Cadre', pression: '200 bar', chapeau: 'Standard / SMARTOP™' },
  },
  {
    id: 'azote-ind',
    name: 'Azote industriel',
    desc: "Idéal pour l'inertage, le dégazage et les tests de pression.",
    formula: 'N₂',
    tag: 'Inerte',
    specs: { taille: 'L50 / Cadre', pression: '200 bar', chapeau: 'Standard' },
  },
  {
    id: 'argon-ind',
    name: 'Argon pur',
    desc: 'Protection optimale pour les procédés haute température.',
    formula: 'Ar',
    tag: 'Protection',
    specs: { taille: 'M20 / L50', pression: '200 bar', chapeau: 'SMARTOP™' },
  },
  {
    id: 'co2-ind',
    name: 'Dioxyde de carbone',
    desc: 'Utilisé dans la métallurgie, le traitement des eaux et la chimie.',
    formula: 'CO₂',
    tag: 'Polyvalent',
    specs: { taille: 'L50 / B50', pression: '50 bar', chapeau: 'Standard' },
  },
];

const FOOD_GASES = [
  {
    id: 'aligal-1',
    name: 'ALIGAL™ 1',
    formula: 'CO₂',
    desc: 'Dioxyde de carbone pour la carbonatation des boissons.',
    usage: 'Boissons & conservation',
    image: 'https://images.unsplash.com/photo-1543253687-c934c2e01861?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'aligal-2',
    name: 'ALIGAL™ 2',
    formula: 'N₂',
    desc: 'Azote de qualité alimentaire pour le conditionnement sous atmosphère.',
    usage: 'Conditionnement',
    image: 'https://images.unsplash.com/photo-1627483262769-04d4a11bf333?auto=format&fit=crop&q=80&w=800',
  },
];

const INSTALLATION_FEATURES = [
  { title: 'Réseaux industriels', desc: 'Réseaux en inox et acier carbone (soudure TIG), certifiés haute et basse pression.', icon: Factory },
  { title: 'Secteur tertiaire', desc: 'Alimentation de cuisines professionnelles, chaudières, et réseaux cuivre/acier.', icon: Building2 },
  { title: 'Systèmes de sécurité', desc: "Mise en place d'électrovannes, détecteurs et systèmes de coupure d'urgence.", icon: ShieldCheck },
];

const SPEC_LABELS = { taille: 'Taille', pression: 'Pression', chapeau: 'Chapeau' } as const;

const container = 'mx-auto w-full max-w-[1400px] px-5 sm:px-6 lg:px-10';

// Unsplash serves any width on demand: let the browser pick the smallest adequate one.
const unsplashSrcSet = (url: string, widths: number[]) =>
  url.includes('images.unsplash.com') && /[?&]w=\d+/.test(url)
    ? widths.map((w) => `${url.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`).join(', ')
    : undefined;

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ id, eyebrow, title, highlight, lead, align = 'center' }: {
  id: string;
  eyebrow: string;
  title: string;
  highlight?: string;
  lead?: string;
  align?: 'center' | 'left';
}) {
  const centered = align === 'center';
  return (
    <Reveal className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      <p className={`flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-afro-green-dark ${centered ? 'justify-center' : ''}`}>
        <span className="h-0.5 w-8 rounded-full bg-afro-green" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 id={id} className="mt-4 font-display text-3xl font-black uppercase leading-[1.05] tracking-tight text-afro-ink md:text-4xl lg:text-5xl">
        {title} {highlight && <span className="text-afro-blue">{highlight}</span>}
      </h2>
      {lead && <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">{lead}</p>}
    </Reveal>
  );
}

function PartnerLogo({ name, url }: { name: string; url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <li>
      <img
        src={url}
        alt={`Logo ${name}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-8 w-auto max-w-[160px] object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 md:h-10"
        referrerPolicy="no-referrer"
      />
    </li>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white transition-colors open:border-afro-blue/30 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-5 text-left font-display text-base font-bold text-afro-ink md:p-6 md:text-lg [&::-webkit-details-marker]:hidden">
        {question}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-afro-blue/10 text-afro-blue transition-transform duration-300 group-open:rotate-180">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </span>
      </summary>
      <p className="px-5 pb-6 leading-relaxed text-slate-600 md:px-6">{answer}</p>
    </details>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(item.date);
  const hasDate = !Number.isNaN(date.getTime());

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-afro-blue/30 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative aspect-[16/10] overflow-hidden bg-afro-blue-50">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Newspaper className="h-12 w-12 text-afro-blue/30" aria-hidden="true" />
          </div>
        )}
        {item.category && (
          <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-afro-blue shadow-sm">
            {item.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {hasDate && (
          <time dateTime={date.toISOString()} className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
        )}
        <h3 className="mb-3 font-display text-lg font-black leading-tight text-afro-ink transition-colors group-hover:text-afro-blue">
          {item.title}
        </h3>
        <p className={`mb-6 text-sm leading-relaxed text-slate-600 ${expanded ? '' : 'line-clamp-3'}`}>{item.content}</p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-auto inline-flex items-center gap-1 self-start text-xs font-bold uppercase tracking-widest text-afro-blue transition-all hover:gap-2"
        >
          {expanded ? 'Réduire' : 'Lire la suite'}
          <ArrowRight className={`h-3.5 w-3.5 transition-transform ${expanded ? '-rotate-90' : ''}`} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function LandingPage() {
  const {
    heroImage,
    heroSubtitle,
    aboutTitle,
    aboutDescription,
    pipelineImage,
    contactPhone,
    contactEmail,
    contactAddress,
    partnerLogos,
    productImages,
    logoImage,
    logoText,
    mascotImage,
  } = useLandingStore();

  usePageMeta({ title: HOME_TITLE, description: HOME_DESCRIPTION, canonicalPath: '/' });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('accueil');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [brandMascot, setBrandMascot] = useState<string | null>(null);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [isSimulatorLoaded, setIsSimulatorLoaded] = useState(false);

  useEffect(() => {
    // The mascot managed in CMS > Identité stays local: a public visit must never write to the shared landing store.
    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        const butagaz = Array.isArray(data) ? data.find((b: { id: string }) => b.id === 'b1') : null;
        if (butagaz?.mascot_url) setBrandMascot(butagaz.mascot_url);
      })
      .catch(() => {});

    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setNews(data.slice(0, 3)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the navigation link of the section crossing the middle of the viewport.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('#contenu > section[id]');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [news.length]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  // A smooth scroll started while the mobile menu animates out gets cancelled: scroll once the menu is gone.
  const pendingAnchor = useRef<string | null>(null);
  const goToSectionFromMenu = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    pendingAnchor.current = id;
    setIsMenuOpen(false);
  };
  const scrollToPendingAnchor = () => {
    const id = pendingAnchor.current;
    pendingAnchor.current = null;
    if (!id) return;
    document.getElementById(id)?.scrollIntoView();
    window.history.replaceState(window.history.state, '', `#${id}`);
  };

  const openSimulator = () => {
    setIsSimulatorLoaded(true);
    setIsSimulationModalOpen(true);
  };

  const getProductImage = (id: string, defaultImage: string) =>
    productImages?.find((img) => img.id === id)?.url ?? defaultImage;

  const phoneDisplay = formatPhoneMA(contactPhone);
  const phoneHref = `tel:${toInternationalPhoneMA(contactPhone)}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`;
  const heroSrc = heroImage || DEFAULT_HERO_IMAGE;
  const heroGases = (heroSubtitle || '').split(/[,·]/).map((s) => s.trim()).filter(Boolean);
  const partners = partnerLogos.length > 0 ? partnerLogos : DEFAULT_PARTNERS;
  const navItems = news.length > 0 ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.id !== 'news');

  const faqs = useMemo(() => [
    {
      question: 'Quels types de gaz distribuez-vous ?',
      answer: 'Nous distribuons les bouteilles Butagaz (butane 3 kg et 12 kg, propane 34 kg) pour les foyers et les professionnels, ainsi que la gamme Air Liquide : gaz industriels (oxygène, azote, argon, CO₂) et gaz alimentaires ALIGAL™.',
    },
    {
      question: 'Quelle bouteille de gaz Butagaz choisir ?',
      answer: "La Butane 3 kg convient au camping et au petit bricolage, la Butane 12 kg à la cuisine et au chauffage d'appoint intérieur, et la Propane 34 kg aux besoins énergétiques élevés avec stockage extérieur.",
    },
    {
      question: 'Livrez-vous partout au Maroc ?',
      answer: 'Oui. Depuis Meknès, notre service logistique livre les particuliers, les professionnels et les industriels dans plus de 20 villes du Maroc.',
    },
    {
      question: 'Comment commander du gaz ?',
      answer: `Appelez-nous au ${phoneDisplay} ou écrivez-nous à ${contactEmail}, du lundi au samedi de 8 h à 18 h. Notre équipe confirme votre commande et organise la livraison.`,
    },
    {
      question: 'Réalisez-vous des installations de réseaux de gaz ?',
      answer: "Oui. Nous concevons, réalisons et entretenons des réseaux de gaz industriels (inox, acier carbone, soudure TIG) et tertiaires (cuisines professionnelles, chaudières), avec électrovannes, détecteurs et systèmes de coupure d'urgence.",
    },
    {
      question: "Quel est votre délai d'intervention ?",
      answer: "Notre service client répond en moins de 2 heures, du lundi au samedi de 8 h à 18 h, pour vos besoins d'approvisionnement comme pour les interventions techniques d'urgence.",
    },
  ], [phoneDisplay, contactEmail]);

  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icon-512.png`,
        image: heroSrc.startsWith('http') ? heroSrc : `${SITE_URL}/og-image.png`,
        description: HOME_DESCRIPTION,
        telephone: toInternationalPhoneMA(contactPhone),
        email: contactEmail,
        address: { '@type': 'PostalAddress', streetAddress: contactAddress, addressLocality: 'Meknès', addressCountry: 'MA' },
        areaServed: { '@type': 'Country', name: 'Maroc' },
        openingHoursSpecification: [{
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '08:00',
          closes: '18:00',
        }],
        knowsAbout: ['Gaz butane', 'Gaz propane', 'Gaz industriels', 'Gaz alimentaires', 'Installation de réseaux de gaz'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        inLanguage: 'fr-MA',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  }), [heroSrc, contactPhone, contactEmail, contactAddress, faqs]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="landing-root min-h-screen overflow-x-clip bg-white font-sans text-afro-ink selection:bg-afro-blue/15 selection:text-afro-blue-dark">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />

        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-afro-blue focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
        >
          Aller au contenu
        </a>

        {/* Utility bar */}
        <div className="hidden bg-afro-blue-dark text-white/85 md:block">
          <div className={`${container} flex h-10 items-center justify-between gap-6 text-xs font-medium`}>
            <p className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-afro-green" aria-hidden="true" /> Lundi – samedi, 08:00 – 18:00
              </span>
              <span className="hidden items-center gap-2 lg:flex">
                <MapPin className="h-3.5 w-3.5 text-afro-green" aria-hidden="true" /> Livraison partout au Maroc
              </span>
            </p>
            <div className="flex items-center gap-6">
              <a href={phoneHref} className="flex items-center gap-2 font-bold text-white transition-colors hover:text-afro-green">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {phoneDisplay}
              </a>
              <a href={`mailto:${contactEmail}`} className="hidden items-center gap-2 transition-colors hover:text-white lg:flex">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {contactEmail}
              </a>
              <span className="h-4 w-px bg-white/20" aria-hidden="true" />
              <Link to="/afro-digital" className="font-bold uppercase tracking-widest text-white transition-colors hover:text-afro-green">
                Afro Digital
              </Link>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className={`sticky top-0 z-[100] border-b bg-white/90 backdrop-blur-md transition-shadow duration-300 ${isScrolled ? 'border-slate-200/80 shadow-[0_8px_30px_rgb(15,23,42,0.06)]' : 'border-slate-100'}`}>
          <div className={`${container} flex h-20 items-center justify-between gap-6`}>
            <Link to="/" className="flex shrink-0 items-center" aria-label={`${SITE_NAME}, accueil`}>
              {logoImage ? (
                <img src={logoImage} alt={logoText || SITE_NAME} className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="font-display text-xl font-black uppercase tracking-tight text-afro-blue">
                  {logoText || 'AFRO NÉGOCE'}
                </span>
              )}
            </Link>

            <nav aria-label="Navigation principale" className="hidden xl:block">
              <ul className="flex items-center">
                {navItems.map(({ id, label }) => {
                  const active = activeSection === id;
                  return (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        aria-current={active ? 'true' : undefined}
                        className={`relative whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:text-afro-blue ${active ? 'text-afro-blue' : 'text-slate-600'}`}
                      >
                        {label}
                        <span
                          aria-hidden="true"
                          className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-afro-blue transition-transform duration-300 ${active ? 'scale-x-100' : 'scale-x-0'}`}
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/ecom"
                className="hidden items-center gap-2 whitespace-nowrap rounded-lg bg-afro-blue px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-afro-blue/20 transition-colors hover:bg-afro-blue-dark lg:inline-flex"
              >
                Pièces & matériel de gaz <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={phoneHref}
                aria-label={`Appeler le ${phoneDisplay}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-afro-blue/10 text-afro-blue md:hidden"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-expanded={isMenuOpen}
                aria-controls="menu-mobile"
                aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                className="-mr-2 rounded-lg p-2 text-afro-ink transition-colors hover:bg-slate-100 xl:hidden"
              >
                {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <AnimatePresence onExitComplete={scrollToPendingAnchor}>
            {isMenuOpen && (
              <motion.nav
                id="menu-mobile"
                aria-label="Navigation mobile"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-slate-100 bg-white shadow-xl shadow-slate-900/10 xl:hidden"
              >
                <div className={`${container} flex flex-col gap-1 py-5`}>
                  {navItems.map(({ id, label }) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      onClick={(e) => goToSectionFromMenu(e, id)}
                      className={`rounded-lg px-3 py-3 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-afro-blue-50 ${activeSection === id ? 'text-afro-blue' : 'text-slate-700'}`}
                    >
                      {label}
                    </a>
                  ))}
                  <div className="my-3 h-px bg-slate-100" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <a href={phoneHref} className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-afro-ink">
                      <Phone className="h-4 w-4 text-afro-blue" aria-hidden="true" /> {phoneDisplay}
                    </a>
                    <Link to="/afro-digital" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-widest text-afro-blue">
                      Afro Digital
                    </Link>
                    <Link to="/ecom" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-2 rounded-lg bg-afro-blue px-4 py-3 text-xs font-bold uppercase tracking-wider text-white">
                      Pièces & matériel de gaz <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </header>

        <main id="contenu">
          {/* Hero */}
          <section id="accueil" aria-labelledby="hero-title" className="relative overflow-hidden bg-white">
            <div className={`${container} relative z-10`}>
              <div className="py-14 text-center sm:py-20 lg:w-1/2 lg:py-28 lg:pr-10 lg:text-left">
                <h1 id="hero-title" className="font-display font-black uppercase tracking-tight text-afro-ink">
                  <span className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full bg-afro-blue/[0.08] px-4 py-1.5 font-sans text-[11px] font-bold tracking-[0.18em] text-afro-blue lg:mx-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-afro-green" aria-hidden="true" />
                    Distributeur de gaz au Maroc
                  </span>
                  <span className="block text-[2.25rem] leading-[1.05] sm:text-5xl lg:text-[3.6rem] xl:text-[4rem]">
                    L'énergie pour aujourd'hui,{' '}
                    <span className="text-afro-blue">les solutions pour demain.</span>
                  </span>
                </h1>
                <div className="mx-auto my-7 h-1 w-12 rounded-full bg-afro-green lg:mx-0" aria-hidden="true" />
                <p className="mx-auto max-w-[520px] text-base font-medium leading-relaxed text-slate-600 md:text-lg lg:mx-0">
                  AFRO Négoce fournit des solutions énergétiques fiables et durables : gaz LPG, gaz industriels et solutions
                  énergétiques pour l'industrie et les professionnels.
                </p>

                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
                  <a
                    href="#solutions"
                    className="inline-flex items-center justify-center gap-3 rounded-lg bg-afro-blue px-7 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-afro-blue/20 transition-colors hover:bg-afro-blue-dark"
                  >
                    Découvrir nos solutions <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a
                    href="#about"
                    className="inline-flex items-center justify-center gap-3 rounded-lg border-2 border-afro-blue bg-white px-7 py-[14px] text-xs font-bold uppercase tracking-widest text-afro-blue transition-colors hover:bg-afro-blue-50"
                  >
                    Qui sommes-nous ? <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>

                {heroGases.length > 0 && (
                  <ul aria-label="Gaz distribués" className="mt-10 flex flex-wrap justify-center gap-2 lg:justify-start">
                    {heroGases.map((gas) => (
                      <li key={gas} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold capitalize text-slate-700">
                        {gas}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="relative mx-5 mb-12 h-72 overflow-hidden rounded-3xl sm:mx-6 sm:h-[420px] lg:absolute lg:inset-y-0 lg:right-0 lg:m-0 lg:h-auto lg:w-[55%] lg:rounded-none">
              <div className="absolute inset-0 hidden bg-afro-blue lg:block lg:[clip-path:ellipse(70%_120%_at_80%_0%)]" aria-hidden="true" />
              <div className="absolute inset-0 overflow-hidden lg:pl-4 lg:[clip-path:ellipse(72%_100%_at_85%_-10%)]">
                <img
                  src={heroSrc}
                  srcSet={unsplashSrcSet(heroSrc, [640, 960, 1280, 1600])}
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  alt="Livraison de bouteilles de gaz par AFRO Négoce au Maroc"
                  fetchPriority="high"
                  className="h-full w-full object-cover object-center lg:object-[center_10%]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute bottom-10 right-10 hidden items-center gap-3 rounded-2xl bg-white/95 p-4 pr-6 shadow-2xl shadow-slate-900/20 backdrop-blur xl:flex">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-afro-green/20 text-afro-green-dark">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">Partenaire officiel</span>
                  <span className="block font-display text-sm font-black uppercase text-afro-ink">Butagaz & Air Liquide</span>
                </span>
              </div>
            </div>
          </section>

          {/* Partners */}
          <section aria-label="Nos marques partenaires" className="border-y border-slate-100 bg-white py-10">
            <div className={`${container} flex flex-col items-center gap-8 lg:flex-row lg:gap-16`}>
              <p className="shrink-0 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Nos marques partenaires</p>
              <ul className="flex flex-1 flex-wrap items-center justify-center gap-x-12 gap-y-6 lg:justify-around">
                {partners.map((logo) => <PartnerLogo key={logo.id} name={logo.name} url={logo.url} />)}
              </ul>
            </div>
          </section>

          {/* Solutions */}
          <section id="solutions" aria-labelledby="solutions-title" className="bg-afro-blue-50 py-20 lg:py-28">
            <div className={container}>
              <SectionHeading
                id="solutions-title"
                eyebrow="Ce que nous faisons"
                title="Nos solutions"
                highlight="énergétiques"
                lead="Du gaz en bouteille aux réseaux industriels, AFRO Négoce accompagne particuliers, professionnels et industriels partout au Maroc."
              />
              <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {SOLUTIONS.map((sol, i) => (
                  <li key={sol.title}>
                    <Reveal delay={i * 0.08} className="h-full">
                      <a
                        href={sol.href}
                        className="group relative flex aspect-[4/5] h-full overflow-hidden rounded-2xl shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-afro-blue/20 sm:aspect-[3/4]"
                      >
                        <img
                          src={sol.img}
                          srcSet={unsplashSrcSet(sol.img, [400, 600, 800])}
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-afro-ink/95 via-afro-ink/40 to-transparent" aria-hidden="true" />
                        <div className="relative mt-auto flex w-full items-end justify-between gap-4 p-6 lg:p-7">
                          <div>
                            <h3 className="font-display text-xl font-black uppercase leading-tight tracking-wide text-white">{sol.title}</h3>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-white/80">{sol.subtitle}</p>
                          </div>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-all duration-300 group-hover:bg-afro-green group-hover:text-afro-ink">
                            <ArrowRight className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </div>
                      </a>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* About */}
          <section id="about" aria-labelledby="about-title" className="bg-white py-20 lg:py-28">
            <div className={`${container} grid items-start gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20`}>
              <div>
                <Reveal>
                  <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-afro-green-dark">
                    <span className="h-0.5 w-8 rounded-full bg-afro-green" aria-hidden="true" />
                    À propos d'AFRO Négoce
                  </p>
                  <h2 id="about-title" className="mt-4 font-display text-3xl font-black uppercase leading-[1.05] tracking-tight text-afro-ink md:text-4xl lg:text-5xl">
                    {aboutTitle}
                  </h2>
                  <p className="mt-6 text-base leading-relaxed text-slate-600 md:text-lg">{aboutDescription}</p>
                </Reveal>
                <Reveal delay={0.1}>
                  <ul className="mt-8 space-y-3">
                    {[
                      'Revendeur Butagaz : butane et propane pour les foyers et les professionnels',
                      'Gaz industriels et alimentaires de la gamme Air Liquide',
                      'Conception, installation et maintenance de réseaux de gaz',
                      'Livraison réactive dans plus de 20 villes du Maroc',
                    ].map((point) => (
                      <li key={point} className="flex gap-3 font-medium text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-afro-green-dark" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <Link
                      to="/notre-histoire"
                      className="inline-flex items-center justify-center gap-3 rounded-lg bg-afro-blue px-7 py-4 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-afro-blue-dark"
                    >
                      Découvrir notre histoire <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <a
                      href="#contact"
                      className="inline-flex items-center justify-center gap-3 rounded-lg border-2 border-slate-200 px-7 py-[14px] text-xs font-bold uppercase tracking-widest text-afro-ink transition-colors hover:border-afro-blue hover:text-afro-blue"
                    >
                      Nous contacter
                    </a>
                  </div>
                </Reveal>
              </div>

              <div>
                <h3 className="sr-only">Nos engagements</h3>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {VALUES.map(({ title, desc, icon: Icon }, i) => (
                    <li key={title}>
                      <Reveal delay={i * 0.05} className="h-full">
                        <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-afro-blue/30 hover:shadow-lg hover:shadow-slate-200/70">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-afro-blue/10 text-afro-blue">
                            <Icon className="h-6 w-6" aria-hidden="true" />
                          </span>
                          <h4 className="mt-5 font-display text-sm font-black uppercase tracking-[0.12em] text-afro-ink">{title}</h4>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                        </div>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Key figures */}
          <section aria-label="AFRO Négoce en chiffres" className="relative overflow-hidden bg-afro-blue py-14 text-white lg:py-16">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
              aria-hidden="true"
            />
            <div className={`${container} relative`}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-white/15">
                {STATS.map(({ value, label, icon: Icon }, i) => (
                  <div key={label} className={`flex flex-col items-center gap-3 text-center lg:flex-row lg:justify-center lg:gap-4 lg:text-left ${i === STATS.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}>
                    <Icon className="h-9 w-9 text-white/50 lg:h-10 lg:w-10" aria-hidden="true" />
                    <div className="flex flex-col-reverse">
                      <dt className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">{label}</dt>
                      <dd className="mb-1 font-display text-3xl font-black tracking-tight text-afro-green lg:text-4xl">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* Products */}
          <section id="products" aria-labelledby="products-title" className="bg-white py-20 lg:py-28">
            <div className={container}>
              <SectionHeading
                id="products-title"
                eyebrow="Produits"
                title="Notre catalogue"
                highlight="produits"
                lead="Bouteilles de gaz Butagaz pour la maison et les professionnels, gaz industriels et alimentaires Air Liquide pour chaque secteur d'activité."
              />

              {/* Butagaz */}
              <div id="gamme-butagaz" className="mt-16 scroll-mt-24">
                <Reveal className="mb-10 flex flex-col items-center justify-between gap-8 rounded-3xl bg-afro-blue-50 p-8 md:flex-row md:p-10">
                  <div className="text-center md:text-left">
                    <h3 className="font-display text-3xl font-black uppercase tracking-tight text-afro-ink lg:text-4xl">
                      Gamme <span className="text-afro-blue">Butagaz</span>
                    </h3>
                    <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-600 md:text-lg">
                      Revendeur exclusif, nous proposons des solutions Butagaz pour le chauffage, la cuisson et les besoins
                      industriels. La confiance d'une marque iconique depuis 1976.
                    </p>
                  </div>
                  <img
                    src={brandMascot || mascotImage || DEFAULT_MASCOT}
                    alt="Mascotte Butagaz"
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-24 shrink-0 lg:w-32"
                    referrerPolicy="no-referrer"
                  />
                </Reveal>

                <ul className="grid gap-6 md:grid-cols-3">
                  {BUTAGAZ_PRODUCTS.map((product, i) => (
                    <li key={product.id}>
                      <Reveal delay={i * 0.08} className="h-full">
                        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-afro-blue/30 hover:shadow-xl hover:shadow-slate-200/70">
                          <div className="relative aspect-[4/3] bg-gradient-to-b from-afro-blue-50 to-white p-8">
                            <img
                              src={getProductImage(product.id, product.image)}
                              alt={`Bouteille de gaz Butagaz ${product.name}`}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white ${product.badge}`}>
                              {product.type}
                            </span>
                          </div>
                          <div className="flex flex-1 flex-col border-t border-slate-100 p-6">
                            <span className="font-display text-3xl font-black text-afro-blue">{product.weight}</span>
                            <h4 className="mt-1 text-sm font-bold uppercase tracking-widest text-afro-ink">{product.name}</h4>
                            <p className="mt-3 mb-6 text-sm font-medium leading-relaxed text-slate-600">{product.use}</p>
                            <div className="mt-auto flex items-center justify-between">
                              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-afro-green-dark">
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> En stock
                              </span>
                              <a
                                href="#contact"
                                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-afro-blue transition-all hover:gap-2 hover:text-afro-blue-dark"
                              >
                                Commander <ArrowRight className="h-4 w-4" aria-hidden="true" />
                              </a>
                            </div>
                          </div>
                        </article>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Air Liquide */}
              <div id="gamme-air-liquide" className="mt-24 scroll-mt-24">
                <Reveal className="mb-10 text-center md:text-left">
                  <h3 className="font-display text-3xl font-black uppercase tracking-tight text-afro-ink lg:text-4xl">
                    Gamme <span className="text-afro-blue">Air Liquide</span>
                  </h3>
                  <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-600 md:text-lg">
                    Gamme complète de gaz industriels et alimentaires pour répondre aux exigences de chaque secteur d'activité.
                  </p>
                </Reveal>

                <h4 className="mb-6 border-b border-slate-200 pb-3 text-sm font-black uppercase tracking-widest text-afro-ink">Gaz industriels</h4>
                <ul className="mb-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {INDUSTRIAL_GASES.map((gas, i) => (
                    <li key={gas.id}>
                      <Reveal delay={i * 0.06} className="h-full">
                        <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-afro-blue/30 hover:shadow-xl hover:shadow-slate-200/70">
                          <div className="mb-5 flex items-start justify-between">
                            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-afro-blue text-xl font-black text-white" aria-hidden="true">
                              {gas.formula}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">{gas.tag}</span>
                          </div>
                          <h5 className="font-display text-base font-black uppercase tracking-wide text-afro-ink">{gas.name}</h5>
                          <p className="mt-2 mb-5 text-sm leading-relaxed text-slate-600">{gas.desc}</p>
                          <dl className="mt-auto space-y-1.5 border-t border-slate-100 pt-4 text-xs">
                            {(Object.keys(SPEC_LABELS) as (keyof typeof SPEC_LABELS)[]).map((key) => (
                              <div key={key} className="flex justify-between gap-3">
                                <dt className="font-semibold text-slate-500">{SPEC_LABELS[key]}</dt>
                                <dd className="text-right font-bold text-afro-ink">{gas.specs[key]}</dd>
                              </div>
                            ))}
                          </dl>
                        </article>
                      </Reveal>
                    </li>
                  ))}
                </ul>

                <h4 className="mb-6 border-b border-slate-200 pb-3 text-sm font-black uppercase tracking-widest text-afro-ink">Gaz alimentaires (ALIGAL™)</h4>
                <ul className="grid gap-5 md:grid-cols-2">
                  {FOOD_GASES.map((gas, i) => (
                    <li key={gas.id}>
                      <Reveal delay={i * 0.08} className="h-full">
                        <article className="flex h-full flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-afro-blue-50 p-6 transition-all duration-300 hover:border-afro-blue/30 hover:shadow-xl hover:shadow-slate-200/70 sm:flex-row">
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-2">
                            <img
                              src={getProductImage(gas.id, gas.image)}
                              alt={`Gaz alimentaire ${gas.name}`}
                              loading="lazy"
                              decoding="async"
                              className="max-h-full max-w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <div className="mb-2 flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                              <h5 className="font-display text-lg font-black uppercase text-afro-ink">{gas.name}</h5>
                              <span className="rounded-full bg-afro-blue/10 px-2.5 py-0.5 text-[11px] font-bold text-afro-blue">{gas.formula}</span>
                            </div>
                            <p className="mb-3 text-sm text-slate-600">{gas.desc}</p>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-afro-green-dark">Usage : {gas.usage}</p>
                          </div>
                        </article>
                      </Reveal>
                    </li>
                  ))}
                </ul>

                <div className="mt-14 text-center">
                  <Link
                    to="/ecom"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-afro-green px-8 py-4 text-xs font-bold uppercase tracking-widest text-afro-ink transition-colors hover:bg-afro-green/85"
                  >
                    Voir tous les produits <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Installation & engineering */}
          <section id="installation" aria-labelledby="installation-title" className="bg-afro-blue-50 py-20 lg:py-28">
            <div className={container}>
              <SectionHeading
                id="installation-title"
                eyebrow="Services"
                title="Installation &"
                highlight="ingénierie"
              />

              <div className="mt-14 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <Reveal className="order-2 lg:order-1">
                  <h3 className="font-display text-2xl font-black uppercase tracking-tight text-afro-ink md:text-3xl">
                    Réseaux de gaz <span className="text-afro-blue">industriels et tertiaires</span>
                  </h3>
                  <p className="mt-4 mb-8 text-base font-medium leading-relaxed text-slate-600 md:text-lg">
                    Conception, réalisation et maintenance de réseaux d'installations de gaz complexes. Nous garantissons la
                    sécurité, la rigueur technique et la conformité totale de vos installations.
                  </p>

                  <ul className="space-y-4">
                    {INSTALLATION_FEATURES.map(({ title, desc, icon: Icon }) => (
                      <li key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-afro-blue/30 hover:shadow-md">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-afro-blue/10 text-afro-blue">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                          <h4 className="mb-1 text-sm font-bold uppercase tracking-wide text-afro-ink">{title}</h4>
                          <p className="text-sm text-slate-600">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={openSimulator}
                    className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-afro-blue px-8 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-afro-blue/20 transition-colors hover:bg-afro-blue-dark sm:w-auto"
                  >
                    <Activity className="h-4 w-4" aria-hidden="true" />
                    Simulateur de capacité (pipeline)
                  </button>
                </Reveal>

                <Reveal className="order-1 lg:order-2" delay={0.1}>
                  <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl shadow-afro-blue/10">
                    <img
                      src={pipelineImage}
                      srcSet={unsplashSrcSet(pipelineImage, [640, 1000, 1400])}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      alt="Installation d'un réseau de gaz industriel par AFRO Négoce"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-afro-ink/60 to-transparent" aria-hidden="true" />
                    <div className="absolute bottom-6 left-6 flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-5 shadow-lg backdrop-blur">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-afro-green/20 text-afro-green-dark">
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">Qualité assurée</span>
                        <span className="block text-xs font-black uppercase text-afro-ink">Certifié ISO 9001</span>
                      </span>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* News */}
          {news.length > 0 && (
            <section id="news" aria-labelledby="news-title" className="bg-white py-20 lg:py-28">
              <div className={container}>
                <SectionHeading id="news-title" eyebrow="Actualités" title="Actualités" highlight="& événements" />
                <ul className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                  {news.map((item, i) => (
                    <li key={item.id}>
                      <Reveal delay={i * 0.08} className="h-full">
                        <NewsCard item={item} />
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* FAQ */}
          <section id="faq" aria-labelledby="faq-title" className={`py-20 lg:py-28 ${news.length > 0 ? 'bg-afro-blue-50' : 'bg-white'}`}>
            <div className={`${container} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>
              <div className="lg:sticky lg:top-28 lg:self-start">
                <SectionHeading
                  id="faq-title"
                  align="left"
                  eyebrow="FAQ"
                  title="Questions"
                  highlight="fréquentes"
                  lead="Tout ce qu'il faut savoir pour commander votre gaz ou lancer votre projet d'installation."
                />
                <a href={phoneHref} className="mt-8 inline-flex items-center gap-3 font-bold text-afro-blue transition-colors hover:text-afro-blue-dark">
                  <Phone className="h-4 w-4" aria-hidden="true" /> Une autre question ? {phoneDisplay}
                </a>
              </div>
              <Reveal className="space-y-3">
                {faqs.map((faq) => <FaqItem key={faq.question} {...faq} />)}
              </Reveal>
            </div>
          </section>

          {/* Contact */}
          <section id="contact" aria-labelledby="contact-title" className="bg-white py-20 lg:py-28">
            <div className={container}>
              <div className="relative overflow-hidden rounded-3xl bg-afro-blue shadow-2xl shadow-afro-blue/20">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
                  aria-hidden="true"
                />
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-afro-blue-dark to-transparent" aria-hidden="true" />

                <div className="relative flex flex-col items-center justify-between gap-12 p-8 md:p-14 lg:p-20 xl:flex-row">
                  <div className="max-w-2xl text-center xl:text-left">
                    <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-afro-green/30 bg-afro-green/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-afro-green">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-afro-green" aria-hidden="true" />
                      Assistance réactive
                    </p>
                    <h2 id="contact-title" className="mb-6 font-display text-3xl font-black uppercase leading-[1.05] tracking-tight text-white md:text-5xl lg:text-6xl">
                      Besoin d'une assistance <span className="text-afro-green">immédiate ?</span>
                    </h2>
                    <p className="mx-auto mb-10 max-w-xl text-lg font-medium text-white/85 xl:mx-0">
                      Notre équipe d'experts est disponible pour vos besoins en approvisionnement ou pour toute intervention
                      technique d'urgence.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-6 sm:flex-row xl:justify-start">
                      <a
                        href={phoneHref}
                        className="flex w-full items-center rounded-xl bg-white p-2 pr-6 text-afro-blue shadow-lg transition-colors hover:bg-afro-blue-50 sm:w-auto"
                      >
                        <span className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-afro-blue/10">
                          <Phone className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="font-display text-xl font-bold tracking-wider">{phoneDisplay}</span>
                      </a>
                      <a href={`mailto:${contactEmail}`} className="flex items-center gap-4 text-white/85 transition-colors hover:text-white">
                        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/25 bg-white/5">
                          <Mail className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-left">
                          <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-widest text-afro-green">Écrivez-nous</span>
                          <span className="block text-sm font-medium">{contactEmail}</span>
                        </span>
                      </a>
                    </div>
                  </div>

                  <div className="w-full max-w-sm shrink-0 rounded-2xl bg-white p-8 shadow-2xl">
                    <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-afro-blue/10 text-afro-blue">
                      <Headset className="h-8 w-8" aria-hidden="true" />
                    </span>
                    <h3 className="mb-6 text-center font-display text-xl font-black uppercase text-afro-blue">Service client</h3>
                    <ul className="space-y-4 text-sm text-slate-600">
                      <li className="flex gap-3">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-afro-blue" aria-hidden="true" />
                        <span>Lundi – samedi, 08:00 – 18:00</span>
                      </li>
                      <li className="flex gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-afro-blue" aria-hidden="true" />
                        <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-afro-blue">
                          {contactAddress}
                        </a>
                      </li>
                    </ul>
                    <p className="mt-6 rounded-full bg-afro-blue-50 px-4 py-2 text-center text-xs font-bold text-afro-blue">
                      Temps de réponse &lt; 2 h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-100 bg-afro-blue-50 pt-16 pb-10 lg:pt-20">
          <div className={container}>
            <div className="mb-14 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-4">
                <p className="font-display text-xl font-black uppercase tracking-tight text-afro-blue">{logoText || 'AFRO NÉGOCE'}</p>
                <p className="mt-5 max-w-sm leading-relaxed text-slate-600">
                  Votre partenaire énergétique de confiance au Maroc. Distribution de gaz Butagaz et Air Liquide.
                </p>
                <div className="mt-6 flex gap-3">
                  <a href={phoneHref} aria-label={`Appeler le ${phoneDisplay}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-afro-blue shadow-sm transition-colors hover:bg-afro-blue hover:text-white">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </a>
                  <a href={`mailto:${contactEmail}`} aria-label={`Écrire à ${contactEmail}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-afro-blue shadow-sm transition-colors hover:bg-afro-blue hover:text-white">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <nav aria-label="Liens du pied de page" className="lg:col-span-2">
                <h2 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Navigation</h2>
                <ul className="space-y-3 text-sm font-semibold text-afro-ink">
                  <li><a href="#about" className="transition-colors hover:text-afro-blue">À propos</a></li>
                  <li><Link to="/notre-histoire" className="transition-colors hover:text-afro-blue">Notre histoire</Link></li>
                  <li><a href="#faq" className="transition-colors hover:text-afro-blue">FAQ</a></li>
                  <li><a href="#contact" className="transition-colors hover:text-afro-blue">Contact</a></li>
                  <li><Link to="/afro-digital" className="transition-colors hover:text-afro-blue">Afro Digital</Link></li>
                </ul>
              </nav>

              <div className="lg:col-span-3">
                <h2 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Nos activités</h2>
                <ul className="space-y-3 text-sm font-semibold text-afro-ink">
                  <li><a href="#gamme-butagaz" className="transition-colors hover:text-afro-blue">Bouteilles de gaz Butagaz</a></li>
                  <li><a href="#gamme-air-liquide" className="transition-colors hover:text-afro-blue">Gaz industriels Air Liquide</a></li>
                  <li><a href="#installation" className="transition-colors hover:text-afro-blue">Installation de réseaux de gaz</a></li>
                  <li><Link to="/ecom" className="transition-colors hover:text-afro-blue">Pièces & matériel de gaz</Link></li>
                </ul>
              </div>

              <div className="lg:col-span-3">
                <h2 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Contact</h2>
                <address className="space-y-4 text-sm not-italic text-slate-600">
                  <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="flex gap-3 transition-colors hover:text-afro-blue">
                    <MapPin className="h-5 w-5 shrink-0 text-afro-blue" aria-hidden="true" /> {contactAddress}
                  </a>
                  <a href={phoneHref} className="flex gap-3 transition-colors hover:text-afro-blue">
                    <Phone className="h-5 w-5 shrink-0 text-afro-blue" aria-hidden="true" /> {phoneDisplay}
                  </a>
                  <a href={`mailto:${contactEmail}`} className="flex gap-3 transition-colors hover:text-afro-blue">
                    <Mail className="h-5 w-5 shrink-0 text-afro-blue" aria-hidden="true" /> {contactEmail}
                  </a>
                </address>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-center text-xs font-semibold text-slate-500 md:flex-row md:text-left">
              <p>© {new Date().getFullYear()} {SITE_NAME}. Tous droits réservés.</p>
              <div className="flex flex-wrap justify-center gap-6">
                <a href="#" className="transition-colors hover:text-afro-blue">Mentions légales</a>
                <a href="#" className="transition-colors hover:text-afro-blue">Confidentialité</a>
              </div>
            </div>
          </div>
        </footer>

        {isSimulatorLoaded && (
          <Suspense fallback={null}>
            <PipelineSimulationModal isOpen={isSimulationModalOpen} onClose={() => setIsSimulationModalOpen(false)} />
          </Suspense>
        )}
      </div>
    </MotionConfig>
  );
}
