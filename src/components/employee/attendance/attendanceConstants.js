// src/components/employee/attendance/attendanceConstants.js

export const STATUS_CONFIG = {
  present: {
    label: 'Có mặt',
    color: '#16A34A',
    bg: '#DCFCE7',
    border: '#86EFAC',
    icon: 'check-circle-outline',
  },
  late: {
    label: 'Đi trễ',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
    icon: 'clock-alert-outline',
  },
  half_day: {
    label: 'Nửa ngày',
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#DDD6FE',
    icon: 'fraction-one-half',
  },
  on_leave: {
    label: 'Nghỉ phép',
    color: '#0284C7',
    bg: '#E0F2FE',
    border: '#BAE6FD',
    icon: 'calendar-month-outline',
  },
  holiday: {
    label: 'Ngày lễ',
    color: '#DB2777',
    bg: '#FCE7F3',
    border: '#FBCFE8',
    icon: 'gift-outline',
  },
  weekend: {
    label: 'Cuối tuần',
    color: '#64748B',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    icon: 'coffee-outline',
  },
  upcoming: {
    label: 'Chưa tới',
    color: '#94A3B8',
    bg: '#F8FAFC',
    border: '#E2E8F0',
    icon: 'clock-outline',
  },
  absent: {
    label: 'Vắng mặt',
    color: '#DC2626',
    bg: '#FEE2E2',
    border: '#FECACA',
    icon: 'close-circle-outline',
  },
};

export const WEEKDAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
