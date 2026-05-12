import { Platform } from 'react-native';

// En la web, usamos la URL actual. En móvil, la IP fija del servidor.
const DEV_IP = '192.168.10.208'; // La IP que el usuario indicó que usa
export const API_URL = Platform.OS === 'web' 
  ? '/api' 
  : `http://${DEV_IP}:3000/api`;

export const getHeaders = () => {
  const headers: any = { 'Content-Type': 'application/json' };
  if (Platform.OS === 'web') {
    headers['bypass-tunnel-reminder'] = 'true';
  }
  return headers;
};