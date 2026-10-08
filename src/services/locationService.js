// src/services/locationService.js
import Geolocation from 'react-native-geolocation-service';
import { checkLocationPermission, requestLocationPermission } from './permissionService';

let cachedLocationName = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 30 * 1000; // 30 giây cache

/**
 * Chuyển đổi toạ độ (latitude, longitude) sang tên địa điểm thực tế
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>}
 */
export const reverseGeocode = async (latitude, longitude) => {
  if (!latitude || !longitude) return null;

  // 1. Sử dụng Photon Komoot (OpenStreetMap data) - Siêu nhanh, tiếng Việt chính xác, không chặn IP
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const feature = data.features?.[0];
      const props = feature?.properties;

      if (props) {
        const street = props.street || '';
        const district = props.district || props.locality || '';
        let city = props.city || props.state || '';
        city = city.replace(/^Thành phố\s+/i, '').replace(/^Tỉnh\s+/i, '');

        if (street && district) {
          return `${street}, ${district}`;
        }
        if (district && city) {
          return `${district}, ${city}`;
        }
        if (props.name && city && props.name.length <= 25) {
          return `${props.name}, ${city}`;
        }
        if (district) return district;
        if (city) return city;
        if (props.name) return props.name;
      }
    }
  } catch (err) {
    // Thử fallback kế tiếp
  }

  // 2. Fallback qua OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'WorklyApp/1.0',
          'Accept-Language': 'vi',
        },
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const road = addr.road || addr.street || '';
      const district = addr.city_district || addr.district || addr.suburb || addr.quarter || '';
      let city = addr.city || addr.state || '';
      city = city.replace(/^Thành phố\s+/i, '').replace(/^Tỉnh\s+/i, '');

      if (road && district) {
        return `${road}, ${district}`;
      }
      if (district && city) {
        return `${district}, ${city}`;
      }
      if (district) return district;
      if (city) return city;
    }
  } catch (err) {
    // Bỏ qua lỗi fallback
  }

  // 3. Fallback cuối cùng nếu không có mạng: Hiển thị toạ độ thực tế của thiết bị
  return `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
};

/**
 * Lấy toạ độ GPS trực tiếp từ cảm biến thiết bị và dịch sang tên vị trí
 * @param {boolean} forceRefresh - Bỏ qua cache nếu cần
 * @returns {Promise<string>}
 */
export const getCurrentLocationName = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedLocationName && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedLocationName;
  }

  let hasPermission = await checkLocationPermission();
  if (!hasPermission) {
    hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }
  }

  return new Promise((resolve) => {
    // 1. Thử lấy vị trí GPS vệ tinh chính xác cao
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const name = await reverseGeocode(latitude, longitude);
        if (name) {
          cachedLocationName = name;
          lastFetchTime = Date.now();
          resolve(name);
        } else {
          resolve(`${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
        }
      },
      () => {
        // 2. Thử lấy vị trí qua mạng / Wi-Fi (phù hợp trong nhà hoặc tín hiệu yếu)
        Geolocation.getCurrentPosition(
          async (posFallback) => {
            const { latitude, longitude } = posFallback.coords;
            const name = await reverseGeocode(latitude, longitude);
            if (name) {
              cachedLocationName = name;
              lastFetchTime = Date.now();
              resolve(name);
            } else {
              resolve(`${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
            }
          },
          (finalErr) => {
            console.warn('Không thể lấy vị trí từ thiết bị:', finalErr);
            resolve(cachedLocationName || null);
          },
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000,
            forceRequestLocation: true,
            showLocationDialog: true,
          },
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 15000,
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    );
  });
};

/**
 * Tự động theo dõi thay đổi vị trí thiết bị theo thời gian thực (Live GPS Tracking)
 * @param {Function} onLocationChange - Callback nhận (locationName, coords) khi vị trí thay đổi
 * @param {Function} onError - Callback khi lỗi
 * @returns {Function} Hàm huỷ theo dõi (unsubscribe)
 */
export const watchDeviceLocation = (onLocationChange, onError) => {
  let lastLat = null;
  let lastLng = null;

  const handleCoords = async (coords) => {
    const { latitude, longitude } = coords;

    // Ngăn chặn geocode trùng lặp nếu vị trí chỉ xê dịch < 20 mét (~0.0002 độ)
    if (
      lastLat !== null &&
      lastLng !== null &&
      Math.abs(latitude - lastLat) < 0.0002 &&
      Math.abs(longitude - lastLng) < 0.0002
    ) {
      return;
    }

    lastLat = latitude;
    lastLng = longitude;

    const name = await reverseGeocode(latitude, longitude);
    if (name) {
      cachedLocationName = name;
      lastFetchTime = Date.now();
      onLocationChange(name, coords);
    } else {
      onLocationChange(`${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`, coords);
    }
  };

  // 1. Lấy vị trí ban đầu ngay lập tức
  Geolocation.getCurrentPosition(
    (pos) => handleCoords(pos.coords),
    () => {
      Geolocation.getCurrentPosition(
        (fallbackPos) => handleCoords(fallbackPos.coords),
        (finalErr) => {
          if (onError) onError(finalErr);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 },
      );
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
  );

  // 2. Lắng nghe thay đổi vị trí khi thiết bị di chuyển
  const watchId = Geolocation.watchPosition(
    (pos) => handleCoords(pos.coords),
    (err) => {
      if (onError) onError(err);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 15, // Cập nhật tự động khi di chuyển từ 15 mét trở lên
      interval: 10000,
      fastestInterval: 5000,
      showsBackgroundLocationIndicator: false,
    },
  );

  return () => {
    Geolocation.clearWatch(watchId);
  };
};
