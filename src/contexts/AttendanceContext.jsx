// src/contexts/AttendanceContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import {
  checkInAction,
  checkOutAction,
  getMyAttendanceTodayAction,
  getAttendanceHistoryAction,
} from '../redux/attendance/attendanceAction';
import { requestLocationPermission } from '../services/permissionService';
import { reverseGeocode } from '../services/locationService';

const AttendanceContext = createContext(null);

export const AttendanceProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { todayRecord, loadingCheck } = useSelector((state) => state.attendance || {});

  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState('checkin');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkLoading, setCheckLoading] = useState(false);
  const timeoutRef = useRef(null);

  // ── Khôi phục trạng thái chấm công hôm nay từ server ──
  const fetchTodayStatus = useCallback(() => {
    dispatch(getMyAttendanceTodayAction());
  }, [dispatch]);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  // ── Trích xuất bản ghi chấm công từ todayRecord ──
  const currentAttendance = useMemo(() => {
    if (!todayRecord) return null;
    // Server có thể trả về { date, attendance, workplace } hoặc trả trực tiếp attendance
    return todayRecord.attendance || (todayRecord.checkIn ? todayRecord : null);
  }, [todayRecord]);

  // Đã check-in (có giờ vào)
  const isCheckedIn = Boolean(currentAttendance?.checkIn?.time);
  // Đã check-out (có cả giờ vào và giờ ra)
  const isCheckedOut = Boolean(currentAttendance?.checkIn?.time && currentAttendance?.checkOut?.time);

  // Trạng thái đang trong ca làm việc: đã check-in nhưng chưa check-out
  const checkedIn = isCheckedIn && !isCheckedOut;

  // Thời gian giờ vào & giờ ra thực tế
  const checkInTime = currentAttendance?.checkIn?.time ? new Date(currentAttendance.checkIn.time) : null;
  const checkOutTime = currentAttendance?.checkOut?.time ? new Date(currentAttendance.checkOut.time) : null;

  // ── Lấy vị trí GPS của nhân viên ──
  const getCurrentPosition = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Ứng dụng chưa được cấp quyền vị trí GPS. Vui lòng cấp quyền trong Cài đặt để chấm công.');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const addr = await reverseGeocode(lat, lng);
          resolve({
            latitude: lat,
            longitude: lng,
            accuracy: position.coords.accuracy,
            location: addr || 'Vị trí làm việc GPS',
            address: addr || '',
            method: 'gps',
          });
        },
        (err) => {
          console.warn('Lỗi lấy GPS độ chính xác cao, thử chế độ mạng fallback:', err);
          Geolocation.getCurrentPosition(
            async (fallbackPos) => {
              const lat = fallbackPos.coords.latitude;
              const lng = fallbackPos.coords.longitude;
              const addr = await reverseGeocode(lat, lng);
              resolve({
                latitude: lat,
                longitude: lng,
                accuracy: fallbackPos.coords.accuracy,
                location: addr || 'Vị trí làm việc GPS (mạng)',
                address: addr || '',
                method: 'gps',
              });
            },
            (fallbackErr) => {
              console.error('Lỗi định vị vị trí GPS:', fallbackErr);
              reject(
                new Error(
                  'Không thể xác định vị trí GPS. Vui lòng bật Định vị / Vị trí trên thiết bị và thử lại.',
                ),
              );
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 10000,
        },
      );
    });
  }, []);

  const openSheet = useCallback((type) => {
    setCurrentTime(new Date());
    setSheetType(type);
    setShowSheet(true);
  }, []);

  const closeSheet = useCallback(() => {
    setShowSheet(false);
    setCheckLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ── Xử lý Check-in bằng vị trí GPS ──
  const handleCheckIn = useCallback(
    async (extraData = {}) => {
      setCheckLoading(true);
      try {
        const geoData = await getCurrentPosition();
        const payload = {
          ...geoData,
          ...extraData,
          method: 'gps',
        };

        const result = await dispatch(checkInAction(payload)).unwrap();
        setCurrentTime(new Date());

        // Làm mới dữ liệu hôm nay và lịch sử
        dispatch(getMyAttendanceTodayAction());
        const now = moment();
        dispatch(getAttendanceHistoryAction({ month: now.month() + 1, year: now.year() }));

        return result;
      } finally {
        setCheckLoading(false);
      }
    },
    [dispatch, getCurrentPosition],
  );

  // ── Xử lý Check-out bằng vị trí GPS ──
  const handleCheckOut = useCallback(
    async (extraData = {}) => {
      setCheckLoading(true);
      try {
        const geoData = await getCurrentPosition();
        const payload = {
          ...geoData,
          ...extraData,
          method: 'gps',
        };

        const result = await dispatch(checkOutAction(payload)).unwrap();
        setCurrentTime(new Date());

        // Làm mới dữ liệu hôm nay và lịch sử
        dispatch(getMyAttendanceTodayAction());
        const now = moment();
        dispatch(getAttendanceHistoryAction({ month: now.month() + 1, year: now.year() }));

        return result;
      } finally {
        setCheckLoading(false);
      }
    },
    [dispatch, getCurrentPosition],
  );

  const value = {
    checkedIn,
    isCheckedIn,
    isCheckedOut,
    checkInTime,
    checkOutTime,
    currentAttendance,
    todayRecord,
    workplace: todayRecord?.workplace || null,
    showSheet,
    sheetType,
    currentTime,
    checkLoading: checkLoading || loadingCheck,
    openSheet,
    closeSheet,
    handleCheckIn,
    handleCheckOut,
    fetchTodayStatus,
    getCurrentPosition,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
};

export default AttendanceContext;
