import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../auth/authSlice.js';
import leaveReducer from '../leave/leaveSlice.js';
import overtimeReducer from '../overtime/overtimeSlice.js';
import attendanceReducer from '../attendance/attendanceSlice.js';
import salaryReducer from '../salary/salarySlice.js';
import notificationReducer from '../notification/notificationSlice.js';

const rootReducer = combineReducers({
  auth: authReducer,
  leave: leaveReducer,
  overtime: overtimeReducer,
  attendance: attendanceReducer,
  salary: salaryReducer,
  notification: notificationReducer,
});

export default rootReducer;