import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

const PRIORITY_CONFIG = {
  high: { color: '#DC2626', bg: '#FEE2E2', label: 'Cao' },
  medium: { color: '#D97706', bg: '#FEF3C7', label: 'TB' },
  low: { color: '#16A34A', bg: '#DCFCE7', label: 'Thấp' },
};

const TaskItem = ({ task, isLast, onToggle }) => {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  return (
    <TouchableOpacity
      style={[styles.taskRow, isLast && styles.taskRowLast]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={styles.checkboxTouch}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={task.done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
          size={22}
          color={task.done ? '#16A34A' : '#94A3B8'}
        />
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <View style={styles.taskTopRow}>
          <Text
            style={[styles.taskLabel, task.done && styles.taskLabelDone]}
            numberOfLines={1}
          >
            {task.label}
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
            <Text style={[styles.priorityText, { color: priority.color }]}>
              {priority.label}
            </Text>
          </View>
        </View>

        <View style={styles.taskBottomRow}>
          <MaterialCommunityIcons name="clock-outline" size={13} color="#64748B" />
          <Text style={styles.taskTime}>{task.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = ScaledSheet.create({
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  taskRowLast: {
    borderBottomWidth: 0,
    paddingBottom: '2@vs',
  },
  checkboxTouch: {
    marginRight: '10@ms',
    padding: '2@ms',
  },
  taskContent: {
    flex: 1,
  },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4@vs',
  },
  taskLabel: {
    fontSize: '13@ms',
    color: '#0F172A',
    fontWeight: '600',
    flex: 1,
    marginRight: '8@ms',
  },
  taskLabelDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  priorityBadge: {
    borderRadius: '6@ms',
    paddingVertical: '2@vs',
    paddingHorizontal: '8@ms',
  },
  priorityText: {
    fontSize: '10@ms',
    fontWeight: '700',
  },
  taskBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    fontSize: '11@ms',
    color: '#64748B',
    marginLeft: '4@ms',
    fontWeight: '500',
  },
});

export default TaskItem;