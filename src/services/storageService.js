import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveTokens = async (accessToken, refreshToken) => {
  try {
    console.log('saveTokens invoked with:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
    if (accessToken != null) {
      await AsyncStorage.setItem('accessToken', String(accessToken));
    } else {
      console.log('saveTokens: accessToken is null or undefined');
    }
    
    if (refreshToken != null) {
      await AsyncStorage.setItem('refreshToken', String(refreshToken));
      console.log('saveTokens: refreshToken saved');
    } else {
      console.log('saveTokens: refreshToken is null or undefined');
    }
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
}


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
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('fcmToken');
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


