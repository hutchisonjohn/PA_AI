/**
 * Chat History Modal Component
 * 
 * Displays user's chat history in a beautiful, mobile-responsive modal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DartmouthAPI from '../services/DartmouthAPIService';
import LoggingService from '../services/LoggingService';

const ChatHistoryModal = ({ visible, onClose, userTimezone = 'Australia/Sydney' }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });
  const [loadingMore, setLoadingMore] = useState(false);

  // Load chat history when modal opens
  useEffect(() => {
    if (visible) {
      loadHistory();
    } else {
      // Reset state when modal closes
      setHistory([]);
      setError(null);
      setPagination({ total: 0, hasMore: false });
    }
  }, [visible]);

  const loadHistory = async (offset = 0, append = false) => {
    try {
      if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await DartmouthAPI.getChatHistory(50, offset);

      if (response.success) {
        if (append) {
          setHistory(prev => [...prev, ...response.history]);
        } else {
          setHistory(response.history);
        }
        setPagination(response.pagination || {});
      } else {
        throw new Error(response.error || 'Failed to load chat history');
      }
    } catch (err) {
      LoggingService.error('Error loading chat history:', err);
      setError(err.message || 'Failed to load chat history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      loadHistory(history.length, true);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      // Format as date
      return date.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch (e) {
      return dateString;
    }
  };

  const renderHistoryItem = ({ item, index }) => (
    <View style={styles.historyItem}>
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Ionicons name="person-circle-outline" size={16} color="#007AFF" />
          <Text style={styles.questionLabel}>You</Text>
          <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.questionText}>{item.question}</Text>
      </View>

      <View style={styles.answerContainer}>
        <View style={styles.answerHeader}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#34C759" />
          <Text style={styles.answerLabel}>McCarthy</Text>
        </View>
        <Text style={styles.answerText}>{item.answer}</Text>
      </View>

      {index < history.length - 1 && <View style={styles.separator} />}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No Chat History</Text>
      <Text style={styles.emptyText}>
        Your conversations with McCarthy will appear here
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
      <Text style={styles.errorTitle}>Failed to Load History</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadHistory()}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="time-outline" size={24} color="#000000" />
              <Text style={styles.headerTitle}>Chat History</Text>
              {pagination.total > 0 && (
                <Text style={styles.headerSubtitle}>({pagination.total})</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading && history.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading history...</Text>
              </View>
            ) : error && history.length === 0 ? (
              renderError()
            ) : history.length === 0 ? (
              renderEmpty()
            ) : (
              <FlatList
                data={history}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  loadingMore ? (
                    <View style={styles.loadingMoreContainer}>
                      <ActivityIndicator size="small" color="#007AFF" />
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    maxHeight: 800,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  historyItem: {
    marginBottom: 16,
  },
  questionContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  timestamp: {
    fontSize: 11,
    color: '#8E8E93',
    marginLeft: 'auto',
  },
  questionText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 20,
  },
  answerContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 6,
  },
  answerText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatHistoryModal;

