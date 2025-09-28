import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dashboard } from '@/components/Dashboard';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Dashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
});