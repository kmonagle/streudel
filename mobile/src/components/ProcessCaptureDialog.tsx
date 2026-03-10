import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Capture, Goal } from '../types/models';
import { useSettings } from '../contexts/SettingsContext';

interface ProcessCaptureDialogProps {
  visible: boolean;
  onClose: () => void;
  capture: Capture | null;
  goals: Goal[];
  onProcess: (
    type: 'task' | 'goal' | 'habit',
    data: { title: string; notes?: string; goalId?: string; color?: string; isToday?: boolean }
  ) => Promise<void>;
  onDelete: () => Promise<void>;
}

const COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B', // Slate
  '#71717A', // Zinc
  '#78716C', // Stone
];

export default function ProcessCaptureDialog({
  visible,
  onClose,
  capture,
  goals,
  onProcess,
  onDelete,
}: ProcessCaptureDialogProps) {
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];

  const [type, setType] = useState<'task' | 'goal' | 'habit'>('task');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [isToday, setIsToday] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form from capture
  useEffect(() => {
    if (capture) {
      const lines = capture.content.split('\n').filter(line => line.trim());
      if (lines.length === 1) {
        // Single line -> all in title
        setTitle(lines[0]);
        setNotes('');
      } else {
        // Multiple lines -> first line as title, rest as notes
        setTitle(lines[0]);
        setNotes(lines.slice(1).join('\n'));
      }
    }
  }, [capture]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!visible) {
      setType('task');
      setTitle('');
      setNotes('');
      setSelectedGoalId('');
      setSelectedColor('#3B82F6');
      setIsToday(true);
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleProcess = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      await onProcess(type, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        goalId: type === 'task' && selectedGoalId ? selectedGoalId : undefined,
        color: type === 'goal' ? selectedColor : undefined,
        isToday: type !== 'goal' ? isToday : undefined,
      });
    } catch (error) {
      console.error('Failed to process capture:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOnly = () => {
    Alert.alert(
      'Delete Capture',
      'Delete this capture without creating anything?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  if (!capture) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.icon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Process Capture</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Capture Content (Read-only) */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>Captured Content</Text>
            <View style={[styles.captureBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.captureText, { color: colors.text }]}>
                {capture.content}
              </Text>
              {capture.source && (
                <Text style={[styles.captureSource, { color: colors.icon }]}>
                  from {capture.source}
                </Text>
              )}
            </View>
          </View>

          {/* Type Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>Create As</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  type === 'task' && { backgroundColor: colors.tint, borderColor: colors.tint },
                ]}
                onPress={() => setType('task')}
              >
                <Text style={[styles.typeButtonText, { color: type === 'task' ? '#fff' : colors.text }]}>
                  Task
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  type === 'habit' && { backgroundColor: colors.tint, borderColor: colors.tint },
                ]}
                onPress={() => setType('habit')}
              >
                <Text style={[styles.typeButtonText, { color: type === 'habit' ? '#fff' : colors.text }]}>
                  Habit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  type === 'goal' && { backgroundColor: colors.tint, borderColor: colors.tint },
                ]}
                onPress={() => setType('goal')}
              >
                <Text style={[styles.typeButtonText, { color: type === 'goal' ? '#fff' : colors.text }]}>
                  Goal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>Title</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title"
              placeholderTextColor={colors.icon}
              autoCapitalize="sentences"
            />
          </View>

          {/* Notes Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>Notes (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                styles.notesInput,
                { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes"
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Goal Picker (Tasks only) */}
          {type === 'task' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.icon }]}>Goal (Optional)</Text>
              <View style={[styles.goalPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.goalOption}
                  onPress={() => setSelectedGoalId('')}
                >
                  <View style={[styles.radio, selectedGoalId === '' && styles.radioSelected]} />
                  <Text style={[styles.goalLabel, { color: colors.text }]}>No Goal</Text>
                </TouchableOpacity>
                {goals.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={styles.goalOption}
                    onPress={() => setSelectedGoalId(goal.id)}
                  >
                    <View style={[styles.radio, selectedGoalId === goal.id && styles.radioSelected]} />
                    <View style={[styles.goalDot, { backgroundColor: goal.color || colors.tint }]} />
                    <Text style={[styles.goalLabel, { color: colors.text }]}>
                      {goal.title || goal.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Color Picker (Goals only) */}
          {type === 'goal' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.icon }]}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Add to Today Toggle (Tasks and Habits only) */}
          {type !== 'goal' && (
            <View style={styles.section}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Add to Today</Text>
                  <Text style={[styles.sectionHint, { color: colors.icon }]}>
                    Mark this {type} for today
                  </Text>
                </View>
                <Switch
                  value={isToday}
                  onValueChange={setIsToday}
                  trackColor={{ false: colors.border, true: colors.tint + '80' }}
                  thumbColor={isToday ? colors.tint : colors.icon}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteOnly}
            disabled={isSubmitting}
          >
            <Text style={styles.deleteButtonText}>Delete Only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.processButton, { backgroundColor: colors.tint }]}
            onPress={handleProcess}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.processButtonText}>
                Create {type === 'task' ? 'Task' : type === 'habit' ? 'Habit' : 'Goal'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    marginTop: 2,
  },
  captureBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  captureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  captureSource: {
    fontSize: 12,
    marginTop: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  goalPicker: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  radioSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  goalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  goalLabel: {
    fontSize: 16,
    flex: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF444410',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  processButton: {
    flex: 2,
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
