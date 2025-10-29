import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import ActivityScreen from '@/screens/ActivityScreen';
import HomeScreen from '@/screens/HomeScreen';
import LoginScreen from '@/screens/LoginScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#2563eb',
      tabBarLabelStyle: {
        fontWeight: '600'
      }
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarLabel: 'Home', tabBarIcon: () => <Text>🏠</Text> }}
    />
    <Tab.Screen
      name="Activity"
      component={ActivityScreen}
      options={{ tabBarLabel: 'Activity', tabBarIcon: () => <Text>📈</Text> }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ tabBarLabel: 'Settings', tabBarIcon: () => <Text>⚙️</Text> }}
    />
  </Tab.Navigator>
);

const RootNavigator = () => {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user));

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
