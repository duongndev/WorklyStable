import { createSlice } from '@reduxjs/toolkit';
import {
  checkInAction,
  checkOutAction,
  getMyAttendanceTodayAction,
  getAttendanceHistoryAction,
} from './attendanceAction';

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    todayRecord: null,
    history: [],
    stats: null,
    loading: false,
    loadingCheck: false,
    error: null,
    message: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      limit: 10,
    },
  },
  reducers: {
    clearAttendanceError: (state) => {
      state.error = null;
    },
    clearAttendanceMessage: (state) => {
      state.message = null;
    },
    resetTodayRecord: (state) => {
      state.todayRecord = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Check-in ──
      .addCase(checkInAction.pending, (state) => {
        state.loadingCheck = true;
        state.error = null;
      })
      .addCase(checkInAction.fulfilled, (state, action) => {
        state.loadingCheck = false;
        state.todayRecord = action.payload.record;
        state.message = action.payload.message;
      })
      .addCase(checkInAction.rejected, (state, action) => {
        state.loadingCheck = false;
        state.error = action.payload || 'Check-in thất bại';
      })

      // ── Check-out ──
      .addCase(checkOutAction.pending, (state) => {
        state.loadingCheck = true;
        state.error = null;
      })
      .addCase(checkOutAction.fulfilled, (state, action) => {
        state.loadingCheck = false;
        state.todayRecord = action.payload.record;
        state.message = action.payload.message;
      })
      .addCase(checkOutAction.rejected, (state, action) => {
        state.loadingCheck = false;
        state.error = action.payload || 'Check-out thất bại';
      })

      // ── Get Today ──
      .addCase(getMyAttendanceTodayAction.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyAttendanceTodayAction.fulfilled, (state, action) => {
        state.loading = false;
        state.todayRecord = action.payload.record;
      })
      .addCase(getMyAttendanceTodayAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── History ──
      .addCase(getAttendanceHistoryAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAttendanceHistoryAction.fulfilled, (state, action) => {
        state.loading = false;
        const { data, pagination } = action.payload;
        const payload = data || {};
        const page = pagination?.currentPage || 1;
        const newHistory = Array.isArray(payload) ? payload : (payload.attendances || payload.history || []);

        if (page === 1) {
          state.history = newHistory;
        } else {
          const existingIds = new Set(state.history.map((item) => item._id));
          const uniqueItems = newHistory.filter((item) => !existingIds.has(item._id));
          state.history = [...state.history, ...uniqueItems];
        }

        if (payload.stats) {
          state.stats = payload.stats;
        }

        if (pagination) {
          state.pagination = {
            currentPage: pagination.currentPage || 1,
            totalPages: pagination.totalPages || 1,
            totalItems: pagination.totalItems || 0,
            limit: pagination.limit || 10,
          };
        }
      })
      .addCase(getAttendanceHistoryAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Không thể tải lịch sử chấm công';
      });
  },
});

export const { clearAttendanceError, clearAttendanceMessage, resetTodayRecord } =
  attendanceSlice.actions;

export default attendanceSlice.reducer;
