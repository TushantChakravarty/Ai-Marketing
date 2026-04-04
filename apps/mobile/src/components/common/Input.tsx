import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { TextInput, Text, HelperText } from 'react-native-paper';
import { Colors, Spacing, Typography } from '../../theme';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  secureTextEntry?: boolean;
  isPassword?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'off';
  disabled?: boolean;
  style?: ViewStyle;
  maxLength?: number;
  showCharCount?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  secureTextEntry,
  isPassword = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  disabled = false,
  style,
  maxLength,
  showCharCount = false,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isSecure = isPassword ? !passwordVisible : (secureTextEntry ?? false);

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={isSecure}
        left={leftIcon ? <TextInput.Icon icon={leftIcon} /> : undefined}
        right={
          isPassword ? (
            <TextInput.Icon
              icon={passwordVisible ? 'eye-off' : 'eye'}
              onPress={() => setPasswordVisible(v => !v)}
            />
          ) : rightIcon ? (
            <TextInput.Icon icon={rightIcon} onPress={onRightIconPress} />
          ) : undefined
        }
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        disabled={disabled}
        maxLength={maxLength}
        mode="outlined"
        error={!!error}
        outlineColor={error ? Colors.error : Colors.border}
        activeOutlineColor={error ? Colors.error : Colors.primary}
        style={[styles.input, multiline && styles.multiline]}
        contentStyle={multiline ? styles.multilineContent : undefined}
      />
      {(error || helperText) && (
        <HelperText type={error ? 'error' : 'info'} visible>
          {error ?? helperText}
        </HelperText>
      )}
      {showCharCount && maxLength && (
        <Text style={styles.charCount}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  multiline: {
    minHeight: 100,
  },
  multilineContent: {
    paddingTop: Spacing.sm,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    marginRight: Spacing.xs,
  },
});

export default Input;
