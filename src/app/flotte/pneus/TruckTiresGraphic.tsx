import React, { useState } from 'react';
import { usePneuStore, PneuPosition, Pneu } from '../../../stores/usePneuStore';
import { formatMAD, formatDate, formatKm } from '../../../lib/formatters';

export function TruckTiresGraphic({ vehiculeId }: { vehiculeId: string }) {
  const pneus = usePneuStore(s => s.pneus).filter(p => p.vehiculeId === vehiculeId);
  const [selectedPos, setSelectedPos] = useState<PneuPosition | null>(null);

  const getLatestPneu = (pos: PneuPosition) => {
    const posPneus = pneus.filter(p => p.position === pos).sort((a, b) => new Date(b.dateMontage).getTime() - new Date(a.dateMontage).getTime());
    return posPneus[0];
  };

  const getHistory = (pos: PneuPosition) => {
    return pneus.filter(p => p.position === pos).sort((a, b) => new Date(b.dateMontage).getTime() - new Date(a.dateMontage).getTime());
  };

  const renderTire = (pos: PneuPosition, label: string) => {
    const latest = getLatestPneu(pos);
    const isSelected = selectedPos === pos;
    const hasHistory = latest !== undefined;

    return (
      <div 
        onClick={() => setSelectedPos(isSelected ? null : pos)}
        className={`relative w-12 h-20 rounded-md border-2 cursor-pointer transition-all flex items-center justify-center
          ${isSelected ? 'border-primary bg-primary/20 scale-105 z-10 shadow-lg shadow-primary/20' : hasHistory ? 'border-border-strong bg-surface hover:border-primary/50' : 'border-border border-dashed bg-surface-2 opacity-50'}
        `}
      >
        <div className="absolute -top-6 text-[10px] font-medium text-text-muted whitespace-nowrap">{label}</div>
        <div className="w-8 h-16 bg-surface-2 rounded border border-border-strong flex items-center justify-center flex-col gap-1 overflow-hidden relative">
           {/* Tread pattern */}
           <div className="absolute inset-0 opacity-10 flex flex-col justify-between py-1">
             <div className="w-full h-1 bg-black"></div>
             <div className="w-full h-1 bg-black"></div>
             <div className="w-full h-1 bg-black"></div>
             <div className="w-full h-1 bg-black"></div>
           </div>
           {hasHistory && <span className="text-[10px] font-bold text-text-primary z-10">{latest.usureActuelle}%</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-6 mt-6 mb-6 shadow-sm flex flex-col xl:flex-row gap-8">
      
      <div className="flex-1 flex justify-center items-center py-8">
        <div className="relative w-[280px] h-[400px] border-4 border-border-strong rounded-t-3xl rounded-b-lg flex justify-center bg-surface-2/30 shadow-inner">
          {/* Chassis outline */}
          <div className="absolute top-0 w-24 h-full border-x-4 border-border-strong/50 bg-border/20"></div>
          
          {/* Front Cab */}
          <div className="absolute top-0 w-full h-32 border-b-4 border-border-strong/50 bg-black/5 rounded-t-2xl flex justify-center">
             <div className="w-40 h-16 mt-4 bg-primary/10 rounded-t-xl border border-primary/20 backdrop-blur-sm"></div>
          </div>

          {/* Front Axle */}
          <div className="absolute top-20 w-[120%] h-3 bg-border-strong/50" />
          <div className="absolute top-11 -left-7">{renderTire('avant_gauche', 'AVG')}</div>
          <div className="absolute top-11 -right-7">{renderTire('avant_droit', 'AVD')}</div>

          {/* Rear Axle */}
          <div className="absolute bottom-28 w-[140%] h-3 bg-border-strong/50" />
          
          <div className="absolute bottom-16 -left-10">{renderTire('arriere_gauche_ext', 'ARG Ext')}</div>
          <div className="absolute bottom-16 left-3">{renderTire('arriere_gauche_int', 'ARG Int')}</div>
          
          <div className="absolute bottom-16 -right-10">{renderTire('arriere_droit_ext', 'ARD Ext')}</div>
          <div className="absolute bottom-16 right-3">{renderTire('arriere_droit_int', 'ARD Int')}</div>

          {/* Secours */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 scale-75 opacity-80">
            {renderTire('secours', 'Secours')}
          </div>
        </div>
      </div>

      <div className="flex-[1.5] bg-surface-2/50 rounded-xl p-6 border border-border">
        {selectedPos ? (
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-bold text-text-primary mb-4 capitalize flex items-center gap-2 border-b border-border pb-3">
              <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
              Historique: {selectedPos.replace(/_/g, ' ')}
            </h3>
            
            <div className="space-y-3 overflow-y-auto pr-2 flex-1 max-h-[400px]">
              {getHistory(selectedPos).length === 0 ? (
                <p className="text-sm text-text-muted mt-4">Aucun historique pour cette position.</p>
              ) : (
                getHistory(selectedPos).map((p, idx) => (
                  <div key={p.id} className={`p-4 rounded-lg border ${idx === 0 ? 'bg-surface border-primary shadow-sm' : 'bg-surface/50 border-border'}`}>
                    {idx === 0 && <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded mb-2 inline-block">Actuel</span>}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-text-primary">{p.marque} {p.modele}</div>
                        <div className="text-xs text-text-secondary">{p.dimensions}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{formatMAD(p.cout)}</div>
                        <div className="text-xs text-text-muted">{formatDate(p.dateMontage)}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm mt-3 pt-3 border-t border-border">
                      <div>
                        <span className="text-text-muted">Monté à:</span> <span className="font-medium text-text-primary">{formatKm(p.kilometrageMontage)}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Usure:</span> <span className="font-medium text-text-primary">{p.usureActuelle}%</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted px-8 text-center gap-4 min-h-[300px]">
            <div className="w-16 h-16 border-2 border-dashed border-border rounded-full flex items-center justify-center">
              <div className="w-8 h-12 bg-surface-2 border border-border rounded opacity-50"></div>
            </div>
            <p>Sélectionnez un pneu sur le schéma à gauche pour voir son historique de remplacement complet.</p>
          </div>
        )}
      </div>
      
    </div>
  );
}
