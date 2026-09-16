import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  applyLeaveApi,
  getMyLeaveRequestsApi,
  getMyLeaveBalanceApi,
  cancelLeaveRequestApi,
} from '../../api/leaveAPI';

/**
 * Lấy danh sách đơn nghỉ phép
 */
export const getMyLeavesRequestAction = createAsyncThunk(
  'leave/getMyLeaves',
  async (query = {}, { rejectWithValue }) => {
    try {
      const response = await getMyLeaveRequestsApi(query);
      if (response && response.success !== false) {
        const payload = response.data || {};
        const requests = payload.requests || payload.leaves || (Array.isArray(payload) ? payload : []);
        return {
          message: response.message,
          leaves: requests,
          pagination: payload.pagination || response.pagination,
        };
      }
      return rejectWithValue(response.message || 'Không thể tải danh sách đơn nghỉ');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi tải đơn nghỉ',
      );
    }
  },
);

/**
 * Lấy số dư quỹ phép (Leave Balance)
 */
export const getLeaveBalanceAction = createAsyncThunk(
  'leave/getBalance',
  async (query = {}, { rejectWithValue }) => {
    try {
      const response = await getMyLeaveBalanceApi(query);
      if (response && response.success !== false) {
        return {
          balance: response.data,
          message: response.message,
        };
      }
      return rejectWithValue(response.message || 'Không thể tải số dư ngày phép');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi tải số dư phép',
      );
    }
  },
);

/**
 * Tạo đơn xin nghỉ phép mới
 */
export const createLeaveRequestAction = createAsyncThunk(
  'leave/applyLeave',
  async (data, { rejectWithValue }) => {
    try {
      const response = await applyLeaveApi(data);
      if (response && response.success !== false) {
        return {
          leaveRequest: response.data,
          message: response.message || 'Gửi đơn nghỉ phép thành công',
        };
      }
      return rejectWithValue(response.message || 'Gửi đơn nghỉ phép thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi gửi đơn nghỉ',
      );
    }
  },
);

export const updateLeaveRequestAction = createLeaveRequestAction;

/**
 * Hủy đơn xin nghỉ phép (khi đang Pending)
 */
export const cancelLeaveRequestAction = createAsyncThunk(
  'leave/cancelLeave',
  async (id, { rejectWithValue }) => {
    try {
      const response = await cancelLeaveRequestApi(id);
      if (response && response.success !== false) {
        return {
          id,
          message: response.message || 'Hủy đơn nghỉ phép thành công',
        };
      }
      return rejectWithValue(response.message || 'Không thể hủy đơn nghỉ phép');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi hủy đơn',
      );
    }
  },
);

export const deleteLeaveRequestAction = cancelLeaveRequestAction;
