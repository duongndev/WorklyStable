/**
 * Navigation helper utilities để tránh lặp code navigation logic
 * @file navigationHelpers.js
 * @description Các hàm helper để navigation dựa trên role và params
 */

/**
 * Navigate dựa trên user role
 * @param {Object} navigation - Navigation object từ useNavigation
 * @param {string} userRole - Role của user ('admin' hoặc 'employee')
 * @param {Function} onUnknownRole - Callback khi role không xác định (optional)
 */
export const navigateBasedOnRole = (navigation, userRole, onUnknownRole) => {
  switch (userRole) {
    case 'admin':
      navigation.replace('Admin');
      break;
    case 'employee':
      navigation.replace('Employee');
      break;
    default:
      console.warn('Unknown user role:', userRole);
      if (onUnknownRole) {
        onUnknownRole(userRole);
      } else {
        navigation.replace('Auth');
      }
      break;
  }
};

/**
 * Navigate đến detail screen với params
 */
export const navigateToDetail = (
  navigation,
  screenName,
  params,
  paramKey = 'item',
) => {
  navigation.navigate(screenName, { [paramKey]: params });
};

/**
 * Navigate đến leave request detail
 */
export const navigateToLeaveDetail = (
  navigation,
  leaveRequest,
) => {
  navigation.navigate('LeaveDetail', { leave: leaveRequest, id: leaveRequest._id });
};

/**
 * Navigate đến overtime request detail
 */
export const navigateToOvertimeDetail = (
  navigation,
  overtimeRequest,
) => {
  navigation.navigate('OvertimeDetail', { overtime: overtimeRequest, id: overtimeRequest._id });
};

/**
 * Navigate với replace (thay thế stack hiện tại)
 */
export const navigateReplace = (navigation, screenName, params = {}) => {
  navigation.replace(screenName, params);
};

/**
 * Navigate back với optional fallback
 */
export const navigateBack = (navigation, fallbackScreen = null) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else if (fallbackScreen) {
    navigation.navigate(fallbackScreen);
  }
};

/**
 * Reset navigation stack và navigate đến screen mới
 */
export const resetAndNavigate = (navigation, screenName, params = {}) => {
  navigation.reset({
    index: 0,
    routes: [{ name: screenName, params }],
  });
};

/**
 * Navigate đến screen với animation options
 */
export const navigateWithOptions = (
  navigation,
  screenName,
  params = {},
  options = {},
) => {
  navigation.navigate(screenName, params, options);
};

/**
 * Common navigation patterns cho các feature screens
 */
export const FeatureNavigation = {
  // Employee features
  toAttendance: (navigation) => navigation.navigate('Attendance'),
  toLeaveRequest: (navigation) => navigation.navigate('LeaveRequest'),
  toLeaveCreate: (navigation) => navigation.navigate('LeaveCreate'),
  toOvertime: (navigation) => navigation.navigate('Overtime'),
  toOvertimeCreate: (navigation) => navigation.navigate('OTCreate'),
  toSalary: (navigation) => navigation.navigate('Salary'),
  toProfile: (navigation) => navigation.navigate('Profile'),
  toNotifications: (navigation) => navigation.navigate('Notification'),

  // Auth flows
  toLogin: (navigation) => navigateReplace(navigation, 'Login'),
  toEmployee: (navigation) => navigateReplace(navigation, 'Employee'),
  toAdmin: (navigation) => navigateReplace(navigation, 'Admin'),
};

/**
 * Utility để tạo navigation handler functions
 */
export const createNavigationHandlers = (navigation) => {
  return {
    navigateBasedOnRole: (userRole, onUnknownRole) =>
      navigateBasedOnRole(navigation, userRole, onUnknownRole),

    navigateToDetail: (screenName, params, paramKey) =>
      navigateToDetail(navigation, screenName, params, paramKey),

    navigateToLeaveDetail: (leaveRequest) =>
      navigateToLeaveDetail(navigation, leaveRequest),

    navigateToOvertimeDetail: (overtimeRequest) =>
      navigateToOvertimeDetail(navigation, overtimeRequest),

    navigateReplace: (screenName, params) =>
      navigateReplace(navigation, screenName, params),

    navigateBack: (fallbackScreen) => navigateBack(navigation, fallbackScreen),

    resetAndNavigate: (screenName, params) =>
      resetAndNavigate(navigation, screenName, params),

    // Feature shortcuts
    features: {
      toAttendance: () => FeatureNavigation.toAttendance(navigation),
      toLeaveRequest: () => FeatureNavigation.toLeaveRequest(navigation),
      toLeaveCreate: () => FeatureNavigation.toLeaveCreate(navigation),
      toOvertime: () => FeatureNavigation.toOvertime(navigation),
      toOvertimeCreate: () => FeatureNavigation.toOvertimeCreate(navigation),
      toSalary: () => FeatureNavigation.toSalary(navigation),
      toProfile: () => FeatureNavigation.toProfile(navigation),
      toNotifications: () => FeatureNavigation.toNotifications(navigation),
      toLogin: () => FeatureNavigation.toLogin(navigation),
    },
  };
};

export default {
  navigateBasedOnRole,
  navigateToDetail,
  navigateToLeaveDetail,
  navigateToOvertimeDetail,
  navigateReplace,
  navigateBack,
  resetAndNavigate,
  navigateWithOptions,
  FeatureNavigation,
  createNavigationHandlers,
};
