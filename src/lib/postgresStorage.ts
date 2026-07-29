import { StateStorage } from 'zustand/middleware';

export const postgresStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    let attempts = 0;
    const maxAttempts = 3;
    const delay = 1000;

    const tryFetch = async (): Promise<string | null> => {
      try {
        const response = await fetch(`/api/zustand/${name}`, { cache: 'no-store' });
        if (response.ok) {
          const state = await response.json();
          const str = JSON.stringify(state);
          try {
            localStorage.setItem(name, str);
          } catch (e) {}
          return str;
        }
        
        if (response.status === 404) {
          // If not found in DB yet, check localStorage fallback
          return typeof window !== 'undefined' ? localStorage.getItem(name) : null;
        }

        if (attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, delay * attempts));
          return tryFetch();
        }

        return typeof window !== 'undefined' ? localStorage.getItem(name) : null;
      } catch (error) {
        if (attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, delay * attempts));
          return tryFetch();
        }
        console.error('Error reading from Postgres, falling back to localStorage:', error);
        return typeof window !== 'undefined' ? localStorage.getItem(name) : null;
      }
    };

    return tryFetch();
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      // Still update localStorage as a local secondary backup
      try {
        localStorage.setItem(name, value);
      } catch (localErr) {
        console.warn('Could not save to localStorage (quota likely exceeded), proceeding with Postgres:', localErr);
      }
      
      const state = JSON.parse(value);
      const response = await fetch(`/api/zustand/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state),
      });
      if (!response.ok) {
        throw new Error(`Failed to save store ${name} to Postgres`);
      }
    } catch (error) {
      console.error('Error writing to Postgres:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await fetch(`/api/zustand/${name}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error removing from Postgres:', error);
    }
  },
};
