import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { TicketCarburant, StationInterne } from '../types';

interface CarburantStore {
  tickets: TicketCarburant[];
  stationInterne: StationInterne;
  addTicket: (data: Omit<TicketCarburant, 'id' | 'createdAt' | 'reference'>) => TicketCarburant;
  deleteTicket: (id: string) => void;
  updateStationStock: (volume: number, type: 'add' | 'remove', details?: { fournisseur: string, prixParLitre: number, coutTotal: number, date?: string }) => void;
  resetStationStock: () => void;
  updateStationSupply: (id: string, updatedData: { date: string; volume: number; fournisseur: string; prixParLitre: number; coutTotal: number }) => void;
  deleteStationSupply: (id: string) => void;
}

export const useCarburantStore = create<CarburantStore>()(
  persist(
    immer((set, get) => ({
      tickets: [],
      stationInterne: {
        capacite: 10000,
        stockActuel: 0,
        historique: []
      },
      addTicket: (data) => {
        const ticket: TicketCarburant = {
          ...data,
          id: nanoid(),
          reference: `TC-${new Date().getFullYear()}-${String(get().tickets.length + 1).padStart(4, '0')}`,
          createdAt: new Date().toISOString(),
        };
        
        set(state => { 
          state.tickets.push(ticket); 
          if (ticket.lieu === 'interne') {
            state.stationInterne.stockActuel -= ticket.volume;
          }
        });
        
        return ticket;
      },
      deleteTicket: (id) => set(state => {
        const ticket = state.tickets.find(t => t.id === id);
        if (ticket && ticket.lieu === 'interne') {
          state.stationInterne.stockActuel += ticket.volume;
        }
        state.tickets = state.tickets.filter(t => t.id !== id);
      }),
      updateStationStock: (volume, type, details) => set(state => {
        if (type === 'add') {
          const currentStockBefore = state.stationInterne.stockActuel;
          state.stationInterne.stockActuel += volume;
          state.stationInterne.historique.push({
            id: nanoid(),
            date: details?.date || new Date().toISOString(),
            volume,
            fournisseur: details?.fournisseur || 'N/A',
            prixParLitre: details?.prixParLitre || 0,
            coutTotal: details?.coutTotal || 0,
            stockAvant: currentStockBefore
          });
        } else {
          state.stationInterne.stockActuel -= volume;
        }
      }),
      resetStationStock: () => set(state => {
        state.stationInterne.stockActuel = 0;
        state.stationInterne.historique = [];
      }),
      updateStationSupply: (id, updatedData) => set(state => {
        const item = state.stationInterne.historique.find(h => h.id === id);
        if (item) {
          const diff = updatedData.volume - item.volume;
          state.stationInterne.stockActuel += diff;
          item.date = updatedData.date;
          item.volume = updatedData.volume;
          item.fournisseur = updatedData.fournisseur;
          item.prixParLitre = updatedData.prixParLitre;
          item.coutTotal = updatedData.coutTotal;
        }
      }),
      deleteStationSupply: (id) => set(state => {
        const item = state.stationInterne.historique.find(h => h.id === id);
        if (item) {
          state.stationInterne.stockActuel -= item.volume;
        }
        state.stationInterne.historique = state.stationInterne.historique.filter(h => h.id !== id);
      }),
    })),
    { name: 'fleetops-carburant', storage: createJSONStorage(() => postgresStorage) }
  )
);
