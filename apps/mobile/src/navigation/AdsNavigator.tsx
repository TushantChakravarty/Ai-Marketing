import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { AdsStackParamList } from '../types';
import CampaignsListScreen from '../screens/ads/CampaignsListScreen';
import CreateCampaignScreen from '../screens/ads/CreateCampaignScreen';
import CreateAICampaignScreen from '../screens/ads/CreateAICampaignScreen';
import CampaignPreviewScreen from '../screens/ads/CampaignPreviewScreen';
import CampaignDetailScreen from '../screens/ads/CampaignDetailScreen';
import { Colors, Typography } from '../theme';

const Stack = createStackNavigator<AdsStackParamList>();

const AdsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.primary,
      headerTitleStyle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
      },
      headerBackTitleVisible: false,
    }}>
    <Stack.Screen
      name="CampaignsList"
      component={CampaignsListScreen}
      options={{ title: 'Ad Campaigns' }}
    />
    <Stack.Screen
      name="CreateCampaign"
      component={CreateCampaignScreen}
      options={{ title: 'New Campaign' }}
    />
    <Stack.Screen
      name="CreateAICampaign"
      component={CreateAICampaignScreen}
      options={{ title: 'AI Campaign Builder' }}
    />
    <Stack.Screen
      name="CampaignPreview"
      component={CampaignPreviewScreen}
      options={{ title: 'Campaign Preview' }}
    />
    <Stack.Screen
      name="CampaignDetail"
      component={CampaignDetailScreen}
      options={{ title: 'Campaign' }}
    />
  </Stack.Navigator>
);

export default AdsNavigator;
