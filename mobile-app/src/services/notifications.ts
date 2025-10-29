import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { useDeviceStore } from '@/store/deviceStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export const usePushNotifications = () => {
  const setPushToken = useDeviceStore((state) => state.setPushToken);

  useEffect(() => {
    const configureAsync = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX
        });
      }

      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device.');
        return;
      }

      const permissionResponse = await Notifications.getPermissionsAsync();
      let finalStatus = permissionResponse.status;

      if (finalStatus !== 'granted') {
        const requestResponse = await Notifications.requestPermissionsAsync();
        finalStatus = requestResponse.status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted.');
        return;
      }

      const expoConfig = Constants.expoConfig ?? Constants.manifest;
      const projectId =
        (expoConfig?.extra as { easProjectId?: string } | undefined)?.easProjectId || expoConfig?.projectId;

      if (projectId) {
        try {
          await Notifications.getExpoPushTokenAsync({ projectId });
        } catch (error) {
          console.warn('Failed to retrieve the Expo push token', error);
        }
      }

      try {
        const pushToken = await Notifications.getDevicePushTokenAsync();
        setPushToken(pushToken.data ?? null);
      } catch (error) {
        console.warn('Failed to retrieve the device push token', error);
      }
    };

    configureAsync();

    return () => {
      setPushToken(null);
    };
  }, [setPushToken]);
};
