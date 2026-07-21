import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { api } from '../api/client';

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
};

type AuthState = {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  updateProfile: (input: { name: string }) => Promise<void>;
};

const TOKEN_KEY = 'smc_token';
const USER_KEY = 'smc_user';

async function save(key: string, value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function load(key: string) {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function remove(key: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const token = await load(TOKEN_KEY);
      const userRaw = await load(USER_KEY);
      if (token && userRaw) {
        set({ token, user: JSON.parse(userRaw), hydrated: true });
        try {
          const me = await api<{ user: User }>('/auth/me', { token });
          set({ user: me.user });
          await save(USER_KEY, JSON.stringify(me.user));
        } catch {
          await get().logout();
        }
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  setSession: async (token, user) => {
    await save(TOKEN_KEY, token);
    await save(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    await remove(TOKEN_KEY);
    await remove(USER_KEY);
    set({ token: null, user: null });
  },

  register: async (input) => {
    const data = await api<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await get().setSession(data.token, data.user);
  },

  login: async (input) => {
    const data = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await get().setSession(data.token, data.user);
  },

  loginGoogle: async (idToken) => {
    const data = await api<{ token: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    await get().setSession(data.token, data.user);
  },

  updateProfile: async (input) => {
    const token = get().token;
    const data = await api<{ user: User }>('/auth/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(input),
    });
    await save(USER_KEY, JSON.stringify(data.user));
    set({ user: data.user });
  },
}));
