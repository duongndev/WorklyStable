import axios from 'axios';
import { Platform } from 'react-native';
import { refreshTokenApi } from '../services/tokenService';
import { getRefreshToken, saveTokens, removeTokens, getAccessToken } from '../services/storageService';

import { API_URL } from '../config/apiConfig';

const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

let storeInstance = null;
let isRefreshing = false;
let failedQueue = [];

export const setStore = (newStore) => {
  storeInstance = newStore;
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      let accessToken = null;

      // 1. Lấy từ Redux store trước (nhanh, đồng bộ)
      if (storeInstance) {
        const state = storeInstance.getState();
        accessToken = state?.auth?.tokens?.accessToken;
      }

      // 2. Nếu không có trong Redux, lấy từ AsyncStorage (bất đồng bộ)
      if (!accessToken) {
        accessToken = await getAccessToken();
      }

      // 3. Gắn header Authorization nếu có token
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.log('Error getting access token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - refresh token on 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/');

    // Skip refresh token logic for auth endpoints
    if (error.response?.status !== 401 || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue the request while refreshing
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosClient(originalRequest);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      let refreshToken = null;
      if (storeInstance) {
        const state = storeInstance.getState();
        refreshToken = state?.auth?.tokens?.refreshToken;
      }

      if (!refreshToken) {
        refreshToken = await getRefreshToken();
      }

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await refreshTokenApi(refreshToken);

      // API có thể trả về nhiều format khác nhau
      const payload = response.data || response;
      const newAccessToken = payload?.accessToken || payload?.tokens?.accessToken;
      const newRefreshToken = payload?.refreshToken || payload?.tokens?.refreshToken;

      if (response.success && newAccessToken) {
        const finalRefreshToken = newRefreshToken || refreshToken;

        // Save new tokens
        await saveTokens(newAccessToken, finalRefreshToken);

        // Update Redux store (cấu trúc payload.tokens khớp với authSlice)
        if (storeInstance) {
          storeInstance.dispatch({
            type: 'auth/refreshToken/fulfilled',
            payload: {
              tokens: {
                accessToken: newAccessToken,
                refreshToken: finalRefreshToken,
              },
            },
          });
        }

        // Process queued requests
        processQueue(null, newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (refreshError) {
      // Refresh failed, logout user
      processQueue(refreshError, null);

      if (storeInstance) {
        storeInstance.dispatch({ type: 'auth/logoutUser' });
      }

      await removeTokens();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Tạo instance axios riêng để luôn gửi User-Agent
const nominatimApi = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 10000,
  headers: {
    'User-Agent': 'WorklyHR/1.0 (worklyhr@gmail.com)',
    'Accept-Language': 'vi',
  },
});

// Throttle for Nominatim: 1 request/second
let nominatimThrottleChain = Promise.resolve();
let nominatimNextAvailableAt = 0;
const NOMINATIM_THROTTLE_MS = 1000;

nominatimApi.interceptors.request.use(async config => {
  // Chain delays to serialize requests at most 1/second
  const now = Date.now();
  const waitMs = Math.max(0, nominatimNextAvailableAt - now);
  nominatimThrottleChain = nominatimThrottleChain.then(
    () =>
      new Promise(resolve => {
        setTimeout(resolve, waitMs);
      }),
  );
  await nominatimThrottleChain;
  nominatimNextAvailableAt = Date.now() + NOMINATIM_THROTTLE_MS;
  return config;
});

// In-memory cache for reverse geocoding results
const reverseGeocodeCache = new Map();
const REVERSE_GEOCODE_TTL = 10 * 60 * 1000; // 10 minutes
const formatCoordKey = (lat, lon) => {
  // Round to 5 decimals to avoid tiny jitter causing cache misses (~1m precision)
  const rlat = Number(lat).toFixed(5);
  const rlon = Number(lon).toFixed(5);
  return `${rlat},${rlon}`;
};

export { axiosClient, nominatimApi };
