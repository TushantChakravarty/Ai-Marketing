import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { useCreatePostMutation, useSchedulePostMutation } from '../../store/api/posts.api';
import { useGeneratePostMutation, useGenerateHashtagsMutation } from '../../store/api/ai.api';
import type { PostsStackParamList, Platform as PlatformType } from '../../types';
import PlatformSelector from '../../components/posts/PlatformSelector';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import { TONES, PLATFORMS } from '../../config/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

type RouteProps = RouteProp<PostsStackParamList, 'CreatePost'>;
type NavProps = StackNavigationProp<PostsStackParamList, 'CreatePost'>;

type TabType = 'manual' | 'ai';

const CreatePostScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const business = useAppSelector(s => s.business.currentBusiness);

  const initialMode = route.params?.mode ?? 'manual';
  const [activeTab, setActiveTab] = useState<TabType>(initialMode);

  // Manual state
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([]);

  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>('professional');
  const [aiGeneratedContent, setAiGeneratedContent] = useState('');
  const [aiHashtags, setAiHashtags] = useState<string[]>([]);

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [schedulePost] = useSchedulePostMutation();
  const [generatePost, { isLoading: isGenerating }] = useGeneratePostMutation();
  const [generateHashtags, { isLoading: isGeneratingHashtags }] = useGenerateHashtagsMutation();

  const handleGeneratePost = useCallback(async () => {
    if (!aiPrompt.trim()) {
      Alert.alert('Missing Info', 'Please describe your post first.');
      return;
    }
    if (!business) {
      Alert.alert('No Business', 'Please complete business setup first.');
      return;
    }
    try {
      const result = await generatePost({
        businessId: business.id,
        prompt: aiPrompt,
        platform: selectedPlatforms[0] ?? 'instagram',
        tone: selectedTone,
      }).unwrap();
      setAiGeneratedContent(result.data.text);

      // Also generate hashtags
      const hashtagResult = await generateHashtags({
        content: result.data.content,
        industry: business.industry,
      }).unwrap();
      setAiHashtags(hashtagResult.data.hashtags);
    } catch {
      Alert.alert('Error', 'Failed to generate post. Please try again.');
    }
  }, [aiPrompt, business, selectedTone, selectedPlatforms, generatePost, generateHashtags]);

  const handlePublish = useCallback(async () => {
    if (!business || selectedPlatforms.length === 0) {
      Alert.alert('Missing Info', 'Please select at least one platform.');
      return;
    }
    const finalContent = activeTab === 'ai' ? aiGeneratedContent : content;
    if (!finalContent.trim()) {
      Alert.alert('Missing Content', 'Please add some content for your post.');
      return;
    }
    const hashtagList =
      activeTab === 'ai'
        ? aiHashtags
        : hashtags
            .split(' ')
            .map(h => h.trim())
            .filter(Boolean);

    try {
      await createPost({
        businessId: business.id,
        content: finalContent,
        hashtags: hashtagList,
        platforms: selectedPlatforms,
        isAiGenerated: activeTab === 'ai',
        prompt: activeTab === 'ai' ? aiPrompt : undefined,
      }).unwrap();
      Alert.alert('Success', 'Post published successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to publish post. Please try again.');
    }
  }, [
    business,
    selectedPlatforms,
    activeTab,
    aiGeneratedContent,
    content,
    hashtags,
    aiHashtags,
    aiPrompt,
    createPost,
    navigation,
  ]);

  const charLimitForPlatforms = selectedPlatforms.includes('twitter') ? 280 : 2200;
  const currentContent = activeTab === 'ai' ? aiGeneratedContent : content;
  const charCount = currentContent.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        {(['manual', 'ai'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Icon
              name={tab === 'manual' ? 'pencil' : 'robot'}
              size={16}
              color={activeTab === tab ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'manual' ? 'Manual' : 'AI Generate'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {activeTab === 'manual' ? (
          /* ── Manual Tab ── */
          <View>
            <Text style={styles.sectionLabel}>Post Content</Text>
            <View style={styles.textAreaWrapper}>
              <Input
                multiline
                numberOfLines={6}
                value={content}
                onChangeText={setContent}
                placeholder="What's on your mind? Share news, tips, or promotions..."
                style={styles.textArea}
              />
              <Text
                style={[
                  styles.charCount,
                  charCount > charLimitForPlatforms && styles.charCountOver,
                ]}>
                {charCount}/{charLimitForPlatforms}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Hashtags</Text>
            <Input
              value={hashtags}
              onChangeText={setHashtags}
              placeholder="#marketing #business #growth"
              label="Space-separated hashtags"
            />
          </View>
        ) : (
          /* ── AI Tab ── */
          <View>
            <Text style={styles.sectionLabel}>Describe Your Post</Text>
            <Input
              multiline
              numberOfLines={3}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder="e.g. Promote our new summer sale with 30% off all products..."
            />

            <Text style={styles.sectionLabel}>Tone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toneScroll}>
              {TONES.map(tone => (
                <TouchableOpacity
                  key={tone.id}
                  style={[styles.toneChip, selectedTone === tone.id && styles.toneChipActive]}
                  onPress={() => setSelectedTone(tone.id)}>
                  <Text style={styles.toneEmoji}>{tone.emoji}</Text>
                  <Text
                    style={[
                      styles.toneLabel,
                      selectedTone === tone.id && styles.toneLabelActive,
                    ]}>
                    {tone.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button
              label={isGenerating ? 'Generating...' : 'Generate Post'}
              onPress={handleGeneratePost}
              variant="primary"
              iconName="robot"
              disabled={!aiPrompt.trim() || isGenerating}
              isLoading={isGenerating}
              style={styles.generateBtn}
            />

            {aiGeneratedContent ? (
              <View style={styles.generatedBox}>
                <View style={styles.generatedHeader}>
                  <Text style={styles.generatedTitle}>AI Generated</Text>
                  <TouchableOpacity onPress={handleGeneratePost}>
                    <Icon name="refresh" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.generatedContent}>{aiGeneratedContent}</Text>
                {aiHashtags.length > 0 && (
                  <Text style={styles.generatedHashtags}>
                    {aiHashtags.map(h => `#${h}`).join(' ')}
                  </Text>
                )}
                <Text
                  style={[
                    styles.charCount,
                    charCount > charLimitForPlatforms && styles.charCountOver,
                  ]}>
                  {charCount}/{charLimitForPlatforms}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Platform Selector */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Publish To</Text>
        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onToggle={platform =>
            setSelectedPlatforms(prev =>
              prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform],
            )
          }
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Save as Draft"
            onPress={() =>
              createPost({
                businessId: business?.id ?? '',
                content: currentContent,
                platforms: selectedPlatforms,
                isAiGenerated: activeTab === 'ai',
              })
                .unwrap()
                .then(() => navigation.goBack())
                .catch(() => Alert.alert('Error', 'Failed to save draft.'))
            }
            variant="outline"
            style={styles.actionBtn}
            disabled={!currentContent.trim()}
          />
          <Button
            label="Publish Now"
            onPress={handlePublish}
            variant="primary"
            style={styles.actionBtn}
            isLoading={isCreating}
            disabled={!currentContent.trim() || selectedPlatforms.length === 0}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: {
    flexDirection: 'row',
    margin: Spacing.base,
    backgroundColor: Colors.gray100,
    borderRadius: Radius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['2xl'] },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  textAreaWrapper: { position: 'relative' },
  textArea: { minHeight: 120 },
  charCount: {
    textAlign: 'right',
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  charCountOver: { color: Colors.error },
  toneScroll: { marginBottom: Spacing.base },
  toneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  toneChipActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceVariant },
  toneEmoji: { fontSize: 16 },
  toneLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  toneLabelActive: { color: Colors.primary, fontWeight: '600' },
  generateBtn: { marginBottom: Spacing.base },
  generatedBox: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  generatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  generatedTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  generatedContent: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  generatedHashtags: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  actionBtn: { flex: 1 },
});

export default CreatePostScreen;
