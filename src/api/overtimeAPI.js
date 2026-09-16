import { axiosClient } from './axiosConfig';

/**
 * =========================
 * OVERTIME API (QUẢN LÝ LÀM THÊM GIỜ)
 * =========================
 */

/**
 * Đăng ký làm thêm giờ (OT)
 * POST /api/overtime/apply
 * @param {object} data - { date, startTime, endTime, durationHours, otType, projectName, reason }
 */
export const applyOvertimeApi = async (data) => {
  try {
    const response = await axiosClient.post('/overtime/apply', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi nộp đơn tăng ca:', error.response?.data || error.message);
    throw error;
  }
};
export const createOvertimeRequestApi = applyOvertimeApi;

/**
 * Lấy danh sách đơn OT của tôi
 * GET /api/overtime/my-requests?month=M&year=YYYY&status=...&page=1&limit=20
 * @param {object} query
 */
export const getMyOvertimeRequestsApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/overtime/my-requests', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn OT:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Admin: Lấy danh sách đơn OT chờ duyệt
 * GET /api/overtime/pending?page=1&limit=20
 * @param {object} query
 */
export const getPendingOvertimeRequestsApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/overtime/pending', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn OT chờ duyệt:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Admin: Duyệt / Từ chối đơn OT
 * PUT /api/overtime/:id/action
 * @param {string} id
 * @param {object} data - { action: 'approve' | 'reject', rejectionReason }
 */
export const processOvertimeActionApi = async (id, data) => {
  try {
    const response = await axiosClient.put(`/overtime/${id}/action`, data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xử lý đơn OT:', error.response?.data || error.message);
    throw error;
  }
};
export const reviewOvertimeRequestApi = (id, action, rejectionReason = '') =>
  processOvertimeActionApi(id, {
    action: action === 'approved' ? 'approve' : action === 'rejected' ? 'reject' : action,
    rejectionReason,
  });
