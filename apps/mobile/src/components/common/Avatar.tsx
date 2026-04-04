import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Avatar as PaperAvatar } from 'react-native-paper';
import { Colors } from '../../theme';
import { getInitials } from '../../utils/format.util';

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: number;
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 40,
  style,
}) => {
  if (imageUrl) {
    return (
      <PaperAvatar.Image
        size={size}
        source={{ uri: imageUrl }}
        style={[styles.avatar, style]}
      />
    );
  }

  const initials = name ? getInitials(name) : '?';

  return (
    <PaperAvatar.Text
      size={size}
      label={initials}
      style={[styles.avatar, style]}
      labelStyle={styles.label}
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.primary,
  },
  label: {
    color: Colors.white,
    fontWeight: '700',
  },
});

export default Avatar;
