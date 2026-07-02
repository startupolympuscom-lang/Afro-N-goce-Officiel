import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { postgresStorage } from '../lib/postgresStorage';
import { initialClients } from '../data/initialClients';

export interface DispatchGazDriver {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  phone: string;
  status: 'actif' | 'inactif';
  cnss?: string;
  address?: string;
  cin?: string;
  speed?: number;
  stops?: number;
  company?: 'afro_negoce' | 'chakirine_gaz';
}

export interface GazBrand {
  id: string;
  name: string;
  categories: string[]; // e.g. "3Kg", "12Kg", "34Kg"
  productImages?: Record<string, string>;
}

export interface GazZone {
  id: string;
  name: string; // e.g. "Zone 0", "Zone 1"
}

export interface GazPrice {
  id: string;
  brandId: string;
  category: string;
  zoneId: string;
  price: number;
}

export interface GazClientSpecialPrice {
  brandId: string;
  category: string;
  price: number;
}

export interface GazClient {
  id: string;
  name: string;
  type: 'entreprise' | 'particulier' | 'foyer' | 'restaurant' | 'industriel' | 'agriculture' | 'colonie de vacances' | 'POS';
  zoneId: string;
  city: string;
  address: string;
  lat?: number;
  lng?: number;
  code?: string;
  secteur?: string;
  ice?: string;
  patente?: string;
  phone?: string;
  hasSpecialPrice?: boolean;
  specialPrices?: GazClientSpecialPrice[];
}

export interface GazSale {
  id: string;
  date: string;
  driverId: string;
  clientId: string;
  brandId: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: 'espece' | 'cheque' | 'credit';
  status?: 'payé' | 'non payé';
  lat?: number;
  lng?: number;
  company?: 'afro_negoce' | 'chakirine_gaz';
}

export interface Convoyeur {
  id: string;
  nom: string;
  prenom: string;
  phone: string;
  cin?: string;
  status: 'actif' | 'inactif';
}

export interface GazPointage {
  id: string;
  driverId: string;
  convoyeurId?: string; // Legacy single selection
  convoyeursIds?: string[]; // Multiple selections
  date: string;
  timestamp: string;
}

export interface GazExpense {
  id: string;
  date: string;
  driverId: string;
  amount: number;
  reason: string;
}

export interface CaisseTransfer {
  id: string;
  date: string;
  amount: number;
  toAccount: 'securitaire' | 'noir';
  reason?: string;
  company?: 'afro_negoce' | 'chakirine_gaz';
}

export interface CaisseAlimentation {
  id: string;
  date: string;
  amount: number;
  byWhom: string;
  reason?: string;
  type?: 'normal' | 'pret';
  company?: 'afro_negoce' | 'chakirine_gaz';
}

export interface GazCommande {
  id: string;
  date: string;
  brandId: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'payé' | 'non payé';
  supplierId: string;
}

export interface GazCommandePrice {
  brandId: string;
  category: string;
  price: number;
}

export interface GazCommission {
  id: string;
  brandId: string;
  category: string;
  rate: number;
}

export interface StockDispatch {
  id: string;
  date: string;
  driverId: string;
  brandId: string;
  category: string;
  quantity: number;
  sold: number;
  soldConsigned?: number; // New: Sold with cylinder (consignation)
  returnedFull?: number;  // New: Returned at end of day
  returnedEmpty?: number; // New: Returned empty at end of day
  isValidated?: boolean;  // New: Validated by admin
}

export interface GlobalStockItem {
  brandId: string;
  category: string;
  full: number;
  empty: number;
  damaged?: number;
  company?: 'afro_negoce' | 'chakirine_gaz';
}

export interface GlobalStockHistoryItem {
  id: string;
  date: string;
  brandId: string;
  category: string;
  deltaFull: number;
  deltaEmpty: number;
  company?: 'afro_negoce' | 'chakirine_gaz';
}

export interface GPLConfig {
  consignationPrices: {
    [brandId: string]: {
      [category: string]: number;
    }
  };
}

export interface TruckLocation {
  driverId: string;
  lat: number;
  lng: number;
  speed: number;
  lastUpdate: string;
  stoppedSince?: string; // Timestamp when the driver stopped
}

export interface LocationHistoryItem {
  id: string;
  driverId: string;
  lat: number;
  lng: number;
  speed: number;
  timestamp: string; // ISO format string
}

export function generateMockLocationHistory() {
  const history: LocationHistoryItem[] = [];
  const driverIds = ['2'];
  const baseLat = 33.8935;
  const baseLng = -5.5473;
  
  // Last 3 days
  for (let d = 0; d < 3; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dateString = date.toISOString().split('T')[0];
    
    driverIds.forEach((driverId) => {
      // 10 points per day from 08:00 to 17:00
      for (let h = 8; h <= 17; h++) {
        const timestamp = `${dateString}T${h.toString().padStart(2, '0')}:00:00.000Z`;
        
        // Generate a nice smooth circular path
        const rad = ((h - 8) / 9) * 2 * Math.PI;
        const latOffset = Math.sin(rad) * 0.025;
        const lngOffset = Math.cos(rad) * 0.025;
        
        history.push({
          id: `hist-${driverId}-${d}-${h}`,
          driverId,
          lat: baseLat + latOffset,
          lng: baseLng + lngOffset,
          speed: h === 8 || h === 13 || h === 17 ? 0 : 35 + Math.floor(Math.random() * 15),
          timestamp
        });
      }
    });
  }
  return history;
}

export interface DashboardWidget {
  id: string;
  type: 'stat' | 'chart' | 'ranking';
  title: string;
  visible: boolean;
  layout: { x: number, y: number, w: number, h: number };
}

export interface DispatchAlert {
  id: string;
  type: 'warning' | 'info' | 'critical';
  message: string;
  timestamp: string;
  driverId?: string;
}

export interface GazPaySlip {
  id: string;
  driverId: string;
  month: string;
  totalCommission: number;
  details: any[];
  generatedAt: string;
  acompte?: number;
}

export interface ComptaDocument {
  id: string;
  type: 'facture' | 'bon_commande' | 'bon_livraison' | 'declaration_tva' | 'declaration_cnss';
  reference: string;
  date: string;
  amount: number;
  fileName: string;
  fileData?: string;
  notes?: string;
  uploadedAt: string;
}

export interface StandardCall {
  id: string;
  timestamp: string; // ISO format string when recorded
  clientName: string;
  phoneNumber: string;
  address?: string;
  status: 'enregistré' | 'dispatché' | 'livré';
  notes?: string;
  driverId?: string;
}

interface DispatchGazState {
  drivers: DispatchGazDriver[];
  brands: GazBrand[];
  zones: GazZone[];
  prices: GazPrice[];
  clients: GazClient[];
  sales: GazSale[];
  expenses: GazExpense[];
  commissions: GazCommission[];
  stockDispatches: StockDispatch[];
  truckLocations: TruckLocation[];
  locationHistory: LocationHistoryItem[];
  dashboardWidgets: DashboardWidget[];
  alerts: DispatchAlert[];
  paySlips: GazPaySlip[];
  convoyeurs: Convoyeur[];
  pointages: GazPointage[];
  globalStock: GlobalStockItem[];
  globalStockHistory: GlobalStockHistoryItem[];
  comptoirStock: GlobalStockItem[];
  caisseSecuritaire: number;
  caisseNoir: number;
  caisseTransfers: CaisseTransfer[];
  caisseAlimentations?: CaisseAlimentation[];
  gplConfig: GPLConfig;
  gpsStatus: 'idle' | 'tracking' | 'error';
  commandePrices?: GazCommandePrice[];
  commandes?: GazCommande[];
  comptaDocuments?: ComptaDocument[];
  standardCalls: StandardCall[];
  gpsError: string | null;

  // Actions
  addComptaDocument: (doc: ComptaDocument) => void;
  deleteComptaDocument: (id: string) => void;
  addStandardCall: (call: StandardCall) => void;
  updateStandardCallStatus: (id: string, status: StandardCall['status']) => void;
  deleteStandardCall: (id: string) => void;
  addDriver: (driver: DispatchGazDriver) => void;
  updateDriver: (id: string, driver: Partial<DispatchGazDriver>) => void;
  deleteDriver: (id: string) => void;
  
  addConvoyeur: (convoyeur: Convoyeur) => void;
  updateConvoyeur: (id: string, convoyeur: Partial<Convoyeur>) => void;
  deleteConvoyeur: (id: string) => void;

  addPointage: (pointage: GazPointage) => void;
  hasPointageToday: (driverId: string) => boolean;

  setGpsStatus: (status: 'idle' | 'tracking' | 'error', error?: string | null) => void;
  
  addBrand: (brand: GazBrand) => void;
  updateBrand: (id: string, brand: Partial<GazBrand>) => void;
  deleteBrand: (id: string) => void;

  addZone: (zone: GazZone) => void;
  updateZone: (id: string, zone: Partial<GazZone>) => void;
  deleteZone: (id: string) => void;

  setPrice: (price: GazPrice) => void;

  addClient: (client: GazClient) => void;
  updateClient: (id: string, client: Partial<GazClient>) => void;
  deleteClient: (id: string) => void;
  reloadInitialClients: () => void;
  setClients: (clients: GazClient[]) => void;

  addSale: (sale: GazSale & { isConsignment?: boolean }) => void;
  addComptoirSale: (sale: GazSale & { isConsignment?: boolean, company?: 'afro_negoce' | 'chakirine_gaz' }) => void;
  updateSaleStatus: (id: string, status: 'payé' | 'non payé') => void;
  addExpense: (expense: GazExpense) => void;

  setCommission: (commission: GazCommission) => void;
  dispatchStock: (dispatch: StockDispatch) => void;
  dispatchStockBatch: (dispatches: StockDispatch[]) => void;
  updateStockSold: (driverId: string, brandId: string, category: string, quantity: number, isConsigned?: boolean) => void;
  validateStockDispatch: (id: string, returnedFull: number, returnedEmpty: number) => void;
  setGlobalStock: (items: GlobalStockItem[], historyItems?: GlobalStockHistoryItem[]) => void;
  declareDamagedStock: (brandId: string, category: string, quantity: number, company: 'afro_negoce' | 'chakirine_gaz') => void;
  repairDamagedStock: (brandId: string, category: string, quantity: number, type: 'full' | 'empty', company: 'afro_negoce' | 'chakirine_gaz') => void;
  dispatchToComptoir: (brandId: string, category: string, quantity: number, company?: 'afro_negoce' | 'chakirine_gaz') => void;
  updateComptoirStockSold: (brandId: string, category: string, quantity: number, isConsigned?: boolean, company?: 'afro_negoce' | 'chakirine_gaz') => void;
  updateGPLConfig: (config: GPLConfig) => void;

  updateTruckLocation: (location: TruckLocation) => void;
  addLocationHistoryItem: (item: Omit<LocationHistoryItem, 'id'>) => void;
  
  updateDashboardWidgets: (widgets: DashboardWidget[]) => void;
  addAlert: (alert: DispatchAlert) => void;
  clearAlerts: () => void;

  addCaisseTransfer: (transfer: CaisseTransfer) => void;
  addCaisseAlimentation: (alimentation: CaisseAlimentation) => void;
  deleteCaisseAlimentation: (id: string) => void;
  addPaySlip: (paySlip: GazPaySlip) => void;
  deletePaySlip: (id: string) => void;
  setCommandePrice: (brandId: string, category: string, price: number) => void;
  addCommande: (commande: GazCommande) => void;
  deleteCommande: (id: string) => void;
  updateCommandeStatus: (id: string, status: 'payé' | 'non payé') => void;
  resetData: () => void;
}

export const useDispatchGazStore = create<DispatchGazState>()(
  persist(
    (set) => ({
      drivers: [
        { id: '2', nom: 'Chauffeur', prenom: 'Test', email: 'driver@afronegoce.ma', phone: '0600000000', status: 'actif' as const, company: 'afro_negoce' },
        { id: '3', nom: 'El Amrani', prenom: 'Yassine', email: 'yassine@chakirine.ma', phone: '0611223344', status: 'actif' as const, company: 'chakirine_gaz' },
        { id: '4', nom: 'Chakir', prenom: 'Karim', email: 'karim@chakirine.ma', phone: '0655667788', status: 'actif' as const, company: 'chakirine_gaz' },
        { id: '5', nom: 'Ait Oufella', prenom: 'Brahim', email: 'brahim@afronegoce.ma', phone: '0677889900', status: 'actif' as const, company: 'afro_negoce' }
      ] as DispatchGazDriver[],
      brands: [
        { id: 'b1', name: 'Butagaz', categories: ['3Kg', '12Kg', '34Kg'] }
      ],
      zones: [
        { id: 'z1', name: 'Zone 0 (Meknès)' },
        { id: 'z2', name: 'Zone 1 (Région)' },
        { id: 'z3', name: 'Fes' },
        { id: 'z4', name: 'Casa' },
        { id: 'z5', name: 'Ifrane' },
        { id: 'z6', name: 'Khemisset' },
        { id: 'z7', name: 'Mrirt' },
        { id: 'z8', name: 'Oulmes' },
        { id: 'z9', name: 'Agourai' }
      ],
      prices: [
        { id: 'p1', brandId: 'b1', category: '12Kg', zoneId: 'z1', price: 40 },
        { id: 'p2', brandId: 'b1', category: '12Kg', zoneId: 'z2', price: 45 }
      ],
      clients: Array.from(new Map(initialClients.map(c => [c.id, c])).values()),
      sales: [],
      expenses: [],
      commissions: [
        { id: 'c1', brandId: 'b1', category: '3Kg', rate: 0.20 },
        { id: 'c2', brandId: 'b1', category: '12Kg', rate: 0.50 },
        { id: 'c3', brandId: 'b1', category: '34Kg', rate: 1.00 }
      ],
      stockDispatches: [],
      truckLocations: [
        { driverId: '2', lat: 33.8935, lng: -5.5473, speed: 0, lastUpdate: new Date().toISOString() },
        { driverId: '3', lat: 33.9021, lng: -5.5510, speed: 0, lastUpdate: new Date().toISOString() }
      ],
      locationHistory: generateMockLocationHistory(),
      dashboardWidgets: [
        { id: 'stat-daily', type: 'stat' as const, title: 'Ventes du jour', visible: true, layout: { x: 0, y: 0, w: 1, h: 2 } },
        { id: 'stat-total', type: 'stat' as const, title: 'Ventes Totales', visible: true, layout: { x: 1, y: 0, w: 1, h: 2 } },
        { id: 'stat-expenses', type: 'stat' as const, title: 'Dépenses', visible: true, layout: { x: 2, y: 0, w: 1, h: 2 } },
        { id: 'stat-profit', type: 'stat' as const, title: 'Bénéfice', visible: true, layout: { x: 3, y: 0, w: 1, h: 2 } },
        { id: 'chart-evolution', type: 'chart' as const, title: 'Évolution des Ventes', visible: true, layout: { x: 0, y: 2, w: 2, h: 8 } },
        { id: 'ranking-drivers', type: 'ranking' as const, title: 'Classement Chauffeurs', visible: true, layout: { x: 2, y: 2, w: 2, h: 8 } },
        { id: 'chart-profit-exp', type: 'chart' as const, title: 'Bénéfice vs Dépenses', visible: true, layout: { x: 0, y: 10, w: 2, h: 8 } },
        { id: 'chart-exp-evolution', type: 'chart' as const, title: 'Évolution des Dépenses', visible: true, layout: { x: 2, y: 10, w: 2, h: 8 } },
      ],
      alerts: [
        { id: '1', type: 'warning' as const, message: 'Niveau de stock bas - Zone 1', timestamp: new Date().toISOString() },
        { id: '2', type: 'info' as const, message: 'Nouveau client prospecté: Restaurant Oasis', timestamp: new Date().toISOString() }
      ] as DispatchAlert[],
      paySlips: [],
      convoyeurs: [
        { id: 'cv1', nom: 'Hassan', prenom: 'Amine', phone: '0611223344', status: 'actif' as const }
      ] as Convoyeur[],
      pointages: [],
      globalStock: [
        { brandId: 'b1', category: '3Kg', full: 100, empty: 50, company: 'afro_negoce' },
        { brandId: 'b1', category: '12Kg', full: 200, empty: 80, company: 'afro_negoce' },
        { brandId: 'b1', category: '34Kg', full: 50, empty: 20, company: 'afro_negoce' },
        { brandId: 'b1', category: '3Kg', full: 120, empty: 40, company: 'chakirine_gaz' },
        { brandId: 'b1', category: '12Kg', full: 180, empty: 60, company: 'chakirine_gaz' },
        { brandId: 'b1', category: '34Kg', full: 40, empty: 15, company: 'chakirine_gaz' }
      ] as GlobalStockItem[],
      globalStockHistory: [],
      comptoirStock: [
        { brandId: 'b1', category: '3Kg', full: 20, empty: 10, company: 'afro_negoce' },
        { brandId: 'b1', category: '12Kg', full: 40, empty: 15, company: 'afro_negoce' },
        { brandId: 'b1', category: '34Kg', full: 10, empty: 5, company: 'afro_negoce' },
        { brandId: 'b1', category: '3Kg', full: 30, empty: 5, company: 'chakirine_gaz' },
        { brandId: 'b1', category: '12Kg', full: 35, empty: 10, company: 'chakirine_gaz' },
        { brandId: 'b1', category: '34Kg', full: 15, empty: 2, company: 'chakirine_gaz' }
      ] as GlobalStockItem[],
      caisseSecuritaire: 0,
      caisseNoir: 0,
      caisseTransfers: [],
      caisseAlimentations: [],
      comptaDocuments: [],
      commandePrices: [
        { brandId: 'b1', category: '3Kg', price: 15 },
        { brandId: 'b1', category: '12Kg', price: 40 },
        { brandId: 'b1', category: '34Kg', price: 115 }
      ],
      commandes: [],
      standardCalls: [],
      gplConfig: {
        consignationPrices: {
          'b1': {
            '3Kg': 150,
            '12Kg': 250,
            '34Kg': 500
          }
        }
      },
      gpsStatus: 'idle' as const,
      gpsError: null,

      addDriver: (driver) => set((state) => ({ drivers: [...state.drivers, driver] })),
      updateDriver: (id, driver) => set((state) => ({
        drivers: state.drivers.map(d => d.id === id ? { ...d, ...driver } : d)
      })),
      deleteDriver: (id) => set((state) => ({ drivers: state.drivers.filter(d => d.id !== id) })),
      
      addConvoyeur: (convoyeur) => set((state) => ({ convoyeurs: [...state.convoyeurs, convoyeur] })),
      updateConvoyeur: (id, convoyeur) => set((state) => ({
        convoyeurs: state.convoyeurs.map(c => c.id === id ? { ...c, ...convoyeur } : c)
      })),
      deleteConvoyeur: (id) => set((state) => ({ convoyeurs: state.convoyeurs.filter(c => c.id !== id) })),

      addPointage: (pointage) => set((state) => ({ pointages: [...state.pointages, pointage] })),
      hasPointageToday: (driverId) => {
        const state = useDispatchGazStore.getState();
        const now = new Date();
        const todayStrLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const todayStrUtc = now.toISOString().split('T')[0];

        const driver = state.drivers.find(d => d.id === driverId || (d.email && d.email === driverId));
        const matchedDriverIds = new Set<string>([driverId]);
        if (driver) {
          matchedDriverIds.add(driver.id);
          if (driver.email) {
            state.drivers.forEach(d => {
              if (d.email === driver.email) {
                matchedDriverIds.add(d.id);
              }
            });
          }
        }

        return state.pointages.some(p => {
          if (!matchedDriverIds.has(p.driverId)) return false;
          const pointageDate = new Date(p.timestamp || p.date);
          const diffHours = (now.getTime() - pointageDate.getTime()) / (1000 * 60 * 60);
          const isTodayStr = p.date === todayStrUtc || p.date === todayStrLocal;
          
          return diffHours < 16 || isTodayStr;
        });
      },

      setGpsStatus: (status, error = null) => set({ gpsStatus: status, gpsError: error }),

      addBrand: (brand) => set((state) => ({ brands: [...state.brands, brand] })),
      updateBrand: (id, brand) => set((state) => ({
        brands: state.brands.map(b => b.id === id ? { ...b, ...brand } : b)
      })),
      deleteBrand: (id) => set((state) => ({ brands: state.brands.filter(b => b.id !== id) })),

      addZone: (zone) => set((state) => ({ zones: [...state.zones, zone] })),
      updateZone: (id, zone) => set((state) => ({
        zones: state.zones.map(z => z.id === id ? { ...z, ...zone } : z)
      })),
      deleteZone: (id) => set((state) => ({ zones: state.zones.filter(z => z.id !== id) })),

      setPrice: (price) => set((state) => {
        const existingIndex = state.prices.findIndex(p => p.brandId === price.brandId && p.category === price.category && p.zoneId === price.zoneId);
        if (existingIndex >= 0) {
          const newPrices = [...state.prices];
          newPrices[existingIndex] = price;
          return { prices: newPrices };
        }
        return { prices: [...state.prices, price] };
      }),

      addClient: (client) => set((state) => {
        // Prevent adding duplicate ID
        if (state.clients.some(c => c.id === client.id)) {
          return {
            clients: state.clients.map(c => c.id === client.id ? client : c)
          };
        }
        return { clients: [...state.clients, client] };
      }),
      updateClient: (id, client) => set((state) => ({
        clients: state.clients.map(c => c.id === id ? { ...c, ...client } : c)
      })),
      deleteClient: (id) => set((state) => ({ clients: state.clients.filter(c => c.id !== id) })),
      reloadInitialClients: () => set({ 
        clients: Array.from(new Map(initialClients.map(c => [c.id, c])).values()) 
      }),
      setClients: (clients) => set({ clients }),

      addSale: (sale) => set((state) => {
        const driver = state.drivers.find(d => d.id === sale.driverId);
        const driverCompany = driver?.company || 'afro_negoce';
        const saleWithCompany = { ...sale, company: sale.company || driverCompany };

        // Also update stock sold
        const newStockDispatches = state.stockDispatches.map(sd => {
          if (sd.driverId === sale.driverId && sd.brandId === sale.brandId && sd.category === sale.category && !sd.isValidated) {
            if (sale.isConsignment) {
              return { ...sd, soldConsigned: (sd.soldConsigned || 0) + sale.quantity };
            } else {
              return { ...sd, sold: sd.sold + sale.quantity };
            }
          }
          return sd;
        });

        // Enrich the sale with GPS coordinates of the sale if not provided
        const enrichSale = { ...saleWithCompany };
        if (!enrichSale.lat || !enrichSale.lng) {
          const truckLoc = state.truckLocations.find(l => l.driverId === sale.driverId);
          if (truckLoc) {
            enrichSale.lat = truckLoc.lat;
            enrichSale.lng = truckLoc.lng;
          } else {
            const client = state.clients.find(c => c.id === sale.clientId);
            if (client && client.lat && client.lng) {
              enrichSale.lat = client.lat;
              enrichSale.lng = client.lng;
            }
          }
        }

        return { sales: [...state.sales, enrichSale], stockDispatches: newStockDispatches };
      }),
      addComptoirSale: (sale) => set((state) => {
        const saleCompany = sale.company || 'afro_negoce';
        const saleWithCompany = { ...sale, company: saleCompany };
        const newComptoir = [...state.comptoirStock];
        const cIdx = newComptoir.findIndex(g => g.brandId === sale.brandId && g.category === sale.category && g.company === saleCompany);
        if (cIdx > -1) {
          if (!sale.isConsignment) {
            newComptoir[cIdx].empty += sale.quantity;
          }
          newComptoir[cIdx].full -= sale.quantity;
        }
        return { sales: [...state.sales, saleWithCompany], comptoirStock: newComptoir };
      }),
      updateSaleStatus: (id, status) => set((state) => ({
        sales: state.sales.map(s => s.id === id ? { ...s, status } : s)
      })),
      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),

      setCommission: (commission) => set((state) => {
        const existingIndex = state.commissions.findIndex(c => c.brandId === commission.brandId && c.category === commission.category);
        if (existingIndex >= 0) {
          const newCommissions = [...state.commissions];
          newCommissions[existingIndex] = commission;
          return { commissions: newCommissions };
        }
        return { commissions: [...state.commissions, commission] };
      }),

      dispatchStock: (dispatch) => set((state) => {
        const driver = state.drivers.find(d => d.id === dispatch.driverId);
        const driverCompany = driver?.company || 'afro_negoce';

        const existingIndex = state.stockDispatches.findIndex(sd => 
          sd.driverId === dispatch.driverId && 
          sd.brandId === dispatch.brandId && 
          sd.category === dispatch.category &&
          !sd.isValidated
        );

        if (existingIndex >= 0) {
          const newDispatches = [...state.stockDispatches];
          newDispatches[existingIndex] = { ...newDispatches[existingIndex], quantity: newDispatches[existingIndex].quantity + dispatch.quantity };
          
          // Deduct from global stock
          const newGlobalStock = state.globalStock.map(gs => {
            if (gs.brandId === dispatch.brandId && gs.category === dispatch.category && (gs.company === driverCompany || !gs.company)) {
              return { ...gs, full: Math.max(0, gs.full - dispatch.quantity) };
            }
            return gs;
          });

          return { stockDispatches: newDispatches, globalStock: newGlobalStock };
        }

        // Deduct from global stock
        const newGlobalStock = state.globalStock.map(gs => {
          if (gs.brandId === dispatch.brandId && gs.category === dispatch.category && (gs.company === driverCompany || !gs.company)) {
            return { ...gs, full: Math.max(0, gs.full - dispatch.quantity) };
          }
          return gs;
        });

        return { stockDispatches: [...state.stockDispatches, dispatch], globalStock: newGlobalStock };
      }),

      dispatchStockBatch: (dispatches) => set((state) => {
        let currentDispatches = [...state.stockDispatches];
        let currentGlobalStock = [...state.globalStock];

        dispatches.forEach(dispatch => {
          const driver = state.drivers.find(d => d.id === dispatch.driverId);
          const driverCompany = driver?.company || 'afro_negoce';

          const existingIndex = currentDispatches.findIndex(sd => 
            sd.driverId === dispatch.driverId && 
            sd.brandId === dispatch.brandId && 
            sd.category === dispatch.category &&
            !sd.isValidated
          );

          if (existingIndex >= 0) {
            currentDispatches[existingIndex] = { 
              ...currentDispatches[existingIndex], 
              quantity: currentDispatches[existingIndex].quantity + dispatch.quantity 
            };
          } else {
            currentDispatches.push(dispatch);
          }

          // Deduct from global stock for driver's company
          currentGlobalStock = currentGlobalStock.map(gs => {
            if (gs.brandId === dispatch.brandId && gs.category === dispatch.category && (gs.company === driverCompany || !gs.company)) {
              return { ...gs, full: Math.max(0, gs.full - dispatch.quantity) };
            }
            return gs;
          });
        });

        return { 
          stockDispatches: currentDispatches, 
          globalStock: currentGlobalStock 
        };
      }),

      updateStockSold: (driverId, brandId, category, quantity, isConsigned) => set((state) => {
        const newStockDispatches = state.stockDispatches.map(sd => {
          if (sd.driverId === driverId && sd.brandId === brandId && sd.category === category && !sd.isValidated) {
            if (isConsigned) {
              return { ...sd, soldConsigned: (sd.soldConsigned || 0) + quantity };
            } else {
              return { ...sd, sold: sd.sold + quantity };
            }
          }
          return sd;
        });
        return { stockDispatches: newStockDispatches };
      }),

      validateStockDispatch: (id, returnedFull, returnedEmpty) => set((state) => {
        const dispatch = state.stockDispatches.find(sd => sd.id === id);
        if (!dispatch) return state;

        const driver = state.drivers.find(d => d.id === dispatch.driverId);
        const driverCompany = driver?.company || 'afro_negoce';

        // Update global stock based on returns
        const newGlobalStock = state.globalStock.map(gs => {
          if (gs.brandId === dispatch.brandId && gs.category === dispatch.category && (gs.company === driverCompany || !gs.company)) {
            return { 
              ...gs, 
              full: gs.full + returnedFull, 
              empty: gs.empty + returnedEmpty 
            };
          }
          return gs;
        });

        const newStockDispatches = state.stockDispatches.map(sd => {
          if (sd.id === id) {
            return { ...sd, returnedFull, returnedEmpty, isValidated: true };
          }
          return sd;
        });

        return { stockDispatches: newStockDispatches, globalStock: newGlobalStock };
      }),

      setGlobalStock: (items, historyItems) => set((state) => ({ 
        globalStock: items,
        ...(historyItems ? { globalStockHistory: [...historyItems, ...state.globalStockHistory] } : {}) 
      })),
      declareDamagedStock: (brandId, category, quantity, company) => set((state) => {
        const newStock = state.globalStock.map(gs => {
          if (gs.brandId === brandId && gs.category === category && gs.company === company && gs.empty >= quantity) {
            return { ...gs, empty: gs.empty - quantity, damaged: (gs.damaged || 0) + quantity };
          }
          return gs;
        });
        return { globalStock: newStock };
      }),
      repairDamagedStock: (brandId, category, quantity, type, company) => set((state) => {
        const newStock = state.globalStock.map(gs => {
          if (gs.brandId === brandId && gs.category === category && gs.company === company && (gs.damaged || 0) >= quantity) {
            return { 
              ...gs, 
              damaged: (gs.damaged || 0) - quantity,
              full: type === 'full' ? gs.full + quantity : gs.full,
              empty: type === 'empty' ? gs.empty + quantity : gs.empty
            };
          }
          return gs;
        });
        return { globalStock: newStock };
      }),
      dispatchToComptoir: (brandId, category, quantity, company: 'afro_negoce' | 'chakirine_gaz' = 'afro_negoce') => set((state) => {
        const newGlobalStock = state.globalStock.map(gs => {
          if (gs.brandId === brandId && gs.category === category && gs.company === company && gs.full >= quantity) {
            return { ...gs, full: gs.full - quantity };
          }
          return gs;
        });

        const newComptoir = [...state.comptoirStock];
        const cIdx = newComptoir.findIndex(g => g.brandId === brandId && g.category === category && g.company === company);
        if (cIdx > -1) {
          newComptoir[cIdx].full += quantity;
        } else {
          newComptoir.push({ brandId, category, full: quantity, empty: 0, company });
        }
        return { globalStock: newGlobalStock, comptoirStock: newComptoir };
      }),
      updateComptoirStockSold: (brandId, category, quantity, isConsigned, company: 'afro_negoce' | 'chakirine_gaz' = 'afro_negoce') => set((state) => {
        const newComptoir = [...state.comptoirStock];
        const cIdx = newComptoir.findIndex(g => g.brandId === brandId && g.category === category && g.company === company);
        if (cIdx > -1) {
          if (!isConsigned) {
            newComptoir[cIdx].empty += quantity;
          }
          newComptoir[cIdx].full -= quantity;
        }
        return { comptoirStock: newComptoir };
      }),
      updateGPLConfig: (config) => set((state) => ({ 
        gplConfig: { ...state.gplConfig, ...config } 
      })),

      updateTruckLocation: (location) => set((state) => {
        const existingIndex = state.truckLocations.findIndex(l => l.driverId === location.driverId);
        const now = new Date();
        let newAlerts = [...state.alerts];
        let updatedLocation = { ...location };

        const newHistoryItem: LocationHistoryItem = {
          id: `hist-${location.driverId}-${now.getTime()}`,
          driverId: location.driverId,
          lat: location.lat,
          lng: location.lng,
          speed: location.speed,
          timestamp: location.lastUpdate || now.toISOString()
        };
        const updatedHistory = [...(state.locationHistory || []), newHistoryItem];

        if (existingIndex >= 0) {
          const prevLocation = state.truckLocations[existingIndex];
          
          // Detect stop
          if (location.speed === 0) {
            updatedLocation.stoppedSince = prevLocation.stoppedSince || now.toISOString();
            
            // Check if stopped for more than 15 minutes (900,000 ms)
            if (updatedLocation.stoppedSince) {
              const stoppedDuration = now.getTime() - new Date(updatedLocation.stoppedSince).getTime();
              const threshold = 15 * 60 * 1000; // 15 minutes
              
              if (stoppedDuration > threshold) {
                const driver = state.drivers.find(d => d.id === location.driverId);
                const alertId = `stop-${location.driverId}-${now.getHours()}-${Math.floor(now.getMinutes() / 15)}`;
                
                // Only add alert if it doesn't exist for this time window
                if (!newAlerts.find(a => a.id === alertId)) {
                  const newAlert: DispatchAlert = {
                    id: alertId,
                    type: 'warning',
                    message: `Arrêt prolongé détecté: ${driver?.prenom} ${driver?.nom} est arrêté depuis plus de 15 minutes.`,
                    timestamp: now.toISOString(),
                    driverId: location.driverId
                  };
                  newAlerts = [newAlert, ...newAlerts].slice(0, 50);
                }
              }
            }
          } else {
            updatedLocation.stoppedSince = undefined;
          }

          const newLocations = [...state.truckLocations];
          newLocations[existingIndex] = updatedLocation;
          
          // Also update driver speed and stops in the drivers array
          const newDrivers = state.drivers.map(d => {
            if (d.id === location.driverId) {
              const isNewStop = location.speed === 0 && prevLocation.speed > 0;
              return { 
                ...d, 
                speed: location.speed, 
                stops: isNewStop ? (d.stops || 0) + 1 : (d.stops || 0) 
              };
            }
            return d;
          });

          return { truckLocations: newLocations, alerts: newAlerts, drivers: newDrivers, locationHistory: updatedHistory };
        }
        
        return { truckLocations: [...state.truckLocations, updatedLocation], alerts: newAlerts, locationHistory: updatedHistory };
      }),

      addLocationHistoryItem: (item) => set((state) => ({
        locationHistory: [...(state.locationHistory || []), { ...item, id: `hist-${Date.now()}-${Math.random()}` }]
      })),

      updateDashboardWidgets: (widgets) => set({ dashboardWidgets: widgets }),
      addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 50) })),
      clearAlerts: () => set({ alerts: [] }),

      addPaySlip: (paySlip) => set((state) => ({ paySlips: [...state.paySlips, paySlip] })),
      deletePaySlip: (id: string) => set((state) => ({ paySlips: state.paySlips.filter(p => p.id !== id) })),
      addCaisseTransfer: (transfer) => set((state) => {
        const nextSecuritaire = transfer.toAccount === 'securitaire' 
          ? state.caisseSecuritaire + transfer.amount 
          : state.caisseSecuritaire;
        const nextNoir = transfer.toAccount === 'noir' 
          ? state.caisseNoir + transfer.amount 
          : state.caisseNoir;
        return {
          caisseTransfers: [...state.caisseTransfers || [], transfer],
          caisseSecuritaire: nextSecuritaire,
          caisseNoir: nextNoir
        };
      }),
      setCommandePrice: (brandId, category, price) => set((state) => {
        const prices = [...(state.commandePrices || [])];
        const idx = prices.findIndex(p => p.brandId === brandId && p.category === category);
        if (idx > -1) {
          prices[idx] = { brandId, category, price };
        } else {
          prices.push({ brandId, category, price });
        }
        return { commandePrices: prices };
      }),
      addCommande: (commande) => set((state) => ({
        commandes: [...(state.commandes || []), commande]
      })),
      deleteCommande: (id) => set((state) => ({
        commandes: (state.commandes || []).filter(c => c.id !== id)
      })),
      updateCommandeStatus: (id, status) => set((state) => ({
        commandes: (state.commandes || []).map(c => c.id === id ? { ...c, status } : c)
      })),
      addComptaDocument: (doc) => set((state) => ({
        comptaDocuments: [...(state.comptaDocuments || []), doc]
      })),
      deleteComptaDocument: (id) => set((state) => ({
        comptaDocuments: (state.comptaDocuments || []).filter(d => d.id !== id)
      })),
      addStandardCall: (call) => set((state) => ({
        standardCalls: [...(state.standardCalls || []), call]
      })),
      updateStandardCallStatus: (id, status) => set((state) => ({
        standardCalls: (state.standardCalls || []).map(c => c.id === id ? { ...c, status } : c)
      })),
      deleteStandardCall: (id) => set((state) => ({
        standardCalls: (state.standardCalls || []).filter(c => c.id !== id)
      })),
      addCaisseAlimentation: (alimentation) => set((state) => ({
        caisseAlimentations: [...(state.caisseAlimentations || []), alimentation]
      })),
      deleteCaisseAlimentation: (id) => set((state) => ({
        caisseAlimentations: (state.caisseAlimentations || []).filter(a => a.id !== id)
      })),
      resetData: () => set((state) => {
        const newGlobalStock = state.globalStock.map(gs => ({
          ...gs,
          full: 0,
          empty: 0
        })) as GlobalStockItem[];

        return {
          sales: [],
          expenses: [],
          stockDispatches: [],
          truckLocations: [],
          locationHistory: generateMockLocationHistory(),
          alerts: [],
          pointages: [],
          comptoirStock: [],
          commandes: [],
          globalStock: newGlobalStock,
          caisseSecuritaire: 0,
          caisseNoir: 0,
          caisseTransfers: [],
          caisseAlimentations: [],
          comptaDocuments: [],
          standardCalls: [],
          paySlips: []
        };
      }),
    }),
    {
      name: 'dispatch-gaz-storage',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
