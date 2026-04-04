import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useAppSelector } from '../../store';
import { useCreateCampaignMutation, useLaunchCampaignMutation } from '../../store/api/ads.api';
import type { AdsStackParamList } from '../../types';
import {
  CampaignObjective,
  CampaignCTA,
  AdBudget,
  AudienceTargeting,
  AdCreative,
  OBJECTIVES,
  CTA_OPTIONS,
} from '../../types/ads';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';

type Nav = StackNavigationProp<AdsStackParamList>;

const STEPS = ['Objective', 'Budget', 'Audience', 'Creative', 'Review'];

const CreateCampaignScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const business = useAppSelector(s => s.business.currentBusiness);

  const [step, setStep] = useState(0);

  // Step 1 — Objective
  const [name, setName] = useState('');
  const [objective, setObjective] = useState<CampaignObjective>('TRAFFIC');
  const [adAccountId, setAdAccountId] = useState('');

  // Step 2 — Budget
  const [budgetType, setBudgetType] = useState<'daily' | 'lifetime'>('daily');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [startDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));

  // Step 3 — Audience
  const [countries, setCountries] = useState('US');
  const [ageMin, setAgeMin] = useState('18');
  const [ageMax, setAgeMax] = useState('55');
  const [interests, setInterests] = useState('');

  // Step 4 — Creative
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [cta, setCta] = useState<CampaignCTA>('LEARN_MORE');

  const [createCampaign, { isLoading: isCreating }] = useCreateCampaignMutation();
  const [launchCampaign, { isLoading: isLaunching }] = useLaunchCampaignMutation();

  const canNext = useCallback((): boolean => {
    if (step === 0) return name.trim().length > 0 && adAccountId.trim().length > 0;
    if (step === 1) return parseFloat(budgetAmount) > 0;
    if (step === 2) return countries.trim().length > 0;
    if (step === 3)
      return headline.trim().length > 0 && bodyText.trim().length > 0 && linkUrl.trim().length > 0;
    return true;
  }, [step, name, adAccountId, budgetAmount, countries, headline, bodyText, linkUrl]);

  const buildDto = () => {
    const countryList = countries
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(Boolean);

    const interestList = interests
      .split(',')
      .map(i => i.trim())
      .filter(Boolean)
      .map(i => ({ id: i, name: i }));

    const targeting: AudienceTargeting = {
      countries: countryList,
      ageMin: parseInt(ageMin) || 18,
      ageMax: parseInt(ageMax) || 55,
      interests: interestList,
    };

    const budget: AdBudget = {
      type: budgetType,
      amount: Math.round(parseFloat(budgetAmount) * 100), // convert to cents
      currency: 'USD',
      startDate: new Date(startDate).toISOString(),
    };

    const creative: AdCreative = {
      headline,
      bodyText,
      callToAction: cta,
      linkUrl,
    };

    return {
      businessId: business?.id ?? '',
      platform: 'meta' as const,
      name,
      objective,
      budget,
      targeting,
      placements: [],
      optimizationGoal: 'LINK_CLICKS' as const,
      billingEvent: 'IMPRESSIONS' as const,
      creative,
      metaAdAccountId: adAccountId,
    };
  };

  const handleSaveDraft = async () => {
    try {
      const campaign = await createCampaign(buildDto()).unwrap();
      Alert.alert('Saved', 'Campaign saved as draft.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.data?.message ?? 'Failed to save.');
    }
  };

  const handleLaunch = async () => {
    Alert.alert(
      'Launch Campaign',
      `Your campaign "${name}" will go live immediately. Budget: $${budgetAmount}/${budgetType}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Launch',
          onPress: async () => {
            try {
              const { data: campaign } = await createCampaign(buildDto()).unwrap();
              await launchCampaign((campaign as any)._id).unwrap();
              Alert.alert('🚀 Campaign Launched!', 'Your ad is now live on Meta.', [
                { text: 'View', onPress: () => navigation.replace('CampaignDetail', { campaignId: (campaign as any)._id }) },
              ]);
            } catch (e: any) {
              Alert.alert('Error', e?.data?.message ?? 'Launch failed.');
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Step indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <TouchableOpacity
              style={[styles.stepDot, i <= step && styles.stepDotActive, i < step && styles.stepDotDone]}
              onPress={() => i < step && setStep(i)}>
              {i < step ? (
                <Icon name="check" size={12} color={Colors.white} />
              ) : (
                <Text style={[styles.stepNumber, i === step && styles.stepNumberActive]}>
                  {i + 1}
                </Text>
              )}
            </TouchableOpacity>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.stepTitle}>{STEPS[step]}</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* ── Step 0: Objective ── */}
        {step === 0 && (
          <View>
            <Input label="Campaign Name" value={name} onChangeText={setName} placeholder="e.g. Summer Sale 2024" />
            <Input
              label="Meta Ad Account ID"
              value={adAccountId}
              onChangeText={setAdAccountId}
              placeholder="act_123456789"
              style={{ marginTop: Spacing.base }}
            />
            <Text style={styles.sectionLabel}>Objective</Text>
            {OBJECTIVES.map(obj => (
              <TouchableOpacity
                key={obj.value}
                style={[styles.optionCard, objective === obj.value && styles.optionCardActive]}
                onPress={() => setObjective(obj.value)}>
                <View style={[styles.optionIcon, objective === obj.value && styles.optionIconActive]}>
                  <Icon
                    name={obj.icon}
                    size={20}
                    color={objective === obj.value ? Colors.white : Colors.primary}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, objective === obj.value && styles.optionTitleActive]}>
                    {obj.label}
                  </Text>
                  <Text style={styles.optionDesc}>{obj.description}</Text>
                </View>
                {objective === obj.value && (
                  <Icon name="check-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Step 1: Budget ── */}
        {step === 1 && (
          <View>
            <Text style={styles.sectionLabel}>Budget Type</Text>
            <View style={styles.toggleRow}>
              {(['daily', 'lifetime'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.toggleBtn, budgetType === t && styles.toggleBtnActive]}
                  onPress={() => setBudgetType(t)}>
                  <Text style={[styles.toggleText, budgetType === t && styles.toggleTextActive]}>
                    {t === 'daily' ? 'Daily Budget' : 'Lifetime Budget'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label={`${budgetType === 'daily' ? 'Daily' : 'Total'} Budget (USD)`}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              placeholder="50.00"
              keyboardType="decimal-pad"
            />

            <View style={styles.infoBox}>
              <Icon name="information-outline" size={16} color={Colors.info} />
              <Text style={styles.infoText}>
                {budgetType === 'daily'
                  ? `You'll spend up to $${budgetAmount || '0'} per day. We recommend at least $10/day for meaningful results.`
                  : `Your total campaign spend won't exceed $${budgetAmount || '0'} over the entire run.`}
              </Text>
            </View>
          </View>
        )}

        {/* ── Step 2: Audience ── */}
        {step === 2 && (
          <View>
            <Input
              label="Countries (comma-separated ISO codes)"
              value={countries}
              onChangeText={setCountries}
              placeholder="US, GB, CA"
            />
            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Input label="Min Age" value={ageMin} onChangeText={setAgeMin} keyboardType="number-pad" placeholder="18" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Max Age" value={ageMax} onChangeText={setAgeMax} keyboardType="number-pad" placeholder="55" />
              </View>
            </View>
            <Input
              label="Interests (comma-separated)"
              value={interests}
              onChangeText={setInterests}
              placeholder="fitness, healthy food, yoga"
              multiline
            />
            <View style={styles.infoBox}>
              <Icon name="information-outline" size={16} color={Colors.info} />
              <Text style={styles.infoText}>
                Interest IDs are searched via the Meta API. For now enter interest names and we'll match them on launch.
              </Text>
            </View>
          </View>
        )}

        {/* ── Step 3: Creative ── */}
        {step === 3 && (
          <View>
            <Input
              label="Headline"
              value={headline}
              onChangeText={setHeadline}
              placeholder="Get 30% off this summer"
              maxLength={255}
            />
            <Input
              label="Ad Copy"
              value={bodyText}
              onChangeText={setBodyText}
              placeholder="Discover our latest collection..."
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
            <Input
              label="Destination URL"
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://yoursite.com/offer"
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={styles.sectionLabel}>Call to Action</Text>
            <View style={styles.ctaGrid}>
              {CTA_OPTIONS.map(c => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.ctaChip, cta === c.value && styles.ctaChipActive]}
                  onPress={() => setCta(c.value)}>
                  <Text style={[styles.ctaLabel, cta === c.value && styles.ctaLabelActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <View>
            <ReviewSection title="Campaign">
              <ReviewRow label="Name" value={name} />
              <ReviewRow label="Platform" value="Meta (Facebook + Instagram)" />
              <ReviewRow label="Objective" value={OBJECTIVES.find(o => o.value === objective)?.label ?? objective} />
              <ReviewRow label="Ad Account" value={adAccountId} />
            </ReviewSection>

            <ReviewSection title="Budget">
              <ReviewRow label="Type" value={budgetType === 'daily' ? 'Daily' : 'Lifetime'} />
              <ReviewRow label="Amount" value={`$${budgetAmount} USD`} />
              <ReviewRow label="Start" value={startDate} />
            </ReviewSection>

            <ReviewSection title="Audience">
              <ReviewRow label="Countries" value={countries} />
              <ReviewRow label="Age" value={`${ageMin} – ${ageMax}`} />
              {interests ? <ReviewRow label="Interests" value={interests} /> : null}
            </ReviewSection>

            <ReviewSection title="Creative">
              <ReviewRow label="Headline" value={headline} />
              <ReviewRow label="Body" value={bodyText} />
              <ReviewRow label="URL" value={linkUrl} />
              <ReviewRow label="CTA" value={CTA_OPTIONS.find(c => c.value === cta)?.label ?? cta} />
            </ReviewSection>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.footer}>
        {step > 0 && (
          <Button
            label="Back"
            onPress={() => setStep(s => s - 1)}
            variant="outline"
            style={styles.footerBtn}
          />
        )}
        {step < STEPS.length - 1 ? (
          <Button
            label="Next"
            onPress={() => setStep(s => s + 1)}
            variant="primary"
            style={styles.footerBtn}
            disabled={!canNext()}
          />
        ) : (
          <View style={styles.finalActions}>
            <Button
              label="Save Draft"
              onPress={handleSaveDraft}
              variant="outline"
              style={{ flex: 1 }}
              isLoading={isCreating && !isLaunching}
            />
            <Button
              label="Launch Now"
              onPress={handleLaunch}
              variant="primary"
              icon="rocket-launch-outline"
              style={{ flex: 1 }}
              isLoading={isCreating || isLaunching}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const ReviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.reviewSection}>
    <Text style={styles.reviewSectionTitle}>{title}</Text>
    <View style={styles.reviewCard}>{children}</View>
  </View>
);

const ReviewRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>{label}</Text>
    <Text style={styles.reviewValue} numberOfLines={2}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: Colors.primary },
  stepDotDone: { backgroundColor: Colors.success },
  stepNumber: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  stepNumberActive: { color: Colors.white },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.gray200 },
  stepLineDone: { backgroundColor: Colors.success },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['2xl'] },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionCardActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceVariant },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: { backgroundColor: Colors.primary },
  optionText: { flex: 1 },
  optionTitle: { fontSize: Typography.fontSize.base, fontWeight: '600', color: Colors.textPrimary },
  optionTitleActive: { color: Colors.primary },
  optionDesc: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  toggleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  toggleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceVariant },
  toggleText: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.primary },
  infoBox: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.infoLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: Spacing.base,
  },
  infoText: { flex: 1, fontSize: Typography.fontSize.xs, color: Colors.info, lineHeight: 16 },
  rowInputs: { flexDirection: 'row', gap: Spacing.sm },
  ctaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  ctaChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  ctaChipActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceVariant },
  ctaLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  ctaLabelActive: { color: Colors.primary },
  reviewSection: { marginBottom: Spacing.base },
  reviewSectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.base },
  reviewLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, flex: 1 },
  reviewValue: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary, fontWeight: '600', flex: 2, textAlign: 'right' },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerBtn: { flex: 1 },
  finalActions: { flex: 1, flexDirection: 'row', gap: Spacing.sm },
});

export default CreateCampaignScreen;
