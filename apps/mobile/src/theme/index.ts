import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';

// ─── Color Palette ────────────────────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#6C63FF',
  primaryLight: '#9C94FF',
  primaryDark: '#4A44CC',
  secondary: '#FF6584',
  secondaryLight: '#FF94AA',
  secondaryDark: '#CC4466',

  // Gradient
  gradientStart: '#6C63FF',
  gradientEnd: '#3F3D94',

  // Semantic
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#F44336',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',

  // Platform
  twitter: '#1DA1F2',
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  // Light theme surfaces
  background: '#F8F7FF',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F0FF',
  border: '#E8E5FF',
  divider: '#EEEEEE',
  overlay: 'rgba(0,0,0,0.5)',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',
};

export const DarkColors = {
  ...Colors,
  background: '#0D0D1A',
  surface: '#1A1A2E',
  surfaceVariant: '#252540',
  border: '#2D2B52',
  divider: '#2D2D3A',
  textPrimary: '#F0EEFF',
  textSecondary: '#9B96CC',
  textDisabled: '#4A4A6A',
};

// ─── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

// ─── Border Radius ────────────────────────────────────────────────────────────

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ─── Paper Theme ──────────────────────────────────────────────────────────────

export const LightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.surfaceVariant,
    secondary: Colors.secondary,
    secondaryContainer: '#FFE5ED',
    background: Colors.background,
    surface: Colors.surface,
    surfaceVariant: Colors.surfaceVariant,
    error: Colors.error,
    onPrimary: Colors.white,
    onBackground: Colors.textPrimary,
    onSurface: Colors.textPrimary,
    outline: Colors.border,
  },
};

export const DarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primaryLight,
    primaryContainer: DarkColors.surfaceVariant,
    secondary: Colors.secondaryLight,
    background: DarkColors.background,
    surface: DarkColors.surface,
    surfaceVariant: DarkColors.surfaceVariant,
    error: Colors.error,
    onPrimary: Colors.white,
    onBackground: DarkColors.textPrimary,
    onSurface: DarkColors.textPrimary,
    outline: DarkColors.border,
  },
};

export type AppTheme = {
  isDark: boolean;
  colors: typeof Colors;
  typography: typeof Typography;
  spacing: typeof Spacing;
  radius: typeof Radius;
  shadows: typeof Shadows;
};

export const lightAppTheme: AppTheme = {
  isDark: false,
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
};

export const darkAppTheme: AppTheme = {
  isDark: true,
  colors: DarkColors,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
};
