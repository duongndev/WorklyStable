import { axiosClient } from './axiosConfig';

/**
 * =========================
 * LEAVE API (QUẢN LÝ NGHỈ PHÉP)
 * =========================
 */

/**
 * Nộp đơn xin nghỉ phép
 * POST /api/leaves/apply
 * @param {object} data - { leaveType, startDate, endDate, leaveDurationType, session, startTime, endTime, reason, emergencyContact, handoverInfo, isPaidLeave }
 */
export const applyLeaveApi = async (data) => {
  try {
    const response = await axiosClient.post('/leaves/apply', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi nộp đơn xin nghỉ phép:', error.response?.data || error.message);
    throw error;
  }
};
export const createLeaveRequestApi = applyLeaveApi;

/**
 * Lấy danh sách đơn xin nghỉ phép của tôi
 * GET /api/leaves/my-requests?status=...&year=YYYY&page=1&limit=20
 * @param {object} query
 */
export const getMyLeaveRequestsApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/leaves/my-requests', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn nghỉ phép:', error.response?.data || error.message);
    throw error;
  }
};
export const getMyLeavesRequestApi = getMyLeaveRequestsApi;

/**
 * Lấy số dư ngày phép (Leave Balance)
 * GET /api/leaves/balance?year=YYYY
 * @param {object} query
 */
export const getMyLeaveBalanceApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/leaves/balance', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy số dư phép:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Hủy đơn xin nghỉ phép (khi còn Pending)
 * PUT /api/leaves/:id/cancel
 * @param {string} id
 */
export const cancelLeaveRequestApi = async (id) => {
  try {
    const response = await axiosClient.put(`/leaves/${id}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi hủy đơn xin nghỉ phép:', error.response?.data || error.message);
    throw error;
  }
};
export const deleteLeaveRequestApi = cancelLeaveRequestApi;

/**
 * Admin: Lấy danh sách đơn nghỉ phép chờ duyệt
 * GET /api/leaves/pending-approvals?page=1&limit=20
 * @param {object} query
 */
export const getPendingLeaveApprovalsApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/leaves/pending-approvals', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn chờ duyệt:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Admin: Phê duyệt / Từ chối đơn nghỉ phép
 * PUT /api/leaves/:id/action
 * @param {string} id
 * @param {object} data - { action: 'approve' | 'reject', comment }
 */
export const processLeaveActionApi = async (id, data) => {
  try {
    const response = await axiosClient.put(`/leaves/${id}/action`, data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xử lý đơn nghỉ phép:', error.response?.data || error.message);
    throw error;
  }
};
export const reviewLeaveRequestApi = (id, action, comment = '') =>
  processLeaveActionApi(id, {
    action: action === 'approved' ? 'approve' : action === 'rejected' ? 'reject' : action,
    comment,
  });