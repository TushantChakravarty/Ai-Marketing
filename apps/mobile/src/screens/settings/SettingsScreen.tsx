import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useAppSelector, useAppDispatch } from '../../store';
import { logout } from '../../store/slices/auth.slice';
import { useGetPlatformConnectionsQuery, useDisconnectPlatformMutation } from '../../store/api/business.api';
import Avatar from '../../components/common/Avatar';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import { PLATFORMS } from '../../config/constants';
import type { MainDrawerParamList, Platform as PlatformType } from '../../types';
import { StorageUtil } from '../../utils/storage.util';

type NavProps = DrawerNavigationProp<MainDrawerParamList>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavProps>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const business = useAppSelector(s => s.business.currentBusiness);

  const { data: platformsData } = useGetPlatformConnectionsQuery(
    business?.id ?? '',
    { skip: !business?.id },
  );
  const [disconnectPlatform, { isLoading: isDisconnecting }] = useDisconnectPlatformMutation();

  const connectedPlatforms = platformsData?.data ?? [];

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

  const handleDisconnectPlatform = useCallback(
    (platform: PlatformType) => {
      const platformConfig = PLATFORMS.find(p => p.id === platform);
      Alert.alert(
        `Disconnect ${platformConfig?.name}`,
        'Your posts scheduled for this platform will no longer be published.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              try {
                await disconnectPlatform({ businessId: business?.id ?? '', platform }).unwrap();
              } catch {
                Alert.alert('Error', 'Failed to disconnect platform.');
              }
            },
          },
        ],
      );
    },
    [business?.id, disconnectPlatform],
  );

  const handleConnectPlatform = useCallback(
    (platform: PlatformType) => {
      // In a real app this would open the OAuth flow
      Alert.alert('Connect Platform', `OAuth flow for ${platform} would open here.`);
    },
    [],
  );

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

      {/* Connected Platforms */}
      <SectionHeader title="Connected Platforms" />
      {PLATFORMS.map(platformConfig => {
        const connection = connectedPlatforms.find(c => c.platform === platformConfig.id);
        return (
          <View key={platformConfig.id} style={styles.platformItem}>
            <View
              style={[styles.platformIcon, { backgroundColor: platformConfig.color + '20' }]}>
              <Icon name={platformConfig.icon} size={22} color={platformConfig.color} />
            </View>
            <View style={styles.platformInfo}>
              <Text style={styles.platformName}>{platformConfig.name}</Text>
              {connection ? (
                <Text style={styles.platformConnected}>
                  @{connection.accountName} · Connected
                </Text>
              ) : (
                <Text style={styles.platformDisconnected}>Not connected</Text>
              )}
            </View>
            {connection ? (
              <TouchableOpacity
                style={styles.disconnectBtn}
                onPress={() => handleDisconnectPlatform(platformConfig.id)}
                disabled={isDisconnecting}>
                <Text style={styles.disconnectBtnText}>Disconnect</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={() => handleConnectPlatform(platformConfig.id)}>
                <Text style={styles.connectBtnText}>Connect</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

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
        label="Post Published"
        subtitle="When a post is successfully published"
        defaultValue
      />
      <NotificationToggleItem
        icon="alert-circle-outline"
        label="Post Failed"
        subtitle="When a post fails to publish"
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
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  platformIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  platformInfo: { flex: 1 },
  platformName: { fontSize: Typography.fontSize.base, fontWeight: '600', color: Colors.textPrimary },
  platformConnected: { fontSize: Typography.fontSize.xs, color: Colors.success, marginTop: 2 },
  platformDisconnected: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  connectBtn: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.primary },
  connectBtnText: { fontSize: Typography.fontSize.sm, color: Colors.white, fontWeight: '600' },
  disconnectBtn: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.error },
  disconnectBtnText: { fontSize: Typography.fontSize.sm, color: Colors.error, fontWeight: '600' },
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
