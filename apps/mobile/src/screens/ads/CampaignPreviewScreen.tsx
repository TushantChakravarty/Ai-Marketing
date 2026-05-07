import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AdsStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';
import { useGenerateImageMutation } from '../../store/api/ai.api';

type Route = RouteProp<AdsStackParamList, 'CampaignPreview'>;
type Nav = StackNavigationProp<AdsStackParamList, 'CampaignPreview'>;

const OBJECTIVE_LABELS: Record<string, string> = {
  REACH: 'Reach',
  TRAFFIC: 'Traffic',
  CONVERSIONS: 'Conversions',
  BRAND_AWARENESS: 'Brand Awareness',
  LEAD_GENERATION: 'Lead Generation',
};

const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: 'Learn More',
  SHOP_NOW: 'Shop Now',
  SIGN_UP: 'Sign Up',
  CONTACT_US: 'Contact Us',
  BOOK_NOW: 'Book Now',
  GET_OFFER: 'Get Offer',
};

function Section({ title, icon, children }: { title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={16} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Chip({ label, color = Colors.primary }: { label: string; color?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

export default function CampaignPreviewScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { campaign } = params;

  const [adImageUrl, setAdImageUrl] = useState<string | null>(null);
  const [generateImage, { isLoading: generatingImage }] = useGenerateImageMutation();

  const handleGenerateImage = async () => {
    try {
      const result = await generateImage({ prompt: campaign.adCreative.imagePrompt }).unwrap();
      setAdImageUrl(result.data.imageUrl);
    } catch {
      Alert.alert('Image generation failed', 'Could not generate the ad image. You can try again.');
    }
  };

  const handleLaunch = () => {
    Alert.alert(
      'Launch Campaign',
      'This will submit your campaign to Meta Ads. Make sure your Meta Ads account is connected in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Launch',
          style: 'default',
          onPress: () => {
            Alert.alert('Coming soon', 'Campaign launch integration with Meta Ads is coming soon!');
          },
        },
      ],
    );
  };

  const { targeting, budget, adCreative } = campaign;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Campaign name + objective banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <MaterialCommunityIcons name="bullseye-arrow" size={24} color={Colors.primary} />
        </View>
        <Text style={styles.campaignName}>{campaign.name}</Text>
        <View style={styles.objectivePill}>
          <Text style={styles.objectivePillText}>{OBJECTIVE_LABELS[campaign.objective] ?? campaign.objective}</Text>
        </View>
      </View>

      {/* AI Rationale */}
      <View style={styles.rationaleCard}>
        <MaterialCommunityIcons name="lightbulb-on" size={16} color={Colors.warning} />
        <Text style={styles.rationaleText}>{campaign.rationale}</Text>
      </View>

      {/* Ad Creative */}
      <Section title="Ad Creative" icon="image-edit">
        {/* Image */}
        <View style={styles.imageBox}>
          {adImageUrl ? (
            <Image source={{ uri: adImageUrl }} style={styles.adImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="image-plus" size={32} color={Colors.textDisabled} />
              <Text style={styles.imagePlaceholderText}>Ad Image</Text>
              <Text style={styles.imagePlaceholderSub} numberOfLines={2}>{adCreative.imagePrompt}</Text>
              <TouchableOpacity
                style={styles.genImageBtn}
                onPress={handleGenerateImage}
                disabled={generatingImage}
                activeOpacity={0.8}>
                {generatingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="creation" size={16} color="#fff" />
                )}
                <Text style={styles.genImageBtnText}>
                  {generatingImage ? 'Generating…' : 'Generate AI Image'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.creativeDetails}>
          <Text style={styles.headline}>{adCreative.headline}</Text>
          <Text style={styles.primaryText}>{adCreative.primaryText}</Text>
          <Text style={styles.description}>{adCreative.description}</Text>
          <View style={styles.ctaRow}>
            <MaterialCommunityIcons name="cursor-default-click" size={14} color={Colors.textSecondary} />
            <Text style={styles.ctaLabel}>CTA: </Text>
            <Chip label={CTA_LABELS[adCreative.callToAction] ?? adCreative.callToAction} />
          </View>
        </View>
      </Section>

      {/* Targeting */}
      <Section title="Audience Targeting" icon="account-group">
        <Row label="Age Range" value={`${targeting.ageMin}–${targeting.ageMax} years`} />
        <Row label="Genders" value={targeting.genders.join(', ')} />
        <Row label="Locations" value={targeting.locations.join(', ')} />
        <Text style={styles.interestsLabel}>Interests</Text>
        <View style={styles.chips}>
          {targeting.interests.map((i, idx) => <Chip key={idx} label={i} color={Colors.info} />)}
        </View>
      </Section>

      {/* Budget */}
      <Section title="Budget & Schedule" icon="currency-usd">
        <View style={styles.budgetGrid}>
          <View style={styles.budgetStat}>
            <Text style={styles.budgetStatValue}>${budget.dailyAmount}/day</Text>
            <Text style={styles.budgetStatLabel}>Daily Budget</Text>
          </View>
          <View style={styles.budgetDivider} />
          <View style={styles.budgetStat}>
            <Text style={styles.budgetStatValue}>{budget.durationDays} days</Text>
            <Text style={styles.budgetStatLabel}>Duration</Text>
          </View>
          <View style={styles.budgetDivider} />
          <View style={styles.budgetStat}>
            <Text style={styles.budgetStatValue}>${budget.totalAmount}</Text>
            <Text style={styles.budgetStatLabel}>Total Budget</Text>
          </View>
        </View>
      </Section>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="pencil" size={18} color={Colors.primary} />
          <Text style={styles.backBtnText}>Edit Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.launchBtn}
          onPress={handleLaunch}
          activeOpacity={0.85}>
          <MaterialCommunityIcons name="rocket-launch" size={18} color="#fff" />
          <Text style={styles.launchBtnText}>Launch Campaign</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: Spacing['4xl'] },

  banner: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  campaignName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  objectivePill: {
    backgroundColor: Colors.primary + '18',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  objectivePillText: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: '600' },

  rationaleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  rationaleText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, lineHeight: 20 },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.textPrimary },

  imageBox: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.md },
  adImage: { width: '100%', height: 200 },
  imagePlaceholder: {
    backgroundColor: Colors.gray100,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  imagePlaceholderText: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  imagePlaceholderSub: { fontSize: Typography.fontSize.xs, color: Colors.textDisabled, textAlign: 'center', maxWidth: '80%' },
  genImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  genImageBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: '#fff' },

  creativeDetails: { gap: Spacing.sm },
  headline: { fontSize: Typography.fontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  primaryText: { fontSize: Typography.fontSize.base, color: Colors.textPrimary, lineHeight: 22 },
  description: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ctaLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },

  rowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  rowLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  rowValue: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
  interestsLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
  },
  chipText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },

  budgetGrid: { flexDirection: 'row', alignItems: 'center' },
  budgetStat: { flex: 1, alignItems: 'center' },
  budgetStatValue: { fontSize: Typography.fontSize.lg, fontWeight: '800', color: Colors.primary },
  budgetStatLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  budgetDivider: { width: 1, height: 40, backgroundColor: Colors.divider },

  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  backBtnText: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.primary },
  launchBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    ...Shadows.md,
  },
  launchBtnText: { fontSize: Typography.fontSize.base, fontWeight: '700', color: '#fff' },
});
