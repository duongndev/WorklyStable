import React from 'react';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

const Statistics = () => {
  const attendance = useSelector((state) => state.attendance || {});
  const leave = useSelector((state) => state.leave || {});
  const overtime = useSelector((state) => state.overtime || {});

  const presentDays = attendance.stats?.presentDays ?? attendance.history?.filter((h) => h.status === 'present').length ?? 0;
  const leaveUsed = leave.balance?.used ?? 0;
  const otHours = overtime.requests
    ?.filter((r) => r.status === 'approved')
    ?.reduce((sum, r) => sum + (r.durationHours || 0), 0) ?? 0;
  const lateDays = attendance.stats?.lateDays ?? attendance.history?.filter((h) => h.checkIn?.isLate).length ?? 0;

  const statsData = [
    {
      value: String(presentDays),
      unit: 'ngày',
      label: 'Đi làm',
      color: '#2563EB',
      bg: '#EFF6FF',
      icon: 'check-circle-outline',
    },
    {
      value: String(leaveUsed),
      unit: 'ngày',
      label: 'Nghỉ phép',
      color: '#D97706',
      bg: '#FEF3C7',
      icon: 'beach',
    },
    {
      value: String(otHours),
      unit: 'giờ',
      label: 'Tăng ca',
      color: '#16A34A',
      bg: '#DCFCE7',
      icon: 'clock-outline',
    },
    {
      value: String(lateDays),
      unit: 'lần',
      label: 'Đi muộn',
      color: '#DC2626',
      bg: '#FEE2E2',
      icon: 'alert-circle-outline',
    },
  ];

  return (
    <View style={styles.statsCard}>
      {statsData.map((item, index) => (
        <View
          key={index}
          style={[
            styles.statItem,
            index < statsData.length - 1 && styles.statItemBorder,
          ]}
        >
          <View
            style={[styles.statIconBox, { backgroundColor: item.bg }]}
          >
            <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
          </View>
          <Text style={[styles.statNumber, { color: item.color }]}>
            {item.value}
            <Text style={styles.statUnit}> {item.unit}</Text>
          </Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = ScaledSheet.create({
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: '20@ms',
    padding: '16@ms',
    marginBottom: '18@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemBorder: {
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
  },
  statIconBox: {
    width: '36@ms',
    height: '36@ms',
    borderRadius: '18@ms',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '6@vs',
  },
  statNumber: {
    fontSize: '18@ms',
    fontWeight: '800',
  },
  statUnit: {
    fontSize: '10@ms',
    fontWeight: '500',
    color: '#64748B',
  },
  statLabel: {
    fontSize: '11@ms',
    color: '#64748B',
    fontWeight: '600',
    marginTop: '2@vs',
    textAlign: 'center',
  },
});

export default Statistics;