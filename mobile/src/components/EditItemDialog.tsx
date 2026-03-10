import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Goal, Task, Habit } from '../types/models';
import { useSettings } from '../contexts/SettingsContext';

type ItemType = 'goal' | 'task' | 'habit';

interface EditItemDialogProps {
  visible: boolean;
  onClose: () => void;
  item: Goal | Task | Habit | null;
  itemType: ItemType | null;
  goals?: Goal[];
  onSave: (type: ItemType, id: string, updates: any) => Promise<void>;
  onDelete?: (type: ItemType, id: string) => Promise<void>;
}

export default function EditItemDialog({
  visible,
  onClose,
  item,
  itemType,
  goals = [],
  onSave,
  onDelete
}: EditItemDialogProps) {
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isToday, setIsToday] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [timerMinutes, setTimerMinutes] = useState<string>('');
  const [frequencyTarget, setFrequencyTarget] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Color palette
  const colorPalette = [
    { name: 'blue', color: '#3B82F6' },
    { name: 'sky', color: '#0EA5E9' },
    { name: 'cyan', color: '#06B6D4' },
    { name: 'teal', color: '#14B8A6' },
    { name: 'emerald', color: '#10B981' },
    { name: 'green', color: '#22C55E' },
    { name: 'lime', color: '#84CC16' },
    { name: 'yellow', color: '#EAB308' },
    { name: 'amber', color: '#F59E0B' },
    { name: 'orange', color: '#F97316' },
    { name: 'red', color: '#EF4444' },
    { name: 'rose', color: '#F43F5E' },
    { name: 'pink', color: '#EC4899' },
    { name: 'fuchsia', color: '#D946EF' },
    { name: 'purple', color: '#A855F7' },
    { name: 'violet', color: '#8B5CF6' },
    { name: 'indigo', color: '#6366F1' },
    { name: 'slate', color: '#64748B' },
    { name: 'zinc', color: '#71717A' },
    { name: 'stone', color: '#78716C' },
  ];

  // Populate form when item changes
  useEffect(() => {
    if (item && visible) {
      setTitle((item as any).title || (item as any).name || '');
      setNotes((item as any).notes || (item as any).description || '');

      if ('isToday' in item) {
        setIsToday(item.isToday || false);
      }

      if ('goalId' in item) {
        setSelectedGoalId(item.goalId || undefined);
      }

      // Set timer for tasks and habits
      if ('timerMinutes' in item) {
        const timerValue = (item as any).timerMinutes;
        setTimerMinutes(timerValue ? String(timerValue) : '');
      }

      // Set frequency target for habits
      if (itemType === 'habit' && 'frequencyTarget' in item) {
        const frequencyValue = (item as any).frequencyTarget;
        setFrequencyTarget(frequencyValue || '');
      }

      // Set color for goals
      if (itemType === 'goal') {
        const goalColor = (item as any).color;
        console.log('Goal color from item:', goalColor);
        setSelectedColor(goalColor || '#3B82F6');
      }
    }
  }, [item, visible, itemType]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    if (!item || !itemType) return;

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const updates: any = {};

      if (itemType === 'goal') {
        updates.title = title.trim();
        updates.description = notes.trim() || undefined;
        updates.color = selectedColor;
      } else {
        updates.title = title.trim();
        updates.notes = notes.trim() || undefined;

        if (itemType === 'task' || itemType === 'habit') {
          updates.isToday = isToday;

          // Add timer if provided
          if (timerMinutes && timerMinutes.trim()) {
            const parsedMinutes = parseInt(timerMinutes.trim());
            if (!isNaN(parsedMinutes) && parsedMinutes > 0) {
              updates.timerMinutes = parsedMinutes;
            } else {
              updates.timerMinutes = null;
            }
          } else {
            updates.timerMinutes = null;
          }
        }

        // Add frequency target for habits
        if (itemType === 'habit') {
          updates.frequencyTarget = frequencyTarget.trim() || undefined;
        }

        if (itemType === 'task') {
          updates.goalId = selectedGoalId || null;
        }
      }

      await onSave(itemType, item.id, updates);
      handleClose();
    } catch (error) {
      console.error(`Failed to update ${itemType}:`, error);
      Alert.alert('Error', `Failed to update ${itemType}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!item || !itemType || !onDelete) return;

    Alert.alert(
      `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
      `Are you sure you want to delete "${(item as any).title || (item as any).name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(itemType, item.id);
              handleClose();
            } catch (error) {
              console.error(`Failed to delete ${itemType}:`, error);
              Alert.alert('Error', `Failed to delete ${itemType}`);
            }
          },
        },
      ]
    );
  };

  const handleManageCompletions = () => {
    if (!item || itemType !== 'habit') return;

    Alert.alert(
      'Manage Completions',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Completions',
          style: 'destructive',
          onPress: handleDeleteAllCompletions,
        },
        {
          text: 'Delete Before Date...',
          onPress: handleDeleteCompletionsBeforeDate,
        },
      ]
    );
  };

  const handleDeleteAllCompletions = async () => {
    if (!item || itemType !== 'habit') return;

    const currentCount = (item as any).completionCount || 0;

    Alert.alert(
      'Delete All Completions',
      `Are you sure you want to delete all ${currentCount} completion records? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Import habitsApi
              const { habitsApi } = await import('../../services/api/habits');

              // Get all completions for this habit
              const startDate = '2000-01-01'; // Far past
              const endDate = new Date().toISOString().split('T')[0];
              const completions = await habitsApi.getCompletions(startDate, endDate);
              const habitCompletions = completions.filter(c => c.habitId === item.id);

              // Delete each completion
              for (const completion of habitCompletions) {
                await habitsApi.deleteCompletion(completion.completionDate, item.id);
              }

              // Reset completion count to 0
              await onSave(itemType, item.id, { completionCount: 0 });

              Alert.alert('Success', `Deleted ${habitCompletions.length} completion records`);
              handleClose();
            } catch (error) {
              console.error('Failed to delete completions:', error);
              Alert.alert('Error', 'Failed to delete completions. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteCompletionsBeforeDate = () => {
    if (!item || itemType !== 'habit') return;

    // Show date input
    Alert.prompt(
      'Delete Completions Before Date',
      'Enter date (YYYY-MM-DD):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async (dateStr) => {
            if (!dateStr) return;

            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(dateStr)) {
              Alert.alert('Invalid Date', 'Please enter date in YYYY-MM-DD format');
              return;
            }

            try {
              // Import habitsApi
              const { habitsApi } = await import('../../services/api/habits');

              // Get all completions for this habit before the specified date
              const startDate = '2000-01-01'; // Far past
              const endDate = new Date(dateStr).toISOString().split('T')[0];
              const completions = await habitsApi.getCompletions(startDate, endDate);
              const habitCompletions = completions.filter(
                c => c.habitId === item.id && c.completionDate < dateStr
              );

              if (habitCompletions.length === 0) {
                Alert.alert('No Completions', `No completions found before ${dateStr}`);
                return;
              }

              // Confirm deletion
              Alert.alert(
                'Confirm Deletion',
                `Delete ${habitCompletions.length} completion records before ${dateStr}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        // Delete each completion
                        for (const completion of habitCompletions) {
                          await habitsApi.deleteCompletion(completion.completionDate, item.id);
                        }

                        // Update completion count
                        const currentCount = (item as any).completionCount || 0;
                        const newCount = Math.max(0, currentCount - habitCompletions.length);
                        await onSave(itemType, item.id, { completionCount: newCount });

                        Alert.alert('Success', `Deleted ${habitCompletions.length} completion records`);
                        handleClose();
                      } catch (error) {
                        console.error('Failed to delete completions:', error);
                        Alert.alert('Error', 'Failed to delete completions. Please try again.');
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Failed to fetch completions:', error);
              Alert.alert('Error', 'Failed to fetch completions. Please try again.');
            }
          },
        },
      ],
      'plain-text',
      new Date().toISOString().split('T')[0] // Default to today
    );
  };

  if (!item || !itemType) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: colors.tint }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Edit {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerButton}
            disabled={isSaving}
          >
            <Text style={[styles.headerButtonText, { color: colors.tint }]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Form */}
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {itemType === 'goal' ? 'Goal Name' : itemType === 'task' ? 'Task' : 'Habit'}
              </Text>
              <TextInput
                style={[styles.input, {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }]}
                value={title}
                onChangeText={setTitle}
                placeholder={`Enter ${itemType} name...`}
                placeholderTextColor={colors.icon}
                autoFocus
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.textArea, {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes..."
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Color Picker (Goals only) */}
            {itemType === 'goal' && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Color</Text>
                <View style={styles.colorGrid}>
                  {colorPalette.map((colorItem) => (
                    <TouchableOpacity
                      key={colorItem.name}
                      style={[
                        styles.colorButton,
                        { backgroundColor: colorItem.color },
                        selectedColor === colorItem.color && styles.colorButtonSelected,
                      ]}
                      onPress={() => setSelectedColor(colorItem.color)}
                    >
                      {selectedColor === colorItem.color && (
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Add to Today Toggle (Tasks and Habits only) */}
            {(itemType === 'task' || itemType === 'habit') && (
              <View style={[styles.toggleRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.toggleLabelRow}>
                    <Ionicons name="sunny" size={20} color="#FFD700" style={{ marginRight: 8 }} />
                    <Text style={[styles.toggleLabel, { color: colors.text }]}>Add to Today</Text>
                  </View>
                  <Text style={[styles.toggleHint, { color: colors.icon }]}>
                    Show on your Today screen
                  </Text>
                </View>
                <Switch
                  value={isToday}
                  onValueChange={setIsToday}
                  trackColor={{ false: colors.border, true: colors.tint }}
                />
              </View>
            )}

            {/* Timer Input (Tasks and Habits only) */}
            {(itemType === 'task' || itemType === 'habit') && (
              <View style={styles.formGroup}>
                <View style={styles.toggleLabelRow}>
                  <Ionicons name="timer-outline" size={20} color={colors.icon} style={{ marginRight: 8 }} />
                  <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Timer (Optional)</Text>
                </View>
                <TextInput
                  style={[styles.input, {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 8,
                  }]}
                  value={timerMinutes}
                  onChangeText={setTimerMinutes}
                  placeholder="Duration in minutes (e.g., 15)"
                  placeholderTextColor={colors.icon}
                  keyboardType="number-pad"
                />
                <Text style={[styles.fieldHint, { color: colors.icon }]}>
                  Timer will auto-start when opened in execution mode
                </Text>
              </View>
            )}

            {/* Frequency Target (Habits only) */}
            {itemType === 'habit' && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Frequency Target
                </Text>
                <TextInput
                  style={[styles.input, {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }]}
                  value={frequencyTarget}
                  onChangeText={setFrequencyTarget}
                  placeholder="e.g., every day, 5 times a week, once a month"
                  placeholderTextColor={colors.icon}
                />
                <Text style={[styles.fieldHint, { color: colors.icon }]}>
                  Examples: "every day", "3 times a week", "once a month", "once every 2 weeks"
                </Text>
              </View>
            )}

            {/* Goal Selector (Tasks only) */}
            {itemType === 'task' && goals.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Goal (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalPills}>
                  <TouchableOpacity
                    style={[
                      styles.goalPill,
                      { borderColor: colors.border },
                      !selectedGoalId && { backgroundColor: colors.tint, borderColor: colors.tint },
                    ]}
                    onPress={() => setSelectedGoalId(undefined)}
                  >
                    <Text style={[
                      styles.goalPillText,
                      { color: !selectedGoalId ? '#fff' : colors.text },
                    ]}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {goals.map((goal) => (
                    <TouchableOpacity
                      key={goal.id}
                      style={[
                        styles.goalPill,
                        { borderColor: colors.border },
                        selectedGoalId === goal.id && { backgroundColor: colors.tint, borderColor: colors.tint },
                      ]}
                      onPress={() => setSelectedGoalId(goal.id)}
                    >
                      <Ionicons
                        name="flag"
                        size={16}
                        color={selectedGoalId === goal.id ? '#fff' : colors.icon}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[
                        styles.goalPillText,
                        { color: selectedGoalId === goal.id ? '#fff' : colors.text },
                      ]}>
                        {goal.title || goal.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Manage Completions Button (Habits only) */}
            {itemType === 'habit' && (
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: '#F59E0B' + '10', borderColor: '#F59E0B' }]}
                onPress={handleManageCompletions}
              >
                <Ionicons name="trash-outline" size={20} color="#F59E0B" />
                <Text style={[styles.resetButtonText, { color: '#F59E0B' }]}>
                  Manage Completions
                </Text>
              </TouchableOpacity>
            )}

            {/* Delete Button */}
            {onDelete && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error + '10', borderColor: colors.error }]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                  Delete {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  fieldHint: {
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleHint: {
    fontSize: 14,
  },
  goalPills: {
    flexDirection: 'row',
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  goalPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
