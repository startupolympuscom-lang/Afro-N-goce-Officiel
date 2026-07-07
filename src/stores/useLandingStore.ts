import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { postgresStorage } from '../lib/postgresStorage';

export interface PartnerLogo {
  id: string;
  url: string;
  name: string;
}

export interface HistoryImage {
  id: string;
  url: string;
}

export interface HistoryMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
  image?: string;
}

export interface ProductImage {
  id: string;
  brand: 'Butagaz' | 'Air Liquide';
  url: string;
  title?: string;
  description?: string;
}

interface LandingState {
  // Media & Texts
  heroImage: string | null;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  
  aboutTitle: string;
  aboutDescription: string;
  
  servicesTitle: string;
  servicesDescription: string;
  pipelineImage: string;
  
  butagazCardImage: string;
  airLiquideCardImage: string;
  contactBgImage: string;
  
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;

  logoImage: string | null;
  logoText: string;
  mascotImage: string | null;

  partnerLogos: PartnerLogo[];
  historyImages: HistoryImage[];
  milestones: HistoryMilestone[];
  productImages: ProductImage[];

  // Actions
  setHeroImage: (image: string) => void;
  updateHeroContent: (content: Partial<Pick<LandingState, 'heroTitle' | 'heroSubtitle' | 'heroDescription'>>) => void;
  updateAboutContent: (content: Partial<Pick<LandingState, 'aboutTitle' | 'aboutDescription'>>) => void;
  updateServicesContent: (content: Partial<Pick<LandingState, 'servicesTitle' | 'servicesDescription' | 'pipelineImage'>>) => void;
  updateMediaContent: (content: Partial<Pick<LandingState, 'butagazCardImage' | 'airLiquideCardImage' | 'contactBgImage' | 'logoImage' | 'logoText' | 'mascotImage'>>) => void;
  updateContactInfo: (info: Partial<Pick<LandingState, 'contactPhone' | 'contactEmail' | 'contactAddress'>>) => void;

  addPartnerLogo: (logo: PartnerLogo) => void;
  removePartnerLogo: (id: string) => void;
  updatePartnerLogoName: (id: string, name: string) => void;
  addHistoryImage: (image: HistoryImage) => void;
  removeHistoryImage: (id: string) => void;
  addMilestone: (milestone: HistoryMilestone) => void;
  updateMilestone: (id: string, milestone: Partial<HistoryMilestone>) => void;
  removeMilestone: (id: string) => void;
  addProductImage: (productImage: ProductImage) => void;
  removeProductImage: (id: string) => void;
  updateProductImage: (id: string, updates: Partial<ProductImage>) => void;
}

export const useLandingStore = create<LandingState>()(
  persist(
    (set) => ({
      heroImage: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&q=80&w=1000",
      heroTitle: "LE LEADER DE LA DISTRIBUTION DE GAZ CONDITIONNÉ EN BOUTEILLE",
      heroSubtitle: "Butane, propane, oxygène, argon, azote, CO2",
      heroDescription: "Industrielle, foyer, agriculture... pour tout type de consommation de gaz",
      
      aboutTitle: "MAÎTRISE et RIGUEUR.",
      aboutDescription: "AFRO Négoce redéfinie la distribution énergétique au Maroc. Nous allions logistique de haute précision et standards de sécurité internationaux.",
      
      servicesTitle: "Installation de gaz Pipeline",
      servicesDescription: "Conception et réalisation de réseaux fluides haute performance. Une synergie entre sécurité absolue et maîtrise technique.",
      pipelineImage: "https://images.unsplash.com/photo-1510152431055-6b5809757398?auto=format&fit=crop&q=80&w=1000",
      
      butagazCardImage: "https://images.unsplash.com/photo-1517420812314-8549b17939df?auto=format&fit=crop&q=80&w=1000",
      airLiquideCardImage: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=1000",
      contactBgImage: "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80&w=2000",
      
      contactPhone: "0535558020",
      contactEmail: "contact@afronegoce.ma",
      contactAddress: "N5 Avenue Bir Anzarane Hay saada Meknes, Maroc",

      logoImage: null,
      logoText: "AFRO NÉGOCE",
      mascotImage: "https://storage.googleapis.com/static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_9.png",

      partnerLogos: [
        { id: 'p1', name: 'Partner 1', url: 'https://storage.googleapis.com/static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_4.png' },
        { id: 'p2', name: 'Partner 2', url: 'https://storage.googleapis.com/static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_5.png' },
        { id: 'p3', name: 'Partner 3', url: 'https://storage.googleapis.com/static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_6.png' },
        { id: 'p4', name: 'Partner 4', url: 'https://storage.googleapis.com/static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_7.png' }
      ],
      historyImages: [
        { id: '1', url: 'https://storage.googleapis.com/static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_1.png' },
        { id: '2', url: 'https://storage.googleapis.com/static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_2.png' },
        { id: '3', url: 'https://storage.googleapis.com/static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_3.png' },
        { id: '4', url: 'https://storage.googleapis.com/static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_8.png' }
      ],
      milestones: [
        {
          id: 'm1',
          year: "1998",
          title: "Fondation d'AFRO Négoce",
          description: "Début de l'aventure à Meknès avec une vision claire : devenir le partenaire énergétique de référence dans la région."
        },
        {
          id: 'm2',
          year: "2005",
          title: "Partenariat avec Butagaz",
          description: "Signature d'un accord stratégique pour la distribution exclusive du gaz Butagaz, renforçant notre présence sur le marché domestique."
        },
        {
          id: 'm3',
          year: "2012",
          title: "Expansion Industrielle",
          description: "Lancement de la division Gaz Industriels en partenariat avec Air Liquide, servant les secteurs de la santé et de la construction."
        },
        {
          id: 'm4',
          year: "2018",
          title: "Modernisation de la Flotte",
          description: "Investissement massif dans une flotte de camions de dernière génération et mise en place de systèmes de suivi logistique avancés."
        },
        {
          id: 'm5',
          year: "2024",
          title: "Digitalisation FleetOps",
          description: "Lancement de notre plateforme propriétaire FleetOps pour une gestion optimisée et transparente de nos opérations."
        }
      ],
      productImages: [],
      setHeroImage: (image) => set({ heroImage: image }),
      updateHeroContent: (content) => set((state) => ({ ...state, ...content })),
      updateAboutContent: (content) => set((state) => ({ ...state, ...content })),
      updateServicesContent: (content) => set((state) => ({ ...state, ...content })),
      updateMediaContent: (content) => set((state) => ({ ...state, ...content })),
      updateContactInfo: (info) => set((state) => ({ ...state, ...info })),

      addPartnerLogo: (logo) => set((state) => ({ partnerLogos: [...state.partnerLogos, logo] })),
      removePartnerLogo: (id) => set((state) => ({ partnerLogos: state.partnerLogos.filter(l => l.id !== id) })),
      updatePartnerLogoName: (id, name) => set((state) => ({
        partnerLogos: state.partnerLogos.map(l => l.id === id ? { ...l, name } : l)
      })),
      addHistoryImage: (image) => set((state) => ({ historyImages: [...state.historyImages, image] })),
      removeHistoryImage: (id) => set((state) => ({ historyImages: state.historyImages.filter(i => i.id !== id) })),
      addMilestone: (milestone) => set((state) => ({ milestones: [...state.milestones, milestone] })),
      updateMilestone: (id, mlp) => set((state) => ({ milestones: state.milestones.map(m => m.id === id ? { ...m, ...mlp } : m) })),
      removeMilestone: (id) => set((state) => ({ milestones: state.milestones.filter(m => m.id !== id) })),
      addProductImage: (image) => set((state) => ({ productImages: [...state.productImages, image] })),
      removeProductImage: (id) => set((state) => ({ productImages: state.productImages.filter(img => img.id !== id) })),
      updateProductImage: (id, updates) => set((state) => ({
        productImages: state.productImages.map(img => img.id === id ? { ...img, ...updates } : img)
      })),
    }),
    {
      name: 'landing-storage-v2',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
