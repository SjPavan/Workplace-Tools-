import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { signInWithEmail } from '@/services/auth';
import { updateLastLogin } from '@/services/profile';
import { AuthUser, useAuthStore } from '@/store/authStore';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setUser = useAuthStore((state) => state.setUser);

  const isDisabled = useMemo(() => !email || !password, [email, password]);

  const updateSession = async (user: AuthUser) => {
    await updateLastLogin();
    await setUser(user);
  };

  const { mutate, isPending, error } = useMutation({
    mutationKey: ['sign-in'],
    mutationFn: async () => {
      const user = await signInWithEmail({ email, password });
      await updateSession(user);
    }
  });

  const handleSubmit = () => {
    if (!isDisabled) {
      mutate();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title} testID="login-title">
          Sign in to continue
        </Text>
        <Text style={styles.subtitle}>
          Connect to Supabase-backed services with React Query, Zustand, and offline persistence already wired up.
        </Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            placeholder="you@example.com"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            testID="login-email"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            placeholder="Enter your password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            testID="login-password"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          style={[styles.button, isDisabled || isPending ? styles.buttonDisabled : null]}
          onPress={handleSubmit}
          disabled={isDisabled || isPending}
          testID="login-submit"
        >
          {isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>
        {error && (
          <Text style={styles.errorText} testID="login-error">
            {(error as Error).message}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827'
  },
  subtitle: {
    fontSize: 15,
    color: '#4b5563'
  },
  inputGroup: {
    gap: 6
  },
  label: {
    fontSize: 14,
    color: '#6b7280'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd'
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 17
  },
  errorText: {
    color: '#ef4444'
  }
});
