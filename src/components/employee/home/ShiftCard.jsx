// components/ShiftCard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';
import { useAttendance } from '../../../contexts/AttendanceContext';
import { watchDeviceLocation } from '../../../services/locationService';
import { checkLocationPermission, requestLocationPermission } from '../../../services/permissionService';

const formatTime = (date) => {
  if (!date) return '--:--';
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const formatDate = (date) => {
  const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const d = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${d}, ${day}/${month}/${year}`;
};

const ShiftCard = ({ onAttendancePress }) => {
  const {
    checkedIn,
    isCheckedIn,
    isCheckedOut,
    checkInTime,
    checkOutTime,
    handleCheckIn,
    handleCheckOut,
    checkLoading,
    currentAttendance,
    workplace,
  } = useAttendance();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentLocation, setCurrentLocation] = useState('Đang lấy vị trí thiết bị...');

  // Cập nhật thời gian thực mỗi giây cho đồng hồ
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tự động làm mới khi thiết bị thay đổi vị trí (Live GPS Watch)
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    const startTracking = async () => {
      let hasPerm = await checkLocationPermission();
      if (!hasPerm) {
        hasPerm = await requestLocationPermission();
      }
      if (!isMounted) return;

      if (hasPerm) {
        unsubscribe = watchDeviceLocation((liveName) => {
          if (isMounted && liveName) {
            setCurrentLocation(liveName);
          }
        });
      } else {
        setCurrentLocation('Chưa cấp quyền vị trí');
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const timeStr = formatTime(currentTime);
  const secondsStr = String(currentTime.getSeconds()).padStart(2, '0');
  const checkInTimeStr = formatTime(checkInTime);
  const checkOutTimeStr = formatTime(checkOutTime);
  const dateStr = formatDate(currentTime);

  const handlePress = useCallback(() => {
    if (isCheckedOut) {
      Alert.alert(
        'Ca làm việc đã kết thúc',
        `Bạn đã hoàn thành chấm công cho hôm nay.\n\n• Giờ vào: ${checkInTimeStr}\n• Giờ ra: ${checkOutTimeStr}`,
        [{ text: 'Đóng', style: 'default' }],
      );
      return;
    }

    const actionType = checkedIn ? 'checkout' : 'checkin';
    if (onAttendancePress) {
      onAttendancePress(actionType);
    } else {
      if (checkedIn) {
        handleCheckOut();
      } else {
        handleCheckIn();
      }
    }
  }, [isCheckedOut, checkedIn, onAttendancePress, handleCheckIn, handleCheckOut, checkInTimeStr, checkOutTimeStr]);

  const buttonIcon = isCheckedOut
    ? 'check-circle'
    : checkedIn
      ? 'logout-variant'
      : 'login-variant';

  const buttonIconColor = isCheckedOut
    ? '#15803D'
    : checkedIn
      ? '#DC2626'
      : '#2563EB';

  const buttonLabel = checkLoading
    ? 'Đang định vị GPS...'
    : isCheckedOut
      ? 'Đã hoàn thành ca hôm nay'
      : checkedIn
        ? 'Check-out kết thúc ca (GPS)'
        : 'Chấm công vào ca (GPS)';

  return (
    <View style={styles.shiftCard}>
      {/* Decorative Circles */}
      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />

      {/* Top Meta: Date + Shift Badge */}
      <View style={styles.shiftTopRow}>
        <View style={styles.shiftPill}>
          <Text style={styles.shiftPillText}>Ca làm việc (08:30 – 17:30)</Text>
        </View>

        <View style={[styles.statusPill, checkedIn && styles.statusPillActive]}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isCheckedOut
                  ? '#3B82F6'
                  : checkedIn
                    ? '#34D399'
                    : '#FBBF24',
              },
            ]}
          />
          <Text style={styles.statusPillText}>
            {isCheckedOut
              ? 'Đã chấm công'
              : checkedIn
                ? 'Đang làm'
                : 'Chưa chấm công'}
          </Text>
        </View>
      </View>

      {/* Center Live Clock */}
      <View style={styles.clockContainer}>
        <Text style={styles.clockMainText}>{timeStr}</Text>
        <Text style={styles.clockSecText}>:{secondsStr}</Text>
      </View>
      <Text style={styles.dateText}>{dateStr}</Text>

      {/* 1. Vị trí thành 1 dòng nằm trên (Tự động cập nhật khi thay đổi vị trí) */}
      <View style={styles.locationRow}>
        <Text style={styles.locationLabel}>Vị trí:</Text>
        <Text style={styles.locationValue} numberOfLines={1} ellipsizeMode="tail">
          {currentLocation}
        </Text>
      </View>

      {/* 2. Giờ vào, Giờ ra thành hàng ngang cân đối (chỉ hiển thị label) */}
      <View style={styles.timeInfoRow}>
        <View style={styles.timeInfoItem}>
          <Text style={styles.timeLabel}>Giờ vào</Text>
          <Text style={[styles.timeValue, { color: isCheckedIn ? '#34D399' : '#FFFFFF' }]}>
            {checkInTimeStr}
          </Text>
        </View>

        <View style={styles.timeDivider} />

        <View style={styles.timeInfoItem}>
          <Text style={styles.timeLabel}>Giờ ra</Text>
          <Text style={[styles.timeValue, { color: isCheckedOut ? '#F87171' : '#FFFFFF' }]}>
            {checkOutTimeStr}
          </Text>
        </View>
      </View>

      {/* Action Button: Chấm công vào ca / Check-out ra ca / Thông báo hoàn thành ca */}
      {/* <TouchableOpacity
        style={[
          styles.checkInButton,
          checkedIn && styles.checkInButtonCheckout,
          isCheckedOut && styles.checkInButtonFinished,
          checkLoading && { opacity: 0.7 },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={checkLoading}
      >
        {checkLoading ? (
          <ActivityIndicator size="small" color={buttonIconColor} />
        ) : (
          <MaterialCommunityIcons
            name={buttonIcon}
            size={22}
            color={buttonIconColor}
          />
        )}
        <Text
          style={[
            styles.checkInText,
            checkedIn && styles.checkInTextCheckout,
            isCheckedOut && styles.checkInTextFinished,
          ]}
        >
          {buttonLabel}
        </Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = ScaledSheet.create({
  shiftCard: {
    backgroundColor: '#1E40AF',
    borderRadius: '24@ms',
    padding: '18@ms',
    marginBottom: '18@vs',
    overflow: 'hidden',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  decorCircleLarge: {
    position: 'absolute',
    width: '180@ms',
    height: '180@ms',
    borderRadius: '90@ms',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: '-50@vs',
    right: '-40@ms',
  },
  decorCircleSmall: {
    position: 'absolute',
    width: '100@ms',
    height: '100@ms',
    borderRadius: '50@ms',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: '-30@vs',
    left: '20@ms',
  },
  shiftTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
  },
  shiftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '20@ms',
    paddingVertical: '5@vs',
    paddingHorizontal: '10@ms',
  },
  shiftPillText: {
    color: '#FFFFFF',
    fontSize: '11@ms',
    fontWeight: '600',
    marginLeft: '5@ms',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '20@ms',
    paddingVertical: '5@vs',
    paddingHorizontal: '10@ms',
  },
  statusPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  statusDot: {
    width: '7@ms',
    height: '7@ms',
    borderRadius: '3.5@ms',
    marginRight: '5@ms',
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: '11@ms',
    fontWeight: '600',
  },
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: '4@vs',
  },
  clockMainText: {
    color: '#FFFFFF',
    fontSize: '36@ms',
    fontWeight: '900',
    letterSpacing: 1,
  },
  clockSecText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: '20@ms',
    fontWeight: '700',
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '12@ms',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: '2@vs',
    marginBottom: '10@vs',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12@ms',
    paddingVertical: '8@vs',
    paddingHorizontal: '12@ms',
    marginBottom: '10@vs',
  },
  locationLabel: {
    fontSize: '14@ms',
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    marginRight: '6@ms',
  },
  locationValue: {
    flex: 1,
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: '16@ms',
    paddingVertical: '12@vs',
    paddingHorizontal: '12@ms',
    marginBottom: '16@vs',
  },
  timeInfoItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: '14@ms',
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '600',
    marginBottom: '3@vs',
  },
  timeValue: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timeDivider: {
    width: 1,
    height: '28@vs',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  checkInButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14@ms',
    paddingVertical: '12@vs',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  checkInButtonCheckout: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  checkInButtonFinished: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    opacity: 0.95,
  },
  checkInText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: '14@ms',
    marginLeft: '8@ms',
  },
  checkInTextCheckout: {
    color: '#DC2626',
  },
  checkInTextFinished: {
    color: '#15803D',
  },
});

export default ShiftCard;
