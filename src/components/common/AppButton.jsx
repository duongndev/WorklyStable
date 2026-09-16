import React from 'react';
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
} from 'react-native';

import {
  ScaledSheet,
} from 'react-native-size-matters';

import COLORS from '../../assets/styles/color';


const AppButton = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
}) => {
  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          style,
          (disabled || loading) && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <>
            <View style={styles.buttonLoading}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.buttonText, styles.loadingText]}>
                {title}
              </Text>
            </View>
          </>
        ) : (
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    </>
  );
};

const styles = ScaledSheet.create({
  loadingText: {
    color: '#FFFFFF',
    fontSize: '16@ms',
    fontWeight: '600',
    marginLeft: 8,
  },
  button: {
    backgroundColor: COLORS.BRAND_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically and horizontally
    marginTop: 'z',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: '16@ms',
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: 'gray',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically and horizontally
    marginTop: 10,
  },
  buttonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppButton;
