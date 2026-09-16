import { createSlice } from '@reduxjs/toolkit';
import {
  getMyOvertimeRequestsAction,
  createOvertimeRequestAction,
  deleteOvertimeRequestAction,
} from './overtimeAction';

const overtimeSlice = createSlice({
  name: 'overtime',
  initialState: {
    overtimes: [],
    overtimeList: [],
    totalApprovedHours: 0,
    loading: false,
    error: null,
    message: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      limit: 20,
    },
  },
  reducers: {
    clearOvertimeError: (state) => {
      state.error = null;
    },
    clearOvertimeMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Get My Overtime ──
      .addCase(getMyOvertimeRequestsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyOvertimeRequestsAction.fulfilled, (state, action) => {
        state.loading = false;
        const list = Array.isArray(action.payload.data) ? action.payload.data : [];
        state.overtimes = list;
        state.overtimeList = list;
        state.totalApprovedHours = action.payload.totalApprovedHours || 0;

        if (action.payload.pagination) {
          const pag = action.payload.pagination;
          state.pagination = {
            currentPage: pag.page || pag.currentPage || 1,
            totalPages: pag.totalPages || 1,
            totalItems: pag.total || pag.totalItems || list.length,
            limit: pag.limit || 20,
          };
        }
      })
      .addCase(getMyOvertimeRequestsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Create Overtime ──
      .addCase(createOvertimeRequestAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOvertimeRequestAction.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        if (action.payload.overtimeRequest) {
          state.overtimes = [action.payload.overtimeRequest, ...state.overtimes];
          state.overtimeList = [action.payload.overtimeRequest, ...state.overtimeList];
        }
      })
      .addCase(createOvertimeRequestAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Delete Overtime ──
      .addCase(deleteOvertimeRequestAction.fulfilled, (state, action) => {
        state.overtimes = state.overtimes.filter((item) => item._id !== action.payload.id);
        state.overtimeList = state.overtimeList.filter((item) => item._id !== action.payload.id);
      });
  },
});

export const { clearOvertimeError, clearOvertimeMessage } = overtimeSlice.actions;
export default overtimeSlice.reducer;
