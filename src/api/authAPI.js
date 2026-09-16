import { axiosClient } from './axiosConfig';

/**
 * =========================
 * AUTH & USER API
 * =========================
 */

/**
 * Đăng nhập
 * POST /api/auth/login
 * @param {string} email
 * @param {string} password
 * @param {string} [deviceId]
 * @param {string} [deviceName]
 */
export const loginApi = async (email, password, deviceId = '', deviceName = '') => {
  try {
    const response = await axiosClient.post('/auth/login', {
      email,
      password,
      deviceId,
      deviceName,
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Đăng xuất
 * POST /api/auth/logout
 */
export const logoutApi = async () => {
  try {
    const response = await axiosClient.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Lấy thông tin hồ sơ người dùng hiện tại
 * GET /api/auth/me
 * @param {string} [accessToken]
 */
export const getProfileApi = async (accessToken) => {
  try {
    const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
    const response = await axiosClient.get('/auth/me', config);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy hồ sơ:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Cập nhật FCM token cho push notification
 * PUT /api/auth/fcm-token
 * @param {string} fcmToken
 */
export const updateFCMTokenApi = async (fcmToken) => {
  try {
    const response = await axiosClient.put('/auth/fcm-token', { fcmToken });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật FCM token:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Đăng ký Face ID (vector đặc trưng)
 * PUT /api/auth/register-face
 * @param {FormData} formData
 */
export const registerFaceApi = async (data) => {
  try {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await axiosClient.put('/auth/register-face', data, {
      headers: isFormData
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đăng ký Face ID:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Làm mới Access Token
 * POST /api/auth/refresh-token
 * @param {string} refreshToken
 */
export const refreshTokenApi = async (refreshToken) => {
  try {
    const response = await axiosClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi refresh token:', error.response?.data || error.message);
    throw error;
  }
};