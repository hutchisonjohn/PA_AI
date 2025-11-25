/**
 * Timezone Picker Component
 * 
 * Displays Australian timezones with current time preview
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import TimezoneService from '../services/TimezoneService';

const TimezonePicker = ({ 
  selectedTimezone, 
  onTimezoneChange, 
  style,
  showCurrentTime = true 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const timezones = TimezoneService.getAustralianTimezones();

  // Update current time display
  useEffect(() => {
    if (selectedTimezone && showCurrentTime) {
      const updateTime = () => {
        const localTime = TimezoneService.getUserLocalTime(selectedTimezone);
        setCurrentTime(localTime.toFormat('HH:mm:ss'));
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedTimezone, showCurrentTime]);

  const selectedTimezoneData = timezones.find(tz => tz.value === selectedTimezone);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.pickerContent}>
          <Text style={styles.label}>Timezone</Text>
          <Text style={styles.selectedValue}>
            {selectedTimezoneData?.label || selectedTimezone || 'Select timezone'}
          </Text>
          {showCurrentTime && currentTime && (
            <Text style={styles.currentTime}>Current time: {currentTime}</Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Timezone</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={timezones}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedTimezone;
                const localTime = TimezoneService.getUserLocalTime(item.value);
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.timezoneItem,
                      isSelected && styles.timezoneItemSelected,
                    ]}
                    onPress={() => {
                      onTimezoneChange(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <View style={styles.timezoneItemContent}>
                      <Text style={[
                        styles.timezoneLabel,
                        isSelected && styles.timezoneLabelSelected,
                      ]}>
                        {item.label}
                      </Text>
                      <Text style={styles.timezoneOffset}>{item.offset}</Text>
                    </View>
                    {showCurrentTime && (
                      <Text style={styles.timezoneTime}>
                        {localTime.toFormat('HH:mm')}
                      </Text>
                    )}
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#FFFFFF',
  },
  pickerContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  selectedValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  currentTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  chevron: {
    fontSize: 24,
    color: '#8E8E93',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  timezoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  timezoneItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  timezoneItemContent: {
    flex: 1,
  },
  timezoneLabel: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  timezoneLabelSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  timezoneOffset: {
    fontSize: 12,
    color: '#8E8E93',
  },
  timezoneTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 10,
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default TimezonePicker;

