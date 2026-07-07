import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  memberIds: string[]; // List of DispatchAccount ids
  createdAt: string;
}

export interface TeamTask {
  id: string;
  title: string;
  description: string;
  assigneeId: string; // Refers to DispatchAccount id
  creatorId: string;
  creatorName: string;
  createdAt: string;
  deadline: string; // ISO date string
  status: 'todo' | 'in_progress' | 'done';
  comments: TaskComment[];
  projectId?: string;
  departmentId?: string;
}

interface TeamState {
  tasks: TeamTask[];
  projects: Project[];
  departments: Department[];
  addTask: (task: Omit<TeamTask, 'id' | 'createdAt' | 'comments'>) => void;
  updateTaskStatus: (taskId: string, status: TeamTask['status']) => void;
  deleteTask: (taskId: string) => void;
  addComment: (taskId: string, comment: Omit<TaskComment, 'id' | 'createdAt' | 'taskId'>) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  deleteProject: (projectId: string) => void;
  addDepartment: (department: Omit<Department, 'id' | 'createdAt'>) => void;
  deleteDepartment: (departmentId: string) => void;
  updateDepartmentMembers: (departmentId: string, memberIds: string[]) => void;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      tasks: [],
      projects: [
        { id: 'p1', name: 'Livraison Ramadan', description: 'Planification logistique spéciale pour la période du Ramadan', createdAt: new Date().toISOString() },
        { id: 'p2', name: 'Optimisation Flotte', description: 'Réduction de la consommation et suivi GPS des camions', createdAt: new Date().toISOString() },
      ],
      departments: [
        { id: 'd1', name: 'Logistique & Chauffeurs', description: 'Gestion des tournées de livraison et des plannings', memberIds: [], createdAt: new Date().toISOString() },
        { id: 'd2', name: 'Service Client & Appels', description: 'Réception des appels, standard téléphonique et réclamations', memberIds: [], createdAt: new Date().toISOString() },
        { id: 'd3', name: 'Comptabilité & Caisse', description: 'Suivi de la facturation, règlements et gestion des fonds', memberIds: [], createdAt: new Date().toISOString() },
      ],
      addTask: (taskData) => set((state) => ({
        tasks: [
          ...state.tasks,
          {
            ...taskData,
            id: nanoid(),
            createdAt: new Date().toISOString(),
            comments: [],
          }
        ]
      })),
      updateTaskStatus: (taskId, status) => set((state) => ({
        tasks: state.tasks.map((task) => 
          task.id === taskId ? { ...task, status } : task
        )
      })),
      deleteTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId)
      })),
      addComment: (taskId, commentData) => set((state) => ({
        tasks: state.tasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              comments: [
                ...task.comments,
                {
                  ...commentData,
                  id: nanoid(),
                  taskId,
                  createdAt: new Date().toISOString()
                }
              ]
            };
          }
          return task;
        })
      })),
      addProject: (projectData) => set((state) => ({
        projects: [
          ...state.projects,
          {
            ...projectData,
            id: nanoid(),
            createdAt: new Date().toISOString()
          }
        ]
      })),
      deleteProject: (projectId) => set((state) => ({
        projects: state.projects.filter(p => p.id !== projectId),
        // Clean tasks associated with this project (or keep them but remove project reference)
        tasks: state.tasks.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t)
      })),
      addDepartment: (deptData) => set((state) => ({
        departments: [
          ...state.departments,
          {
            ...deptData,
            id: nanoid(),
            createdAt: new Date().toISOString()
          }
        ]
      })),
      deleteDepartment: (departmentId) => set((state) => ({
        departments: state.departments.filter(d => d.id !== departmentId),
        tasks: state.tasks.map(t => t.departmentId === departmentId ? { ...t, departmentId: undefined } : t)
      })),
      updateDepartmentMembers: (departmentId, memberIds) => set((state) => ({
        departments: state.departments.map(d => d.id === departmentId ? { ...d, memberIds } : d)
      }))
    }),
    {
      name: 'dispatch-team-storage-v2',
    }
  )
);
