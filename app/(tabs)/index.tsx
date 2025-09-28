import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { TimeSlotGrid } from '@/components/TimeSlotGrid';
import { getCurrentDateString, addDays, formatDateForDisplay } from '@/utils/timeUtils';

export default function TimelineScreen() {
  const [currentDate, setCurrentDate] = useState(getCurrentDateString());
  const [refreshKey, setRefreshKey] = useState(0);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = addDays(currentDate, direction === 'next' ? 1 : -1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(getCurrentDateString());
  };

  const handleDataChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const isToday = currentDate === getCurrentDateString();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateNavigation}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('prev')}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dateContainer} onPress={goToToday}>
            <Text style={styles.dateText}>{formatDateForDisplay(currentDate)}</Text>
            {!isToday && (
              <Text style={styles.todayHint}>Tap to go to today</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('next')}>
            <ChevronRight size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <TimeSlotGrid 
        key={`${currentDate}-${refreshKey}`}
        date={currentDate} 
        onDataChange={handleDataChange}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  todayHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});