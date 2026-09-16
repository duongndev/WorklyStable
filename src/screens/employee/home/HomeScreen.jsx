// screens/employee/home/HomeScreen.jsx
import React, { useCallback, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ScaledSheet, verticalScale } from 'react-native-size-matters';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';

import Header from '../../../components/common/Header';
import ShiftCard from '../../../components/employee/home/ShiftCard';
import QuickActions from '../../../components/employee/home/QuickActions';
import SectionHeader from '../../../components/employee/home/SectionHeader';
import Statistics from '../../../components/employee/home/Statistics';
import NewsFeed from '../../../components/employee/home/NewsFeed';
import { useAttendance } from '../../../contexts/AttendanceContext';
import { getNotificationsAction } from '../../../redux/notification/notificationAction';
import { getMyAttendanceTodayAction, getAttendanceHistoryAction } from '../../../redux/attendance/attendanceAction';
import { getMyLeavesRequestAction, getLeaveBalanceAction } from '../../../redux/leave/leaveAction';
import { getMyOvertimeRequestsAction } from '../../../redux/overtime/overtimeAction';
import COLORS from '../../../assets/styles/color';

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { unreadCount, loading: notifLoading } = useSelector((state) => state.notification || {});
  const { openSheet } = useAttendance();

  const currentMonth = moment().format('M');
  const currentYear = moment().year();
  const [feedRefreshTick, setFeedRefreshTick] = useState(0);

  const loadHomeData = useCallback(() => {
    dispatch(getMyAttendanceTodayAction());
    dispatch(getNotificationsAction({ page: 1, limit: 10 }));
    dispatch(getAttendanceHistoryAction({ month: Number(currentMonth), year: currentYear }));
    dispatch(getLeaveBalanceAction());
    dispatch(getMyLeavesRequestAction({ page: 1, limit: 5 }));
    dispatch(getMyOvertimeRequestsAction({ page: 1, limit: 5 }));
  }, [dispatch, currentMonth, currentYear]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData]),
  );

  const onRefresh = useCallback(() => {
    loadHomeData();
    setFeedRefreshTick((t) => t + 1);
  }, [loadHomeData]);

  // Điều hướng các tính năng
  const toLeave = () => navigation.navigate('LeaveCreate');
  const toOvertime = () => navigation.navigate('OTCreate');
  const toAttendance = () => navigation.navigate('Attendance');
  const toSalary = () => navigation.navigate('Salary');
  const toAnnouncement = () => navigation.navigate('Announcement');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        username={user?.fullName || 'Nhân viên'}
        canGoBack={false}
        showNotification
        unreadCount={unreadCount || 0}
        onNotificationPress={() => navigation.navigate('Notification')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(notifLoading)}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY || '#2563EB']}
          />
        }
      >
        {/* 1. Hero Shift Card với Live Clock & GPS */}
        <ShiftCard onAttendancePress={openSheet} />

        {/* 2. Lối tắt chức năng nhanh (Quick Actions) */}
        <SectionHeader title="Truy cập nhanh" />
        <QuickActions
          toAttendance={toAttendance}
          toSalary={toSalary}
          toLeave={toLeave}
          toOvertime={toOvertime}
        />

        {/* 3. Thống kê công tháng thực tế */}
        <SectionHeader
          title={`Thống kê tháng ${currentMonth}`}
          action="Chi tiết"
          onAction={toAttendance}
        />
        <Statistics />

        {/* 4. Bảng tin nội bộ (News Feed) */}
        <NewsFeed onSeeAll={toAnnouncement} refreshToken={feedRefreshTick} />


      </ScrollView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: '16@ms',
    paddingTop: '14@vs',
    paddingBottom: verticalScale(90),
  },
  salaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: '16@ms',
    padding: '14@ms',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: '16@vs',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  salaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: '8@ms',
  },
  salaryIconBox: {
    width: '42@ms',
    height: '42@ms',
    borderRadius: '21@ms',
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@ms',
  },
  salaryTextBox: {
    flex: 1,
  },
  salaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salaryTitle: {
    fontSize: '13@ms',
    fontWeight: '800',
    color: '#166534',
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: '6@ms',
    paddingVertical: '2@vs',
    borderRadius: '6@ms',
    marginLeft: '6@ms',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  securityPillText: {
    fontSize: '9@ms',
    fontWeight: '800',
    color: '#16A34A',
    marginLeft: '2@ms',
  },
  salarySub: {
    fontSize: '11@ms',
    color: '#15803D',
    marginTop: '2@vs',
  },
  bottomSpacer: {
    height: '20@vs',
  },
});

export default HomeScreen;
