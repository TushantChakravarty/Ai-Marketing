import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, ProgressBar, Chip, Snackbar } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  businessInfoSchema,
  audienceSchema,
  BusinessInfoFormData,
  AudienceFormData,
} from '../../utils/validation.util';
import { useBusiness } from '../../hooks/useBusiness';
import { useAuth } from '../../hooks/useAuth';
import { INDUSTRIES, TONES, MARKETING_MODES, PLATFORMS } from '../../config/constants';
import type { MarketingMode, Platform } from '../../types';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const TOTAL_STEPS = 4;

const BusinessSetupScreen: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedMarketingMode, setSelectedMarketingMode] =
    useState<MarketingMode>('hybrid');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const { createBusiness, isLoading } = useBusiness();
  const { markOnboardingComplete } = useAuth();

  const step1Form = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: { name: '', description: '', industry: '', website: '' },
  });

  const step2Form = useForm<AudienceFormData>({
    resolver: zodResolver(audienceSchema),
    defaultValues: { targetAudience: '', tone: '' },
  });

  const [businessInfo, setBusinessInfo] =
    useState<BusinessInfoFormData | null>(null);
  const [audienceInfo, setAudienceInfo] =
    useState<AudienceFormData | null>(null);

  const handleStep1 = (data: BusinessInfoFormData) => {
    setBusinessInfo(data);
    setStep(2);
  };

  const handleStep2 = (data: AudienceFormData) => {
    setAudienceInfo(data);
    setStep(3);
  };

  const handleStep3 = () => setStep(4);

  const handleFinish = async () => {
    if (!businessInfo || !audienceInfo) return;
    if (selectedPlatforms.length === 0) {
      setSnackbar({ visible: true, message: 'Please select at least one platform.' });
      return;
    }
    try {
      await createBusiness({
        name: businessInfo.name,
        description: businessInfo.description,
        industry: businessInfo.industry,
        tone: audienceInfo.tone,
        targetAudience: audienceInfo.targetAudience,
        marketingMode: selectedMarketingMode,
        website: businessInfo.website,
      });
      await markOnboardingComplete();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save business.';
      setSnackbar({ visible: true, message });
    }
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform],
    );
  };

  const stepLabels = ['Business Info', 'Audience', 'Mode', 'Platforms'];

  return (
    <View style={styles.flex}>
      {/* Progress header */}
      <View style={styles.progressContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepLabel}>
            Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}
          </Text>
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(s => s - 1)}>
              <Text style={styles.backLink}>Back</Text>
            </TouchableOpacity>
          )}
        </View>
        <ProgressBar
          progress={step / TOTAL_STEPS}
          color={Colors.primary}
          style={styles.progressBar}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Tell us about your business</Text>
            <Text style={styles.stepSubtitle}>
              This helps AI create on-brand content for you.
            </Text>

            <Controller
              control={step1Form.control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Business Name"
                  value={value}
                  onChangeText={onChange}
                  leftIcon="domain"
                  error={step1Form.formState.errors.name?.message}
                />
              )}
            />

            <Controller
              control={step1Form.control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Business Description"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  showCharCount
                  error={step1Form.formState.errors.description?.message}
                  helperText="What does your business do? Who do you serve?"
                />
              )}
            />

            <Text style={styles.fieldLabel}>Industry</Text>
            <View style={styles.chipGrid}>
              {INDUSTRIES.map(industry => (
                <Chip
                  key={industry.id}
                  selected={
                    step1Form.watch('industry') === industry.id
                  }
                  onPress={() =>
                    step1Form.setValue('industry', industry.id, {
                      shouldValidate: true,
                    })
                  }
                  style={[
                    styles.chip,
                    step1Form.watch('industry') === industry.id &&
                      styles.chipSelected,
                  ]}
                  textStyle={
                    step1Form.watch('industry') === industry.id
                      ? styles.chipTextSelected
                      : styles.chipText
                  }>
                  {industry.label}
                </Chip>
              ))}
            </View>
            {step1Form.formState.errors.industry && (
              <Text style={styles.errorText}>
                {step1Form.formState.errors.industry.message}
              </Text>
            )}

            <Controller
              control={step1Form.control}
              name="website"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Website (optional)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  keyboardType="url"
                  autoCapitalize="none"
                  leftIcon="web"
                  error={step1Form.formState.errors.website?.message}
                />
              )}
            />

            <Button
              label="Continue"
              onPress={step1Form.handleSubmit(handleStep1)}
              fullWidth
              size="lg"
              iconName="arrow-right"
              iconPosition="right"
              style={styles.nextBtn}
            />
          </View>
        )}

        {/* Step 2: Target Audience & Tone */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Define your audience</Text>
            <Text style={styles.stepSubtitle}>
              Help AI understand who you're speaking to.
            </Text>

            <Controller
              control={step2Form.control}
              name="targetAudience"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Target Audience"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  showCharCount
                  error={step2Form.formState.errors.targetAudience?.message}
                  helperText="E.g. Small business owners aged 25-45 interested in productivity"
                />
              )}
            />

            <Text style={styles.fieldLabel}>Brand Tone</Text>
            <View style={styles.toneGrid}>
              {TONES.map(tone => (
                <TouchableOpacity
                  key={tone.id}
                  style={[
                    styles.toneCard,
                    step2Form.watch('tone') === tone.id &&
                      styles.toneCardSelected,
                  ]}
                  onPress={() =>
                    step2Form.setValue('tone', tone.id, {
                      shouldValidate: true,
                    })
                  }>
                  <Text style={styles.toneEmoji}>{tone.emoji}</Text>
                  <Text
                    style={[
                      styles.toneName,
                      step2Form.watch('tone') === tone.id &&
                        styles.toneNameSelected,
                    ]}>
                    {tone.label}
                  </Text>
                  <Text style={styles.toneDesc}>{tone.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {step2Form.formState.errors.tone && (
              <Text style={styles.errorText}>
                {step2Form.formState.errors.tone.message}
              </Text>
            )}

            <Button
              label="Continue"
              onPress={step2Form.handleSubmit(handleStep2)}
              fullWidth
              size="lg"
              iconName="arrow-right"
              iconPosition="right"
              style={styles.nextBtn}
            />
          </View>
        )}

        {/* Step 3: Marketing Mode */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose your marketing mode</Text>
            <Text style={styles.stepSubtitle}>
              How much do you want AI to help?
            </Text>

            {MARKETING_MODES.map(mode => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeCard,
                  selectedMarketingMode === mode.id && styles.modeCardSelected,
                ]}
                onPress={() => setSelectedMarketingMode(mode.id)}>
                <View style={styles.modeHeader}>
                  <View style={styles.modeIconContainer}>
                    <Icon name={mode.icon} size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.modeTitleContainer}>
                    <Text style={styles.modeTitle}>{mode.title}</Text>
                    <Text style={styles.modeDescription}>
                      {mode.description}
                    </Text>
                  </View>
                  {selectedMarketingMode === mode.id && (
                    <Icon
                      name="check-circle"
                      size={22}
                      color={Colors.primary}
                    />
                  )}
                </View>
                <View style={styles.modePros}>
                  {mode.pros.map((pro, i) => (
                    <View key={i} style={styles.proRow}>
                      <Icon
                        name="check"
                        size={13}
                        color={Colors.success}
                      />
                      <Text style={styles.proText}>{pro}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}

            <Button
              label="Continue"
              onPress={handleStep3}
              fullWidth
              size="lg"
              iconName="arrow-right"
              iconPosition="right"
              style={styles.nextBtn}
            />
          </View>
        )}

        {/* Step 4: Platform Selection */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Connect your platforms</Text>
            <Text style={styles.stepSubtitle}>
              Select the social media platforms for your business. You can
              connect them after setup.
            </Text>

            {PLATFORMS.map(platform => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.platformCard,
                    isSelected && {
                      borderColor: platform.color,
                      backgroundColor: `${platform.color}10`,
                    },
                  ]}
                  onPress={() => togglePlatform(platform.id)}>
                  <Icon
                    name={platform.icon}
                    size={28}
                    color={isSelected ? platform.color : Colors.gray500}
                  />
                  <View style={styles.platformInfo}>
                    <Text style={styles.platformName}>{platform.name}</Text>
                    <Text style={styles.platformLimit}>
                      {platform.charLimit.toLocaleString()} char limit
                    </Text>
                  </View>
                  {isSelected ? (
                    <Icon
                      name="check-circle"
                      size={22}
                      color={platform.color}
                    />
                  ) : (
                    <Icon
                      name="plus-circle-outline"
                      size={22}
                      color={Colors.gray400}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            <Button
              label="Finish Setup"
              onPress={handleFinish}
              isLoading={isLoading}
              fullWidth
              size="lg"
              iconName="check"
              iconPosition="right"
              style={styles.nextBtn}
            />
          </View>
        )}
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
        duration={3000}>
        {snackbar.message}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  progressContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    paddingTop: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  backLink: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  stepContent: {
    gap: Spacing.base,
  },
  stepTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSize.base * 1.6,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.surfaceVariant,
    borderColor: Colors.primary,
  },
  chipText: { color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },
  toneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  toneCard: {
    width: '47%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    gap: 2,
  },
  toneCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceVariant,
  },
  toneEmoji: { fontSize: 22 },
  toneName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toneNameSelected: { color: Colors.primary },
  toneDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  modeCard: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  modeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceVariant,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  modeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTitleContainer: { flex: 1 },
  modeTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modeDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  modePros: { gap: Spacing.xs },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  proText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  platformInfo: { flex: 1 },
  platformName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  platformLimit: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  nextBtn: { marginTop: Spacing.sm },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.xs,
    marginTop: -Spacing.xs,
  },
});

export default BusinessSetupScreen;
