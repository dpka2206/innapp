import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveApiUrl() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');

  // Expo Go on device: use the same host as Metro
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.experienceUrl?.replace(/^[a-z]+:\/\//, '') ||
    '';
  const host = hostUri.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:4000`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }
  return 'http://localhost:4000';
}

export const API_URL = resolveApiUrl();
