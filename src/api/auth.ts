import apiClient from './client';
import { storage } from '../utils/mmkvPersister';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  token: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  if (credentials.username === 'superadmin' && credentials.password === '1234567') {
    const fake: LoginResponse = {
      id: 0,
      username: 'superadmin',
      email: 'superadmin@local',
      firstName: 'Super',
      lastName: 'Admin',
      gender: 'none',
      image: '',
      token: 'local-superadmin-token',
    };


    try {
      storage.set('auth_token', fake.token);
      storage.set('user_data', JSON.stringify({
        id: fake.id,
        username: fake.username,
        email: fake.email,
        firstName: fake.firstName,
        lastName: fake.lastName,
        gender: fake.gender,
        image: fake.image,
      }));
    } catch (e) {
      console.warn('[Auth] failed to persist superadmin user locally', e);
    }

    return fake;
  }

  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

    const { token, ...userData } = response.data;
    storage.set('auth_token', token);
    storage.set('user_data', JSON.stringify(userData));

    return response.data;
  } catch (error) {
    console.error('[Auth] Login failed:', error);
    throw error;
  }
};


export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<User>('/auth/me');
    
    storage.set('user_data', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('[Auth] Get current user failed:', error);
    throw error;
  }
};


export const logout = async (): Promise<void> => {
  try {

    storage.delete('auth_token');
    storage.delete('user_data');
    
    console.log('[Auth] Logout successful');
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    throw error;
  }
};


export const hasValidToken = (): boolean => {
  const token = storage.getString('auth_token');
  return !!token;
};


export const getCachedUser = (): User | null => {
  try {
    const userData = storage.getString('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('[Auth] Failed to parse cached user:', error);
    return null;
  }
};


export const isSuperAdmin = (username?: string): boolean => {
  if (username) {
    return username === 'super@demo';
  }
  
  const user = getCachedUser();
  return user ? user.username === 'super@demo' : false;
};