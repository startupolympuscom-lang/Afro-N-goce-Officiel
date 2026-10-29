import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  Check,
  ArrowRight,
  ShieldCheck,
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
import { SiteLogo } from '../components/Logo';
import { container, unsplashSrcSet, Reveal, Eyebrow, SectionHeading, btnPrimaryLook, btnPrimary, btnSecondary } from '../components/landing/shared';
import { SolarSection, type SolarImageSlot } from '../components/landing/SolarSection';
import { SolarSimulator } from '../components/landing/SolarSimulator';
import { SolarQuoteModal, type SolarQuoteRequest } from '../components/landing/SolarQuoteModal';

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
  { id: 'solaire', label: 'Solaire' },
  { id: 'news', label: 'Actualités' },
  { id: 'contact', label: 'Contact' },
];

// Hero artwork shipped with the site (public/images), in three widths.
const HERO_IMAGE = '/images/hero-afro-negoce-1536.webp';
const HERO_SRCSET = [640, 960, 1536].map((w) => `/images/hero-afro-negoce-${w}.webp ${w}w`).join(', ');
// Former default hero photos, still stored in the CMS by sites that never picked their own.
const LEGACY_HERO_IMAGES = ['photo-1516937941344-00b4e0337589', 'photo-1542744173-8e7e53415bb0'];
// The artwork's backdrop is off-white: fade its edges so no rectangle shows against the hero background.
const HERO_EDGE_MASK = 'linear-gradient(to right, transparent, #000 5%, #000 96%, transparent), linear-gradient(to bottom, transparent, #000 6%, #000 92%, transparent)';
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
    subtitle: 'Panneaux solaires : étude, fourniture et installation, avec ou sans batteries.',
    href: '#solaire',
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
        className="h-7 w-auto max-w-[150px] object-contain opacity-50 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 md:h-9"
        referrerPolicy="no-referrer"
      />
    </li>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white transition-all open:border-afro-blue/25 open:shadow-[0_8px_30px_rgb(14,108,208,0.08)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-5 text-left font-display text-base font-semibold text-afro-ink md:p-6 md:text-[17px] [&::-webkit-details-marker]:hidden">
        {question}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-afro-blue-50 text-afro-blue transition-transform duration-300 group-open:rotate-180">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </span>
      </summary>
      <p className="-mt-1 px-5 pb-6 leading-relaxed text-slate-600 md:px-6">{answer}</p>
    </details>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(item.date);
  const hasDate = !Number.isNaN(date.getTime());

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgb(15,23,42,0.08)]">
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
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-afro-blue shadow-sm backdrop-blur">
            {item.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {hasDate && (
          <time dateTime={date.toISOString()} className="mb-2 text-sm text-slate-500">
            {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
        )}
        <h3 className="mb-3 font-display text-lg font-bold leading-snug text-afro-ink transition-colors group-hover:text-afro-blue">
          {item.title}
        </h3>
        <p className={`mb-6 text-sm leading-relaxed text-slate-600 ${expanded ? '' : 'line-clamp-3'}`}>{item.content}</p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-auto inline-flex items-center gap-1.5 self-start text-sm font-semibold text-afro-blue transition-all hover:gap-2.5"
        >
          {expanded ? 'Réduire' : 'Lire la suite'}
          <ArrowRight className={`h-4 w-4 transition-transform ${expanded ? '-rotate-90' : ''}`} aria-hidden="true" />
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
  const [solarQuote, setSolarQuote] = useState<SolarQuoteRequest | null>(null);

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
  const solarImages = Object.fromEntries(
    (['principal', 'industrie', 'agriculture', 'habitat'] as SolarImageSlot[])
      .map((slot) => [slot, productImages?.find((img) => img.id === `solaire-${slot}`)?.url])
      .filter(([, url]) => url),
  ) as Partial<Record<SolarImageSlot, string>>;

  const phoneDisplay = formatPhoneMA(contactPhone);
  const phoneHref = `tel:${toInternationalPhoneMA(contactPhone)}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`;
  const hasCustomHero = !!heroImage && heroImage !== HERO_IMAGE && !LEGACY_HERO_IMAGES.some((id) => heroImage.includes(id));
  const heroSrc = hasCustomHero ? heroImage : HERO_IMAGE;
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
      question: 'Installez-vous des panneaux solaires ?',
      answer: 'Oui. Nous concevons, fournissons et installons des systèmes photovoltaïques pour les sites industriels, les exploitations agricoles (pompage et irrigation solaires), les commerces, les bâtiments publics et les habitations, avec ou sans batteries. Estimez votre installation avec notre simulateur, puis demandez un devis.',
    },
    {
      question: 'Faut-il des batteries avec des panneaux solaires ?',
      answer: "Pas forcément. Sans batterie, les panneaux alimentent directement vos équipements en journée : c'est la solution la plus rentable pour les sites qui consomment surtout le jour. Les batteries stockent la production pour le soir et la nuit, et sont indispensables pour les sites isolés non raccordés au réseau.",
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
        image: heroSrc.startsWith('http') ? heroSrc : heroSrc.startsWith('/') ? `${SITE_URL}${heroSrc}` : `${SITE_URL}/og-image.png`,
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
        knowsAbout: ['Gaz butane', 'Gaz propane', 'Gaz industriels', 'Gaz alimentaires', 'Installation de réseaux de gaz', 'Panneaux solaires', 'Installation photovoltaïque', 'Pompage solaire', 'Batteries solaires'],
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
      <div className="landing-root min-h-screen overflow-x-clip bg-white font-sans text-afro-ink antialiased selection:bg-afro-blue/15 selection:text-afro-blue-dark">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />

        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-afro-blue focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Aller au contenu
        </a>

        {/* Utility bar */}
        <div className="hidden bg-afro-navy text-white/80 md:block">
          <div className={`${container} flex h-10 items-center justify-between gap-6 text-[13px]`}>
            <p className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-afro-green" aria-hidden="true" /> Lundi – samedi, 08:00 – 18:00
              </span>
              <span className="hidden items-center gap-2 lg:flex">
                <MapPin className="h-3.5 w-3.5 text-afro-green" aria-hidden="true" /> Livraison partout au Maroc
              </span>
            </p>
            <div className="flex items-center gap-6">
              <a href={phoneHref} className="flex items-center gap-2 font-semibold text-white transition-colors hover:text-afro-green">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {phoneDisplay}
              </a>
              <a href={`mailto:${contactEmail}`} className="hidden items-center gap-2 transition-colors hover:text-white lg:flex">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {contactEmail}
              </a>
              <span className="h-4 w-px bg-white/20" aria-hidden="true" />
              <Link to="/afro-digital" className="font-semibold text-white transition-colors hover:text-afro-green">
                Afro Digital
              </Link>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className={`sticky top-0 z-[100] border-b bg-white/85 backdrop-blur-xl transition-all duration-300 ${isScrolled ? 'border-slate-200/80 shadow-[0_8px_30px_rgb(15,23,42,0.06)]' : 'border-transparent'}`}>
          <div className={`${container} flex h-[72px] items-center justify-between gap-6`}>
            <Link to="/" className="flex shrink-0 items-center" aria-label={`${SITE_NAME}, accueil`}>
              {logoImage ? (
                <img src={logoImage} alt={logoText || SITE_NAME} className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <SiteLogo />
              )}
            </Link>

            <nav aria-label="Navigation principale" className="hidden xl:block">
              <ul className="flex items-center gap-1">
                {navItems.map(({ id, label }) => {
                  const active = activeSection === id;
                  return (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        aria-current={active ? 'true' : undefined}
                        className={`relative whitespace-nowrap rounded-lg px-3.5 py-2 text-[15px] font-medium transition-colors hover:text-afro-blue ${active ? 'text-afro-blue' : 'text-slate-600'}`}
                      >
                        {label}
                        <span
                          aria-hidden="true"
                          className={`absolute left-1/2 -bottom-0.5 h-1 w-1 -translate-x-1/2 rounded-full bg-afro-blue transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/ecom" className={`hidden h-11 px-5 lg:inline-flex ${btnPrimaryLook}`}>
                Pièces & matériel de gaz <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={phoneHref}
                aria-label={`Appeler le ${phoneDisplay}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-afro-blue-50 text-afro-blue md:hidden"
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
                className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-slate-100 bg-white shadow-xl shadow-slate-900/10 xl:hidden"
              >
                <div className={`${container} flex flex-col gap-1 py-5`}>
                  {navItems.map(({ id, label }) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      onClick={(e) => goToSectionFromMenu(e, id)}
                      className={`rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-afro-blue-50 ${activeSection === id ? 'text-afro-blue' : 'text-slate-700'}`}
                    >
                      {label}
                    </a>
                  ))}
                  <div className="my-3 h-px bg-slate-100" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <a href={phoneHref} className={btnSecondary}>
                      <Phone className="h-4 w-4 text-afro-blue" aria-hidden="true" /> {phoneDisplay}
                    </a>
                    <Link to="/afro-digital" onClick={() => setIsMenuOpen(false)} className={btnSecondary}>
                      Afro Digital
                    </Link>
                    <Link to="/ecom" onClick={() => setIsMenuOpen(false)} className={btnPrimary}>
                      Pièces & matériel de gaz
                    </Link>
                  </div>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </header>

        <main id="contenu">
          {/* Hero */}
          <section id="accueil" aria-labelledby="hero-title" className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute -top-40 right-[-10%] h-[620px] w-[620px] rounded-full bg-afro-blue/10 blur-3xl" />
              <div className="absolute -bottom-40 left-[-10%] h-[420px] w-[420px] rounded-full bg-afro-green/10 blur-3xl" />
              <div
                className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]"
                style={{ backgroundImage: 'radial-gradient(rgb(14 108 208 / 0.18) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
              />
            </div>

            <div className={`${container} relative grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-24 xl:grid-cols-[1fr_1.15fr]`}>
              <div className="text-center lg:text-left">
                <h1 id="hero-title" className="font-display font-extrabold tracking-tight text-afro-ink">
                  <span className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-afro-blue/15 bg-white/80 px-4 py-1.5 font-sans text-[13px] font-semibold text-afro-blue shadow-sm backdrop-blur lg:mx-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-afro-green" aria-hidden="true" />
                    Distributeur de gaz au Maroc
                  </span>
                  <span className="block text-[2.5rem] leading-[1.04] sm:text-5xl lg:text-[3.4rem] xl:text-[3.85rem]">
                    L'énergie pour aujourd'hui,{' '}
                    <span className="bg-gradient-to-r from-afro-blue to-[#2E8BEA] bg-clip-text text-transparent">les solutions pour demain.</span>
                  </span>
                </h1>
                <p className="mx-auto mt-6 max-w-[540px] text-lg leading-relaxed text-slate-600 lg:mx-0">
                  AFRO Négoce fournit des solutions énergétiques fiables et durables : gaz LPG, gaz industriels et panneaux
                  solaires pour l'industrie, l'agriculture, les professionnels et les particuliers.
                </p>

                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#solutions" className={btnPrimary}>
                    Découvrir nos solutions <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a href="#about" className={btnSecondary}>
                    Qui sommes-nous ?
                  </a>
                </div>

                {heroGases.length > 0 && (
                  <div className="mt-10 border-t border-slate-200/80 pt-6">
                    <p className="mb-3 text-sm font-medium text-slate-500">Gaz distribués</p>
                    <ul aria-label="Gaz distribués" className="flex flex-wrap justify-center gap-2 lg:justify-start">
                      {heroGases.map((gas) => (
                        <li key={gas} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium capitalize text-slate-700">
                          {gas}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
                {hasCustomHero ? (
                  <div className="relative aspect-[3/2] overflow-hidden rounded-[2rem] bg-afro-blue-50 shadow-2xl shadow-afro-blue/20 ring-1 ring-slate-900/5">
                    <img
                      src={heroSrc}
                      srcSet={unsplashSrcSet(heroSrc, [640, 960, 1280, 1600])}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      alt="AFRO Négoce, distribution de gaz au Maroc"
                      fetchPriority="high"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-x-[4%] inset-y-[6%] rounded-[50%] bg-gradient-to-br from-afro-blue/15 via-afro-blue/5 to-afro-green/15 blur-2xl" aria-hidden="true" />
                    {/* White-background artwork: multiply lets the white blend into the hero background */}
                    <img
                      src={heroSrc}
                      srcSet={HERO_SRCSET}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      width={1536}
                      height={1024}
                      alt="Bouteilles de gaz butane et propane, camion-citerne, réseau de gaz et panneaux solaires"
                      fetchPriority="high"
                      className="relative h-auto w-full mix-blend-multiply"
                      style={{ maskImage: HERO_EDGE_MASK, WebkitMaskImage: HERO_EDGE_MASK, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }}
                    />
                  </>
                )}
                {/* Stacked under the image on phones, floating over its empty corners from sm up */}
                <div className="mt-5 grid grid-cols-[auto_1fr] gap-3 sm:contents">
                <div className="rounded-2xl bg-white px-5 py-4 text-left shadow-[0_20px_50px_rgb(15,23,42,0.14)] ring-1 ring-slate-900/5 sm:absolute sm:-left-4 sm:-top-6 lg:-top-10">
                  <span className="block font-display text-3xl font-extrabold text-afro-blue">+20</span>
                  <span className="block text-xs font-medium text-slate-500">villes desservies</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 pr-5 shadow-[0_20px_50px_rgb(15,23,42,0.14)] ring-1 ring-slate-900/5 sm:absolute sm:-bottom-4 sm:-right-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-afro-green/20 text-afro-green-dark">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-left">
                    <span className="block text-xs font-medium text-slate-500">Partenaire officiel</span>
                    <span className="block font-display text-[15px] font-bold text-afro-ink">Butagaz & Air Liquide</span>
                  </span>
                </div>
                </div>
              </div>
            </div>
          </section>

          {/* Partners */}
          <section aria-label="Nos marques partenaires" className="border-y border-slate-100 bg-white py-10">
            <div className={`${container} flex flex-col items-center gap-8 lg:flex-row lg:gap-16`}>
              <p className="shrink-0 text-sm font-medium text-slate-500">Nos marques partenaires</p>
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
              <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {SOLUTIONS.map((sol, i) => (
                  <li key={sol.title}>
                    <Reveal delay={i * 0.08} className="h-full">
                      <a
                        href={sol.href}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white p-2 shadow-[0_1px_2px_rgb(15,23,42,0.04)] ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgb(14,108,208,0.14)] hover:ring-afro-blue/25"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-afro-blue-50">
                          <img
                            src={sol.img}
                            srcSet={unsplashSrcSet(sol.img, [400, 600, 800])}
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-1 flex-col p-4 pt-5">
                          <h3 className="font-display text-lg font-bold text-afro-ink">{sol.title}</h3>
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{sol.subtitle}</p>
                          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-afro-blue transition-all group-hover:gap-2.5">
                            En savoir plus <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
              <div className="lg:sticky lg:top-28">
                <Reveal>
                  <Eyebrow>À propos d'AFRO Négoce</Eyebrow>
                  <h2 id="about-title" className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-afro-ink md:text-4xl lg:text-[2.75rem]">
                    {aboutTitle}
                  </h2>
                  <p className="mt-6 text-lg leading-relaxed text-slate-600">{aboutDescription}</p>
                </Reveal>
                <Reveal delay={0.1}>
                  <ul className="mt-8 space-y-3.5">
                    {[
                      'Revendeur Butagaz : butane et propane pour les foyers et les professionnels',
                      'Gaz industriels et alimentaires de la gamme Air Liquide',
                      'Conception, installation et maintenance de réseaux de gaz',
                      'Panneaux solaires : étude, fourniture et installation',
                      'Livraison réactive dans plus de 20 villes du Maroc',
                    ].map((point) => (
                      <li key={point} className="flex gap-3 text-slate-700">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-afro-green/20 text-afro-green-dark">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                    <Link to="/notre-histoire" className={btnPrimary}>
                      Découvrir notre histoire <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <a href="#contact" className={btnSecondary}>
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
                        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-afro-blue/25 hover:shadow-[0_20px_40px_rgb(14,108,208,0.1)]">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-afro-blue-50 text-afro-blue">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <h4 className="mt-5 font-display text-base font-bold text-afro-ink">{title}</h4>
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
          <section aria-label="AFRO Négoce en chiffres" className="bg-white pb-20 lg:pb-28">
            <div className={container}>
              <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-afro-blue to-afro-blue-dark px-6 py-12 text-white shadow-[0_30px_60px_rgb(14,108,208,0.25)] sm:px-10 lg:py-14">
                <div
                  className="absolute inset-0 opacity-15"
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
                  aria-hidden="true"
                />
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                <dl className="relative grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-white/15">
                  {STATS.map(({ value, label, icon: Icon }, i) => (
                    <div key={label} className={`flex flex-col items-center text-center ${i === STATS.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}>
                      <Icon className="mb-3 h-6 w-6 text-afro-green" aria-hidden="true" />
                      <div className="flex flex-col-reverse">
                        <dt className="mt-1 text-sm text-white/80">{label}</dt>
                        <dd className="font-display text-4xl font-extrabold tracking-tight lg:text-5xl">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </section>

          {/* Products */}
          <section id="products" aria-labelledby="products-title" className="bg-afro-blue-50 py-20 lg:py-28">
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
                <Reveal className="mb-8 flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
                  <div>
                    <h3 className="font-display text-2xl font-bold tracking-tight text-afro-ink lg:text-3xl">
                      Gamme <span className="text-afro-blue">Butagaz</span>
                    </h3>
                    <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
                      Revendeur exclusif, nous proposons des solutions Butagaz pour le chauffage, la cuisson et les besoins
                      industriels. La confiance d'une marque iconique depuis 1976.
                    </p>
                  </div>
                  <img
                    src={brandMascot || mascotImage || DEFAULT_MASCOT}
                    alt="Mascotte Butagaz"
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-20 shrink-0 lg:w-24"
                    referrerPolicy="no-referrer"
                  />
                </Reveal>

                <ul className="grid gap-6 md:grid-cols-3">
                  {BUTAGAZ_PRODUCTS.map((product, i) => (
                    <li key={product.id}>
                      <Reveal delay={i * 0.08} className="h-full">
                        <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgb(14,108,208,0.12)]">
                          <div className="relative aspect-[4/3] bg-gradient-to-b from-white to-afro-blue-50 p-8">
                            <img
                              src={getProductImage(product.id, product.image)}
                              alt={`Bouteille de gaz Butagaz ${product.name}`}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-white ${product.badge}`}>
                              {product.type}
                            </span>
                          </div>
                          <div className="flex flex-1 flex-col p-6">
                            <div className="flex items-baseline justify-between gap-3">
                              <h4 className="font-display text-lg font-bold text-afro-ink">{product.name}</h4>
                              <span className="font-display text-2xl font-extrabold text-afro-blue">{product.weight}</span>
                            </div>
                            <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">{product.use}</p>
                            <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                              <span className="flex items-center gap-1.5 text-sm font-medium text-afro-green-dark">
                                <span className="h-2 w-2 rounded-full bg-afro-green" aria-hidden="true" /> En stock
                              </span>
                              <a href="#contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-afro-blue transition-all hover:gap-2.5">
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
                <Reveal className="mb-8 text-center md:text-left">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-afro-ink lg:text-3xl">
                    Gamme <span className="text-afro-blue">Air Liquide</span>
                  </h3>
                  <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
                    Gamme complète de gaz industriels et alimentaires pour répondre aux exigences de chaque secteur d'activité.
                  </p>
                </Reveal>

                <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Gaz industriels</h4>
                <ul className="mb-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {INDUSTRIAL_GASES.map((gas, i) => (
                    <li key={gas.id}>
                      <Reveal delay={i * 0.06} className="h-full">
                        <article className="flex h-full flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgb(14,108,208,0.12)]">
                          <div className="mb-5 flex items-start justify-between">
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-afro-blue to-afro-blue-dark text-xl font-bold text-white shadow-lg shadow-afro-blue/25" aria-hidden="true">
                              {gas.formula}
                            </span>
                            <span className="rounded-full bg-afro-blue-50 px-2.5 py-1 text-xs font-medium text-afro-blue">{gas.tag}</span>
                          </div>
                          <h5 className="font-display text-base font-bold text-afro-ink">{gas.name}</h5>
                          <p className="mt-2 mb-5 text-sm leading-relaxed text-slate-600">{gas.desc}</p>
                          <dl className="mt-auto space-y-1.5 border-t border-slate-100 pt-4 text-[13px]">
                            {(Object.keys(SPEC_LABELS) as (keyof typeof SPEC_LABELS)[]).map((key) => (
                              <div key={key} className="flex justify-between gap-3">
                                <dt className="text-slate-500">{SPEC_LABELS[key]}</dt>
                                <dd className="text-right font-medium text-afro-ink">{gas.specs[key]}</dd>
                              </div>
                            ))}
                          </dl>
                        </article>
                      </Reveal>
                    </li>
                  ))}
                </ul>

                <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Gaz alimentaires (ALIGAL™)</h4>
                <ul className="grid gap-5 md:grid-cols-2">
                  {FOOD_GASES.map((gas, i) => (
                    <li key={gas.id}>
                      <Reveal delay={i * 0.08} className="h-full">
                        <article className="flex h-full flex-col items-center gap-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 transition-all duration-300 hover:shadow-[0_24px_50px_rgb(14,108,208,0.12)] sm:flex-row">
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-afro-blue-50 p-2">
                            <img
                              src={getProductImage(gas.id, gas.image)}
                              alt={`Gaz alimentaire ${gas.name}`}
                              loading="lazy"
                              decoding="async"
                              className="max-h-full max-w-full rounded-lg object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <div className="mb-2 flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                              <h5 className="font-display text-lg font-bold text-afro-ink">{gas.name}</h5>
                              <span className="rounded-full bg-afro-blue-50 px-2.5 py-0.5 text-xs font-semibold text-afro-blue">{gas.formula}</span>
                            </div>
                            <p className="mb-3 text-sm text-slate-600">{gas.desc}</p>
                            <p className="text-sm font-medium text-afro-green-dark">Usage : {gas.usage}</p>
                          </div>
                        </article>
                      </Reveal>
                    </li>
                  ))}
                </ul>

                <div className="mt-14 text-center">
                  <Link to="/ecom" className={btnPrimary}>
                    Voir tous les produits <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Installation & engineering */}
          <section id="installation" aria-labelledby="installation-title" className="bg-white py-20 lg:py-28">
            <div className={`${container} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
              <Reveal className="relative order-1">
                <div className="absolute -inset-3 -rotate-2 rounded-[2.25rem] bg-afro-blue-50" aria-hidden="true" />
                <div className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-afro-blue-50 shadow-2xl shadow-afro-blue/10">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-afro-navy/50 to-transparent" aria-hidden="true" />
                  <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-5 shadow-lg backdrop-blur">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-afro-green/20 text-afro-green-dark">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-xs font-medium text-slate-500">Qualité assurée</span>
                      <span className="block text-sm font-bold text-afro-ink">Certifié ISO 9001</span>
                    </span>
                  </div>
                </div>
              </Reveal>

              <Reveal className="order-2" delay={0.1}>
                <Eyebrow>Services</Eyebrow>
                <h2 id="installation-title" className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-afro-ink md:text-4xl lg:text-[2.75rem]">
                  Installation & <span className="text-afro-blue">ingénierie</span>
                </h2>
                <h3 className="mt-5 font-display text-xl font-semibold text-afro-ink">Réseaux de gaz industriels et tertiaires</h3>
                <p className="mt-3 mb-8 text-lg leading-relaxed text-slate-600">
                  Conception, réalisation et maintenance de réseaux d'installations de gaz complexes. Nous garantissons la
                  sécurité, la rigueur technique et la conformité totale de vos installations.
                </p>

                <ul className="space-y-3">
                  {INSTALLATION_FEATURES.map(({ title, desc, icon: Icon }) => (
                    <li key={title} className="flex gap-4 rounded-2xl border border-slate-200/80 p-5 transition-all duration-300 hover:border-afro-blue/25 hover:shadow-[0_16px_40px_rgb(14,108,208,0.08)]">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-afro-blue-50 text-afro-blue">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h4 className="mb-1 font-display font-bold text-afro-ink">{title}</h4>
                        <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <button type="button" onClick={openSimulator} className={`${btnPrimary} mt-8 w-full sm:w-auto`}>
                  <Activity className="h-4 w-4" aria-hidden="true" />
                  Simulateur de capacité (pipeline)
                </button>
              </Reveal>
            </div>
          </section>

          <SolarSection images={solarImages} onRequestQuote={(sector) => setSolarQuote({ sector })} />
          <SolarSimulator onRequestQuote={(sector, summary) => setSolarQuote({ sector, summary })} />

          {/* News */}
          {news.length > 0 && (
            <section id="news" aria-labelledby="news-title" className="bg-afro-blue-50 py-20 lg:py-28">
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
          <section id="faq" aria-labelledby="faq-title" className={`py-20 lg:py-28 ${news.length > 0 ? 'bg-white' : 'bg-afro-blue-50'}`}>
            <div className={`${container} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>
              <div className="lg:sticky lg:top-28 lg:self-start">
                <SectionHeading
                  id="faq-title"
                  align="left"
                  eyebrow="FAQ"
                  title="Questions"
                  highlight="fréquentes"
                  lead="Tout ce qu'il faut savoir pour commander votre gaz ou lancer votre projet d'installation, gaz ou solaire."
                />
                <a href={phoneHref} className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3.5 font-semibold text-afro-ink shadow-sm ring-1 ring-slate-200/70 transition-colors hover:text-afro-blue">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-afro-blue-50 text-afro-blue">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-left">
                    <span className="block text-xs font-medium text-slate-500">Une autre question ?</span>
                    {phoneDisplay}
                  </span>
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
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-afro-blue via-afro-blue to-afro-blue-dark shadow-[0_40px_80px_rgb(14,108,208,0.28)]">
                <div
                  className="absolute inset-0 opacity-15"
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
                  aria-hidden="true"
                />
                <div className="absolute -left-24 -bottom-24 h-80 w-80 rounded-full bg-afro-green/20 blur-3xl" aria-hidden="true" />
                <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />

                <div className="relative flex flex-col items-center justify-between gap-12 p-8 md:p-14 lg:p-16 xl:flex-row">
                  <div className="max-w-2xl text-center xl:text-left">
                    <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-afro-green" aria-hidden="true" />
                      Assistance réactive
                    </p>
                    <h2 id="contact-title" className="mb-5 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
                      Besoin d'une assistance immédiate ?
                    </h2>
                    <p className="mx-auto mb-10 max-w-xl text-lg text-white/85 xl:mx-0">
                      Notre équipe d'experts est disponible pour vos besoins en approvisionnement ou pour toute intervention
                      technique d'urgence.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-5 sm:flex-row xl:justify-start">
                      <a
                        href={phoneHref}
                        className="flex w-full items-center rounded-2xl bg-white p-2 pr-6 text-afro-blue shadow-lg transition-transform hover:-translate-y-0.5 sm:w-auto"
                      >
                        <span className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-afro-blue-50">
                          <Phone className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="font-display text-xl font-bold tracking-wide">{phoneDisplay}</span>
                      </a>
                      <a href={`mailto:${contactEmail}`} className="flex items-center gap-4 text-white/85 transition-colors hover:text-white">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/10">
                          <Mail className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-left">
                          <span className="mb-0.5 block text-xs font-medium text-white/70">Écrivez-nous</span>
                          <span className="block text-sm font-semibold">{contactEmail}</span>
                        </span>
                      </a>
                    </div>
                  </div>

                  <div className="w-full max-w-sm shrink-0 rounded-2xl bg-white p-8 shadow-2xl">
                    <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-afro-blue-50 text-afro-blue">
                      <Headset className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <h3 className="mb-5 font-display text-xl font-bold text-afro-ink">Service client</h3>
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
                    <p className="mt-6 flex items-center gap-2 rounded-xl bg-afro-green/15 px-4 py-2.5 text-sm font-semibold text-afro-green-dark">
                      <Zap className="h-4 w-4" aria-hidden="true" /> Temps de réponse &lt; 2 h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/70 bg-afro-blue-50 pt-16 pb-10 lg:pt-20">
          <div className={container}>
            <div className="mb-14 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-4">
                <SiteLogo size="lg" />
                <p className="mt-5 max-w-sm leading-relaxed text-slate-600">
                  Votre partenaire énergétique de confiance au Maroc. Distribution de gaz Butagaz et Air Liquide, énergie solaire.
                </p>
                <div className="mt-6 flex gap-3">
                  <a href={phoneHref} aria-label={`Appeler le ${phoneDisplay}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-afro-blue shadow-sm ring-1 ring-slate-200/70 transition-colors hover:bg-afro-blue hover:text-white">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </a>
                  <a href={`mailto:${contactEmail}`} aria-label={`Écrire à ${contactEmail}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-afro-blue shadow-sm ring-1 ring-slate-200/70 transition-colors hover:bg-afro-blue hover:text-white">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <nav aria-label="Liens du pied de page" className="lg:col-span-2">
                <h2 className="mb-5 text-sm font-semibold text-afro-ink">Navigation</h2>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li><a href="#about" className="transition-colors hover:text-afro-blue">À propos</a></li>
                  <li><Link to="/notre-histoire" className="transition-colors hover:text-afro-blue">Notre histoire</Link></li>
                  <li><a href="#faq" className="transition-colors hover:text-afro-blue">FAQ</a></li>
                  <li><a href="#contact" className="transition-colors hover:text-afro-blue">Contact</a></li>
                  <li><Link to="/afro-digital" className="transition-colors hover:text-afro-blue">Afro Digital</Link></li>
                </ul>
              </nav>

              <div className="lg:col-span-3">
                <h2 className="mb-5 text-sm font-semibold text-afro-ink">Nos activités</h2>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li><a href="#gamme-butagaz" className="transition-colors hover:text-afro-blue">Bouteilles de gaz Butagaz</a></li>
                  <li><a href="#gamme-air-liquide" className="transition-colors hover:text-afro-blue">Gaz industriels Air Liquide</a></li>
                  <li><a href="#installation" className="transition-colors hover:text-afro-blue">Installation de réseaux de gaz</a></li>
                  <li><a href="#solaire" className="transition-colors hover:text-afro-blue">Panneaux solaires</a></li>
                  <li><Link to="/ecom" className="transition-colors hover:text-afro-blue">Pièces & matériel de gaz</Link></li>
                </ul>
              </div>

              <div className="lg:col-span-3">
                <h2 className="mb-5 text-sm font-semibold text-afro-ink">Contact</h2>
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

            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-center text-sm text-slate-500 md:flex-row md:text-left">
              <p>© {new Date().getFullYear()} {SITE_NAME}. Tous droits réservés.</p>
              <div className="flex flex-wrap justify-center gap-6">
                <a href="#" className="transition-colors hover:text-afro-blue">Mentions légales</a>
                <a href="#" className="transition-colors hover:text-afro-blue">Confidentialité</a>
              </div>
            </div>
          </div>
        </footer>

        <SolarQuoteModal
          request={solarQuote}
          onClose={() => setSolarQuote(null)}
          contactEmail={contactEmail}
          phoneDisplay={phoneDisplay}
          phoneHref={phoneHref}
        />

        {isSimulatorLoaded && (
          <Suspense fallback={null}>
            <PipelineSimulationModal isOpen={isSimulationModalOpen} onClose={() => setIsSimulationModalOpen(false)} />
          </Suspense>
        )}
      </div>
    </MotionConfig>
  );
}
