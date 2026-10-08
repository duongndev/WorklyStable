import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config/apiConfig';

export const BASE_URL = API_URL;

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
  const token = typeof tokens === 'string' ? tokens : tokens?.accessToken;
  if (!token) {
    console.log('Token is null or undefined.');
    return true;
  }

  try {
    const decoded = jwtDecode(token);
    if (typeof decoded?.exp === 'undefined') {
      console.log('Token does not contain an expiration time (exp).');
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    // Buffer 30 giây để tránh tình trạng token vừa hết hạn trong lúc gửi request
    return decoded.exp < currentTime + 30;
  } catch (error) {
    console.error('Error decoding token or token is invalid:', error);
    return true;
  }
};
