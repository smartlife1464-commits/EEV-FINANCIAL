import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'eev_mobile_auth_token';
const USER_KEY = 'eev_mobile_user_data';

export const MobileStorage = {
  async saveToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async saveUser(user: any): Promise<void> {
    const json = JSON.stringify(user);
    if (Platform.OS === 'web') {
      localStorage.setItem(USER_KEY, json);
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, json);
  },

  async getUser(): Promise<any | null> {
    let json: string | null = null;
    if (Platform.OS === 'web') {
      json = localStorage.getItem(USER_KEY);
    } else {
      json = await SecureStore.getItemAsync(USER_KEY);
    }
    return json ? JSON.parse(json) : null;
  },

  async removeUser(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(USER_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};

