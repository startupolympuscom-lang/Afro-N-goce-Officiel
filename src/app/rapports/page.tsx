import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Settings, 
  PieChart, 
  TrendingUp, 
  Truck, 
  Users,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatePicker } from '../../components/ui/DatePicker';

export default function RapportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [format, setFormat] = useState('pdf');

  const rapports = [
    { id: 'synthese', title: 'Synthèse globale', desc: 'Vue d\'ensemble des coûts et performances', icon: PieChart, color: 'text-primary', bg: 'bg-primary/10' },
    { id: 'carburant', title: 'Consommation carburant', desc: 'Analyse détaillée des pleins et L/100km', icon: TrendingUp, color: 'text-info', bg: 'bg-info/10' },
    { id: 'maintenance', title: 'Coûts de maintenance', desc: 'Dépenses par véhicule et type d\'intervention', icon: Settings, color: 'text-warning', bg: 'bg-warning/10' },
    { id: 'activite', title: 'Activité des véhicules', desc: 'Taux d\'utilisation, missions et arrêts', icon: Truck, color: 'text-success', bg: 'bg-success/10' },
    { id: 'chauffeurs', title: 'Performance chauffeurs', desc: 'Scores, infractions et éco-conduite', icon: Users, color: 'text-danger', bg: 'bg-danger/10' },
  ];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate generation
    alert(`Génération du rapport "${rapports.find(r => r.id === selectedReport)?.title}" du ${dateDebut} au ${dateFin} en format ${format.toUpperCase()}`);
    setSelectedReport(null);
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Rapports
          </h1>
          <p className="text-text-secondary mt-1">Générez et exportez vos analyses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rapports.map((r, i) => (
          <motion.div 
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedReport(r.id)}
            className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${r.bg} ${r.color}`}>
              <r.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">{r.title}</h3>
            <p className="text-sm text-text-secondary flex-1">{r.desc}</p>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-primary group-hover:text-primary-hover transition-colors">
                Générer
              </span>
              <Download className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Generate Report Modal */}
      <AnimatePresence>
        {selectedReport && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface rounded-2xl shadow-2xl z-50 border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Générer un rapport
                </h2>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6 p-4 bg-surface-2 rounded-lg border border-border">
                  <h3 className="font-medium text-text-primary mb-1">
                    {rapports.find(r => r.id === selectedReport)?.title}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {rapports.find(r => r.id === selectedReport)?.desc}
                  </p>
                </div>

                <form id="generate-report-form" onSubmit={handleGenerate} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date de début</label>
                      <DatePicker
                        value={dateDebut}
                        onChange={setDateDebut}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date de fin</label>
                      <DatePicker
                        value={dateFin}
                        onChange={setDateFin}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Format d'export</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${format === 'pdf' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface hover:bg-surface-2 text-text-secondary'}`}>
                        <input 
                          type="radio" 
                          name="format" 
                          value="pdf" 
                          checked={format === 'pdf'}
                          onChange={e => setFormat(e.target.value)}
                          className="sr-only"
                        />
                        <span className="font-medium">PDF</span>
                      </label>
                      <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${format === 'excel' ? 'border-success bg-success/5 text-success' : 'border-border bg-surface hover:bg-surface-2 text-text-secondary'}`}>
                        <input 
                          type="radio" 
                          name="format" 
                          value="excel" 
                          checked={format === 'excel'}
                          onChange={e => setFormat(e.target.value)}
                          className="sr-only"
                        />
                        <span className="font-medium">Excel (CSV)</span>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-border bg-surface-2 flex gap-3 justify-end">
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="px-6 py-2.5 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  form="generate-report-form"
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Générer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
