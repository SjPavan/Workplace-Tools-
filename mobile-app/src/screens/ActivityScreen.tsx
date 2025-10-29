import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const staticActivities = [
  {
    id: 'sync',
    title: 'Background sync prepared',
    description: 'React Query hydration wiring is ready for remote APIs.'
  },
  {
    id: 'notifications',
    title: 'FCM registration hook',
    description:
      'Device tokens are captured so push notifications can be connected to Supabase edge functions.'
  },
  {
    id: 'database',
    title: 'SQLite cache online',
    description: 'Persistent kv-store hydrates auth details across cold launches.'
  }
];

const ActivityScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Latest Activity</Text>
      <FlatList
        data={staticActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

export default ActivityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5'
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6
  },
  description: {
    fontSize: 15,
    color: '#4b5563'
  },
  separator: {
    height: 12
  }
});
