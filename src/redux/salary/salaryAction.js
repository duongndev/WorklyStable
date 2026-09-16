import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  setupPayslipPinApi,
  verifyPayslipPinApi,
  getMyPayslipsApi,
  getPayslipDetailApi,
} from '../../api/salaryAPI';

/**
 * Thiết lập mã PIN mới
 */
export const setupPayslipPinAction = createAsyncThunk(
  'salary/setupPin',
  async ({ pin, oldPin }, { rejectWithValue }) => {
    try {
      const response = await setupPayslipPinApi(pin, oldPin);
      if (response && response.success !== false) {
        return { message: response.message };
      }
      return rejectWithValue(response.message || 'Thiết lập mã PIN thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi tạo mã PIN',
      );
    }
  },
);

/**
 * Xác thực mã PIN để nhận accessPayslipToken
 */
export const verifyPayslipPinAction = createAsyncThunk(
  'salary/verifyPin',
  async (pin, { rejectWithValue }) => {
    try {
      const response = await verifyPayslipPinApi(pin);
      if (response && response.success !== false) {
        const token =
          response.data?.accessPayslipToken ||
          response.data?.payslipToken ||
          response.data?.token ||
          response.token;
        return {
          token,
          expiresInSeconds: response.data?.expiresInSeconds || 300,
          message: response.message,
        };
      }
      return rejectWithValue(response.message || 'Mã PIN không đúng');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Mã PIN không chính xác',
      );
    }
  },
);

/**
 * Lấy danh sách phiếu lương của nhân viên
 */
export const getMyPayslipsAction = createAsyncThunk(
  'salary/getMyPayslips',
  async (query = {}, { rejectWithValue }) => {
    try {
      const response = await getMyPayslipsApi(query);
      if (response && response.success !== false) {
        const list = Array.isArray(response.data) ? response.data : (response.data?.payslips || []);
        return {
          payslips: list,
          message: response.message,
        };
      }
      return rejectWithValue(response.message || 'Không thể tải danh sách phiếu lương');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi',
      );
    }
  },
);

export const getSalaryHistoryAction = getMyPayslipsAction;

/**
 * Xem chi tiết 1 phiếu lương (Cần token xác thực PIN)
 */
export const getPayslipDetailAction = createAsyncThunk(
  'salary/getDetail',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await getPayslipDetailApi(id, token);
      if (response && response.success !== false) {
        return {
          detail: response.data || response,
        };
      }
      return rejectWithValue(response.message || 'Không thể tải chi tiết phiếu lương');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi tải phiếu lương',
      );
    }
  },
);

export const getSalaryDetailAction = getPayslipDetailAction;
