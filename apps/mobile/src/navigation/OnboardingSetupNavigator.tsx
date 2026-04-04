import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';
import BusinessSetupScreen from '../screens/onboarding/BusinessSetupScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

const OnboardingSetupNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BusinessSetup" component={BusinessSetupScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingSetupNavigator;
