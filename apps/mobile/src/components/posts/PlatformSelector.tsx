import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Platform, PlatformConnection } from '../../types';
import { PLATFORMS } from '../../config/constants';
import { Colors, Spacing, Radius, Typography } from '../../theme';

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onToggle: (platform: Platform) => void;
  connectedPlatforms?: PlatformConnection[];
  label?: string;
  error?: string;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onToggle,
  connectedPlatforms = [],
  label = 'Select Platforms',
  error,
}) => {
  const connectedIds = connectedPlatforms
    .filter(c => c.isActive)
    .map(c => c.platform);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.grid}>
        {PLATFORMS.map(platform => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const isConnected = connectedIds.includes(platform.id);

          return (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformBtn,
                isSelected && { borderColor: platform.color, backgroundColor: `${platform.color}15` },
                !isConnected && styles.platformBtnDisabled,
              ]}
              onPress={() => onToggle(platform.id)}
              disabled={!isConnected}>
              <View style={styles.iconRow}>
                <Icon
                  name={platform.icon}
                  size={22}
                  color={isSelected ? platform.color : Colors.gray500}
                />
                {!isConnected && (
                  <View style={styles.lockBadge}>
                    <Icon name="lock" size={10} color={Colors.white} />
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.platformName,
                  isSelected && { color: platform.color },
                  !isConnected && styles.platformNameDisabled,
                ]}>
                {platform.name}
              </Text>
              {isConnected && (
                <View style={styles.connectedDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  platformBtn: {
    width: '47%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  platformBtnDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.gray100,
  },
  iconRow: {
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.gray500,
    borderRadius: 6,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  platformNameDisabled: {
    color: Colors.textDisabled,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  error: {
    color: Colors.error,
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
  },
});

export default PlatformSelector;
