import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveSecureRefreshToken } from './secureStorageService';

/**
 * Lưu accessToken và refreshToken vào AsyncStorage (và đồng bộ Keychain nếu có refreshToken)
 * Hỗ trợ cả 2 cách gọi:
 * - saveTokens(accessToken, refreshToken)
 * - saveTokens({ accessToken, refreshToken })
 */
export const saveTokens = async (accessToken, refreshToken) => {
  try {
    let access = accessToken;
    let refresh = refreshToken;

    if (typeof accessToken === 'object' && accessToken !== null) {
      access = accessToken.accessToken;
      refresh = refreshToken || accessToken.refreshToken;
    }

    const promises = [];
    if (access != null && access !== '') {
      promises.push(AsyncStorage.setItem('accessToken', String(access)));
    }
    if (refresh != null && refresh !== '') {
      promises.push(AsyncStorage.setItem('refreshToken', String(refresh)));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    // Đồng bộ an toàn sang Keychain cho luồng đăng nhập sinh trắc học
    if (refresh != null && refresh !== '') {
      try {
        await saveSecureRefreshToken(String(refresh));
      } catch (keychainError) {
        // Keychain có thể không khả dụng trên môi trường giả lập hoặc chưa cấu hình
        console.log('Error saving refresh token to Keychain:', keychainError);
      }
    }
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
};

export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (error) {
    console.log('Error getting access token from storage:', error);
    return null;
  }
};

export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem('refreshToken');
  } catch (error) {
    console.log('Error getting refresh token from storage:', error);
    return null;
  }
};

export const getTokens = async () => {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem('accessToken'),
      AsyncStorage.getItem('refreshToken'),
    ]);
    return { accessToken: accessToken || null, refreshToken: refreshToken || null };
  } catch (error) {
    console.log('Error getting tokens from storage:', error);
    return { accessToken: null, refreshToken: null };
  }
};

// fcm token
export const saveFCMToken = async token => {
  try {
    if (token != null) {
      await AsyncStorage.setItem('fcmToken', String(token));
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
};

export const getFCMToken = async () => {
  try {
    return await AsyncStorage.getItem('fcmToken');
  } catch (error) {
    console.log('Error getting FCM Token from storage:', error);
    return null;
  }
};

export const removeTokens = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem('accessToken'),
      AsyncStorage.removeItem('refreshToken'),
    ]);
    try {
      await saveSecureRefreshToken(null);
    } catch (keychainError) {
      // Bỏ qua lỗi Keychain khi xóa
    }
    console.log('Tokens đã được xóa thành công khỏi AsyncStorage');
  } catch (error) {
    console.error('Error removing tokens:', error);
    throw error;
  }
};

export const removeFCMToken = async () => {
  try {
    await AsyncStorage.removeItem('fcmToken');
    console.log('FCM Token removed successfully');
  } catch (error) {
    console.error('Error removing FCM token:', error);
    throw error;
  }
};

// ─── Biometric Credentials ───────────────────────────────────────────────────
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';

export const saveBiometricCredentials = async (email, password) => {
  try {
    if (email && password) {
      await AsyncStorage.setItem(BIOMETRIC_EMAIL_KEY, email);
      await AsyncStorage.setItem(BIOMETRIC_PASSWORD_KEY, password);
    } else {
      await AsyncStorage.removeItem(BIOMETRIC_EMAIL_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_PASSWORD_KEY);
    }
  } catch (error) {
    console.error('Error saving biometric credentials:', error);
    throw error;
  }
};

export const getBiometricCredentials = async () => {
  try {
    const email = await AsyncStorage.getItem(BIOMETRIC_EMAIL_KEY);
    const password = await AsyncStorage.getItem(BIOMETRIC_PASSWORD_KEY);
    if (email && password) {
      return { email, password };
    }
    return null;
  } catch (error) {
    console.error('Error getting biometric credentials:', error);
    return null;
  }
};

// Re-export secure storage functions for convenience
export * from './secureStorageService';


