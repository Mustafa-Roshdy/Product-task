import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';

let _storage: any = null;
let usingMMKV = false;

try {
  _storage = new MMKV({
    id: 'products-app-storage',
    encryptionKey: 'my-secure-encryption-key-2025',
  });
  usingMMKV = true;
} catch (e) {
  console.warn('[mmkvPersister] MMKV init failed, falling back to in-memory shim:', e);

  const map = new Map<string, string>();

  (async () => {
    try {
      const raw = await SecureStore.getItemAsync('mmkv_backup_v1');
      if (raw) {
        const obj = JSON.parse(raw);
        Object.keys(obj).forEach((k) => map.set(k, String(obj[k])));
      }
    } catch (err) {
      console.warn('[mmkvPersister] failed to restore SecureStore backup:', err);
    }
  })();

  const persistMap = async () => {
    try {
      const obj: Record<string, string> = {};
      for (const [k, v] of map.entries()) obj[k] = v;
      await SecureStore.setItemAsync('mmkv_backup_v1', JSON.stringify(obj));
    } catch (err) {
      console.warn('[mmkvPersister] failed to save backup to SecureStore:', err);
    }
  };

  _storage = {
    set: (key: string, value: string | number | boolean) => {
      map.set(key, String(value));
      void persistMap();
    },
    getString: (key: string) => {
      const v = map.get(key);
      return v === undefined ? undefined : String(v);
    },
    getNumber: (key: string) => {
      const v = map.get(key);
      return v === undefined ? undefined : Number(v);
    },
    getBoolean: (key: string) => {
      const v = map.get(key);
      return v === undefined ? undefined : v === 'true';
    },
    delete: (key: string) => {
      map.delete(key);
      void persistMap();
    },
    contains: (key: string) => map.has(key),
    clearAll: () => {
      map.clear();
      void persistMap();
    },
    getAllKeys: () => Array.from(map.keys()),
  };
}

export const storage = _storage;

export const setString = (key: string, value: string): void => {
  storage.set(key, value);
};


export const getString = (key: string): string | undefined => {
  return storage.getString(key);
};

export const setNumber = (key: string, value: number): void => {
  storage.set(key, value);
};


export const getNumber = (key: string): number | undefined => {
  return storage.getNumber(key);
};

export const setBoolean = (key: string, value: boolean): void => {
  storage.set(key, value);
};


export const getBoolean = (key: string): boolean | undefined => {
  return storage.getBoolean(key);
};

export const setObject = <T>(key: string, value: T): void => {
  storage.set(key, JSON.stringify(value));
};

export const getObject = <T>(key: string): T | null => {
  try {
    const jsonString = storage.getString(key);
    return jsonString ? JSON.parse(jsonString) : null;
  } catch (error) {
    console.error(`[Storage] Failed to parse object for key ${key}:`, error);
    return null;
  }
};


export const deleteKey = (key: string): void => {
  storage.delete(key);
};


export const hasKey = (key: string): boolean => {
  return storage.contains(key);
};


export const clearAll = (): void => {
  storage.clearAll();
};


export const getAllKeys = (): string[] => {
  return storage.getAllKeys();
};


export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REACT_QUERY_CACHE: 'react_query_cache',
  LOCK_STATE: 'lock_state',
  LAST_ACTIVITY: 'last_activity',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

export const mmkvPersister = {
  persistClient: async (client: any) => {
    try {
      const json = JSON.stringify(client); 
      storage.set(STORAGE_KEYS.REACT_QUERY_CACHE, json);
    } catch (e) {
      console.warn('[mmkvPersister] persist error', e);
    }
  },
  restoreClient: async () => {
    try {
      const json = storage.getString(STORAGE_KEYS.REACT_QUERY_CACHE);
      return json ? JSON.parse(json) : undefined;
    } catch (e) {
      console.warn('[mmkvPersister] restore error', e);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      storage.delete(STORAGE_KEYS.REACT_QUERY_CACHE);
    } catch (e) {
      console.warn('[mmkvPersister] remove error', e);
    }
  },
};