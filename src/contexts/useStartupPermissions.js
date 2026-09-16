import { useEffect, useState } from 'react';
import {
  checkLocationPermission,
  checkNotificationPermission,
  requestNotificationPermission,
} from '../services/permissionService';

/**
 * Hook khởi tạo các quyền hệ thống cơ bản một cách mượt mà khi mở ứng dụng.
 * - Thông báo: Yêu cầu cấp quyền thông báo đẩy tự động.
 * - Vị trí: Kiểm tra trạng thái mà không bật popup chặn màn hình của người dùng.
 */
const useStartupPermissions = () => {
  const [permissionsState, setPermissionsState] = useState({
    locationGranted: false,
    notificationGranted: false,
  });

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const [hasLoc, hasNoti] = await Promise.all([
          checkLocationPermission(),
          checkNotificationPermission(),
        ]);

        if (!hasNoti) {
          // Xin quyền thông báo âm thầm trên Android 13+
          await requestNotificationPermission();
        }

        if (isMounted) {
          setPermissionsState({
            locationGranted: Boolean(hasLoc),
            notificationGranted: true,
          });
        }
      } catch (err) {
        console.warn('Startup permission notice:', err);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  return permissionsState;
};

export default useStartupPermissions;
