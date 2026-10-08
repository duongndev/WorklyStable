// src/components/employee/attendance/MonthNavigator.jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

const MonthNavigator = ({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
}) => {
  const isCurrentMonthNow = currentMonth.isSame(moment(), 'month');

  return (
    <View style={styles.monthNavCard}>
      <TouchableOpacity
        style={styles.monthNavBtn}
        onPress={onPrevMonth}
        activeOpacity={0.7}
      >
        <Icon name="chevron-left" size={24} color="#2563EB" />
      </TouchableOpacity>

      <View style={styles.monthTitleBox}>
        <Text style={styles.monthTitleText}>
          Tháng {currentMonth.format('MM/YYYY')}
        </Text>
        {!isCurrentMonthNow ? (
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={onToday}
            activeOpacity={0.7}
          >
            <Text style={styles.todayBtnText}>Về hiện tại</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.monthNavBtn}
        onPress={onNextMonth}
        activeOpacity={0.7}
      >
        <Icon name="chevron-right" size={24} color="#2563EB" />
      </TouchableOpacity>
    </View>
  );
};

const styles = ScaledSheet.create({
  monthNavCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    paddingVertical: '12@vs',
    paddingHorizontal: '16@ms',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: '12@vs',
  },
  monthNavBtn: {
    padding: '6@ms',
    borderRadius: '8@ms',
    backgroundColor: '#EFF6FF',
  },
  monthTitleBox: {
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#0F172A',
  },
  todayBtn: {
    marginTop: '2@vs',
  },
  todayBtnText: {
    fontSize: '11@ms',
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default React.memo(MonthNavigator);
