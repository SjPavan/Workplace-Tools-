import { ConfigContext, ExpoConfig } from 'expo/config';

type Extra = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  easProjectId: string;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const extra: Extra = {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    easProjectId: process.env.EAS_PROJECT_ID ?? ''
  };

  return {
    ...config,
    name: 'Mobile Scaffold',
    slug: 'mobile-app',
    version: '1.0.0',
    scheme: 'mobileapp',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.mobileapp'
    },
    android: {
      package: 'com.mobileapp',
      versionCode: 1,
      googleServicesFile: './android/app/google-services.json',
      permissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.WAKE_LOCK'
      ]
    },
    extra,
    plugins: [
      'expo-sqlite',
      'expo-notifications'
    ]
  };
};
