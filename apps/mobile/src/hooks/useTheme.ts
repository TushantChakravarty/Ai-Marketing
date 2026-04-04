import { useColorScheme } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store';
import { setTheme as setThemeAction } from '../store/slices/ui.slice';
import {
  LightTheme,
  DarkTheme,
  lightAppTheme,
  darkAppTheme,
  Colors,
  DarkColors,
} from '../theme';
import type { ThemeMode } from '../store/slices/ui.slice';

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(s => s.ui.theme);
  const systemColorScheme = useColorScheme();

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  const paperTheme = isDark ? DarkTheme : LightTheme;
  const appTheme = isDark ? darkAppTheme : lightAppTheme;
  const colors = isDark ? DarkColors : Colors;

  const setTheme = (mode: ThemeMode) => {
    dispatch(setThemeAction(mode));
  };

  const toggleTheme = () => {
    if (themeMode === 'light') {
      setTheme('dark');
    } else if (themeMode === 'dark') {
      setTheme('light');
    } else {
      setTheme(isDark ? 'light' : 'dark');
    }
  };

  return {
    isDark,
    themeMode,
    paperTheme,
    appTheme,
    colors,
    setTheme,
    toggleTheme,
  };
};
