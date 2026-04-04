import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';
import { Colors, Typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

const { width } = Dimensions.get('window');

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo appears
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Text fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after animation
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2800);

    return () => clearTimeout(timer);
  }, [navigation, logoScale, logoOpacity, textOpacity, taglineOpacity]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🚀</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity }}>
        <Text style={styles.appName}>AI Marketing</Text>
      </Animated.View>

      <Animated.View style={{ opacity: taglineOpacity }}>
        <Text style={styles.tagline}>
          Automate. Engage. Grow.
        </Text>
      </Animated.View>

      {/* Gradient dots decoration */}
      <View style={styles.decoration}>
        {[...Array(3)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                opacity: 0.15 + i * 0.1,
                width: 80 + i * 60,
                height: 80 + i * 60,
                borderRadius: (80 + i * 60) / 2,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 52,
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  decoration: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    backgroundColor: Colors.white,
  },
});

export default SplashScreen;
