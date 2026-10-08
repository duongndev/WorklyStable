// screens/employee/attendance/AttendanceScreen.jsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import MonthNavigator from '../../../components/employee/attendance/MonthNavigator';
import AttendanceStats from '../../../components/employee/attendance/AttendanceStats';
import AttendanceCalendar from '../../../components/employee/attendance/AttendanceCalendar';
import AttendanceDetailModal from '../../../components/employee/attendance/AttendanceDetailModal';

import { getAttendanceHistoryAction } from '../../../redux/attendance/attendanceAction';
import COLORS from '../../../assets/styles/color';

const AttendanceScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { history = [], stats = {}, loading = false } = useSelector(
    (state) => state.attendance || {},
  );

  const todayStr = useMemo(() => moment().format('YYYY-MM-DD'), []);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedModalDay, setSelectedModalDay] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Map ngày -> bản ghi chấm công (tra cứu O(1))
  const attendanceMap = useMemo(() => {
    const map = {};
    if (Array.isArray(history)) {
      history.forEach((record) => {
        if (record?.date) {
          map[record.date] = record;
        }
      });
    }
    return map;
  }, [history]);

  const loadData = useCallback(() => {
    dispatch(
      getAttendanceHistoryAction({
        month: currentMonth.month() + 1,
        year: currentMonth.year(),
      }),
    );
  }, [dispatch, currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(
      getAttendanceHistoryAction({
        month: currentMonth.month() + 1,
        year: currentMonth.year(),
      }),
    ).unwrap().catch(() => {});
    setRefreshing(false);
  }, [dispatch, currentMonth]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const nextM = prev.clone().subtract(1, 'month');
      if (nextM.isSame(moment(), 'month')) {
        setSelectedDate(todayStr);
      } else {
        setSelectedDate(nextM.clone().startOf('month').format('YYYY-MM-DD'));
      }
      return nextM;
    });
  }, [todayStr]);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const nextM = prev.clone().add(1, 'month');
      if (nextM.isSame(moment(), 'month')) {
        setSelectedDate(todayStr);
      } else {
        setSelectedDate(nextM.clone().startOf('month').format('YYYY-MM-DD'));
      }
      return nextM;
    });
  }, [todayStr]);

  const handleToday = useCallback(() => {
    setCurrentMonth(moment());
    setSelectedDate(todayStr);
  }, [todayStr]);

  // Chạm vào một ô ngày -> highlight ngày trên lịch và bật popup modal chi tiết
  const handleSelectDay = useCallback(
    (dateStr, record) => {
      setSelectedDate(dateStr);

      const targetRecord =
        record ||
        attendanceMap[dateStr] ||
        (() => {
          const d = moment(dateStr);
          const isFuture = d.isAfter(moment(), 'day');
          const isWeekend = d.day() === 0 || d.day() === 6;
          return {
            date: dateStr,
            status: isFuture ? 'upcoming' : isWeekend ? 'weekend' : 'absent',
            note: isFuture
              ? 'Ngày làm việc sắp tới'
              : isWeekend
              ? 'Nghỉ cuối tuần'
              : 'Chưa có bản ghi chấm công',
          };
        })();

      setSelectedModalDay(targetRecord);
      setIsDetailModalVisible(true);
    },
    [attendanceMap],
  );

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Lịch sử chấm công"
        canGoBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY || '#2563EB']}
          />
        }
      >
        {/* Month Navigator Header */}
        <MonthNavigator
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />

        {/* Monthly Summary Statistics Grid */}
        <AttendanceStats stats={stats} history={history} />

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Đang cập nhật dữ liệu...</Text>
          </View>
        )}

        {/* Main Content: Optimized Calendar Grid */}
        <AttendanceCalendar
          currentMonth={currentMonth}
          attendanceMap={attendanceMap}
          selectedDate={selectedDate}
          onSelectDay={handleSelectDay}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      </ScrollView>

      {/* Popup chi tiết ngày khi chạm vào bất kỳ ô ngày nào */}
      <AttendanceDetailModal
        visible={isDetailModalVisible}
        selectedDay={selectedModalDay}
        onClose={handleCloseDetailModal}
      />
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: '16@ms',
    paddingTop: '12@vs',
    paddingBottom: '32@vs',
  },
  centerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '8@vs',
    marginBottom: '8@vs',
  },
  loadingText: {
    fontSize: '12@ms',
    color: '#64748B',
    marginLeft: '8@ms',
    fontWeight: '500',
  },
});

export default AttendanceScreen;
