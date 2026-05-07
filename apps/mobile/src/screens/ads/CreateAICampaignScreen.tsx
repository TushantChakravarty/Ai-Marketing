import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AdsStackParamList, CampaignType, BudgetRange } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';
import { useGenerateCampaignMutation } from '../../store/api/ai.api';
import { useAppSelector } from '../../store';

type Nav = StackNavigationProp<AdsStackParamList, 'CreateAICampaign'>;

interface Template {
  type: CampaignType;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  description: string;
  placeholder: string;
}

const TEMPLATES: Template[] = [
  {
    type: 'product_launch',
    label: 'Product Launch',
    icon: 'rocket-launch',
    color: '#6C63FF',
    description: 'Introduce a new product or service',
    placeholder: 'e.g. Launching our new protein shake line with 20% intro discount',
  },
  {
    type: 'sale',
    label: 'Sale / Promo',
    icon: 'tag',
    color: '#FF6584',
    description: 'Drive purchases with a limited-time offer',
    placeholder: 'e.g. Weekend flash sale — 40% off all shoes',
  },
  {
    type: 'awareness',
    label: 'Brand Awareness',
    icon: 'bullhorn',
    color: '#FF9800',
    description: 'Grow your reach and brand recognition',
    placeholder: 'e.g. Introduce our eco-friendly packaging to more people',
  },
  {
    type: 'event',
    label: 'Event',
    icon: 'calendar-star',
    color: '#4CAF50',
    description: 'Promote an upcoming event or webinar',
    placeholder: 'e.g. Free cooking class this Saturday at 2pm',
  },
];

const BUDGET_OPTIONS: { value: BudgetRange; label: string; range: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'low', label: 'Starter', range: '$5–$20/day', icon: 'sprout' },
  { value: 'medium', label: 'Growth', range: '$20–$100/day', icon: 'trending-up' },
  { value: 'high', label: 'Scale', range: '$100–$500/day', icon: 'lightning-bolt' },
];

const DURATION_OPTIONS = [3, 7, 14, 30];

export default function CreateAICampaignScreen() {
  const navigation = useNavigation<Nav>();
  const businessId = useAppSelector(s => s.business.currentBusiness?.id ?? '');

  const [selectedTemplate, setSelectedTemplate] = useState<CampaignType | null>(null);
  const [offer, setOffer] = useState('');
  const [location, setLocation] = useState('');
  const [budgetRange, setBudgetRange] = useState<BudgetRange>('medium');
  const [durationDays, setDurationDays] = useState(7);

  const [generateCampaign, { isLoading }] = useGenerateCampaignMutation();

  const currentTemplate = TEMPLATES.find(t => t.type === selectedTemplate);

  const handleGenerate = async () => {
    if (!selectedTemplate) { Alert.alert('Select a template', 'Choose a campaign type to continue.'); return; }
    if (!offer.trim()) { Alert.alert('Describe your offer', 'Tell the AI what this campaign is about.'); return; }
    if (!location.trim()) { Alert.alert('Add a location', 'Enter the target city, region, or country.'); return; }
    if (!businessId) { Alert.alert('No business', 'Please set up a business first.'); return; }

    try {
      const result = await generateCampaign({
        businessId,
        campaignType: selectedTemplate,
        offer: offer.trim(),
        location: location.trim(),
        budgetRange,
        durationDays,
      }).unwrap();

      navigation.navigate('CampaignPreview', {
        campaign: result.data.campaign,
        businessId,
      });
    } catch {
      Alert.alert('Generation failed', 'Could not generate campaign. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="creation" size={28} color={Colors.primary} />
        </View>
        <Text style={styles.title}>AI Campaign Builder</Text>
        <Text style={styles.subtitle}>Pick a template, fill in a few details, and let AI do the rest.</Text>
      </View>

      {/* Templates */}
      <Text style={styles.sectionLabel}>Campaign Type</Text>
      <View style={styles.templatesGrid}>
        {TEMPLATES.map(t => {
          const active = selectedTemplate === t.type;
          return (
            <TouchableOpacity
              key={t.type}
              style={[styles.templateCard, active && { borderColor: t.color, borderWidth: 2, backgroundColor: t.color + '10' }]}
              onPress={() => setSelectedTemplate(t.type)}
              activeOpacity={0.8}>
              <View style={[styles.templateIcon, { backgroundColor: t.color + '20' }]}>
                <MaterialCommunityIcons name={t.icon} size={24} color={t.color} />
              </View>
              <Text style={[styles.templateLabel, active && { color: t.color }]}>{t.label}</Text>
              <Text style={styles.templateDesc}>{t.description}</Text>
              {active && (
                <View style={[styles.checkBadge, { backgroundColor: t.color }]}>
                  <MaterialCommunityIcons name="check" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Offer */}
      <Text style={styles.sectionLabel}>What's the offer or goal?</Text>
      <TextInput
        style={styles.textArea}
        placeholder={currentTemplate?.placeholder ?? 'Describe what this campaign is about…'}
        placeholderTextColor={Colors.textDisabled}
        value={offer}
        onChangeText={setOffer}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Location */}
      <Text style={styles.sectionLabel}>Target Location</Text>
      <View style={styles.inputRow}>
        <MaterialCommunityIcons name="map-marker" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="e.g. New York, USA or United Kingdom"
          placeholderTextColor={Colors.textDisabled}
          value={location}
          onChangeText={setLocation}
        />
      </View>

      {/* Budget */}
      <Text style={styles.sectionLabel}>Daily Budget</Text>
      <View style={styles.row}>
        {BUDGET_OPTIONS.map(b => {
          const active = budgetRange === b.value;
          return (
            <TouchableOpacity
              key={b.value}
              style={[styles.budgetCard, active && styles.budgetCardActive]}
              onPress={() => setBudgetRange(b.value)}
              activeOpacity={0.8}>
              <MaterialCommunityIcons
                name={b.icon}
                size={20}
                color={active ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.budgetLabel, active && styles.budgetLabelActive]}>{b.label}</Text>
              <Text style={[styles.budgetRange, active && { color: Colors.primary }]}>{b.range}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Duration */}
      <Text style={styles.sectionLabel}>Duration</Text>
      <View style={styles.row}>
        {DURATION_OPTIONS.map(d => {
          const active = durationDays === d;
          return (
            <TouchableOpacity
              key={d}
              style={[styles.durationChip, active && styles.durationChipActive]}
              onPress={() => setDurationDays(d)}
              activeOpacity={0.8}>
              <Text style={[styles.durationText, active && styles.durationTextActive]}>
                {d}d
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateBtn, isLoading && styles.generateBtnDisabled]}
        onPress={handleGenerate}
        disabled={isLoading}
        activeOpacity={0.85}>
        {isLoading ? (
          <>
            <MaterialCommunityIcons name="loading" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>Generating Campaign…</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="creation" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>Generate Campaign</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: Spacing['4xl'] },

  header: { alignItems: 'center', marginBottom: Spacing.xl, paddingTop: Spacing.md },
  headerIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 20 },

  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  templateCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  templateIcon: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  templateLabel: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  templateDesc: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 90,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, height: 48, fontSize: Typography.fontSize.base, color: Colors.textPrimary },

  row: { flexDirection: 'row', gap: Spacing.sm },
  budgetCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  budgetCardActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceVariant },
  budgetLabel: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  budgetLabelActive: { color: Colors.primary },
  budgetRange: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },

  durationChip: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  durationChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  durationText: { fontSize: Typography.fontSize.base, fontWeight: '600', color: Colors.textPrimary },
  durationTextActive: { color: '#fff' },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing['2xl'],
    gap: Spacing.sm,
    ...Shadows.md,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { fontSize: Typography.fontSize.md, fontWeight: '700', color: '#fff' },
});
