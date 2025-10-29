import React from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { useDeviceStore } from '@/store/deviceStore';

const SettingsScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const pushToken = useDeviceStore((state) => state.pushToken);

  const handleSignOut = async () => {
    await signOut();
    Alert.alert('Signed out', 'Your session has been cleared from the device.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? 'Unknown'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>User ID</Text>
          <Text style={styles.value}>{user?.id ?? 'N/A'}</Text>
        </View>
        <Button title="Sign out" onPress={handleSignOut} />
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Device</Text>
        <Text style={styles.label}>Push token (FCM)</Text>
        <Text selectable style={styles.token}>
          {pushToken ?? 'Pending registration. Approve push notifications to view the token.'}
        </Text>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
    gap: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 16
  },
  heading: {
    fontSize: 20,
    fontWeight: '600'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: 16,
    color: '#4b5563'
  },
  value: {
    fontSize: 16,
    fontWeight: '600'
  },
  token: {
    fontSize: 13,
    color: '#2563eb'
  }
});
