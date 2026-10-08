// screens/employee/attendance/AttendanceScreen.jsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import { getAttendanceHistoryAction } from '../../../redux/attendance/attendanceAction';
import COLORS from '../../../assets/styles/color';

// ─── Status Config ─────────────────────────────────────────
const STATUS_CONFIG = {
  present: {
    label: 'Có mặt',
    color: '#16A34A',
    bg: '#DCFCE7',
    border: '#86EFAC',
    icon: 'check-circle-outline',
  },
  late: {
    label: 'Đi trễ',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
    icon: 'clock-alert-outline',
  },
  half_day: {
    label: 'Nửa ngày',
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#DDD6FE',
    icon: 'fraction-one-half',
  },
  on_leave: {
    label: 'Nghỉ phép',
    color: '#0284C7',
    bg: '#E0F2FE',
    border: '#BAE6FD',
    icon: 'calendar-month-outline',
  },
  holiday: {
    label: 'Ngày lễ',
    color: '#DB2777',
    bg: '#FCE7F3',
    border: '#FBCFE8',
    icon: 'gift-outline',
  },
  absent: {
    label: 'Vắng mặt',
    color: '#DC2626',
    bg: '#FEE2E2',
    border: '#FECACA',
    icon: 'close-circle-outline',
  },
};

const WEEKDAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const AttendanceScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { history = [], stats = {}, loading = false } = useSelector(
    (state) => state.attendance || {},
  );

  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDay, setSelectedDay] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Map ngày -> bản ghi chấm công
  const attendanceMap = useMemo(() => {
    const map = {};
    if (Array.isArray(history)) {
      history.forEach((record) => {
        if (record.date) {
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

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => prev.clone().subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.clone().add(1, 'month'));
  };

  const handleToday = () => {
    setCurrentMonth(moment());
  };

  // Tạo ma trận lịch tháng (Calendar Grid)
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const daysInMonth = currentMonth.daysInMonth();

    // Thứ của ngày đầu tháng (0: Chủ nhật, 1: T2, ..., 6: T7) -> Chuyển về (0: T2, ..., 6: CN)
    let startDayOfWeek = startOfMonth.day() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Các ngày đệm đầu tháng
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = startOfMonth.clone().subtract(i + 1, 'days');
      days.push({
        dateStr: prevDate.format('YYYY-MM-DD'),
        dayNum: prevDate.date(),
        isCurrentMonth: false,
        isWeekend: prevDate.day() === 0 || prevDate.day() === 6,
      });
    }

    // Các ngày trong tháng
    for (let i = 1; i <= daysInMonth; i++) {
      const thisDate = currentMonth.clone().date(i);
      days.push({
        dateStr: thisDate.format('YYYY-MM-DD'),
        dayNum: i,
        isCurrentMonth: true,
        isToday: thisDate.isSame(moment(), 'day'),
        isWeekend: thisDate.day() === 0 || thisDate.day() === 6,
      });
    }

    // Các ngày đệm cuối tháng để đủ bội số 7
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextDate = endOfMonth.clone().add(i, 'days');
        days.push({
          dateStr: nextDate.format('YYYY-MM-DD'),
          dayNum: nextDate.date(),
          isCurrentMonth: false,
          isWeekend: nextDate.day() === 0 || nextDate.day() === 6,
        });
      }
    }

    return days;
  }, [currentMonth]);

  // Chia danh sách ngày thành các tuần (7 ngày / hàng) để khoảng cách đều và không bao giờ bị dính vào nhau
  const calendarWeeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);

  // ── Render Calendar Grid ──
  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      {/* Header thứ */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_NAMES.map((name, idx) => (
          <View key={idx} style={styles.weekdayCol}>
            <Text
              style={[
                styles.weekdayText,
                idx >= 5 && styles.weekendText,
              ]}
            >
              {name}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid ngày theo từng hàng tuần cân đối */}
      <View style={styles.weeksContainer}>
        {calendarWeeks.map((week, wIdx) => (
          <View key={wIdx} style={styles.weekRow}>
            {week.map((dayItem, dIdx) => {
              const record = attendanceMap[dayItem.dateStr];
              const hasRecord = Boolean(record);
              const status = record?.status ? STATUS_CONFIG[record.status] : null;
              console.log('Render Day:', dayItem.dateStr, 'Record:', record);

              return (
                <View key={dIdx} style={styles.dayColWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.dayCellInner,
                      !dayItem.isCurrentMonth && styles.dayCellOutside,
                      dayItem.isToday && styles.dayCellToday,
                      hasRecord && status && { backgroundColor: status.bg, borderColor: status.border },
                    ]}
                    disabled={!dayItem.isCurrentMonth}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (record) {
                        setSelectedDay(record);
                      } else if (dayItem.isCurrentMonth) {
                        setSelectedDay({
                          date: dayItem.dateStr,
                          status: dayItem.isWeekend ? 'holiday' : 'absent',
                          note: dayItem.isWeekend ? 'Nghỉ cuối tuần' : 'Chưa có bản ghi chấm công',
                        });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.dayNumText,
                        !dayItem.isCurrentMonth && styles.dayNumTextOutside,
                        dayItem.isToday && styles.dayNumTextToday,
                        dayItem.isWeekend && dayItem.isCurrentMonth && styles.dayNumTextWeekend,
                        hasRecord && status && { color: status.color, fontWeight: '800' },
                      ]}
                    >
                      {dayItem.dayNum}
                    </Text>

                    {hasRecord && status ? (
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    ) : (
                      <View style={styles.statusDotPlaceholder} />
                    )}

                    {record?.totalWorkHours > 0 ? (
                      <Text
                        style={[
                          styles.workHoursMini,
                          status && { color: status.color },
                        ]}
                      >
                        {record.totalWorkHours}h
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Chú thích màu sắc */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
          <Text style={styles.legendText}>Có mặt</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
          <Text style={styles.legendText}>Đi trễ</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#0284C7' }]} />
          <Text style={styles.legendText}>Nghỉ phép</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.legendText}>Vắng</Text>
        </View>
      </View>
    </View>
  );

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
        <View style={styles.monthNavCard}>
          <TouchableOpacity style={styles.monthNavBtn} onPress={handlePrevMonth}>
            <Icon name="chevron-left" size={24} color="#2563EB" />
          </TouchableOpacity>

          <View style={styles.monthTitleBox}>
            <Text style={styles.monthTitleText}>
              Tháng {currentMonth.format('MM/YYYY')}
            </Text>
            {!currentMonth.isSame(moment(), 'month') ? (
              <TouchableOpacity style={styles.todayBtn} onPress={handleToday}>
                <Text style={styles.todayBtnText}>Về hiện tại</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={styles.monthNavBtn} onPress={handleNextMonth}>
            <Icon name="chevron-right" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Monthly Summary Statistics Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <Icon name="account-check-outline" size={22} color="#16A34A" />
            <Text style={[styles.statNum, { color: '#16A34A' }]}>
              {stats?.presentDays ?? history.filter((h) => h.status === 'present').length}
            </Text>
            <Text style={styles.statLbl}>Ngày công</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Icon name="clock-outline" size={22} color="#2563EB" />
            <Text style={[styles.statNum, { color: '#2563EB' }]}>
              {Number(stats?.totalHours ?? history.reduce((s, h) => s + (h.totalWorkHours || 0), 0)).toFixed(1)}h
            </Text>
            <Text style={styles.statLbl}>Tổng giờ làm</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Icon name="clock-alert-outline" size={22} color="#D97706" />
            <Text style={[styles.statNum, { color: '#D97706' }]}>
              {stats?.lateDays ?? history.filter((h) => h.checkIn?.isLate).length}
            </Text>
            <Text style={styles.statLbl}>Đi muộn</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Icon name="clock-fast" size={22} color="#DC2626" />
            <Text style={[styles.statNum, { color: '#DC2626' }]}>
              {stats?.earlyDays ?? history.filter((h) => h.checkOut?.isEarlyLeave).length}
            </Text>
            <Text style={styles.statLbl}>Về sớm</Text>
          </View>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Đang tải dữ liệu chấm công...</Text>
          </View>
        )}

        {/* Main Content: Calendar */}
        {renderCalendar()}
      </ScrollView>

      {/* Day Detail Modal */}
      {selectedDay ? (
        <Modal
          visible={Boolean(selectedDay)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDay(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedDay(null)}
          >
            <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalDateTitle}>
                    {moment(selectedDay.date).format('dddd, DD/MM/YYYY')}
                  </Text>
                  <Text style={styles.modalSubtitle}>Chi tiết dữ liệu chấm công</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedDay(null)}>
                  <Icon name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Status Badge */}
                <View style={styles.modalStatusRow}>
                  <Text style={styles.modalFieldLbl}>Trạng thái:</Text>
                  <View
                    style={[
                      styles.modalStatusBadge,
                      {
                        backgroundColor:
                          STATUS_CONFIG[selectedDay.status]?.bg || '#F1F5F9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalStatusText,
                        {
                          color:
                            STATUS_CONFIG[selectedDay.status]?.color || '#475569',
                        },
                      ]}
                    >
                      {STATUS_CONFIG[selectedDay.status]?.label || selectedDay.status || 'Chưa ghi nhận'}
                    </Text>
                  </View>
                </View>

                {/* Check In Detail */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>1. Giờ vào (Check-in)</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Thời gian:</Text>
                    <Text style={styles.detailVal}>
                      {selectedDay.checkIn?.time
                        ? moment(selectedDay.checkIn.time).format('HH:mm:ss')
                        : '--:--:--'}
                    </Text>
                  </View>
                  {selectedDay.checkIn?.isLate ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Đi muộn:</Text>
                      <Text style={[styles.detailVal, { color: '#DC2626' }]}>
                        {selectedDay.checkIn.minutesLate} phút
                      </Text>
                    </View>
                  ) : null}
                  {selectedDay.checkIn?.location?.address ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Địa điểm:</Text>
                      <Text style={[styles.detailVal, { flex: 1, textAlign: 'right' }]}>
                        {selectedDay.checkIn.location.address}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Check Out Detail */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSecTitle}>2. Giờ ra (Check-out)</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Thời gian:</Text>
                    <Text style={styles.detailVal}>
                      {selectedDay.checkOut?.time
                        ? moment(selectedDay.checkOut.time).format('HH:mm:ss')
                        : '--:--:--'}
                    </Text>
                  </View>
                  {selectedDay.checkOut?.isEarlyLeave ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Về sớm:</Text>
                      <Text style={[styles.detailVal, { color: '#DC2626' }]}>
                        {selectedDay.checkOut.minutesEarly} phút
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Work Hours & Note */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Tổng giờ làm việc:</Text>
                    <Text style={[styles.detailVal, { color: '#2563EB', fontWeight: '700' }]}>
                      {selectedDay.totalWorkHours || 0} giờ
                    </Text>
                  </View>
                  {selectedDay.note ? (
                    <View style={[styles.detailRow, { marginTop: 6 }]}>
                      <Text style={styles.detailKey}>Ghi chú:</Text>
                      <Text style={[styles.detailVal, { flex: 1, textAlign: 'right', fontStyle: 'italic' }]}>
                        {selectedDay.note}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      ) : null}
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
  centerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '12@vs',
  },
  loadingText: {
    fontSize: '12@ms',
    color: '#64748B',
    marginLeft: '6@ms',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18@ms',
    paddingHorizontal: '10@ms',
    paddingVertical: '14@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: '10@vs',
    marginBottom: '6@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#64748B',
  },
  weekendText: {
    color: '#EF4444',
  },
  weeksContainer: {
    paddingVertical: '2@vs',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: '3@vs',
  },
  dayColWrapper: {
    flex: 1,
    paddingHorizontal: '2.5@ms',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInner: {
    width: '100%',
    height: '46@vs',
    borderRadius: '10@ms',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#F8FAFC',
  },
  dayCellOutside: {
    opacity: 0.25,
    backgroundColor: 'transparent',
  },
  dayCellToday: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
  },
  dayNumText: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#0F172A',
  },
  dayNumTextOutside: {
    color: '#94A3B8',
  },
  dayNumTextToday: {
    color: '#2563EB',
    fontWeight: '800',
  },
  dayNumTextWeekend: {
    color: '#EF4444',
  },
  statusDot: {
    width: '4@ms',
    height: '4@ms',
    borderRadius: '2@ms',
    marginTop: '2@vs',
  },
  statusDotPlaceholder: {
    width: '4@ms',
    height: '4@ms',
    marginTop: '2@vs',
  },
  workHoursMini: {
    fontSize: '8.5@ms',
    fontWeight: '700',
    marginTop: '1@vs',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: '12@vs',
    marginTop: '8@vs',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: '8@ms',
    height: '8@ms',
    borderRadius: '4@ms',
    marginRight: '4@ms',
  },
  legendText: {
    fontSize: '11@ms',
    color: '#64748B',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20@ms',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '20@ms',
    width: '100%',
    maxWidth: '340@ms',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalDateTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  modalSubtitle: {
    fontSize: '12@ms',
    color: '#64748B',
    marginTop: '2@vs',
  },
  modalBody: {
    paddingTop: '12@vs',
  },
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  modalFieldLbl: {
    fontSize: '13@ms',
    color: '#64748B',
  },
  modalStatusBadge: {
    paddingHorizontal: '10@ms',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
  },
  modalStatusText: {
    fontSize: '12@ms',
    fontWeight: '700',
  },
  detailSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10@ms',
    padding: '10@ms',
    marginBottom: '10@vs',
  },
  detailSecTitle: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6@vs',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '2@vs',
  },
  detailKey: {
    fontSize: '12@ms',
    color: '#64748B',
  },
  detailVal: {
    fontSize: '12@ms',
    fontWeight: '600',
    color: '#0F172A',
  },
});

export default AttendanceScreen;
