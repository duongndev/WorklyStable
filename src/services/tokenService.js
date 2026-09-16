import axios from 'axios';
import { Platform } from 'react-native';
import {jwtDecode} from 'jwt-decode';

export const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api'
    : 'http://localhost:8080/api';

/**
 * Gọi API refresh token — dùng axios thuần, không qua axiosClient
 * để tránh vòng lặp interceptor 401 → refresh → 401 → ...
 */
export const refreshTokenApi = async (refreshToken) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/refresh-token`,
      { refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi làm mới token:', error.response?.data || error.message);
    throw error;
  }
};

export const isTokenExpired = (tokens) => {
  if (!tokens?.accessToken) {
    console.log('Token is null or undefined.');
    return true;
  }

  try {
    const decoded = jwtDecode(tokens.accessToken);
    if (typeof decoded?.exp === 'undefined') {
      console.log('Token does not contain an expiration time (exp).');
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token or token is invalid:', error);
    return true;
  }
};
