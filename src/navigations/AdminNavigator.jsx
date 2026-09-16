// navigations/AdminNavigator.jsx
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ── Admin Screens ──
import AdminDashboardScreen from '../screens/admin/dashboard/AdminDashboardScreen';
import AdminLeaveApprovalsScreen from '../screens/admin/leave/AdminLeaveApprovalsScreen';
import AdminOvertimeApprovalsScreen from '../screens/admin/overtime/AdminOvertimeApprovalsScreen';
import AdminSalaryScreen from '../screens/admin/salary/AdminSalaryScreen';
import AdminCreateAnnouncementScreen from '../screens/admin/announcement/AdminCreateAnnouncementScreen';
import AdminAnnouncementListScreen from '../screens/admin/announcement/AdminAnnouncementListScreen';
import AdminAnnouncementDetailScreen from '../screens/admin/announcement/AdminAnnouncementDetailScreen';
import AdminRegularizationApprovalsScreen from '../screens/admin/regularization/AdminRegularizationApprovalsScreen';
import AdminAttendanceQRScreen from '../screens/admin/attendance/AdminAttendanceQRScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_CONFIG = [
  {
    route: 'AdminDashboardTab',
    label: 'Tổng quan',
    icon: 'view-dashboard-outline',
    activeIcon: 'view-dashboard',
    component: AdminDashboardScreen,
  },
  {
    route: 'AdminLeaveTab',
    label: 'Duyệt phép',
    icon: 'beach',
    activeIcon: 'beach',
    component: AdminLeaveApprovalsScreen,
  },
  {
    route: 'AdminOTTab',
    label: 'Duyệt OT',
    icon: 'clock-time-eight-outline',
    activeIcon: 'clock-time-eight',
    component: AdminOvertimeApprovalsScreen,
  },
  {
    route: 'AdminSalaryTab',
    label: 'Bảng lương',
    icon: 'cash-multiple',
    activeIcon: 'cash-multiple',
    component: AdminSalaryScreen,
  },
];

const CustomAdminTabBar = ({ state, navigation }) => {
  const currentRoute = state.routes[state.index];
  const currentRouteName = currentRoute?.name;

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {TAB_CONFIG.map((tab) => {
          const isFocused = currentRouteName === tab.route;
          const iconName = isFocused ? tab.activeIcon : tab.icon;
          const color = isFocused ? '#2563EB' : '#64748B';

          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.route)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={iconName} size={22} color={color} />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const renderAdminTabBar = (props) => <CustomAdminTabBar {...props} />;

const AdminMainTabs = memo(() => (
  <Tab.Navigator
    tabBar={renderAdminTabBar}
    screenOptions={{ headerShown: false, tabBarShowLabel: false }}
  >
    {TAB_CONFIG.map((item) => (
      <Tab.Screen
        key={item.route}
        name={item.route}
        component={item.component}
        options={{ title: item.label }}
      />
    ))}
  </Tab.Navigator>
));

const AdminNavigator = memo(() => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMainTabs" component={AdminMainTabs} />
      <Stack.Screen name="LeaveApprovals" component={AdminLeaveApprovalsScreen} />
      <Stack.Screen name="OTApprovals" component={AdminOvertimeApprovalsScreen} />
      <Stack.Screen name="SalaryAdmin" component={AdminSalaryScreen} />
      <Stack.Screen name="RegularizationApprovals" component={AdminRegularizationApprovalsScreen} />
      <Stack.Screen name="AttendanceQR" component={AdminAttendanceQRScreen} />
      <Stack.Screen name="CreateAnnouncement" component={AdminCreateAnnouncementScreen} />
      <Stack.Screen name="Announcement" component={AdminAnnouncementListScreen} />
      <Stack.Screen name="AnnouncementList" component={AdminAnnouncementListScreen} />
      <Stack.Screen name="AdminAnnouncementList" component={AdminAnnouncementListScreen} />
      <Stack.Screen name="AnnouncementDetail" component={AdminAnnouncementDetailScreen} />
    </Stack.Navigator>
  );
});

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 20,
    left: 16,
    right: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});

export default AdminNavigator;