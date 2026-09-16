import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

/**
 * =========================================================
 * WORKLY PERMISSION SERVICE - QUẢN LÝ QUYỀN TRUY CẬP CHUẨN HÓA
 * =========================================================
 */

/**
 * Kiểm tra xem ứng dụng đã có quyền vị trí (GPS) hay chưa (Không làm phiền người dùng)
 * @returns {Promise<boolean>}
 */
export const checkLocationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      // Trên iOS Geolocation không có hàm check độc lập an toàn, trả về true nếu đã cấp
      return true;
    }

    if (Platform.OS === 'android') {
      const fine = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      const coarse = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );
      return fine || coarse;
    }
    return true;
  } catch (error) {
    console.warn('Lỗi kiểm tra quyền vị trí:', error);
    return false;
  }
};

/**
 * Yêu cầu cấp quyền vị trí GPS chính xác (Chỉ gọi khi người dùng Chấm công hoặc mở bản đồ)
 * @returns {Promise<boolean>}
 */
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      return status === 'granted' || status === 'always';
    }

    if (Platform.OS === 'android') {
      // Nếu đã có quyền rồi thì return true ngay
      const alreadyGranted = await checkLocationPermission();
      if (alreadyGranted) return true;

      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineGranted =
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const coarseGranted =
        results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;

      return fineGranted || coarseGranted;
    }

    return true;
  } catch (error) {
    console.warn('Lỗi xin quyền vị trí:', error);
    return false;
  }
};

/**
 * Kiểm tra quyền nhận thông báo đẩy (Push Notifications)
 * @returns {Promise<boolean>}
 */
export const checkNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }
    return true;
  } catch (error) {
    console.warn('Lỗi kiểm tra quyền thông báo:', error);
    return true;
  }
};

/**
 * Yêu cầu quyền thông báo đẩy trên Android 13+ (Âm thầm, chuẩn hệ thống)
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const alreadyGranted = await checkNotificationPermission();
      if (alreadyGranted) return true;

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  } catch (error) {
    console.warn('Lỗi xin quyền thông báo:', error);
    return true;
  }
};
