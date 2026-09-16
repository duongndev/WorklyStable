import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import {
  checkInAction,
  checkOutAction,
  getAttendanceByDateAction,
} from '../redux/attendance/attendanceAction';
import { requestLocationPermission } from '../services/permissionService';

const AttendanceContext = createContext(null);

export const AttendanceProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { todayRecord } = useSelector((state) => state.attendance);

  const [checkedIn, setCheckedIn] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState('checkin');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const timeoutRef = useRef(null);

  // ── Khôi phục trạng thái hôm nay từ server khi mở màn hình ──
  useEffect(() => {
    const today = moment().format('YYYY-MM-DD');
    dispatch(getAttendanceByDateAction(today));
  }, [dispatch]);

  // todayRecord (từ redux) là nguồn dữ liệu duy nhất cho trạng thái check-in
  useEffect(() => {
    if (!todayRecord) {
      setCheckedIn(false);
      return;
    }
    const today = moment().format('YYYY-MM-DD');
    const isToday = todayRecord.date === today;
    setCheckedIn(
      isToday &&
        todayRecord.isCheckedIn === true &&
        todayRecord.isCheckedOut !== true,
    );
    if (isToday && todayRecord.isCheckedIn && todayRecord.checkInTime) {
      setCheckInTime(new Date(todayRecord.checkInTime));
    }
  }, [todayRecord]);

  const getCurrentPosition = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Ứng dụng chưa được cấp quyền vị trí GPS. Vui lòng cấp quyền trong Cài đặt để chấm công.');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location: 'Văn phòng Workly',
          });
        },
        (err) => {
          console.log('Lỗi lấy vị trí GPS chính xác:', err);
          // Thử lấy vị trí mạng fallback nếu GPS vệ tinh chưa kịp khóa
          Geolocation.getCurrentPosition(
            (fallbackPos) => {
              resolve({
                latitude: fallbackPos.coords.latitude,
                longitude: fallbackPos.coords.longitude,
                location: 'Văn phòng Workly',
              });
            },
            (fallbackErr) => {
              console.log('Lỗi fallback GPS:', fallbackErr);
              reject(new Error('Không thể xác định vị trí. Vui lòng bật định vị GPS trên thiết bị và thử lại.'));
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
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

  // Trả promise: AttendanceSheet sẽ đợi API xong mới hiện màn hình thành công.
  const handleCheckIn = useCallback(async (extraData = {}) => {
    setCheckLoading(true);
    try {
      let geoData = {};
      try {
        geoData = await getCurrentPosition();
      } catch (err) {
        if (extraData.method !== 'face') throw err;
      }
      const payload = { ...geoData, ...extraData };
      const result = await dispatch(checkInAction(payload)).unwrap();
      setCurrentTime(new Date());
      return result;
    } finally {
      setCheckLoading(false);
    }
  }, [dispatch, getCurrentPosition]);

  const handleCheckOut = useCallback(async (extraData = {}) => {
    setCheckLoading(true);
    try {
      let geoData = {};
      try {
        geoData = await getCurrentPosition();
      } catch (err) {
        if (extraData.method !== 'face') throw err;
      }
      const payload = { ...geoData, ...extraData };
      const result = await dispatch(checkOutAction(payload)).unwrap();
      setCurrentTime(new Date());
      return result;
    } finally {
      setCheckLoading(false);
    }
  }, [dispatch, getCurrentPosition]);

  const value = {
    checkedIn,
    showSheet,
    sheetType,
    currentTime,
    checkInTime,
    checkLoading,
    openSheet,
    closeSheet,
    handleCheckIn,
    handleCheckOut,
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
