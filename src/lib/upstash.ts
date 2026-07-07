import { StateStorage } from 'zustand/middleware';
import { Redis } from '@upstash/redis';
import { get, set, del } from 'idb-keyval';

// We initialize Redis only if the environment variables are present
const getRedisClient = () => {
  const env = (import.meta as any).env || {};
  const url = env.VITE_UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = env.VITE_UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({
    url,
    token,
  });
};

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    let localValue = await get(name);
    if (!localValue) {
      localValue = localStorage.getItem(name);
      if (localValue) {
        try {
          await set(name, localValue);
        } catch (e) {
          console.error('Failed to migrate data to IndexedDB', e);
        }
      }
    }
    return localValue || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (err) {
      console.error('Error writing to IndexedDB:', err);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (err) {
      console.error('Error removing from IndexedDB:', err);
    }
  },
};

export const upstashStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const redis = getRedisClient();
    
    // Try to get from IndexedDB first
    let localValue = await get(name);
    
    // Migration from localStorage if not found in IndexedDB
    if (!localValue) {
      localValue = localStorage.getItem(name);
      if (localValue) {
        try {
          await set(name, localValue); // Migrate to IndexedDB
        } catch (e) {
          console.error('Failed to migrate data to IndexedDB', e);
        }
      }
    }

    if (!redis) {
      return localValue || null;
    }
    try {
      const value = await redis.get(name);
      if (value === null || value === undefined) return localValue || null;
      return typeof value === 'string' ? value : JSON.stringify(value);
    } catch (error) {
      console.error('Error reading from Upstash:', error);
      return localValue || null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (err) {
      console.error('Error writing to IndexedDB:', err);
    }

    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.set(name, value);
      } catch (error) {
        console.error('Error writing to Upstash:', error);
      }
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (err) {
      console.error('Error removing from IndexedDB:', err);
    }

    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(name);
      } catch (error) {
        console.error('Error removing from Upstash:', error);
      }
    }
  },
};
