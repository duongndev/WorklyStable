import { axiosClient } from './axiosConfig';

/**
 * ============================================
 * ADMIN API - CỔNG QUẢN TRỊ DOANH NGHIỆP WORKLY
 * ============================================
 */

// ─── 1. Dashboard Thống kê Tổng quan ────────────────────────────────────────
export const getAdminDashboardSummaryApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/dashboard/summary', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu Dashboard:', error.response?.data || error.message);
    throw error;
  }
};

// ─── 2. Phê duyệt Nghỉ phép (Leave Approvals) ────────────────────────────────
export const getPendingLeaveApprovalsApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/leaves/pending-approvals', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn nghỉ chờ duyệt:', error.response?.data || error.message);
    throw error;
  }
};

export const reviewLeaveRequestApi = async (id, action, comment = '') => {
  try {
    const response = await axiosClient.put(`/leaves/${id}/action`, {
      action, // 'approve' | 'reject'
      comment,
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi duyệt đơn nghỉ:', error.response?.data || error.message);
    throw error;
  }
};

// ─── 3. Phê duyệt Làm thêm giờ (Overtime Approvals) ──────────────────────────
export const getPendingOvertimeRequestsApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/overtime/pending', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn OT chờ duyệt:', error.response?.data || error.message);
    throw error;
  }
};

export const reviewOvertimeRequestApi = async (id, action, rejectionReason = '') => {
  try {
    const response = await axiosClient.put(`/overtime/${id}/action`, {
      action, // 'approve' | 'reject'
      rejectionReason,
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi duyệt đơn OT:', error.response?.data || error.message);
    throw error;
  }
};

// ─── 4. Quản lý Bảng lương (Payroll Management) ──────────────────────────────
export const generateMonthlyPayslipsApi = async (month, year) => {
  try {
    const response = await axiosClient.post('/payslip/admin/generate', { month, year });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tính bảng lương tháng:', error.response?.data || error.message);
    throw error;
  }
};

export const updatePayslipStatusApi = async (id, status) => {
  try {
    const response = await axiosClient.put(`/payslip/admin/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái phiếu lương:', error.response?.data || error.message);
    throw error;
  }
};

// ─── 5. Báo cáo Điểm danh & Sinh mã QR Điểm làm việc ─────────────────────────
export const getAdminAttendanceReportApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/attendance/admin/report', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy báo cáo điểm danh:', error.response?.data || error.message);
    throw error;
  }
};

export const generateWorkplaceQRApi = async (workplaceId) => {
  try {
    const response = await axiosClient.post('/attendance/admin/qr-generate', { workplaceId });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi sinh mã QR điểm danh:', error.response?.data || error.message);
    throw error;
  }
};

// ─── 6. Phát Thông Báo Hệ Thống (Broadcast Notification) ─────────────────────
export const sendCustomNotificationAdminApi = async (data) => {
  try {
    const response = await axiosClient.post('/notifications/admin/send', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi phát thông báo hệ thống:', error.response?.data || error.message);
    throw error;
  }
};

// ─── 7. Phê duyệt Đơn Giải Trình Bổ Sung Công (Regularization) ───────────────
export const getPendingRegularizationsApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/regularization/pending', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn giải trình chờ duyệt:', error.response?.data || error.message);
    throw error;
  }
};

export const reviewRegularizationApi = async (id, action, rejectionReason = '') => {
  try {
    const response = await axiosClient.put(`/regularization/${id}/action`, {
      action, // 'approve' | 'reject'
      rejectionReason,
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi duyệt đơn giải trình:', error.response?.data || error.message);
    throw error;
  }
};
