import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

const QUICK_ACTIONS = [
  {
    icon: 'calendar-check-outline',
    label: 'Bảng công',
    bg: '#EFF6FF',
    color: '#2563EB',
    key: 'toAttendance',
  },
  {
    icon: 'cash-multiple',
    label: 'Bảng lương',
    bg: '#EDE9FE',
    color: '#7C3AED',
    key: 'toSalary',
  },
  {
    icon: 'beach',
    label: 'Xin nghỉ',
    bg: '#FEF3C7',
    color: '#D97706',
    key: 'toLeave',
  },
  {
    icon: 'clock-time-eight-outline',
    label: 'Tăng ca',
    bg: '#DCFCE7',
    color: '#16A34A',
    key: 'toOvertime',
  },

];

const QuickActions = ({ toAttendance, toSalary, toLeave, toOvertime }) => {
  const actionsMap = {
    toAttendance,
    toSalary,
    toLeave,
    toOvertime,
  };

  return (
    <View style={styles.quickGrid}>
      {QUICK_ACTIONS.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.quickCard}
          onPress={actionsMap[item.key]}
          activeOpacity={0.75}
        >
          <View style={[styles.quickIconBox, { backgroundColor: item.bg }]}>
            <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
          </View>
          <Text style={styles.quickLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = ScaledSheet.create({
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '18@vs',
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    paddingVertical: '14@vs',
    alignItems: 'center',
    marginHorizontal: '4@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIconBox: {
    width: '46@ms',
    height: '46@ms',
    borderRadius: '14@ms',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  quickLabel: {
    fontSize: '12@ms',
    color: '#1E293B',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default QuickActions;