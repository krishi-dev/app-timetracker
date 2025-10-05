import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { generateTimeSlots, formatTime, getCurrentDateString } from '@/utils/timeUtils';
import { getTimeLogsForDate, getCategories, logTime, bulkLogTime, deleteTimeLog } from '@/services/database';
import { Category, TimeLog, TimeSlot } from '@/types/database';

const screenHeight = Dimensions.get('window').height;
const SLOT_HEIGHT = 47;

interface TimeSlotGridProps {
  date: string;
  onDataChange: () => void;
}

export function TimeSlotGrid({ date, onDataChange }: TimeSlotGridProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadData();
    updateCurrentTimePosition();
    
    // Update current time position every minute
    const interval = setInterval(updateCurrentTimePosition, 60000);
    return () => clearInterval(interval);
  }, [date]);

  useEffect(() => {
    // Auto-scroll to current time for today's date
    if (date === getCurrentDateString() && currentTimePosition !== null && scrollViewRef.current) {
      setTimeout(() => {
        const centerOffset = currentTimePosition - (screenHeight / 2);
        const maxOffset = (timeSlots.length * SLOT_HEIGHT) - screenHeight;
        const scrollOffset = Math.max(0, Math.min(centerOffset, maxOffset));
        
        scrollViewRef.current?.scrollTo({
          y: scrollOffset,
          animated: true,
        });
      }, 300);
    }
  }, [date, currentTimePosition, timeSlots.length]);

  const updateCurrentTimePosition = () => {
    if (date === getCurrentDateString()) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Calculate position based on time slots (each slot is 15 minutes)
      const totalMinutes = hours * 60 + minutes;
      const slotIndex = Math.floor(totalMinutes / 15);
      const minutesIntoSlot = totalMinutes % 15;
      
      // Position within the slot (0-1)
      const positionInSlot = minutesIntoSlot / 15;
      const position = (slotIndex + positionInSlot) * SLOT_HEIGHT;
      
      setCurrentTimePosition(position);
    } else {
      setCurrentTimePosition(null);
    }
  };

  const loadData = async () => {
    try {
      const slots = generateTimeSlots();
      const logs = await getTimeLogsForDate(date);
      const cats = await getCategories();
      
      const slotsWithCategories = slots.map(time => {
        const log = logs.find(l => l.start_time === time);
        const category = log ? cats.find(c => c.id === log.category_id) : undefined;
        return { time, category };
      });
      
      setTimeSlots(slotsWithCategories);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSlotPress = (time: string) => {
    if (isDragging) return;
    
    const slot = timeSlots.find(s => s.time === time);
    if (slot?.category) {
      // Show delete confirmation for filled slots
      Alert.alert(
        'Remove Time Log',
        `Remove ${slot.category.name} from ${formatTime(time)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => handleDeleteTimeLog(time)
          }
        ]
      );
    } else {
      // Single slot selection
      setSelectedSlots([time]);
      setModalVisible(true);
    }
  };

  const handleLongPress = (time: string, index: number) => {
    const slot = timeSlots.find(s => s.time === time);
    if (slot?.category) {
      // For filled slots, show delete confirmation
      handleSlotPress(time);
    } else {
      // Start drag selection for empty slots
      setIsDragging(true);
      setDragStartIndex(index);
      setSelectedSlots([time]);
    }
  };

  const handleSlotMove = (time: string, index: number) => {
    if (isDragging && dragStartIndex !== null) {
      // Only allow downward selection
      if (index >= dragStartIndex) {
        const rangeSlots = timeSlots
          .slice(dragStartIndex, index + 1)
          .filter(slot => !slot.category) // Only select empty slots
          .map(slot => slot.time);
        setSelectedSlots(rangeSlots);
      }
    }
  };

  const handleDragEnd = () => {
    // Show modal if we have selected slots
    if (selectedSlots.length > 0) {
      setModalVisible(true);
    }
    
    setIsDragging(false);
    setDragStartIndex(null);
  };

  const handleCategorySelect = async (categoryId: number) => {
    try {
      if (selectedSlots.length === 1) {
        const [hours, minutes] = selectedSlots[0].split(':').map(Number);
        const endMinutes = minutes + 15;
        const endHours = endMinutes >= 60 ? hours + 1 : hours;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
        
        await logTime(date, selectedSlots[0], endTime, categoryId);
      } else {
        await bulkLogTime(date, selectedSlots, categoryId);
      }
      
      await loadData();
      onDataChange();
      setModalVisible(false);
      setSelectedSlots([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to log time');
    }
  };

  const handleDeleteTimeLog = async (time: string) => {
    try {
      await deleteTimeLog(date, time);
      await loadData();
      onDataChange();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete time log');
    }
  };

  const handleCancel = () => {
    setSelectedSlots([]);
    setModalVisible(false);
    setIsDragging(false);
    setDragStartIndex(null);
  };

  const getHeaderText = () => {
    if (selectedSlots.length > 0) {
      return `${selectedSlots.length} slot${selectedSlots.length > 1 ? 's' : ''} selected`;
    }
    return 'Tap to assign • Long press & drag to select multiple';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{getHeaderText()}</Text>
        {selectedSlots.length > 0 && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timeGrid}>
          {/* Current time indicator */}
          {currentTimePosition !== null && (
            <View 
              style={[
                styles.currentTimeLine,
                { top: currentTimePosition }
              ]} 
            />
          )}
          
          {timeSlots.map((slot, index) => (
            <TouchableOpacity
              key={slot.time}
              style={[
                styles.slot,
                slot.category && { backgroundColor: slot.category.color },
                selectedSlots.includes(slot.time) && styles.selectedSlot,
                isDragging && styles.draggingMode,
              ]}
              onPress={() => handleSlotPress(slot.time)}
              onLongPress={() => handleLongPress(slot.time, index)}
              onPressIn={() => handleSlotMove(slot.time, index)}
              onPressOut={() => {
                if (isDragging) {
                  // Handle drag end when finger lifts
                  handleDragEnd();
                }
              }}
              delayLongPress={500}
            >
              <View style={styles.slotContent}>
                <Text style={styles.timeText}>{formatTime(slot.time)}</Text>
                {slot.category && (
                  <Text style={styles.categoryText}>{slot.category.name}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              Select Category
              {selectedSlots.length > 1 && (
                <Text style={styles.slotCount}> ({selectedSlots.length} slots)</Text>
              )}
            </Text>
            
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryButton, { backgroundColor: category.color }]}
                  onPress={() => handleCategorySelect(category.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryButtonText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  timeGrid: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  currentTimeLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#ef4444',
    zIndex: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  slot: {
    height: SLOT_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  selectedSlot: {
    borderColor: '#3b82f6',
    borderWidth: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  draggingMode: {
    opacity: 0.8,
  },
  slotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  categoryText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  slotCount: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});