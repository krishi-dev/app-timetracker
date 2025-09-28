import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { generateTimeSlots, formatTime } from '@/utils/timeUtils';
import { getTimeLogsForDate, getCategories, bulkLogTime, deleteTimeLog } from '@/services/database';
import { Category, TimeLog, TimeSlot } from '@/types/database';

interface TimeSlotGridProps {
  date: string;
  onDataChange: () => void;
}

export function TimeSlotGrid({ date, onDataChange }: TimeSlotGridProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingSlots, setPendingSlots] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logs, cats] = await Promise.all([
        getTimeLogsForDate(date),
        getCategories()
      ]);
      
      setCategories(cats);
      
      const slots = generateTimeSlots().map(time => {
        const log = logs.find(l => l.start_time === time);
        const category = log ? cats.find(c => c.id === log.category_id) : undefined;
        
        return {
          time,
          category,
          isSelected: false,
        };
      });
      
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      Alert.alert('Error', 'Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotPress = (time: string) => {
    if (isSelecting) {
      setSelectedSlots(prev => 
        prev.includes(time) 
          ? prev.filter(t => t !== time)
          : [...prev, time]
      );
    } else {
      // Single slot assignment
      const slot = timeSlots.find(s => s.time === time);
      if (slot?.category) {
        // Delete existing log
        Alert.alert(
          'Remove Time Log',
          `Remove ${slot.category.name} from ${formatTime(time)}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteTimeLog(date, time);
                  await loadData();
                  onDataChange();
                } catch (error) {
                  Alert.alert('Error', 'Failed to remove time log');
                }
              }
            }
          ]
        );
      } else {
        // Show category selection
        showCategorySelection([time]);
      }
    }
  };

  const startBulkSelection = () => {
    setIsSelecting(true);
    setSelectedSlots([]);
  };

  const cancelBulkSelection = () => {
    setIsSelecting(false);
    setSelectedSlots([]);
  };

  const showCategorySelection = (slots: string[]) => {
    if (categories.length === 0) {
      Alert.alert('No Categories', 'Please create some categories first');
      return;
    }

    setPendingSlots(slots);
    setShowCategoryModal(true);
  };

  const handleCategorySelect = async (categoryId: number) => {
    try {
      await bulkLogTime(date, pendingSlots, categoryId);
      await loadData();
      onDataChange();
      setIsSelecting(false);
      setSelectedSlots([]);
      setShowCategoryModal(false);
      setPendingSlots([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to log time');
    }
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setPendingSlots([]);
  };

  const assignSelectedSlots = () => {
    if (selectedSlots.length === 0) {
      Alert.alert('No Selection', 'Please select some time slots first');
      return;
    }
    showCategorySelection(selectedSlots);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading time slots...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {isSelecting ? `${selectedSlots.length} slots selected` : 'Tap to assign category'}
        </Text>
        <View style={styles.headerButtons}>
          {!isSelecting ? (
            <TouchableOpacity style={styles.bulkButton} onPress={startBulkSelection}>
              <Text style={styles.bulkButtonText}>Bulk Select</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.assignButton} onPress={assignSelectedSlots}>
                <Text style={styles.assignButtonText}>Assign</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelBulkSelection}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.grid}>
          {timeSlots.map((slot, index) => (
            <TouchableOpacity
              key={slot.time}
              style={[
                styles.slot,
                slot.category && { backgroundColor: slot.category.color },
                selectedSlots.includes(slot.time) && styles.selectedSlot,
              ]}
              onPress={() => handleSlotPress(slot.time)}
              activeOpacity={0.7}
            >
              <View style={styles.slotContent}>
                <Text style={[
                  styles.timeText,
                  slot.category && styles.timeTextWithCategory
                ]}>
                  {formatTime(slot.time)}
                </Text>
                {slot.category && (
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {slot.category.name}
                  </Text>
                )}
              </View>
              {selectedSlots.includes(slot.time) && (
                <View style={styles.selectionOverlay} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showCategoryModal}
        onRequestClose={closeCategoryModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeCategoryModal}>
          <Pressable style={styles.categoryModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              Select Category ({pendingSlots.length} slot{pendingSlots.length > 1 ? 's' : ''})
            </Text>
            <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryOption}
                  onPress={() => handleCategorySelect(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelModalButton} onPress={closeCategoryModal}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  bulkButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  assignButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  assignButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6b7280',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    padding: 16,
    gap: 2,
  },
  slot: {
    height: 45,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  slotContent: {
    flex: 1,
    justifyContent: 'center',
  },
  selectedSlot: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 6,
  },
  timeText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  timeTextWithCategory: {
    color: '#ffffff',
  },
  categoryText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  categoryModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  cancelModalButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});