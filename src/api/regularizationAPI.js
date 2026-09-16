import { axiosClient } from './axiosConfig';

/**
 * =========================
 * REGULARIZATION API (GIẢI TRÌNH BÙ CÔNG)
 * =========================
 */

/**
 * Nộp đơn giải trình bù công
 * POST /api/regularization/apply
 * @param {object} data - { attendanceDate, requestedCheckIn, requestedCheckOut, reason, proofImage }
 */
export const applyRegularizationApi = async (data) => {
  try {
    const response = await axiosClient.post('/regularization/apply', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi nộp đơn giải trình bù công:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Lấy danh sách đơn giải trình của tôi
 * GET /api/regularization/my-requests?status=...&page=1&limit=10
 * @param {object} query
 */
export const getMyRegularizationRequestsApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/regularization/my-requests', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn giải trình:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Admin: Lấy danh sách đơn giải trình chờ duyệt
 * GET /api/regularization/pending?page=1&limit=10
 * @param {object} query
 */
export const getPendingRegularizationRequestsApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/regularization/pending', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách giải trình chờ duyệt:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Admin: Duyệt / Từ chối đơn giải trình (Tự động bù công vào Attendance)
 * PUT /api/regularization/:id/action
 * @param {string} id
 * @param {object} data - { action: 'approved' | 'rejected', rejectionReason }
 */
export const processRegularizationActionApi = async (id, data) => {
  try {
    const response = await axiosClient.put(`/regularization/${id}/action`, data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xử lý đơn giải trình:', error.response?.data || error.message);
    throw error;
  }
};
