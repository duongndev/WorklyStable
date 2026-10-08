// src/components/employee/attendance/AttendanceStats.jsx
import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

const AttendanceStats = ({ stats = {}, history = [] }) => {
  const safeHistory = Array.isArray(history) ? history : [];

  const presentDays =
    stats?.presentDays ??
    safeHistory.filter((h) => h.status === 'present').length;

  const totalHours = Number(
    stats?.totalHours ??
      safeHistory.reduce((s, h) => s + (h.totalWorkHours || 0), 0),
  ).toFixed(1);

  const lateDays =
    stats?.lateDays ??
    safeHistory.filter((h) => h.checkIn?.isLate).length;

  const earlyDays =
    stats?.earlyDays ??
    safeHistory.filter((h) => h.checkOut?.isEarlyLeave).length;

  return (
    <View style={styles.statsGrid}>
      <View style={[styles.statBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
        <Icon name="account-check-outline" size={22} color="#16A34A" />
        <Text style={[styles.statNum, { color: '#16A34A' }]}>{presentDays}</Text>
        <Text style={styles.statLbl}>Ngày công</Text>
      </View>

      <View style={[styles.statBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
        <Icon name="clock-outline" size={22} color="#2563EB" />
        <Text style={[styles.statNum, { color: '#2563EB' }]}>{totalHours}h</Text>
        <Text style={styles.statLbl}>Tổng giờ làm</Text>
      </View>

      <View style={[styles.statBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
        <Icon name="clock-alert-outline" size={22} color="#D97706" />
        <Text style={[styles.statNum, { color: '#D97706' }]}>{lateDays}</Text>
        <Text style={styles.statLbl}>Đi muộn</Text>
      </View>

      <View style={[styles.statBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
        <Icon name="clock-fast" size={22} color="#DC2626" />
        <Text style={[styles.statNum, { color: '#DC2626' }]}>{earlyDays}</Text>
        <Text style={styles.statLbl}>Về sớm</Text>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '12@vs',
  },
  statBox: {
    width: '23%',
    borderRadius: '12@ms',
    paddingVertical: '10@vs',
    paddingHorizontal: '4@ms',
    alignItems: 'center',
    borderWidth: 1,
  },
  statNum: {
    fontSize: '16@ms',
    fontWeight: '800',
    marginVertical: '2@vs',
  },
  statLbl: {
    fontSize: '10@ms',
    color: '#64748B',
    fontWeight: '500',
  },
});

export default React.memo(AttendanceStats);
