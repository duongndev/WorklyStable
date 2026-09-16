// navigation/EmployeeNavigator.js
import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../assets/styles/color';

// ── Import các màn hình chính ──
import HomeScreen from '../screens/employee/home/HomeScreen';
// leave
import LeaveListScreen from '../screens/employee/leave/LeaveRequestScreen';
import LeaveCreateScreen from '../screens/employee/leave/LeaveCreateScreen';
import LeaveDetailScreen from '../screens/employee/leave/LeaveDetailScreen';

// overtime
import OTListScreen from '../screens/employee/overtime/OvertimeScreen';
import OTCreateScreen from '../screens/employee/overtime/OvertimeCreateScreen';
import OTDetailScreen from '../screens/employee/overtime/OvertimeDetailScreen';

// profile
import ProfileScreen from '../screens/employee/profile/ProfileScreen';
import EditProfileScreen from '../screens/employee/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/employee/profile/ChangePasswordScreen';
import BiometricSetupScreen from '../screens/employee/profile/BiometricSetupScreen';


// attendance
import AttendanceScreen from '../screens/employee/attendance/AttendanceScreen';
import AttendanceSheet from '../components/employee/attendance/AttendanceSheet';

// notification
import NotificationScreen from '../screens/employee/notification/NotificationScreen';

// salary
import SalaryScreen from '../screens/employee/salary/SalaryScreen';
import SalaryDetailScreen from '../screens/employee/salary/SalaryDetailScreen';

// announcement (bảng tin doanh nghiệp)
import AnnouncementListScreen from '../screens/employee/announcement/AnnouncementListScreen';
import AnnouncementDetailScreen from '../screens/employee/announcement/AnnouncementDetailScreen';

// ── Attendance Context ──
import { AttendanceProvider, useAttendance } from '../contexts/AttendanceContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Cấu hình các tab ──
const TAB_CONFIG = [
  {
    route: 'HomeTab',
    label: 'Trang chủ',
    activeIcon: 'home',
    inActiveIcon: 'home-outline',
    component: HomeScreen,
  },
  {
    route: 'LeaveTab',
    label: 'Đơn nghỉ',
    activeIcon: 'beach',
    inActiveIcon: 'beach',
    component: LeaveListScreen,
  },
  {
    route: 'OTTab',
    label: 'Làm thêm',
    activeIcon: 'clock-time-eight',
    inActiveIcon: 'clock-time-eight-outline',
    component: OTListScreen,
  },
  {
    route: 'ProfileTab',
    label: 'Cá nhân',
    activeIcon: 'account',
    inActiveIcon: 'account-outline',
    component: ProfileScreen,
  },
];

// ── Custom Tab Bar ──
const CustomTabBar = ({ state, navigation }) => {
  const currentRoute = state.routes[state.index];
  const routeState = currentRoute?.state;
  const isChildScreen = routeState && routeState.index > 0;
  const currentRouteName = currentRoute?.name;
  const { checkedIn, handleCheckIn, handleCheckOut } = useAttendance();

  if (isChildScreen) return null;

  const onTabPress = (routeName) => {
    if (currentRouteName !== routeName) {
      navigation.navigate(routeName);
    }
  };

  const leftTabs = TAB_CONFIG.slice(0, 2);
  const rightTabs = TAB_CONFIG.slice(2);

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {leftTabs.map((tab) => {
          const isFocused = currentRouteName === tab.route;
          const iconName = isFocused ? tab.activeIcon : tab.inActiveIcon;
          const color = isFocused ? COLORS.BRAND_COLOR : COLORS.TEXT_SECONDARY;
          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={iconName} size={24} color={color} />
              <Text
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Nút chấm công nổi */}
        <TouchableOpacity
          style={styles.attendanceButton}
          onPress={() => checkedIn ? handleCheckOut() : handleCheckIn()}
          activeOpacity={0.8}
        >
          <View style={styles.attendanceButtonInner}>
            <MaterialCommunityIcons name="fingerprint" size={32} color="#FFF" />
          </View>
        </TouchableOpacity>

        {rightTabs.map((tab) => {
          const isFocused = currentRouteName === tab.route;
          const iconName = isFocused ? tab.activeIcon : tab.inActiveIcon;
          const color = isFocused ? COLORS.BRAND_COLOR : COLORS.TEXT_SECONDARY;
          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={iconName} size={24} color={color} />
              <Text
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ── BottomTabNavigator ──
const MainTabsNavigator = memo(() => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
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
  );
});

// ── Wrapper để AttendanceSheet có thể dùng context ──
const AttendanceSheetWrapper = memo(() => {
  const { showSheet, sheetType, closeSheet, handleCheckIn, handleCheckOut } = useAttendance();

  return (
    <AttendanceSheet
      visible={showSheet}
      type={sheetType}
      onClose={closeSheet}
      onSuccess={(data) => (sheetType === 'checkin' ? handleCheckIn(data) : handleCheckOut(data))}
      onError={(msg) => Alert.alert('Lỗi', msg)}
    />
  );
});

// ── EmployeeNavigator (root stack) ──
const EmployeeNavigator = memo(() => {
  return (
    <AttendanceProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />

        {/* Leave Routes & Aliases */}
        <Stack.Screen name="LeaveList" component={LeaveListScreen} />
        <Stack.Screen name="LeaveRequest" component={LeaveListScreen} />
        <Stack.Screen name="LeaveCreate" component={LeaveCreateScreen} />
        <Stack.Screen name="LeaveDetail" component={LeaveDetailScreen} />

        {/* Overtime Routes & Aliases */}
        <Stack.Screen name="OTList" component={OTListScreen} />
        <Stack.Screen name="Overtime" component={OTListScreen} />
        <Stack.Screen name="OTCreate" component={OTCreateScreen} />
        <Stack.Screen name="OvertimeCreate" component={OTCreateScreen} />
        <Stack.Screen name="OTDetail" component={OTDetailScreen} />
        <Stack.Screen name="OvertimeDetail" component={OTDetailScreen} />

        {/* Notification Routes & Aliases */}
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />

        {/* Announcement (Bảng tin) Routes */}
        <Stack.Screen name="Announcement" component={AnnouncementListScreen} />
        <Stack.Screen name="Announcements" component={AnnouncementListScreen} />
        <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />

        {/* Salary Routes */}
        <Stack.Screen name="Salary" component={SalaryScreen} />
        <Stack.Screen name="SalaryDetail" component={SalaryDetailScreen} />

        {/* Profile Routes */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
      </Stack.Navigator>

      {/* Chỉ 1 AttendanceSheet duy nhất cho toàn bộ Employee flow */}
      <AttendanceSheetWrapper />
    </AttendanceProvider>
  );
});

export default EmployeeNavigator;

// ── Styles ──
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 30,
    left: 20,
    right: 20,
    marginHorizontal: 10,
    borderRadius: 24,
    backgroundColor: COLORS.BG_CARD,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.BRAND_COLOR,
    fontWeight: '700',
  },
  attendanceButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.BRAND_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BRAND_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
