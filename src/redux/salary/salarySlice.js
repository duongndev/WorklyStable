import { createSlice } from '@reduxjs/toolkit';
import {
  setupPayslipPinAction,
  verifyPayslipPinAction,
  getMyPayslipsAction,
  getPayslipDetailAction,
} from './salaryAction';

const salarySlice = createSlice({
  name: 'salary',
  initialState: {
    payslips: [],
    salaries: [],
    currentDetail: null,
    salaryDetail: null,
    payslipToken: null,
    tokenExpiresAt: null,
    loading: false,
    loadingDetail: false,
    error: null,
    message: null,
  },
  reducers: {
    clearSalaryError: (state) => {
      state.error = null;
    },
    clearSalaryMessage: (state) => {
      state.message = null;
    },
    setPayslipToken: (state, action) => {
      state.payslipToken = action.payload;
      state.tokenExpiresAt = Date.now() + 5 * 60 * 1000;
    },
    clearPayslipToken: (state) => {
      state.payslipToken = null;
      state.tokenExpiresAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Verify PIN ──
      .addCase(verifyPayslipPinAction.pending, (state) => {
        state.error = null;
      })
      .addCase(verifyPayslipPinAction.fulfilled, (state, action) => {
        state.payslipToken = action.payload.token;
        state.tokenExpiresAt = Date.now() + (action.payload.expiresInSeconds || 300) * 1000;
      })
      .addCase(verifyPayslipPinAction.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ── Setup PIN ──
      .addCase(setupPayslipPinAction.fulfilled, (state, action) => {
        state.message = action.payload.message;
      })

      // ── Get My Payslips ──
      .addCase(getMyPayslipsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyPayslipsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.payslips = action.payload.payslips;
        state.salaries = action.payload.payslips;
      })
      .addCase(getMyPayslipsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Get Payslip Detail ──
      .addCase(getPayslipDetailAction.pending, (state) => {
        state.loadingDetail = true;
        state.error = null;
      })
      .addCase(getPayslipDetailAction.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.currentDetail = action.payload.detail;
        state.salaryDetail = action.payload.detail;
      })
      .addCase(getPayslipDetailAction.rejected, (state, action) => {
        state.loadingDetail = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearSalaryError,
  clearSalaryMessage,
  setPayslipToken,
  clearPayslipToken,
} = salarySlice.actions;

export default salarySlice.reducer;
