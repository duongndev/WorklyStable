import { createSlice } from '@reduxjs/toolkit';
import {
  getMyLeavesRequestAction,
  getLeaveBalanceAction,
  createLeaveRequestAction,
  cancelLeaveRequestAction,
} from './leaveAction';

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    leaves: [],
    leavesList: [],
    balance: null,
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
    clearLeaveError: (state) => {
      state.error = null;
    },
    clearLeaveMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Get My Leaves ──
      .addCase(getMyLeavesRequestAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyLeavesRequestAction.fulfilled, (state, action) => {
        state.loading = false;
        const list = Array.isArray(action.payload.leaves) ? action.payload.leaves : [];
        state.leaves = list;
        state.leavesList = list;
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
      .addCase(getMyLeavesRequestAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Get Balance ──
      .addCase(getLeaveBalanceAction.pending, (state) => {
        state.error = null;
      })
      .addCase(getLeaveBalanceAction.fulfilled, (state, action) => {
        state.balance = action.payload.balance;
      })
      .addCase(getLeaveBalanceAction.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ── Create Leave ──
      .addCase(createLeaveRequestAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLeaveRequestAction.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        if (action.payload.leaveRequest) {
          state.leaves = [action.payload.leaveRequest, ...state.leaves];
          state.leavesList = [action.payload.leaveRequest, ...state.leavesList];
        }
      })
      .addCase(createLeaveRequestAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Cancel / Delete Leave ──
      .addCase(cancelLeaveRequestAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelLeaveRequestAction.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.leaves = state.leaves.map((l) =>
          l._id === action.payload.id ? { ...l, status: 'cancelled' } : l
        );
        state.leavesList = state.leavesList.map((l) =>
          l._id === action.payload.id ? { ...l, status: 'cancelled' } : l
        );
      })
      .addCase(cancelLeaveRequestAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearLeaveError, clearLeaveMessage } = leaveSlice.actions;
export default leaveSlice.reducer;
