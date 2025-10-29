import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getLocalProfile } from '@/services/profile';

const HomeScreen: React.FC = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['local-profile'],
    queryFn: getLocalProfile
  });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />
      }
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Offline Profile Snapshot</Text>
        <Text style={styles.description}>
          The mobile scaffold keeps lightweight profile details in a local SQLite store so the
          application can hydrate instantly when a user returns.
        </Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last login:</Text>
          <Text style={styles.detailValue}>{data?.lastLogin ?? 'Not recorded yet'}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f5f5f5'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  detailLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600'
  }
});
