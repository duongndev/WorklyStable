import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  checkInApi,
  checkOutApi,
  getMyAttendanceTodayApi,
  getAttendanceHistoryApi,
} from '../../api/attendanceAPI';

export const checkInAction = createAsyncThunk(
  'attendance/checkIn',
  async (data, { rejectWithValue }) => {
    try {
      const response = await checkInApi(data);
      if (response.success) {
        const payload = response.data || response;
        return { record: payload, message: response.message };
      }
      return rejectWithValue(response.message || 'Check-in thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi check-in',
      );
    }
  },
);

export const checkOutAction = createAsyncThunk(
  'attendance/checkOut',
  async (data, { rejectWithValue }) => {
    try {
      const response = await checkOutApi(data);
      if (response.success) {
        const payload = response.data || response;
        return { record: payload, message: response.message };
      }
      return rejectWithValue(response.message || 'Check-out thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi check-out',
      );
    }
  },
);

export const getMyAttendanceTodayAction = createAsyncThunk(
  'attendance/getToday',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyAttendanceTodayApi();
      if (response.success) {
        const payload = response.data ?? null;
        return { record: payload };
      }
      return rejectWithValue(response.message || 'Không thể tải chấm công hôm nay');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi',
      );
    }
  },
);

export const getAttendanceHistoryAction = createAsyncThunk(
  'attendance/getHistory',
  async (query = {}, { rejectWithValue }) => {
    try {
      const response = await getAttendanceHistoryApi(query);
      if (response.success) {
        return {
          data: response.data,
          pagination: response.pagination,
          message: response.message,
        };
      }
      return rejectWithValue(response.message || 'Không thể tải lịch sử chấm công');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi',
      );
    }
  },
);
