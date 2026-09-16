import { axiosClient } from './axiosConfig';

/**
 * =========================
 * PAYSLIP & SALARY API
 * =========================
 */

/**
 * Thiết lập mã PIN xem lương
 * POST /api/payslip/pin/setup
 * @param {string} pin - 6 chữ số
 */
export const setupPayslipPinApi = async (pin) => {
  try {
    const response = await axiosClient.post('/payslip/pin/setup', { pin });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi thiết lập mã PIN:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Xác thực mã PIN xem lương (nhận token tạm 5 phút)
 * POST /api/payslip/pin/verify
 * @param {string} pin
 */
export const verifyPayslipPinApi = async (pin) => {
  try {
    const response = await axiosClient.post('/payslip/pin/verify', { pin });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xác thực mã PIN:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Lấy danh sách phiếu lương của tôi
 * GET /api/payslip/my-payslips
 */
export const getMyPayslipsApi = async () => {
  try {
    const response = await axiosClient.get('/payslip/my-payslips');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phiếu lương:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Xem chi tiết 1 phiếu lương
 * GET /api/payslip/:id
 * @param {string} id
 * @param {string} payslipToken - Token sau khi verify PIN
 */
export const getPayslipDetailApi = async (id, payslipToken) => {
  try {
    const headers = payslipToken ? { 'x-payslip-token': payslipToken } : {};
    const response = await axiosClient.get(`/payslip/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết phiếu lương:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Admin: Tính toán bảng lương tháng tự động
 * POST /api/payslip/admin/generate
 * @param {number} month
 * @param {number} year
 */
export const generateMonthlyPayslipsApi = async (month, year) => {
  try {
    const response = await axiosClient.post('/payslip/admin/generate', { month, year });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tính bảng lương tháng:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Admin: Cập nhật trạng thái phiếu lương (published / paid)
 * PUT /api/payslip/admin/:id/status
 * @param {string} id
 * @param {string} status - 'draft' | 'published' | 'paid'
 */
export const updatePayslipStatusApi = async (id, status) => {
  try {
    const response = await axiosClient.put(`/payslip/admin/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái phiếu lương:', error.response?.data || error.message);
    throw error;
  }
};
