import React, { useState, useMemo } from 'react';
import { useTeamStore, TeamTask, Project, Department } from '../../../../stores/useTeamStore';
import { useRbacStore, DispatchAccount } from '../../../../stores/useRbacStore';
import { useDispatchAuthStore } from '../../../../stores/useDispatchAuthStore';
import { 
  Users, Plus, Calendar, CheckSquare, Clock, AlertTriangle, 
  MessageSquare, User, X, Edit2, Search, Send, Trash2, 
  Folder, Building, ChevronLeft, ChevronRight, Check, Layers, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

export default function DispatchTeamPage() {
  const { 
    tasks, projects, departments, 
    addTask, updateTaskStatus, deleteTask, addComment, 
    addProject, deleteProject, addDepartment, deleteDepartment, updateDepartmentMembers 
  } = useTeamStore();
  const { accounts } = useRbacStore();
  const { user } = useDispatchAuthStore();

  const [activeTab, setActiveTab] = useState<'board' | 'calendar' | 'projects_depts'>('board');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState<TeamTask | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // Navigation for Calendar Month
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Filters
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Task Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    deadline: '',
    projectId: '',
    departmentId: ''
  });

  // Project Form State
  const [projForm, setProjForm] = useState({
    name: '',
    description: ''
  });

  // Department Form State
  const [deptForm, setDeptForm] = useState({
    name: '',
    description: '',
    memberIds: [] as string[]
  });

  // Manage Department editing state
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // Filter tasks based on selected Project and Department filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchProject = projectFilter === 'all' || task.projectId === projectFilter;
      const matchDept = deptFilter === 'all' || task.departmentId === deptFilter;
      return matchProject && matchDept;
    });
  }, [tasks, projectFilter, deptFilter]);

  // KPIs based on filtered tasks
  const kpis = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'done').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    
    const now = new Date().getTime();
    const delayed = filteredTasks.filter(t => 
      t.status !== 'done' && new Date(t.deadline).getTime() < now
    ).length;

    return { total, completed, inProgress, delayed };
  }, [filteredTasks]);

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
      projectId: formData.projectId || undefined,
      departmentId: formData.departmentId || undefined
    });

    toast.success('Tâche créée avec succès.');
    setIsTaskModalOpen(false);
    setFormData({ 
      title: '', 
      description: '', 
      assigneeId: '', 
      deadline: '', 
      projectId: '', 
      departmentId: '' 
    });
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projForm.name) {
      toast.error('Veuillez indiquer le nom du projet.');
      return;
    }

    addProject({
      name: projForm.name,
      description: projForm.description
    });

    toast.success('Projet créé avec succès.');
    setIsProjectModalOpen(false);
    setProjForm({ name: '', description: '' });
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name) {
      toast.error('Veuillez indiquer le nom du département.');
      return;
    }

    addDepartment({
      name: deptForm.name,
      description: deptForm.description,
      memberIds: deptForm.memberIds
    });

    toast.success('Département créé avec succès.');
    setIsDeptModalOpen(false);
    setDeptForm({ name: '', description: '', memberIds: [] });
  };

  const handleUpdateDeptMembers = (deptId: string, memberIds: string[]) => {
    updateDepartmentMembers(deptId, memberIds);
    toast.success('Membres du département mis à jour.');
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

  // Dynamically filter members based on selected department in Task Modal
  const availableAssignees = useMemo(() => {
    if (!formData.departmentId) return accounts;
    const dept = departments.find(d => d.id === formData.departmentId);
    if (!dept) return accounts;
    return accounts.filter(acc => dept.memberIds.includes(acc.id));
  }, [formData.departmentId, departments, accounts]);

  // Calendar calculations (Month View)
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Weekday of the first day (0 = Sunday, 1 = Monday, etc. Adjust for Monday start)
    let startDayOfWeek = firstDayOfMonth.getDay(); 
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // 0=Mon, 6=Sun

    const days = [];

    // Add empty placeholder days for prefix
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayTasks = filteredTasks.filter(t => {
        const d = new Date(t.deadline);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      });
      days.push({ date, tasks: dayTasks });
    }

    return days;
  }, [currentMonth, filteredTasks]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const openQuickAddTask = (date: Date) => {
    // Format date to local datetime-local string (YYYY-MM-DDTHH:MM)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setFormData({
      title: '',
      description: '',
      assigneeId: '',
      deadline: `${year}-${month}-${day}T09:00`,
      projectId: projectFilter !== 'all' ? projectFilter : '',
      departmentId: deptFilter !== 'all' ? deptFilter : ''
    });
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600 animate-pulse" />
            Productivité & Équipe
          </h1>
          <p className="text-slate-500 font-medium mt-1">Gérez les tâches, projets, départements et collaborez en temps réel</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
          >
            <Folder className="w-4 h-4 text-amber-500" />
            Nouveau Projet
          </button>
          <button 
            onClick={() => setIsDeptModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
          >
            <Building className="w-4 h-4 text-blue-500" />
            Nouveau Département
          </button>
          <button 
            onClick={() => {
              setFormData({ title: '', description: '', assigneeId: '', deadline: '', projectId: '', departmentId: '' });
              setIsTaskModalOpen(true);
            }}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Tâche
          </button>
        </div>
      </div>

      {/* Global Project & Department Filters */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          Filtres de l'espace de travail :
        </div>
        
        <div className="relative">
          <label className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wider text-slate-400">Projet</label>
          <select 
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full pl-20 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous les Projets</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wider text-slate-400">Dépt</label>
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full pl-16 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous les Départements</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs Grid */}
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

      {/* Navigation Tabs */}
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
        <button
          onClick={() => setActiveTab('projects_depts')}
          className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'projects_depts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Layers className="w-4 h-4" />
          Projets & Départements
        </button>
      </div>

      {/* Active Tab View Rendering */}
      {activeTab === 'board' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="p-4">Tâche</th>
                <th className="p-4">Projet / Départ.</th>
                <th className="p-4">Assigné à</th>
                <th className="p-4">Échéance</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Aucune tâche correspondante n'a été trouvée pour les filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const assignee = accounts.find(a => a.id === task.assigneeId);
                  const isDelayed = task.status !== 'done' && new Date(task.deadline).getTime() < new Date().getTime();
                  const proj = projects.find(p => p.id === task.projectId);
                  const dept = departments.find(d => d.id === task.departmentId);
                  
                  return (
                    <tr key={task.id} className={`hover:bg-slate-50/50 transition-colors ${isDelayed ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{task.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MessageSquare className="w-3.5 h-3.5" /> {task.comments.length} commentaire(s)
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {proj && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 w-max">
                              <Folder className="w-3 h-3" />
                              {proj.name}
                            </span>
                          )}
                          {dept && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 w-max">
                              <Building className="w-3 h-3" />
                              {dept.name}
                            </span>
                          )}
                          {!proj && !dept && <span className="text-xs text-slate-400 italic">Aucun</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase">
                            {assignee ? assignee.prenom.charAt(0) : '?'}
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {assignee ? `${assignee.prenom} ${assignee.nom}` : 'Inconnu'}
                          </span>
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
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs rounded-xl transition-colors"
                        >
                          Détails & Chat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Enhanced Calendar Agenda View (Interactive Month View) */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                  {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Cliquez sur un jour pour y ajouter directement une tâche</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                Aujourd'hui
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Weekdays */}
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((w, idx) => (
              <div key={idx} className="text-center text-xs font-black text-slate-400 uppercase tracking-widest py-2">
                {w}
              </div>
            ))}

            {/* Days Grid */}
            {calendarData.map((day, idx) => {
              if (day === null) {
                return (
                  <div key={`empty-${idx}`} className="min-h-[120px] bg-slate-50/40 rounded-xl border border-dashed border-slate-100" />
                );
              }

              const isToday = day.date.toDateString() === new Date().toDateString();
              return (
                <div 
                  key={`day-${day.date.getDate()}`}
                  onClick={() => openQuickAddTask(day.date)}
                  className={`group min-h-[120px] p-2.5 rounded-2xl border transition-all hover:shadow-md cursor-pointer flex flex-col justify-between ${
                    isToday 
                      ? 'bg-indigo-50/60 border-indigo-200 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      isToday 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-600 group-hover:bg-slate-100'
                    }`}>
                      {day.date.getDate()}
                    </span>
                    <Plus className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="space-y-1.5 mt-2 flex-1 overflow-y-auto max-h-[80px]">
                    {day.tasks.map(task => {
                      const assignee = accounts.find(a => a.id === task.assigneeId);
                      return (
                        <div 
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering day task addition
                            setSelectedTask(task);
                          }}
                          className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all truncate hover:scale-102 ${
                            task.status === 'done' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100' :
                            task.status === 'in_progress' ? 'bg-blue-50 text-blue-800 border-blue-100 hover:bg-blue-100' :
                            'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={`${task.title} - ${assignee ? `${assignee.prenom} ${assignee.nom}` : ''}`}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects & Departments Management Tab */}
      {activeTab === 'projects_depts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-slate-950 uppercase tracking-wide">Gestion des Projets ({projects.length})</h3>
              </div>
            </div>

            <div className="divide-y divide-slate-100 space-y-3">
              {projects.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-4">Aucun projet créé pour le moment.</p>
              ) : (
                projects.map(proj => {
                  const projTasks = tasks.filter(t => t.projectId === proj.id);
                  const completedCount = projTasks.filter(t => t.status === 'done').length;
                  const progressPct = projTasks.length > 0 ? Math.round((completedCount / projTasks.length) * 100) : 0;
                  
                  return (
                    <div key={proj.id} className="pt-3 first:pt-0">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            {proj.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">{proj.description || "Aucune description."}</p>
                        </div>

                        <button 
                          onClick={() => {
                            if (confirm(`Supprimer le projet "${proj.name}" ?`)) {
                              deleteProject(proj.id);
                              toast.success("Projet supprimé.");
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1 mt-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>{projTasks.length} tâches</span>
                          <span>{progressPct}% complété</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Departments Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-500" />
                <h3 className="font-black text-slate-950 uppercase tracking-wide">Départements & Membres ({departments.length})</h3>
              </div>
            </div>

            <div className="divide-y divide-slate-100 space-y-4">
              {departments.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-4">Aucun département créé.</p>
              ) : (
                departments.map(dept => {
                  const deptTasks = tasks.filter(t => t.departmentId === dept.id);
                  const isEditing = editingDeptId === dept.id;
                  
                  return (
                    <div key={dept.id} className="pt-3 first:pt-0">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            {dept.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">{dept.description || "Aucune description."}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setEditingDeptId(isEditing ? null : dept.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            {isEditing ? 'Fermer' : 'Membres'}
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Supprimer le département "${dept.name}" ?`)) {
                                deleteDepartment(dept.id);
                                toast.success("Département supprimé.");
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Display assigned members list */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {dept.memberIds.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">Aucun membre assigné</span>
                        ) : (
                          dept.memberIds.map(mId => {
                            const acc = accounts.find(a => a.id === mId);
                            return acc ? (
                              <span key={mId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {acc.prenom} {acc.nom}
                              </span>
                            ) : null;
                          })
                        )}
                      </div>

                      {/* Members list checkboxes edit panel */}
                      {isEditing && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigner des membres :</p>
                          <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                            {accounts.map(acc => {
                              const isChecked = dept.memberIds.includes(acc.id);
                              return (
                                <label key={acc.id} className="flex items-center gap-2 p-1.5 bg-white border rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-100">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => {
                                      const newIds = isChecked 
                                        ? dept.memberIds.filter(id => id !== acc.id)
                                        : [...dept.memberIds, acc.id];
                                      handleUpdateDeptMembers(dept.id, newIds);
                                    }}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span>{acc.prenom} {acc.nom}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Projet (Optionnel)</label>
                  <select 
                    value={formData.projectId}
                    onChange={e => setFormData({...formData, projectId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium cursor-pointer"
                  >
                    <option value="">Aucun Projet</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Département (Optionnel)</label>
                  <select 
                    value={formData.departmentId}
                    onChange={e => {
                      setFormData({
                        ...formData, 
                        departmentId: e.target.value,
                        assigneeId: '' // Reset assignee to avoid cross-dept assignment
                      });
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium cursor-pointer"
                  >
                    <option value="">Tous les membres</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Assigné à * {formData.departmentId && <span className="text-blue-600 font-black">(Filtré par Département)</span>}
                </label>
                <select 
                  required
                  value={formData.assigneeId}
                  onChange={e => setFormData({...formData, assigneeId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none cursor-pointer"
                >
                  <option value="">-- Sélectionner un membre --</option>
                  {availableAssignees.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.prenom} {acc.nom} ({acc.role})</option>
                  ))}
                </select>
                {formData.departmentId && availableAssignees.length === 0 && (
                  <p className="text-xs text-rose-600 font-bold mt-1.5">Aucun membre n'est encore assigné à ce département !</p>
                )}
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

      {/* Project Creation Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-500" />
                Créer un Nouveau Projet
              </h2>
              <button 
                onClick={() => setIsProjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nom du projet *</label>
                <input 
                  type="text" 
                  required
                  value={projForm.name}
                  onChange={e => setProjForm({...projForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  placeholder="Ex: Livraisons Été 2026..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description / Objectif</label>
                <textarea 
                  value={projForm.description}
                  onChange={e => setProjForm({...projForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none"
                  placeholder="Description succincte..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-6 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-900/20"
                >
                  Créer Projet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Creation Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-500" />
                Créer un Département
              </h2>
              <button 
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nom du département *</label>
                <input 
                  type="text" 
                  required
                  value={deptForm.name}
                  onChange={e => setDeptForm({...deptForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  placeholder="Ex: Facturation & Compta..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  value={deptForm.description}
                  onChange={e => setDeptForm({...deptForm, description: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none"
                  placeholder="Description succincte..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Définir les membres du département</label>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-[160px] overflow-y-auto space-y-2">
                  {accounts.map(acc => {
                    const isSelected = deptForm.memberIds.includes(acc.id);
                    return (
                      <label key={acc.id} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const newIds = isSelected 
                              ? deptForm.memberIds.filter(id => id !== acc.id)
                              : [...deptForm.memberIds, acc.id];
                            setDeptForm({ ...deptForm, memberIds: newIds });
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{acc.prenom} {acc.nom} <span className="text-xs text-slate-400 font-mono">({acc.role})</span></span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-6 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
                >
                  Créer Dépt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail & Comments Modal */}
      {selectedTask && (() => {
        const currentTask = tasks.find(t => t.id === selectedTask.id) || selectedTask;
        const assignee = accounts.find(a => a.id === currentTask.assigneeId);
        const proj = projects.find(p => p.id === currentTask.projectId);
        const dept = departments.find(d => d.id === currentTask.departmentId);
        
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-end bg-slate-900/50 backdrop-blur-sm">
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
                      className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors shrink-0 animate-pulse hover:animate-none"
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
                    {proj && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Projet</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          {proj.name}
                        </span>
                      </div>
                    )}
                    {dept && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Département</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {dept.name}
                        </span>
                      </div>
                    )}
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
