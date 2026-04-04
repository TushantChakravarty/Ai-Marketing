import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Text, Avatar } from 'react-native-paper';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { MainDrawerParamList } from './types';
import TabNavigator from './TabNavigator';
import BusinessSetupScreen from '../screens/onboarding/BusinessSetupScreen';
import BillingScreen from '../screens/billing/BillingScreen';
import { Colors, Spacing, Typography } from '../theme';
import { useAppSelector, useAppDispatch } from '../store';
import { logout } from '../store/slices/auth.slice';
import { StorageUtil } from '../utils/storage.util';

const Drawer = createDrawerNavigator<MainDrawerParamList>();

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = props => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const business = useAppSelector(s => s.business.currentBusiness);

  const handleLogout = async () => {
    await StorageUtil.clearAll();
    dispatch(logout());
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContent}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Avatar.Text
          size={52}
          label={
            user
              ? `${user.firstName[0]}${user.lastName[0]}`
              : 'U'
          }
          style={styles.avatar}
        />
        <Text variant="titleMedium" style={styles.userName}>
          {user ? `${user.firstName} ${user.lastName}` : 'User'}
        </Text>
        {business && (
          <Text variant="bodySmall" style={styles.businessName}>
            {business.name}
          </Text>
        )}
      </View>

      <DrawerItemList {...props} />

      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerStyle: {
          backgroundColor: Colors.surface,
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: Typography.fontSize.base,
          fontWeight: Typography.fontWeight.medium,
        },
      }}>
      <Drawer.Screen
        name="Tabs"
        component={TabNavigator}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="BusinessSetup"
        component={BusinessSetupScreen}
        options={{
          title: 'Business Profile',
          drawerIcon: ({ color, size }) => (
            <Icon name="domain" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Billing"
        component={BillingScreen}
        options={{
          title: 'Billing & Plans',
          drawerIcon: ({ color, size }) => (
            <Icon name="credit-card" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  avatar: {
    backgroundColor: Colors.primary,
    marginBottom: Spacing.sm,
  },
  userName: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  businessName: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  drawerFooter: {
    marginTop: 'auto',
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  logoutText: {
    color: Colors.error,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default MainNavigator;
