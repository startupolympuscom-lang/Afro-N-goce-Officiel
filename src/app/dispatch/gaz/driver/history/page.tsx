import React from 'react';
import { useDispatchGazStore } from '../../../../../stores/useDispatchGazStore';
import { useDispatchAuthStore } from '../../../../../stores/useDispatchAuthStore';
import { Building2, Flame } from 'lucide-react';

export default function DispatchDriverHistoryPage() {
  const { user } = useDispatchAuthStore();
  const { sales, clients, brands } = useDispatchGazStore();

  if (!user) return null;

  const mySales = sales.filter(s => s.driverId === user.id).reverse();
  const totalToday = mySales
    .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.totalPrice, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Mes Ventes</h1>
      </div>

      <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200">
        <p className="text-blue-100 font-medium mb-1">Total des Encaissements Aujourd'hui</p>
        <p className="text-4xl font-bold">{totalToday.toLocaleString()} MAD</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 text-left">
          <h2 className="font-bold text-slate-900">Historique des Transactions</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {mySales.map(sale => {
            const client = clients.find(c => c.id === sale.clientId);
            const brand = brands.find(b => b.id === sale.brandId);
            return (
              <div key={sale.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-900">{client?.name || 'Client inconnu'}</span>
                  </div>
                  <span className="font-bold text-emerald-600">+{sale.totalPrice} MAD</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>{brand?.name} {sale.category} x{sale.quantity}</span>
                  </div>
                  <span>{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(sale.date).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
          {mySales.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              Aucune vente enregistrée pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
