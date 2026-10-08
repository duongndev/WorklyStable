// src/components/employee/attendance/AttendanceCalendar.jsx
import React, { useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import moment from 'moment';
import { ScaledSheet } from 'react-native-size-matters';
import { STATUS_CONFIG, WEEKDAY_NAMES } from './attendanceConstants';
import AttendanceLegend from './AttendanceLegend';

/**
 * Component hiển thị từng ô ngày riêng biệt được tối ưu với React.memo
 */
const CalendarDayCell = React.memo(
  ({
    dayItem,
    record,
    isSelected,
    onSelectDay,
    onPressAdjacentMonth,
  }) => {
    const hasRecord = Boolean(record);
    const status = record?.status ? STATUS_CONFIG[record.status] : null;

    const handlePress = useCallback(() => {
      if (!dayItem.isCurrentMonth) {
        if (onPressAdjacentMonth) {
          onPressAdjacentMonth(dayItem.dateStr, dayItem.isPrevMonth ? 'prev' : 'next');
        }
        return;
      }
      onSelectDay(dayItem.dateStr, record);
    }, [dayItem, record, onSelectDay, onPressAdjacentMonth]);

    // Ngày ngoài tháng hiện tại
    if (!dayItem.isCurrentMonth) {
      return (
        <View style={styles.dayColWrapper}>
          <TouchableOpacity
            style={[styles.dayCellInner, styles.dayCellOutside]}
            activeOpacity={0.6}
            onPress={handlePress}
          >
            <Text style={[styles.dayNumText, styles.dayNumTextOutside]}>
              {dayItem.dayNum}
            </Text>
            <View style={styles.statusDotPlaceholder} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.dayColWrapper}>
        <TouchableOpacity
          style={[
            styles.dayCellInner,
            dayItem.isToday && styles.dayCellToday,
            hasRecord &&
              status && {
                backgroundColor: status.bg,
                borderColor: status.border,
              },
            isSelected && styles.dayCellSelected,
          ]}
          activeOpacity={0.7}
          onPress={handlePress}
        >
          {/* Số ngày */}
          {dayItem.isToday ? (
            <View
              style={[
                styles.todayNumBadge,
                isSelected && styles.todayNumBadgeSelected,
              ]}
            >
              <Text style={styles.dayNumTextTodayBadge}>{dayItem.dayNum}</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.dayNumText,
                dayItem.isWeekend && (dayItem.dayOfWeek === 0 ? styles.sundayText : styles.saturdayText),
                hasRecord &&
                  status && {
                    color: status.color,
                    fontWeight: '800',
                  },
                isSelected && styles.dayNumTextSelected,
              ]}
            >
              {dayItem.dayNum}
            </Text>
          )}

          {/* Dấu chấm trạng thái */}
          {hasRecord && status ? (
            <View
              style={[
                styles.statusDot,
                { backgroundColor: status.color },
              ]}
            />
          ) : dayItem.isToday ? (
            <View style={[styles.statusDot, styles.todayDot]} />
          ) : (
            <View style={styles.statusDotPlaceholder} />
          )}
        </TouchableOpacity>
      </View>
    );
  },
);

const AttendanceCalendar = ({
  currentMonth,
  calendarWeeks: customWeeks,
  attendanceMap = {},
  selectedDate,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}) => {
  // Bắt cử chỉ vuốt ngang để đổi tháng
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchStartY.current = e.nativeEvent.pageY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.nativeEvent.pageX - touchStartX.current;
    const dy = Math.abs(e.nativeEvent.pageY - touchStartY.current);

    // Chỉ kích hoạt đổi tháng khi vuốt ngang rõ ràng (dx > 55 và góc ngang lớn hơn dọc)
    if (Math.abs(dx) > 55 && Math.abs(dx) > dy) {
      if (dx > 0 && onPrevMonth) {
        onPrevMonth();
      } else if (dx < 0 && onNextMonth) {
        onNextMonth();
      }
    }
  };

  const handleAdjacentMonthPress = useCallback(
    (dateStr, direction) => {
      if (direction === 'prev' && onPrevMonth) {
        onPrevMonth();
      } else if (direction === 'next' && onNextMonth) {
        onNextMonth();
      }
      if (onSelectDay) {
        onSelectDay(dateStr, attendanceMap[dateStr]);
      }
    },
    [onPrevMonth, onNextMonth, onSelectDay, attendanceMap],
  );

  // Tính ma trận tuần nếu không được truyền từ ngoài
  const weeks = useMemo(() => {
    if (Array.isArray(customWeeks) && customWeeks.length > 0) {
      return customWeeks;
    }

    const monthMoment = moment.isMoment(currentMonth)
      ? currentMonth
      : moment(currentMonth);

    const startOfMonth = monthMoment.clone().startOf('month');
    const endOfMonth = monthMoment.clone().endOf('month');
    const daysInMonth = monthMoment.daysInMonth();

    // Thứ của ngày đầu tháng (0: CN, 1: T2, ..., 6: T7) -> chuẩn ISO (0: T2, ..., 6: CN)
    let startDayOfWeek = startOfMonth.day() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Các ngày đệm đầu tháng
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = startOfMonth.clone().subtract(i + 1, 'days');
      const dayOfWeek = prevDate.day();
      days.push({
        dateStr: prevDate.format('YYYY-MM-DD'),
        dayNum: prevDate.date(),
        dayOfWeek,
        isCurrentMonth: false,
        isPrevMonth: true,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    // Các ngày trong tháng
    const todayStr = moment().format('YYYY-MM-DD');
    for (let i = 1; i <= daysInMonth; i++) {
      const thisDate = monthMoment.clone().date(i);
      const dateStr = thisDate.format('YYYY-MM-DD');
      const dayOfWeek = thisDate.day();
      days.push({
        dateStr,
        dayNum: i,
        dayOfWeek,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    // Các ngày đệm cuối tháng để đủ bội số 7
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextDate = endOfMonth.clone().add(i, 'days');
        const dayOfWeek = nextDate.day();
        days.push({
          dateStr: nextDate.format('YYYY-MM-DD'),
          dayNum: nextDate.date(),
          dayOfWeek,
          isCurrentMonth: false,
          isPrevMonth: false,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        });
      }
    }

    // Chia danh sách ngày thành từng tuần
    const chunked = [];
    for (let i = 0; i < days.length; i += 7) {
      chunked.push(days.slice(i, i + 7));
    }
    return chunked;
  }, [currentMonth, customWeeks]);

  return (
    <View
      style={styles.calendarContainer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header thứ (T2 -> CN) */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_NAMES.map((name, idx) => (
          <View key={idx} style={styles.weekdayCol}>
            <Text
              style={[
                styles.weekdayText,
                idx === 5 && styles.saturdayText,
                idx === 6 && styles.sundayText,
              ]}
            >
              {name}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid ngày theo từng hàng tuần */}
      <View style={styles.weeksContainer}>
        {weeks.map((week, wIdx) => (
          <View key={wIdx} style={styles.weekRow}>
            {week.map((dayItem, dIdx) => (
              <CalendarDayCell
                key={`${wIdx}-${dIdx}-${dayItem.dateStr}`}
                dayItem={dayItem}
                record={attendanceMap[dayItem.dateStr]}
                isSelected={selectedDate === dayItem.dateStr}
                onSelectDay={onSelectDay}
                onPressAdjacentMonth={handleAdjacentMonthPress}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Chú thích màu sắc (Legend) */}
      <AttendanceLegend />
    </View>
  );
};

const styles = ScaledSheet.create({
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20@ms',
    paddingHorizontal: '12@ms',
    paddingTop: '16@vs',
    paddingBottom: '14@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
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
  saturdayText: {
    color: '#D97706',
  },
  sundayText: {
    color: '#EF4444',
  },
  weeksContainer: {
    paddingVertical: '2@vs',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: '2.5@vs',
  },
  dayColWrapper: {
    flex: 1,
    paddingHorizontal: '1.5@ms',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInner: {
    width: '100%',
    height: '48@vs',
    borderRadius: '12@ms',
    paddingVertical: '4@vs',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  dayCellOutside: {
    opacity: 0.35,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  dayCellToday: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
  },
  dayCellSelected: {
    borderColor: '#1D4ED8',
    borderWidth: 2,
    backgroundColor: '#EEF2FF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  todayNumBadge: {
    width: '22@ms',
    height: '22@ms',
    borderRadius: '11@ms',
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayNumBadgeSelected: {
    backgroundColor: '#1D4ED8',
  },
  dayNumTextTodayBadge: {
    fontSize: '12@ms',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dayNumText: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: '18@ms',
  },
  dayNumTextSelected: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  dayNumTextOutside: {
    color: '#94A3B8',
  },
  statusDot: {
    width: '5@ms',
    height: '5@ms',
    borderRadius: '2.5@ms',
    marginTop: '3@vs',
  },
  todayDot: {
    backgroundColor: '#2563EB',
  },
  statusDotPlaceholder: {
    width: '5@ms',
    height: '5@ms',
    marginTop: '3@vs',
  },
});

export default React.memo(AttendanceCalendar);
