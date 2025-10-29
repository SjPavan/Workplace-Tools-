import 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import RootNavigator from '@/navigation/RootNavigator';
import { usePushNotifications } from '@/services/notifications';
import { initializeDatabase } from '@/services/database';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f5f5f5'
  }
};

const AppProviders: React.FC = () => {
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  usePushNotifications();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        await initializeDatabase();
      } catch (error) {
        console.warn('Failed to initialize the local database', error);
      } finally {
        setIsDatabaseReady(true);
      }
    };

    boot();
  }, []);

  useEffect(() => {
    if (isDatabaseReady) {
      hydrateAuth();
    }
  }, [hydrateAuth, isDatabaseReady]);

  if (!isAuthHydrated) {
    return (
      <GestureHandlerRootView style={styles.loaderContainer}>
        <SafeAreaProvider>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default AppProviders;

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  loaderContainer: {
    flex: 1
  },
  loaderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
