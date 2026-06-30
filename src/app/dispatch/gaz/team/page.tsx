import React, { useState, useMemo } from 'react';
import { useTeamStore, TeamTask } from '../../../../stores/useTeamStore';
import { useRbacStore } from '../../../../stores/useRbacStore';
import { useDispatchAuthStore } from '../../../../stores/useDispatchAuthStore';
import { 
  Users, Plus, Calendar, CheckSquare, Clock, AlertTriangle, 
  MessageSquare, User, X, Edit2, Search, Send, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function DispatchTeamPage() {
  const { tasks, addTask, updateTaskStatus, deleteTask, addComment } = useTeamStore();
  const { accounts } = useRbacStore();
  const { user } = useDispatchAuthStore();

  const [activeTab, setActiveTab] = useState<'board' | 'calendar'>('board');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TeamTask | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // Task Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    deadline: ''
  });

  // KPIs
  const kpis = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    
    const now = new Date().getTime();
    const delayed = tasks.filter(t => 
      t.status !== 'done' && new Date(t.deadline).getTime() < now
    ).length;

    return { total, completed, inProgress, delayed };
  }, [tasks]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assigneeId || !formData.deadline) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    addTask({
      title: formData.title,
      description: formData.description,
      assigneeId: formData.assigneeId,
      creatorId: user?.id || 'unknown',
      creatorName: user ? `${user.prenom} ${user.nom}` : 'Administrateur',
      deadline: new Date(formData.deadline).toISOString(),
      status: 'todo',
    });

    toast.success('Tâche créée avec succès.');
    setIsTaskModalOpen(false);
    setFormData({ title: '', description: '', assigneeId: '', deadline: '' });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;

    addComment(selectedTask.id, {
      authorId: user?.id || 'unknown',
      authorName: user ? `${user.prenom} ${user.nom}` : 'Administrateur',
      content: commentText.trim()
    });

    setCommentText('');
    toast.success('Commentaire ajouté.');
  };

  // Calendar View Helpers
  const calendarDays = useMemo(() => {
    // Generate a simple 14-day view starting from today (or start of week)
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start from 3 days ago to show some past context
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 3);

    for (let i = 0; i < 14; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      
      const dayTasks = tasks.filter(t => {
        const taskDate = new Date(t.deadline);
        return taskDate.getDate() === d.getDate() && 
               taskDate.getMonth() === d.getMonth() && 
               taskDate.getFullYear() === d.getFullYear();
      });
      
      days.push({ date: d, tasks: dayTasks });
    }
    return days;
  }, [tasks]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            Productivité & Équipe
          </h1>
          <p className="text-slate-500 font-medium mt-1">Gérez les tâches et collaborez en temps réel</p>
        </div>
        <button 
          onClick={() => setIsTaskModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Tâche
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Tâches</p>
            <p className="text-2xl font-black text-slate-900">{kpis.total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Terminées</p>
            <p className="text-2xl font-black text-emerald-700">{kpis.completed}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">En Cours</p>
            <p className="text-2xl font-black text-blue-700">{kpis.inProgress}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">En Retard</p>
            <p className="text-2xl font-black text-rose-700">{kpis.delayed}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('board')}
          className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'board' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <CheckSquare className="w-4 h-4" />
          Liste des Tâches
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'calendar' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Calendar className="w-4 h-4" />
          Agenda (Calendrier)
        </button>
      </div>

      {/* Content */}
      {activeTab === 'board' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="p-4">Tâche</th>
                <th className="p-4">Assigné à</th>
                <th className="p-4">Échéance</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Aucune tâche n'a été créée.
                  </td>
                </tr>
              ) : (
                tasks.map(task => {
                  const assignee = accounts.find(a => a.id === task.assigneeId);
                  const isDelayed = task.status !== 'done' && new Date(task.deadline).getTime() < new Date().getTime();
                  
                  return (
                    <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${isDelayed ? 'bg-rose-50/30' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{task.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MessageSquare className="w-3 h-3" /> {task.comments.length} commentaire(s)
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase">
                            {assignee ? assignee.prenom.charAt(0) : '?'}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{assignee ? `${assignee.prenom} ${assignee.nom}` : 'Inconnu'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Calendar className={`w-4 h-4 ${isDelayed ? 'text-rose-500' : 'text-slate-400'}`} />
                          <span className={isDelayed ? 'text-rose-600 font-bold' : ''}>
                            {new Date(task.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <select 
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                          className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border outline-none cursor-pointer transition-colors ${
                            task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <option value="todo">À faire</option>
                          <option value="in_progress">En cours</option>
                          <option value="done">Terminé</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
          <div className="min-w-[800px]">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Vue Agenda (14 Jours)
            </h3>
            <div className="grid grid-cols-7 gap-4">
              {calendarDays.map((day, idx) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                return (
                  <div key={idx} className={`min-h-[120px] p-3 rounded-xl border ${isToday ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-xs font-bold uppercase tracking-widest mb-3 pb-2 border-b ${isToday ? 'text-indigo-600 border-indigo-100' : 'text-slate-500 border-slate-200'}`}>
                      {day.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="space-y-2">
                      {day.tasks.map(task => (
                        <div 
                          key={task.id} 
                          onClick={() => setSelectedTask(task)}
                          className={`p-2 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                            task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' :
                            task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' :
                            'bg-white text-slate-700 border-slate-200 shadow-sm hover:border-indigo-300'
                          }`}
                        >
                          <div className="truncate font-bold mb-1">{task.title}</div>
                          <div className="text-[10px] opacity-80 flex items-center justify-between">
                            <span>{new Date(task.deadline).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))}
                      {day.tasks.length === 0 && (
                        <div className="text-[10px] text-slate-400 font-medium italic text-center py-2">
                          Vide
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                Créer une Nouvelle Tâche
              </h2>
              <button 
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Titre de la tâche *</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  placeholder="Ex: Appeler le client X, Vérifier le stock..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assigné à *</label>
                <select 
                  required
                  value={formData.assigneeId}
                  onChange={e => setFormData({...formData, assigneeId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none cursor-pointer"
                >
                  <option value="">-- Sélectionner un membre --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.prenom} {acc.nom} ({acc.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Date & Heure Limite (Deadline) *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={formData.deadline}
                  onChange={e => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description / Consignes (Optionnel)</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none"
                  placeholder="Détails supplémentaires..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-6 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail & Comments Modal */}
      {selectedTask && (() => {
        // Find latest selected task reference from state to keep comments updated
        const currentTask = tasks.find(t => t.id === selectedTask.id) || selectedTask;
        const assignee = accounts.find(a => a.id === currentTask.assigneeId);
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 animate-in slide-in-from-right flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  Détails de la tâche
                </h2>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-white">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{currentTask.title}</h3>
                    <button 
                      onClick={() => {
                        if (confirm("Supprimer cette tâche ?")) {
                          deleteTask(currentTask.id);
                          setSelectedTask(null);
                          toast.success("Tâche supprimée.");
                        }
                      }}
                      className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">{currentTask.description || <span className="italic text-slate-400">Aucune description.</span>}</p>
                  
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Statut</span>
                      <select 
                        value={currentTask.status}
                        onChange={(e) => updateTaskStatus(currentTask.id, e.target.value as any)}
                        className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border outline-none cursor-pointer ${
                          currentTask.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          currentTask.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <option value="todo">À faire</option>
                        <option value="in_progress">En cours</option>
                        <option value="done">Terminé</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Assigné à</span>
                      <span className="text-sm font-bold text-slate-900">{assignee ? `${assignee.prenom} ${assignee.nom}` : 'Inconnu'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Créé par</span>
                      <span className="text-sm font-medium text-slate-700">{currentTask.creatorName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Échéance</span>
                      <span className={`text-sm font-bold ${new Date(currentTask.deadline).getTime() < new Date().getTime() && currentTask.status !== 'done' ? 'text-rose-600' : 'text-slate-900'}`}>
                        {new Date(currentTask.deadline).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    Commentaires ({currentTask.comments.length})
                  </h4>
                  
                  <div className="space-y-4 mb-6">
                    {currentTask.comments.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">Aucun commentaire.</p>
                    ) : (
                      currentTask.comments.map(comment => (
                        <div key={comment.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-900">{comment.authorName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(comment.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                          <p className="text-sm text-slate-700">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input 
                      type="text" 
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!commentText.trim()}
                      className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
