import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ScaledSheet } from 'react-native-size-matters';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { store } from './src/redux/store';
import AppNavigator from './src/navigations/AppNavigator';
import { getApp } from '@react-native-firebase/app';
import messaging, {
  getMessaging,
  getToken,
  requestPermission,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus,
  onTokenRefresh,
  setAPNSToken,
  deleteToken,
} from '@react-native-firebase/messaging';
import {
  Toast,
  AlertNotificationRoot,
  ALERT_TYPE,
  Dialog,
} from 'react-native-alert-notification';
import { navigate } from './src/navigations/NavigationService';
import useStartupPermissions from './src/contexts/useStartupPermissions';
import { saveFCMToken } from './src/services/storageService';
import { setStore } from './src/api/axiosConfig';
import { updateFCMTokenApi } from './src/api/authAPI';

// Gán store cho axios interceptor (dùng để đọc token từ Redux)
setStore(store);


const App = () => {
  const messagingInstance = useMemo(() => getMessaging(getApp()), []);
  const fcmTokenRequested = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const updateFCMTokenOnServer = useCallback(async token => {
    try {
      console.log('FCM Token to send to server:', token);
      await updateFCMTokenApi(token);
      console.log('FCM Token đã cập nhật lên server thành công.');
    } catch (error) {
      // Có thể xảy ra khi chưa đăng nhập (chưa có access token)
      // Sẽ được retry sau khi đăng nhập qua LoginScreen
      console.log('Error updating FCM token on server (có thể chưa đăng nhập):', error.message);
    }
  }, []);

  const getFCMToken = useCallback(async () => {
    // Tránh gọi trùng lặp
    if (fcmTokenRequested.current) return;
    fcmTokenRequested.current = true;

    try {
      // Ghi chú: Firebase Cloud Messaging KHÔNG hỗ trợ chính thức trên iOS Simulator.
      // Việc gọi getToken() liên tục có thể gây ra lỗi TOO_MANY_REGISTRATIONS do cơ chế chống spam.

      const fcmToken = await getToken(messagingInstance);
      if (fcmToken) {
        console.log('Lưu FCM token: ', fcmToken);
        await saveFCMToken(fcmToken);
        await updateFCMTokenOnServer(fcmToken);
      } else {
        console.log('FCM Token not available');
      }
    } catch (error) {
      // iOS: Simulator không hỗ trợ push notifications
      // hoặc APNS token chưa sẵn sàng - sẽ retry qua onTokenRefresh
      if (Platform.OS === 'ios') {
        console.log('Lưu ý: Push Notification không được hỗ trợ trên iOS Simulator.');
        console.log('Chi tiết lỗi:', error.message);
        
        // Cấp phát một mock token để không chặn các luồng API cần FCM Token
        if (__DEV__) {
          const mockToken = 'mock-token-ios-simulator';
          console.log('Sử dụng Mock FCM Token:', mockToken);
          await saveFCMToken(mockToken);
          await updateFCMTokenOnServer(mockToken);
        }
        fcmTokenRequested.current = false; 
      } else {
        console.log('Error getting FCM Token: ', error.message);
      }
    }
  }, [messagingInstance, updateFCMTokenOnServer]);

  const requestUserPermission = useCallback(async () => {
    try {
      const authStatus = await requestPermission(messagingInstance);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        getFCMToken();
      }
    } catch (error) {
      console.log('Error requesting permission:', error);
    }
  }, [getFCMToken, messagingInstance]);

  useEffect(() => {
    // Chỉ setup FCM một lần khi app khởi động
    requestUserPermission();

    // Listen for token refresh (quan trọng cho iOS)
    const unsubscribeTokenRefresh = onTokenRefresh(messagingInstance, async (newToken) => {
      console.log('FCM Token refreshed:', newToken);
      if (isMounted.current && newToken) {
        await saveFCMToken(newToken);
        await updateFCMTokenOnServer(newToken);
      }
    });

    // ── Helper: parse FCM data và điều hướng đúng màn hình ──
    const navigateFromRemoteMessage = (remoteMessage) => {
      if (!remoteMessage) return;
      const data = remoteMessage.data || {};
      const type = String(data.type || '').toLowerCase();

      // 1. Thông báo liên quan bảng tin (comment / reply / like / new announcement)
      if (data.announcementId) {
        navigate('AnnouncementDetail', { id: data.announcementId });
        return;
      }
      // 2. Nghỉ phép
      if (type.includes('leave')) {
        const id = data.leaveId || data.referenceId || data.id;
        if (id) {
          navigate('LeaveDetail', { id });
        } else {
          navigate('Leave');
        }
        return;
      }
      // 3. Tăng ca
      if (type.includes('overtime') || type.includes('ot')) {
        const id = data.overtimeId || data.referenceId || data.id;
        if (id) {
          navigate('OvertimeDetail', { id });
        } else {
          navigate('Overtime');
        }
        return;
      }
      // 4. Chấm công / Bù công
      if (type.includes('attendance') || type.includes('regularization')) {
        navigate('Attendance');
        return;
      }
      // 5. Bảng lương
      if (type.includes('payslip') || type.includes('salary')) {
        navigate('Salary');
        return;
      }
      // Mặc định: vào màn hình danh sách thông báo
      navigate('Notification');
    };

    // ── Foreground: hiện Toast, bấm vào thì mở đúng màn hình ──
    const unsubscribe = onMessage(messagingInstance, async remoteMessage => {
      if (!isMounted.current) return;
      Toast.show({
        type: ALERT_TYPE.INFO,
        title: remoteMessage.notification?.title || 'Thông báo mới',
        textBody: remoteMessage.notification?.body || '',
        onPress: () => {
          Toast.hide();
          navigateFromRemoteMessage(remoteMessage);
        },
      });
    });

    // ── Background: người dùng bấm vào thông báo khi app đang chạy nền ──
    onNotificationOpenedApp(messagingInstance, remoteMessage => {
      console.log('Notification opened from background:', remoteMessage.data);
      navigateFromRemoteMessage(remoteMessage);
    });

    // ── Killed state: mở app từ thông báo khi app đã bị tắt hoàn toàn ──
    getInitialNotification(messagingInstance).then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from quit state via notification:', remoteMessage.data);
        // Delay nhừ để navigator sẵn sàng
        setTimeout(() => navigateFromRemoteMessage(remoteMessage), 500);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeTokenRefresh();
    };
  }, [messagingInstance, requestUserPermission, updateFCMTokenOnServer]);

  // Request location + notification permissions at startup
  useStartupPermissions();

  return (
    <AlertNotificationRoot>
      <ThemeProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <AppNavigator />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ThemeProvider>
    </AlertNotificationRoot>
  );
};

export default App;

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
});
