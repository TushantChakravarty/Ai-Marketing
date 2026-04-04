import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme } from './src/theme';

SplashScreen.preventAutoHideAsync();

const App: React.FC = () => {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <SafeAreaProvider>
          <PaperProvider theme={lightTheme}>
            <StatusBar style="dark" />
            <AppNavigator />
          </PaperProvider>
        </SafeAreaProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
};

export default App;
