import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import { checkInAction, checkOutAction } from '../redux/attendance/attendanceAction';

const AttendanceContext = createContext(null);

export const AttendanceProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { loadingCheck, error } = useSelector((state) => state.attendance);

  const [checkedIn, setCheckedIn] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState('checkin');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const timeoutRef = useRef(null);

  const getCurrentPosition = useCallback(() => {
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
          console.log('Lỗi lấy vị trí:', err);
          // Fallback: vẫn cho phép check-in với location mặc định
          resolve({
            latitude: 21.0269,
            longitude: 105.7887,
            location: 'Văn phòng Workly',
          });
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

  const handleCheckIn = useCallback(async () => {
    setCheckLoading(true);
    try {
      const geoData = await getCurrentPosition();
      const result = await dispatch(checkInAction(geoData)).unwrap();

      const now = new Date();
      setCheckedIn(true);
      setCheckInTime(now);
      setCurrentTime(now);
      closeSheet();

      Alert.alert('Thành công', result?.message || 'Check-in thành công!');
    } catch (err) {
      Alert.alert('Thất bại', err || 'Không thể check-in. Vui lòng thử lại.');
      closeSheet();
    }
  }, [dispatch, getCurrentPosition, closeSheet]);

  const handleCheckOut = useCallback(async () => {
    setCheckLoading(true);
    try {
      const geoData = await getCurrentPosition();
      const result = await dispatch(checkOutAction(geoData)).unwrap();

      setCheckedIn(false);
      setCheckInTime(null);
      setCurrentTime(new Date());
      closeSheet();

      Alert.alert('Thành công', result?.message || 'Check-out thành công!');
    } catch (err) {
      Alert.alert('Thất bại', err || 'Không thể check-out. Vui lòng thử lại.');
      closeSheet();
    }
  }, [dispatch, getCurrentPosition, closeSheet]);

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
