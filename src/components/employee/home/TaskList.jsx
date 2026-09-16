import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import TaskItem from './TaskItem';

const TASKS = [
  { id: 1, label: 'Họp giao ban đầu ngày', time: '08:30', priority: 'high', done: true },
  { id: 2, label: 'Kiểm tra & đối soát ca làm', time: '11:00', priority: 'medium', done: false },
  { id: 3, label: 'Báo cáo tiến độ công việc', time: '16:30', priority: 'low', done: false },
];

const TaskList = () => {
  const [tasks, setTasks] = useState(TASKS);

  const toggle = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );

  const doneCount = tasks.filter((t) => t.done).length;
  const percent = Math.round((doneCount / tasks.length) * 100);

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskProgressHeader}>
        <Text style={styles.taskProgressText}>
          {doneCount}/{tasks.length} nhiệm vụ hoàn tất
        </Text>
        <View style={styles.percentBadge}>
          <Text style={styles.percentText}>{percent}%</Text>
        </View>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${percent}%` },
          ]}
        />
      </View>

      <View style={styles.taskList}>
        {tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            isLast={index === tasks.length - 1}
            onToggle={() => toggle(task.id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20@ms',
    padding: '16@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: '10@vs',
  },
  taskProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  taskProgressText: {
    fontSize: '12@ms',
    color: '#64748B',
    fontWeight: '600',
  },
  percentBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: '8@ms',
    paddingVertical: '2@vs',
    borderRadius: '8@ms',
  },
  percentText: {
    fontSize: '12@ms',
    color: '#2563EB',
    fontWeight: '800',
  },
  progressBarBg: {
    height: '6@vs',
    backgroundColor: '#F1F5F9',
    borderRadius: '3@ms',
    marginBottom: '14@vs',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '6@vs',
    backgroundColor: '#2563EB',
    borderRadius: '3@ms',
  },
  taskList: {},
});

export default TaskList;