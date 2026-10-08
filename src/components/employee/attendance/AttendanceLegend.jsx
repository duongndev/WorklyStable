// src/components/employee/attendance/AttendanceLegend.jsx
import React from 'react';
import { View, Text } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { STATUS_CONFIG } from './attendanceConstants';

const DEFAULT_LEGEND_KEYS = [
  'present',
  'late',
  'on_leave',
  'absent',
];

const AttendanceLegend = ({ keys = DEFAULT_LEGEND_KEYS }) => {
  return (
    <View style={styles.legendContainer}>
      <View style={styles.legendGrid}>
        {keys.map((key) => {
          const config = STATUS_CONFIG[key];
          if (!config) return null;

          return (
            <View key={key} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: config.color },
                ]}
              />
              <Text style={styles.legendText}>{config.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  legendContainer: {
    paddingTop: '12@vs',
    marginTop: '10@vs',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: '8@ms',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '6@ms',
    paddingVertical: '2@vs',
  },
  legendDot: {
    width: '7@ms',
    height: '7@ms',
    borderRadius: '3.5@ms',
    marginRight: '5@ms',
  },
  legendText: {
    fontSize: '11@ms',
    fontWeight: '600',
    color: '#475569',
  },
});

export default React.memo(AttendanceLegend);
