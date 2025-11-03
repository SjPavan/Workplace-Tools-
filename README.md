# Mobile App Scaffold

This repository now contains an Expo bare React Native scaffold targeting Android. The project lives in the [`mobile-app/`](mobile-app) directory and comes pre-configured with TypeScript, React Query, Zustand, SQLite-backed offline storage, a Supabase client, Firebase Cloud Messaging (FCM), and a stack + bottom tab navigation layout.

## Getting started

1. Change into the mobile application directory and install dependencies:

   ```bash
   cd mobile-app
   npm install
   ```

2. Provide credentials through environment variables (the Expo CLI automatically exposes variables prefixed with `EXPO_PUBLIC_`):

   ```bash
   export EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   export EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   export EAS_PROJECT_ID="your-eas-project-id"
   ```

3. Copy your Firebase configuration into place:

   ```bash
   cp android/app/google-services.example.json android/app/google-services.json
   # Replace the placeholder values with the file downloaded from Firebase console.
   ```

4. Start the application in development mode:

   ```bash
   npm run android
   # Or use: npm start
   ```

## Debug APK generation (iQOO Z7 Pro profile)

The repository includes an EAS build profile tuned for the iQOO Z7 Pro. It emits a lightweight debug APK that can be sideloaded directly onto the device.

```bash
cd mobile-app
npm install
npx eas build -p android --profile iqooZ7Pro
```

For a fully offline build without EAS, you can also rely on Gradle directly:

```bash
cd mobile-app/android
./gradlew assembleDebug
```

The resulting APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Testing

All unit tests run through Jest and the Detox smoke suite can be launched once a local Android emulator is available.

```bash
npm test
npm run detox:build:android
npm run detox:test:android
```

## Project highlights

- **TypeScript-first setup** with path aliases and strict mode enabled.
- **State & networking** handled via React Query and Zustand, including hydration from a SQLite key-value store.
- **Supabase integration** prepared through a configurable client and mocked fallbacks for offline iteration.
- **Firebase Cloud Messaging** wired for token registration and stored in Zustand so the Settings tab surfaces the device token.
- **Navigation skeleton** combining a stack navigator with a bottom tab bar covering Home, Activity, and Settings destinations.
- **End-to-end automation** powered by Detox with a smoke test that asserts the login experience is rendered on boot.

Refer to the documentation inside `mobile-app` for further customization options.
