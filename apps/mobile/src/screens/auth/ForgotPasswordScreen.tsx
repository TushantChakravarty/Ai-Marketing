import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, Snackbar } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from '../../utils/validation.util';
import { AuthService } from '../../services/auth.service';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Colors, Spacing, Typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await AuthService.forgotPassword(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send reset link.';
      setSnackbar({ visible: true, message });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>📬</Text>
        <Text variant="headlineSmall" style={styles.successTitle}>
          Check your email
        </Text>
        <Text style={styles.successText}>
          We've sent a password reset link to your email address. Check your
          inbox and follow the instructions.
        </Text>
        <Button
          label="Back to Login"
          onPress={() => navigation.navigate('Login')}
          variant="primary"
          fullWidth
          style={styles.backBtn}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        <Text variant="headlineMedium" style={styles.title}>
          Forgot password?
        </Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email Address"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="email-outline"
              error={errors.email?.message}
            />
          )}
        />

        <Button
          label="Send Reset Link"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />
      </View>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
        duration={4000}
        style={styles.snackbar}>
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  backLink: {
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
    alignSelf: 'flex-start',
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  icon: { fontSize: 52 },
  title: {
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * 1.6,
    marginBottom: Spacing.xl,
  },
  submitBtn: { marginTop: Spacing.sm },
  snackbar: { backgroundColor: Colors.error },
  // Success
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.base,
  },
  successEmoji: { fontSize: 64 },
  successTitle: {
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * 1.6,
    maxWidth: 300,
    marginBottom: Spacing.lg,
  },
  backBtn: { marginTop: Spacing.lg },
});

export default ForgotPasswordScreen;
