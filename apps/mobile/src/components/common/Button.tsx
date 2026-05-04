import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  iconName?: string;
  iconPosition?: 'left' | 'right';
  iconColor?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  iconName,
  iconPosition = 'left',
  iconColor: iconColorProp,
  fullWidth = false,
  size = 'md',
  style,
  labelStyle,
}) => {
  const isDisabled = disabled || isLoading;

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style ?? {},
  ];

  const textStyle: TextStyle[] = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
    isDisabled && styles.labelDisabled,
    labelStyle ?? {},
  ];

  const defaultIconColor = variant === 'outline' || variant === 'ghost'
    ? Colors.primary
    : variant === 'danger'
    ? Colors.white
    : Colors.white;
  const iconColor = iconColorProp ?? defaultIconColor;

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}>
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
        />
      ) : (
        <View style={styles.content}>
          {iconName && iconPosition === 'left' && (
            <Icon name={iconName} size={iconSize} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={textStyle}>{label}</Text>
          {iconName && iconPosition === 'right' && (
            <Icon name={iconName} size={iconSize} color={iconColor} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  // Sizes
  size_sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    minHeight: 36,
  },
  size_md: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 4,
    minHeight: 48,
  },
  size_lg: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: Spacing.xs,
  },
  iconRight: {
    marginLeft: Spacing.xs,
  },
  // Labels
  label: {
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  label_primary: {
    color: Colors.white,
  },
  label_secondary: {
    color: Colors.white,
  },
  label_outline: {
    color: Colors.primary,
  },
  label_ghost: {
    color: Colors.primary,
  },
  label_danger: {
    color: Colors.white,
  },
  labelDisabled: {
    opacity: 0.7,
  },
  labelSize_sm: {
    fontSize: Typography.fontSize.sm,
  },
  labelSize_md: {
    fontSize: Typography.fontSize.base,
  },
  labelSize_lg: {
    fontSize: Typography.fontSize.md,
  },
});

export default Button;
