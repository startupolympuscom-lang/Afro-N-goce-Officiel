import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Receipt } from 'lucide-react';
import { Maintenance, getDateCommande, getNumeroCommande } from '../../../stores/useMaintenanceStore';
import { DatePicker } from '../../../components/ui/DatePicker';
import { toDayKey, dayKeyToISO } from '../../../lib/formatters';

export type MaintenanceReferences = Pick<Maintenance, 'numeroCommande' | 'dateCommande' | 'numeroBL' | 'numeroFacture' | 'dateFacture'>;

interface MaintenanceReferencesModalProps {
  maintenance: Maintenance;
  immatriculation?: string;
  onClose: () => void;
  onSave: (references: MaintenanceReferences) => void;
}

export function MaintenanceReferencesModal({ maintenance, immatriculation, onClose, onSave }: MaintenanceReferencesModalProps) {
  const [numeroCommande, setNumeroCommande] = useState(maintenance.numeroCommande ?? '');
  const [dateCommande, setDateCommande] = useState(toDayKey(getDateCommande(maintenance)));
  const [numeroBL, setNumeroBL] = useState(maintenance.numeroBL ?? '');
  const [numeroFacture, setNumeroFacture] = useState(maintenance.numeroFacture ?? '');
  const [dateFacture, setDateFacture] = useState(toDayKey(maintenance.dateFacture));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      numeroCommande: numeroCommande.trim() || undefined,
      dateCommande: dayKeyToISO(dateCommande),
      numeroBL: numeroBL.trim() || undefined,
      numeroFacture: numeroFacture.trim() || undefined,
      dateFacture: dayKeyToISO(dateFacture),
    });
  };

  const inputClass = 'w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 outline-none';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-surface rounded-2xl shadow-2xl z-50 border border-border overflow-hidden"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Bon de commande, BL & facture
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {immatriculation} — {maintenance.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>

        <form id="maintenance-references-form" onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">N° bon de commande</label>
              <input
                type="text"
                value={numeroCommande}
                onChange={e => setNumeroCommande(e.target.value)}
                placeholder={getNumeroCommande({ ...maintenance, numeroCommande: undefined })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Date du bon de commande</label>
              <DatePicker value={dateCommande} onChange={setDateCommande} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">N° bon de livraison (BL)</label>
            <input
              type="text"
              value={numeroBL}
              onChange={e => setNumeroBL(e.target.value)}
              placeholder="Ex: BL-2026-0451"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">N° facture</label>
              <input
                type="text"
                value={numeroFacture}
                onChange={e => setNumeroFacture(e.target.value)}
                placeholder="Ex: FAC-2026-145"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Date de facture</label>
              <DatePicker value={dateFacture} onChange={setDateFacture} />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-border bg-surface-2 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="maintenance-references-form"
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Enregistrer
          </button>
        </div>
      </motion.div>
    </>
  );
}
