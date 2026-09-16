import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  applyOvertimeApi,
  getMyOvertimeRequestsApi,
} from '../../api/overtimeAPI';

/**
 * Lấy danh sách đơn làm thêm giờ (OT)
 */
export const getMyOvertimeRequestsAction = createAsyncThunk(
  'overtime/getMyOvertime',
  async (query = {}, { rejectWithValue }) => {
    try {
      const response = await getMyOvertimeRequestsApi(query);
      if (response && response.success !== false) {
        const payload = response.data || {};
        const list = payload.requests || (Array.isArray(payload) ? payload : []);
        return {
          message: response.message,
          data: list,
          totalApprovedHours: payload.totalApprovedHours || 0,
          pagination: payload.pagination || response.pagination,
        };
      }
      return rejectWithValue(response.message || 'Không thể tải danh sách đơn OT');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi tải đơn OT',
      );
    }
  },
);

/**
 * Tạo đơn xin làm thêm giờ mới
 */
export const createOvertimeRequestAction = createAsyncThunk(
  'overtime/applyOvertime',
  async (data, { rejectWithValue }) => {
    try {
      const response = await applyOvertimeApi(data);
      if (response && response.success !== false) {
        return {
          message: response.message || 'Nộp đơn làm thêm giờ thành công',
          overtimeRequest: response.data,
        };
      }
      return rejectWithValue(response.message || 'Nộp đơn OT thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi nộp đơn OT',
      );
    }
  },
);

export const updateOvertimeRequestAction = createOvertimeRequestAction;

/**
 * Hủy đơn OT
 */
export const deleteOvertimeRequestAction = createAsyncThunk(
  'overtime/deleteOvertime',
  async (id, { rejectWithValue }) => {
    try {
      return { id };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
