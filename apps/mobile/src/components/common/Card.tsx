import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  shadow = 'sm',
  borderRadius = 'lg',
}) => {
  const paddingMap = {
    none: 0,
    sm: Spacing.sm,
    md: Spacing.base,
    lg: Spacing.xl,
  };

  const shadowMap = {
    none: {},
    sm: Shadows.sm,
    md: Shadows.md,
    lg: Shadows.lg,
  };

  const radiusMap = {
    sm: Radius.sm,
    md: Radius.md,
    lg: Radius.lg,
  };

  return (
    <View
      style={[
        styles.card,
        {
          padding: paddingMap[padding],
          borderRadius: radiusMap[borderRadius],
          ...shadowMap[shadow],
        },
        style,
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default Card;
