import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Download, Trash2, Info, HelpCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

export default function SettingsScreen() {
  const handleExportData = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('timetracker.db');
      
      // Get all data
      const categories = await db.getAllAsync('SELECT * FROM categories');
      const timeLogs = await db.getAllAsync('SELECT * FROM time_logs');
      
      const exportData = {
        categories,
        timeLogs,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };
      
      // In a real app, you'd use file system APIs to save this
      console.log('Export data:', JSON.stringify(exportData, null, 2));
      
      Alert.alert(
        'Data Export',
        'Export data has been logged to console. In a production app, this would save to device storage or share via email.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your time tracking data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await SQLite.openDatabaseAsync('timetracker.db');
              await db.execAsync('DELETE FROM time_logs');
              await db.execAsync('DELETE FROM categories');
              
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Clear data error:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'About Time Tracker',
      'A comprehensive time tracking app that helps you monitor your daily activities in 15-minute intervals.\n\nVersion 1.0.0\nBuilt with Expo and React Native',
      [{ text: 'OK' }]
    );
  };

  const showHelp = () => {
    Alert.alert(
      'How to Use',
      '• Timeline: Tap time slots to assign categories, or use bulk selection for multiple slots\n\n• Dashboard: View your time distribution with charts and insights\n\n• Categories: Create and manage custom categories with colors\n\n• Each slot represents 15 minutes of time\n\n• Unlogged time shows periods without assigned categories',
      [{ text: 'Got it!' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <View style={styles.settingLeft}>
              <Download size={20} color="#3b82f6" />
              <Text style={styles.settingLabel}>Export Data</Text>
            </View>
            <Text style={styles.settingDescription}>Export all your time tracking data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearAllData}>
            <View style={styles.settingLeft}>
              <Trash2 size={20} color="#ef4444" />
              <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Clear All Data</Text>
            </View>
            <Text style={styles.settingDescription}>Permanently delete all data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={showHelp}>
            <View style={styles.settingLeft}>
              <HelpCircle size={20} color="#6b7280" />
              <Text style={styles.settingLabel}>Help & Guide</Text>
            </View>
            <Text style={styles.settingDescription}>Learn how to use the app</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={showAbout}>
            <View style={styles.settingLeft}>
              <Info size={20} color="#6b7280" />
              <Text style={styles.settingLabel}>About</Text>
            </View>
            <Text style={styles.settingDescription}>App version and information</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Time Tracker v1.0.0{'\n'}
            Built with React Native & Expo
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 32,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});