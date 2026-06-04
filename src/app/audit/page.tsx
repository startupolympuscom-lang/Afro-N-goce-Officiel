import { useState } from 'react';
import { useAuditStore } from '../../stores/useAuditStore';
import { 
  History, 
  Search, 
  Filter, 
  Download,
  User,
  Clock,
  FileText
} from 'lucide-react';
import { formatDatetime } from '../../lib/formatters';

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const logs = useAuditStore(s => s.logs);

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.resource.toLowerCase().includes(search.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Création': return 'bg-success/10 text-success border-success/20';
      case 'Modification': return 'bg-warning/10 text-warning border-warning/20';
      case 'Suppression': return 'bg-danger/10 text-danger border-danger/20';
      case 'Connexion': return 'bg-info/10 text-info border-info/20';
      default: return 'bg-surface-2 text-text-secondary border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Journal d'Audit
          </h1>
          <p className="text-text-secondary mt-1">Traçabilité des actions utilisateurs</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-surface hover:bg-surface-2 text-text-primary border border-border px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher par utilisateur, action, ressource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-2 transition-colors text-text-primary font-medium">
          <Filter className="w-4 h-4" />
          <span>Filtres</span>
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-sm text-text-secondary">
                <th className="p-4 font-medium">Date & Heure</th>
                <th className="p-4 font-medium">Utilisateur</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Ressource</th>
                <th className="p-4 font-medium">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-text-primary">
                      <Clock className="w-4 h-4 text-text-muted" />
                      {formatDatetime(log.date)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-3 h-3" />
                      </div>
                      {log.user}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-text-primary">
                      <FileText className="w-4 h-4 text-text-muted" />
                      {log.resource}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-text-secondary">
                    {log.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-secondary">
                    Aucun journal trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
