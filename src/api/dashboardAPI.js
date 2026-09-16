import { axiosClient } from './axiosConfig';

/**
 * =========================
 * DASHBOARD API
 * =========================
 */

/**
 * Lấy dữ liệu tổng quan Dashboard (Admin)
 * GET /api/dashboard/summary?date=YYYY-MM-DD
 * @param {object} query
 */
export const getDashboardSummaryApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/dashboard/summary', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu dashboard:', error.response?.data || error.message);
    throw error;
  }
};
