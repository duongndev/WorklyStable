import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

const AppTextInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  placeholderTextColor,
  style,
  textArea,
  onPress,
  disabled,
  icon,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.formGroup}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          style,
          secureTextEntry && styles.passwordInputContainer,
          error && styles.inputContainerError,
        ]}>
        {icon && (
          <Icon
            name={icon}
            size={24}
            color="#666666"
            style={styles.leftIcon}
          />
        )}
        <TextInput
          placeholder={placeholder}
          value={value}
          onPressIn={onPress} // Changed onPress to onPressIn for better TextInput handling if needed, or remove if unused. TextInput doesn't have onPress usually unless editable=false
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholderTextColor={placeholderTextColor || '#999'}
          style={[
            styles.input,
            textArea && styles.textArea,
            secureTextEntry && styles.passwordInput,
          ]}
          multiline={textArea}
          numberOfLines={textArea ? 4 : 1}
          textAlignVertical={textArea ? 'top' : 'center'}
          editable={!disabled}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#666666"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = ScaledSheet.create({
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
    marginTop: 16,
  },
  inputContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 12,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0, // Remove default padding to center text
  },
  textArea: {
    height: 100,
    paddingVertical: 10,
  },
  passwordInputContainer: {
    // specific styles if needed
  },
  eyeIcon: {
    padding: 4,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default AppTextInput;
