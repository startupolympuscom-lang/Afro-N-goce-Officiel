import {
  PencilRuler,
  Truck,
  Wrench,
  Gauge,
  Factory,
  Tractor,
  House,
  Store,
  Hotel,
  School,
  RadioTower,
  EvCharger,
  LampFloor,
  type LucideIcon,
} from 'lucide-react';
import type { SolarSegment } from '../../lib/solarSimulation';
import type { SolarVignetteVariant } from './SolarIllustrations';

export const SOLAR_SERVICES: { title: string; desc: string; icon: LucideIcon }[] = [
  {
    title: 'Étude & conception',
    desc: 'Analyse de vos factures, visite technique, étude de toiture ou de terrain et dimensionnement de la centrale.',
    icon: PencilRuler,
  },
  {
    title: 'Fourniture & vente',
    desc: 'Panneaux, onduleurs, batteries, structures et câblage : matériel seul ou installation complète.',
    icon: Truck,
  },
  {
    title: 'Installation & mise en service',
    desc: 'Pose, raccordement et mise en service par nos équipes, dans le respect des normes de sécurité électrique.',
    icon: Wrench,
  },
  {
    title: 'Suivi & maintenance',
    desc: 'Supervision de la production, nettoyage des panneaux et maintenance préventive pour un rendement durable.',
    icon: Gauge,
  },
];

export interface SolarSector {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

export const FEATURED_SECTORS: (SolarSector & { id: SolarVignetteVariant; uses: string[] })[] = [
  {
    id: 'industrie',
    title: 'Sites industriels',
    desc: "Centrales en toiture, au sol ou en ombrière pour réduire durablement la facture d'électricité de vos usines.",
    icon: Factory,
    uses: ['Usines & ateliers', 'Entrepôts & logistique', 'Agro-industrie', 'Carrières & mines'],
  },
  {
    id: 'agriculture',
    title: 'Agriculture',
    desc: "Pompage solaire pour l'irrigation et alimentation des exploitations, même loin du réseau électrique.",
    icon: Tractor,
    uses: ['Pompage & irrigation', 'Serres', 'Élevages', 'Chambres froides'],
  },
  {
    id: 'habitat',
    title: 'Habitat',
    desc: 'Villas, maisons et résidences : produisez votre propre électricité et stockez-la pour le soir.',
    icon: House,
    uses: ['Villas & maisons', 'Immeubles & résidences', 'Résidences secondaires', 'Batteries domestiques'],
  },
];

export const OTHER_SECTORS: SolarSector[] = [
  {
    id: 'tertiaire',
    title: 'Commerces & bureaux',
    desc: 'Magasins, bureaux, centres commerciaux et stations-service : une consommation de journée idéale pour le solaire.',
    icon: Store,
  },
  {
    id: 'hotellerie',
    title: 'Hôtellerie & restauration',
    desc: 'Hôtels, riads et restaurants : climatisation, froid et eau chaude à moindre coût.',
    icon: Hotel,
  },
  {
    id: 'collectivites',
    title: 'Santé, éducation & collectivités',
    desc: 'Écoles, cliniques, hôpitaux, mosquées et bâtiments publics.',
    icon: School,
  },
  {
    id: 'sites-isoles',
    title: 'Sites isolés & télécoms',
    desc: 'Fermes, chantiers et relais télécoms hors réseau, alimentés en autonomie grâce aux batteries.',
    icon: RadioTower,
  },
  {
    id: 'ombrieres',
    title: 'Ombrières & recharge électrique',
    desc: 'Parkings couverts de panneaux et bornes de recharge pour véhicules électriques.',
    icon: EvCharger,
  },
  {
    id: 'eclairage',
    title: 'Éclairage & pompage public',
    desc: "Lampadaires solaires, éclairage de voirie et pompage d'eau potable pour les communes.",
    icon: LampFloor,
  },
];

export const SOLAR_SECTOR_OPTIONS = [...FEATURED_SECTORS, ...OTHER_SECTORS].map((s) => s.title).concat('Autre projet');

/** Sector preselected in the quote form for each simulator profile. */
export const SEGMENT_SECTOR: Record<SolarSegment, string> = {
  habitat: 'Habitat',
  tertiaire: 'Commerces & bureaux',
  industrie: 'Sites industriels',
  agriculture: 'Agriculture',
};
