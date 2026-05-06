import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppSelector } from '../../store';
import { useCreatePostMutation, useSchedulePostMutation } from '../../store/api/posts.api';
import { useGeneratePostMutation, useGenerateHashtagsMutation, useGenerateImageMutation } from '../../store/api/ai.api';
import { uploadImage } from '../../store/api/upload.api';
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

  // Media state
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageGenModalVisible, setImageGenModalVisible] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState('');

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [schedulePost] = useSchedulePostMutation();
  const [generatePost, { isLoading: isGenerating }] = useGeneratePostMutation();
  const [generateHashtags] = useGenerateHashtagsMutation();
  const [generateImage, { isLoading: isGeneratingImage }] = useGenerateImageMutation();

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    const localUri = result.assets[0].uri;
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadImage(localUri);
      setMediaUrls(prev => [...prev, uploadedUrl]);
    } catch {
      // If upload fails, use local URI as fallback (visible on this device only)
      setMediaUrls(prev => [...prev, localUri]);
      Alert.alert('Upload Notice', 'Image saved locally. Upload to server failed — it will be visible on this device only.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!imageGenPrompt.trim()) return;
    try {
      const result = await generateImage({ prompt: imageGenPrompt }).unwrap();
      setMediaUrls(prev => [...prev, result.data.imageUrl]);
      setImageGenModalVisible(false);
      setImageGenPrompt('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate image.';
      Alert.alert('Generation Failed', msg);
    }
  }, [imageGenPrompt, generateImage]);

  const handleRemoveImage = (url: string) => {
    setMediaUrls(prev => prev.filter(u => u !== url));
  };

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
      const generatedText = result.data.text;
      setAiGeneratedContent(generatedText);

      // Pre-fill image gen prompt from AI suggestion
      if (result.data.imagePrompt) {
        setImageGenPrompt(result.data.imagePrompt);
      }

      const hashtagResult = await generateHashtags({
        content: generatedText,
        industry: business.industry,
      }).unwrap();
      setAiHashtags(hashtagResult.data.hashtags);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate post. Please try again.';
      Alert.alert('Generation Failed', message);
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
        : hashtags.split(' ').map(h => h.trim()).filter(Boolean);

    try {
      await createPost({
        businessId: business.id,
        text: finalContent,
        hashtags: hashtagList,
        mediaUrls,
        platforms: selectedPlatforms,
        mode: activeTab === 'ai' ? 'ai' : 'manual',
        aiPrompt: activeTab === 'ai' ? aiPrompt : undefined,
      }).unwrap();
      Alert.alert('Success', 'Post published successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish post.';
      Alert.alert('Error', message);
    }
  }, [
    business, selectedPlatforms, activeTab, aiGeneratedContent, content,
    hashtags, aiHashtags, aiPrompt, mediaUrls, createPost, navigation,
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
              <Text style={[styles.charCount, charCount > charLimitForPlatforms && styles.charCountOver]}>
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
                  <Text style={[styles.toneLabel, selectedTone === tone.id && styles.toneLabelActive]}>
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
                <Text style={[styles.charCount, charCount > charLimitForPlatforms && styles.charCountOver]}>
                  {charCount}/{charLimitForPlatforms}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ── Media Section ── */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Photos</Text>
        <View style={styles.mediaActions}>
          <TouchableOpacity
            style={[styles.mediaBtn, isUploading && styles.mediaBtnDisabled]}
            onPress={handlePickImage}
            disabled={isUploading || mediaUrls.length >= 4}>
            {isUploading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Icon name="image-plus" size={20} color={Colors.primary} />
            )}
            <Text style={styles.mediaBtnText}>
              {isUploading ? 'Uploading…' : 'Attach Photo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mediaBtn, styles.mediaBtnAI, mediaUrls.length >= 4 && styles.mediaBtnDisabled]}
            onPress={() => setImageGenModalVisible(true)}
            disabled={mediaUrls.length >= 4}>
            <Icon name="creation" size={20} color={Colors.white} />
            <Text style={[styles.mediaBtnText, { color: Colors.white }]}>Generate AI Photo</Text>
          </TouchableOpacity>
        </View>

        {mediaUrls.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaStrip}>
            {mediaUrls.map(url => (
              <View key={url} style={styles.mediaThumbWrap}>
                <Image source={{ uri: url }} style={styles.mediaThumb} resizeMode="cover" />
                <TouchableOpacity style={styles.mediaRemoveBtn} onPress={() => handleRemoveImage(url)}>
                  <Icon name="close-circle" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        {mediaUrls.length >= 4 && (
          <Text style={styles.mediaLimitText}>Maximum 4 images per post</Text>
        )}

        {/* Platform Selector */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Publish To</Text>
        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onToggle={platform =>
            setSelectedPlatforms(prev =>
              prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform],
            )
          }
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Save as Draft"
            onPress={() => {
              if (!business) return;
              const draftHashtags = activeTab === 'ai'
                ? aiHashtags
                : hashtags.split(' ').map(h => h.trim()).filter(Boolean);
              createPost({
                businessId: business.id,
                text: currentContent,
                hashtags: draftHashtags,
                mediaUrls,
                platforms: selectedPlatforms,
                mode: activeTab === 'ai' ? 'ai' : 'manual',
                aiPrompt: activeTab === 'ai' ? aiPrompt : undefined,
              })
                .unwrap()
                .then(() => navigation.goBack())
                .catch((err: unknown) => {
                  const message = err instanceof Error ? err.message : 'Failed to save draft.';
                  Alert.alert('Error', message);
                });
            }}
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

      {/* AI Image Generation Modal */}
      <Modal
        visible={imageGenModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImageGenModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Icon name="creation" size={22} color={Colors.primary} />
              <Text style={styles.modalTitle}>Generate AI Photo</Text>
              <TouchableOpacity onPress={() => setImageGenModalVisible(false)}>
                <Icon name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Describe the image you want DALL-E 3 to create for your post.
            </Text>
            <RNTextInput
              style={styles.modalInput}
              value={imageGenPrompt}
              onChangeText={setImageGenPrompt}
              placeholder="e.g. A vibrant summer sale banner with bright colors and modern typography..."
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.modalHint}>Tip: Be specific about style, colors, mood, and composition.</Text>
            <TouchableOpacity
              style={[styles.modalGenerateBtn, (!imageGenPrompt.trim() || isGeneratingImage) && styles.mediaBtnDisabled]}
              onPress={handleGenerateImage}
              disabled={!imageGenPrompt.trim() || isGeneratingImage}>
              {isGeneratingImage ? (
                <View style={styles.modalGeneratingRow}>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.modalGenerateBtnText}>Generating image…</Text>
                </View>
              ) : (
                <Text style={styles.modalGenerateBtnText}>Generate Image</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: {
    flexDirection: 'row', margin: Spacing.base,
    backgroundColor: Colors.gray100, borderRadius: Radius.lg, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: Radius.md,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['2xl'] },
  sectionLabel: {
    fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.textPrimary,
    marginBottom: Spacing.sm, marginTop: Spacing.base,
  },
  textAreaWrapper: { position: 'relative' },
  textArea: { minHeight: 120 },
  charCount: { textAlign: 'right', fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  charCountOver: { color: Colors.error },
  toneScroll: { marginBottom: Spacing.base },
  toneChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    marginRight: Spacing.sm, backgroundColor: Colors.surface,
  },
  toneChipActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceVariant },
  toneEmoji: { fontSize: 16 },
  toneLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  toneLabelActive: { color: Colors.primary, fontWeight: '600' },
  generateBtn: { marginBottom: Spacing.base },
  generatedBox: {
    backgroundColor: Colors.surfaceVariant, borderRadius: Radius.lg,
    padding: Spacing.base, borderWidth: 1, borderColor: Colors.primary + '40',
  },
  generatedHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.sm,
  },
  generatedTitle: {
    fontSize: Typography.fontSize.xs, fontWeight: '700', color: Colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  generatedContent: { fontSize: Typography.fontSize.base, color: Colors.textPrimary, lineHeight: 22 },
  generatedHashtags: { marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: '600' },

  // Media
  mediaActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  mediaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  mediaBtnAI: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  mediaBtnDisabled: { opacity: 0.45 },
  mediaBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.primary },
  mediaStrip: { marginBottom: Spacing.sm },
  mediaThumbWrap: { position: 'relative', marginRight: Spacing.sm },
  mediaThumb: {
    width: 100, height: 100, borderRadius: Radius.lg,
    backgroundColor: Colors.gray200,
  },
  mediaRemoveBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: Colors.white, borderRadius: Radius.full,
  },
  mediaLimitText: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.sm },

  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  actionBtn: { flex: 1 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'], padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modalTitle: { flex: 1, fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  modalSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.base },
  modalInput: {
    backgroundColor: Colors.surfaceVariant, borderRadius: Radius.lg,
    padding: Spacing.base, fontSize: Typography.fontSize.base,
    color: Colors.textPrimary, minHeight: 100,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  modalHint: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.base },
  modalGenerateBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: Spacing.base, alignItems: 'center',
  },
  modalGeneratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalGenerateBtnText: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.white },
});

export default CreatePostScreen;
