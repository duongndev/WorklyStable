import * as Keychain from 'react-native-keychain';

const BIOMETRIC_SERVICE = 'workly_biometric_credentials';
const REFRESH_TOKEN_SERVICE = 'workly_refresh_token';

export const saveSecureBiometricCredentials = async (email, password) => {
  try {
    if (email && password) {
      const credentials = JSON.stringify({ email, password });
      await Keychain.setGenericPassword(email, credentials, {
        service: BIOMETRIC_SERVICE,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
      });
    } else {
      await Keychain.resetGenericPassword({ service: BIOMETRIC_SERVICE });
    }
  } catch (error) {
    console.error('Error saving secure biometric credentials:', error);
    throw error;
  }
};

export const getSecureBiometricCredentials = async () => {
  try {
    const result = await Keychain.getGenericPassword({
      service: BIOMETRIC_SERVICE,
      authenticationPrompt: {
        title: 'Xác thực sinh trắc học',
        subtitle: 'Đăng nhập Workly',
        description: 'Xác thực để truy cập tài khoản',
        cancel: 'Hủy',
      },
    });

    if (result && result.password) {
      const credentials = JSON.parse(result.password);
      return credentials;
    }
    return null;
  } catch (error) {
    console.error('Error getting secure biometric credentials:', error);
    return null;
  }
};

export const hasSecureBiometricCredentials = async () => {
  try {
    const result = await Keychain.getGenericPassword({ service: BIOMETRIC_SERVICE });
    return !!result;
  } catch (error) {
    return false;
  }
};

export const saveSecureRefreshToken = async (refreshToken) => {
  try {
    if (refreshToken) {
      await Keychain.setGenericPassword('refreshToken', refreshToken, {
        service: REFRESH_TOKEN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE });
    }
  } catch (error) {
    console.error('Error saving secure refresh token:', error);
    throw error;
  }
};

export const getSecureRefreshToken = async () => {
  try {
    const result = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_SERVICE });
    if (result) {
      return result.password;
    }
    return null;
  } catch (error) {
    console.error('Error getting secure refresh token:', error);
    return null;
  }
};

export const clearSecureCredentials = async () => {
  try {
    await Keychain.resetGenericPassword({ service: BIOMETRIC_SERVICE });
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE });
  } catch (error) {
    console.error('Error clearing secure credentials:', error);
  }
};