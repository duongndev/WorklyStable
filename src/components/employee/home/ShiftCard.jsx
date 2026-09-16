// components/ShiftCard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';
import { useAttendance } from '../../../contexts/AttendanceContext';

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
  const { checkedIn, checkInTime, handleCheckIn, handleCheckOut, checkLoading } = useAttendance();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Cập nhật thời gian thực mỗi giây cho đồng hồ sống động
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePress = useCallback(() => {
    if (onAttendancePress) {
      onAttendancePress(checkedIn ? 'checkout' : 'checkin');
    } else {
      if (checkedIn) {
        handleCheckOut();
      } else {
        handleCheckIn();
      }
    }
  }, [checkedIn, onAttendancePress, handleCheckIn, handleCheckOut]);

  const timeStr = formatTime(currentTime);
  const secondsStr = String(currentTime.getSeconds()).padStart(2, '0');
  const checkInTimeStr = formatTime(checkInTime);
  const dateStr = formatDate(currentTime);

  return (
    <View style={styles.shiftCard}>
      {/* Decorative Circles */}
      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />

      {/* Top Meta: Date + Shift Badge */}
      <View style={styles.shiftTopRow}>
        <View style={styles.shiftPill}>
          <Ionicons name="sunny" size={14} color="#FBBF24" />
          <Text style={styles.shiftPillText}>Ca sáng (08:00 – 17:00)</Text>
        </View>

        <View style={[styles.statusPill, checkedIn && styles.statusPillActive]}>
          <View style={[styles.statusDot, { backgroundColor: checkedIn ? '#34D399' : '#FBBF24' }]} />
          <Text style={styles.statusPillText}>
            {checkedIn ? 'Đang trong ca' : 'Chưa vào ca'}
          </Text>
        </View>
      </View>

      {/* Center Live Clock */}
      <View style={styles.clockContainer}>
        <Text style={styles.clockMainText}>{timeStr}</Text>
        <Text style={styles.clockSecText}>:{secondsStr}</Text>
      </View>
      <Text style={styles.dateText}>{dateStr}</Text>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="login-variant" size={18} color="#34D399" />
          <View style={styles.infoTextGroup}>
            <Text style={styles.infoLabel}>Giờ vào</Text>
            <Text style={[styles.infoValue, { color: checkedIn ? '#34D399' : '#FFFFFF' }]}>
              {checkInTimeStr}
            </Text>
          </View>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="logout-variant" size={18} color="#F87171" />
          <View style={styles.infoTextGroup}>
            <Text style={styles.infoLabel}>Giờ ra</Text>
            <Text style={styles.infoValue}>--:--</Text>
          </View>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="map-marker-radius" size={18} color="#93C5FD" />
          <View style={styles.infoTextGroup}>
            <Text style={styles.infoLabel}>Vị trí</Text>
            <Text style={styles.infoValue} numberOfLines={1}>Trụ sở chính</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.checkInButton, checkedIn && styles.checkInButtonDone, checkLoading && { opacity: 0.7 }]}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={checkLoading}
      >
        {checkLoading ? (
          <ActivityIndicator size="small" color={checkedIn ? '#059669' : '#2563EB'} />
        ) : (
          <MaterialCommunityIcons
            name={checkedIn ? 'checkbox-marked-circle-outline' : 'fingerprint'}
            size={22}
            color={checkedIn ? '#059669' : '#2563EB'}
          />
        )}
        <Text style={[styles.checkInText, checkedIn && styles.checkInTextDone]}>
          {checkLoading ? 'Đang xử lý...' : (checkedIn ? 'Check-out Kết Thúc Ca' : 'Chấm Công Ngay Bây Giờ')}
        </Text>
      </TouchableOpacity>
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
    marginBottom: '14@vs',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: '16@ms',
    padding: '12@ms',
    marginBottom: '16@vs',
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextGroup: {
    marginLeft: '6@ms',
  },
  infoLabel: {
    fontSize: '10@ms',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  infoValue: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: '1@vs',
  },
  infoDivider: {
    width: 1,
    height: '24@vs',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: '6@ms',
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
  checkInButtonDone: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  checkInText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: '14@ms',
    marginLeft: '8@ms',
  },
  checkInTextDone: {
    color: '#059669',
  },
});

export default ShiftCard;
