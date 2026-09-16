import { axiosClient } from './axiosConfig';

/**
 * =========================
 * ATTENDANCE API
 * =========================
 */

/**
 * Check-in vào ca
 * POST /api/attendance/check-in
 * @param {object} data - { method, latitude, longitude, workplaceId, bssid, qrData, faceImage }
 */
export const checkInApi = async (data) => {
  try {
    const response = await axiosClient.post('/attendance/check-in', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi check-in:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Check-out tan ca
 * POST /api/attendance/check-out
 * @param {object} data - { method, latitude, longitude, workplaceId }
 */
export const checkOutApi = async (data) => {
  try {
    const response = await axiosClient.post('/attendance/check-out', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi check-out:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Lấy thông tin chấm công hôm nay
 * GET /api/attendance/today
 */
export const getMyAttendanceTodayApi = async () => {
  try {
    const response = await axiosClient.get('/attendance/today');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chấm công hôm nay:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Lấy lịch sử chấm công theo tháng/năm
 * GET /api/attendance/history?month=MM&year=YYYY
 * @param {object} query - { month, year, page, limit }
 */
export const getAttendanceHistoryApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/attendance/history', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử chấm công:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Admin: Sinh mã QR chấm công động cho Workplace
 * POST /api/attendance/admin/qr-generate
 * @param {string} workplaceId
 */
export const generateWorkplaceQRApi = async (workplaceId) => {
  try {
    const response = await axiosClient.post('/attendance/admin/qr-generate', { workplaceId });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi sinh mã QR chấm công:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Admin: Lấy báo cáo chấm công toàn công ty
 * GET /api/attendance/admin/report?date=YYYY-MM-DD&department=...
 * @param {object} query
 */
export const getAdminAttendanceReportApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/attendance/admin/report', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy báo cáo chấm công admin:', error.response?.data || error.message);
    throw error;
  }
};


/**
 * =========================
 * FACE ID MANAGEMENT API
 * =========================
 */
export const getFaceStatusApi = async () => {
  const { axiosClient } = require('./axiosConfig');
  try {
    const response = await axiosClient.get('/attendance/face/status');
    return response.data;
  } catch (error) {
    console.error('Lỗi lấy trạng thái Face ID:', error.response?.data || error.message);
    throw error;
  }
};

export const registerFaceApi = async (data) => {
  const { axiosClient } = require('./axiosConfig');
  try {
    const response = await axiosClient.post('/attendance/face/register', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi đăng ký khuôn mặt:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteFaceApi = async () => {
  const { axiosClient } = require('./axiosConfig');
  try {
    const response = await axiosClient.delete('/attendance/face/delete');
    return response.data;
  } catch (error) {
    console.error('Lỗi xoá khuôn mặt:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyFaceOnlyApi = async (data) => {
  const { axiosClient } = require('./axiosConfig');
  try {
    const response = await axiosClient.post('/attendance/face/verify', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi xác minh khuôn mặt:', error.response?.data || error.message);
    throw error;
  }
};
