import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useAppSelector, useAppDispatch } from '../../store';
import { logout } from '../../store/slices/auth.slice';
import Avatar from '../../components/common/Avatar';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import type { MainDrawerParamList } from '../../types';
import { StorageUtil } from '../../utils/storage.util';

type NavProps = DrawerNavigationProp<MainDrawerParamList>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavProps>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const business = useAppSelector(s => s.business.currentBusiness);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await StorageUtil.clearAll();
          dispatch(logout());
        },
      },
    ]);
  }, [dispatch]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={styles.profileCard}>
        <Avatar
          uri={user?.avatarUrl}
          name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
          size={72}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.editProfileBtn}>
          <Icon name="pencil-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Business Section */}
      <SectionHeader title="Business" />
      <SettingsItem
        icon="domain"
        label="Business Profile"
        subtitle={business?.name ?? 'Set up your business'}
        onPress={() => navigation.navigate('BusinessSetup')}
      />
      <SettingsItem
        icon="tune"
        label="Marketing Mode"
        subtitle={
          business?.marketingMode === 'ai'
            ? 'AI Autopilot'
            : business?.marketingMode === 'hybrid'
            ? 'Hybrid'
            : 'Manual'
        }
        onPress={() => navigation.navigate('BusinessSetup')}
      />

      {/* Subscription */}
      <SectionHeader title="Subscription" />
      <SettingsItem
        icon="credit-card-outline"
        label="Billing & Plans"
        subtitle="Manage your subscription"
        onPress={() => navigation.navigate('Billing')}
      />

      {/* Notifications */}
      <SectionHeader title="Notifications" />
      <NotificationToggleItem
        icon="bell-outline"
        label="Campaign Active"
        subtitle="When a campaign goes live"
        defaultValue
      />
      <NotificationToggleItem
        icon="alert-circle-outline"
        label="Campaign Failed"
        subtitle="When a campaign fails to launch"
        defaultValue
      />
      <NotificationToggleItem
        icon="chart-line"
        label="Weekly Analytics"
        subtitle="Weekly performance summary"
        defaultValue={false}
      />

      {/* Account */}
      <SectionHeader title="Account" />
      <SettingsItem icon="lock-outline" label="Change Password" onPress={() => {}} />
      <SettingsItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
      <SettingsItem icon="file-document-outline" label="Terms & Privacy" onPress={() => {}} />

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>AI Marketing v1.0.0</Text>
    </ScrollView>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const SettingsItem: React.FC<{
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}> = ({ icon, label, subtitle, onPress }) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsItemIcon}>
      <Icon name={icon} size={20} color={Colors.primary} />
    </View>
    <View style={styles.settingsItemContent}>
      <Text style={styles.settingsItemLabel}>{label}</Text>
      {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
    </View>
    <Icon name="chevron-right" size={20} color={Colors.gray400} />
  </TouchableOpacity>
);

const NotificationToggleItem: React.FC<{
  icon: string;
  label: string;
  subtitle?: string;
  defaultValue?: boolean;
}> = ({ icon, label, subtitle, defaultValue = false }) => {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <View style={styles.settingsItem}>
      <View style={styles.settingsItemIcon}>
        <Icon name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={setValue}
        trackColor={{ false: Colors.gray300, true: Colors.primary + '80' }}
        thumbColor={value ? Colors.primary : Colors.gray400}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing['2xl'] },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    marginBottom: Spacing.xs,
    gap: Spacing.base,
    ...Shadows.sm,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  editProfileBtn: { padding: Spacing.sm },
  sectionHeader: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  settingsItemIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemContent: { flex: 1 },
  settingsItemLabel: { fontSize: Typography.fontSize.base, color: Colors.textPrimary, fontWeight: '500' },
  settingsItemSubtitle: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  logoutText: { fontSize: Typography.fontSize.base, color: Colors.error, fontWeight: '600' },
  version: { textAlign: 'center', color: Colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: Spacing.base, marginBottom: Spacing.sm },
});

export default SettingsScreen;
