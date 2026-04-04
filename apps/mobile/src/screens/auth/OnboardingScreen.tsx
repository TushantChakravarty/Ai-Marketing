import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';
import Button from '../../components/common/Button';
import { Colors, Spacing, Typography, Radius } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  bg: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🤖',
    title: 'AI-Powered Marketing',
    subtitle:
      'Let AI create compelling content for your business. Generate posts, hashtags, and entire content calendars in seconds.',
    bg: Colors.primary,
  },
  {
    id: '2',
    emoji: '📅',
    title: 'Schedule & Automate',
    subtitle:
      'Plan posts across Twitter, Instagram, Facebook, and LinkedIn. Set it once and let it run on autopilot.',
    bg: '#4F46E5',
  },
  {
    id: '3',
    emoji: '📈',
    title: 'Track Your Growth',
    subtitle:
      'Understand what resonates with your audience. Get detailed analytics on engagement, reach, and follower growth.',
    bg: '#7C3AED',
  },
];

const { width } = Dimensions.get('window');

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(i => i + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <Button
            label={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
            variant="primary"
            iconName={currentIndex === SLIDES.length - 1 ? 'arrow-right' : 'chevron-right'}
            iconPosition="right"
            style={styles.nextBtn}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: 120,
    gap: Spacing.xl,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * 1.7,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    backgroundColor: 'rgba(0,0,0,0.15)',
    gap: Spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.white,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    padding: Spacing.sm,
  },
  skipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  nextBtn: {
    minWidth: 130,
    backgroundColor: Colors.white,
  },
});

export default OnboardingScreen;
