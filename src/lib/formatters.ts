import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DocumentStatus, Chauffeur, TicketCarburant, Mission, Infraction } from '../types';

export const formatMAD = (amount: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }).format(amount);

export const formatKm = (km: number) =>
  new Intl.NumberFormat('fr-FR').format(km) + ' km';

export const formatDate = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy', { locale: fr });

export const formatDatetime = (date: string | Date) =>
  format(new Date(date), "dd MMM yyyy 'à' HH:mm", { locale: fr });

export const formatRelativeTime = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });

export const getDaysUntilExpiry = (date: string | Date): number =>
  differenceInDays(new Date(date), new Date());

export const getDocumentStatus = (expiryDate: string | Date): DocumentStatus => {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return 'expire';
  if (days <= 30) return 'expire_bientot';
  return 'valide';
};

export const computeLPour100km = (liters: number, kmNow: number, kmBefore: number): number | null => {
  const distance = kmNow - kmBefore;
  if (distance <= 0) return null;
  return Number(((liters / distance) * 100).toFixed(1));
};

export const computeDriverScore = (chauffeur: Chauffeur, tickets: TicketCarburant[], missions: Mission[], infractions: Infraction[]): number => {
  // Mock implementation for now
  let score = 100;
  score -= infractions.length * 10;
  return Math.max(0, Math.min(100, score));
};

export const generateReference = (prefix: string, existingRefs: string[]): string => {
  const year = new Date().getFullYear();
  const next = (existingRefs.filter(r => r.startsWith(`${prefix}-${year}`)).length + 1)
    .toString().padStart(4, '0');
  return `${prefix}-${year}-${next}`;
};

// Moroccan numbers: "0535558020" → "05 35 55 80 20"
export const formatPhoneMA = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? digits.replace(/(\d{2})(?=\d)/g, '$1 ') : phone;
};

// Moroccan numbers: "0535558020" → "+212535558020", for tel: links and structured data
export const toInternationalPhoneMA = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('212')) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `+212${digits.slice(1)}`;
  return digits || phone;
};
