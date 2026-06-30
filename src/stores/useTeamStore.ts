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
}

interface TeamState {
  tasks: TeamTask[];
  addTask: (task: Omit<TeamTask, 'id' | 'createdAt' | 'comments'>) => void;
  updateTaskStatus: (taskId: string, status: TeamTask['status']) => void;
  deleteTask: (taskId: string) => void;
  addComment: (taskId: string, comment: Omit<TaskComment, 'id' | 'createdAt' | 'taskId'>) => void;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      tasks: [],
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
    }),
    {
      name: 'dispatch-team-storage',
    }
  )
);
