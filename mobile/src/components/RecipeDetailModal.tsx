import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '../types/models';
import { Colors } from '../constants/colors';
import { useSettings } from '../contexts/SettingsContext';

interface RecipeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  onUpdate: (id: string, updates: { notes?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddToQueue?: (recipeId: string, servingMultiplier: number) => Promise<void>;
  onRemoveFromQueue?: (recipeId: string) => Promise<void>;
  isInQueue?: boolean;
}

export default function RecipeDetailModal({
  visible,
  onClose,
  recipe,
  onUpdate,
  onDelete,
  onAddToQueue,
  onRemoveFromQueue,
  isInQueue = false,
}: RecipeDetailModalProps) {
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showParsedIngredients, setShowParsedIngredients] = useState(true);
  const [servingMultiplier, setServingMultiplier] = useState(1);

  if (!recipe) return null;

  const handleOpenUrl = () => {
    if (recipe.url) {
      Linking.openURL(recipe.url).catch(() => {
        Alert.alert('Error', 'Could not open URL');
      });
    }
  };

  const handleSaveNotes = async () => {
    try {
      await onUpdate(recipe.id, { notes });
      setIsEditingNotes(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save notes');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(recipe.id);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  const handleEditNotes = () => {
    setNotes(recipe.notes || '');
    setIsEditingNotes(true);
  };

  const scaleAmount = (amount: string | null): string | null => {
    if (!amount || servingMultiplier === 1) return amount;

    // Try to parse the amount
    const numMatch = amount.match(/[\d.\/]+/);
    if (!numMatch) return amount;

    let num = 0;
    const numStr = numMatch[0];

    // Handle fractions like "1/2"
    if (numStr.includes('/')) {
      const [numerator, denominator] = numStr.split('/').map(Number);
      num = numerator / denominator;
    } else {
      num = parseFloat(numStr);
    }

    const scaled = num * servingMultiplier;

    // Format the scaled number nicely
    if (scaled % 1 === 0) {
      return amount.replace(numStr, scaled.toString());
    } else if (scaled < 1) {
      // Try to convert to fraction for small amounts
      const fractions = [[1, 4], [1, 3], [1, 2], [2, 3], [3, 4]];
      for (const [n, d] of fractions) {
        if (Math.abs(scaled - n / d) < 0.05) {
          return amount.replace(numStr, `${n}/${d}`);
        }
      }
    }
    return amount.replace(numStr, scaled.toFixed(2).replace(/\.?0+$/, ''));
  };

  const parseServings = (servings: string | null): number => {
    if (!servings) return 1;
    const match = servings.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  };

  const originalServings = parseServings(recipe?.servings);
  const scaledServings = Math.round(originalServings * servingMultiplier);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            Recipe
          </Text>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Recipe Image */}
          {recipe.imageUrl && (
            <Image
              source={{ uri: recipe.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>{recipe.title}</Text>
          </View>

          {/* Description */}
          {recipe.description && (
            <View style={styles.section}>
              <Text style={[styles.description, { color: colors.icon }]}>
                {recipe.description}
              </Text>
            </View>
          )}

          {/* Meta Info */}
          {(recipe.prepTime || recipe.cookTime || recipe.totalTime || recipe.servings) && (
            <View style={[styles.section, styles.metaSection]}>
              {recipe.prepTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="timer-outline" size={18} color={colors.icon} />
                  <Text style={[styles.metaText, { color: colors.icon }]}>
                    Prep: {recipe.prepTime}
                  </Text>
                </View>
              )}
              {recipe.cookTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="flame-outline" size={18} color={colors.icon} />
                  <Text style={[styles.metaText, { color: colors.icon }]}>
                    Cook: {recipe.cookTime}
                  </Text>
                </View>
              )}
              {recipe.totalTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={18} color={colors.icon} />
                  <Text style={[styles.metaText, { color: colors.icon }]}>
                    Total: {recipe.totalTime}
                  </Text>
                </View>
              )}
              {recipe.servings && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={18} color={colors.icon} />
                  <Text style={[styles.metaText, { color: colors.icon }]}>
                    {recipe.servings}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Category & Cuisine */}
          {(recipe.category || recipe.cuisine) && (
            <View style={[styles.section, styles.tagsSection]}>
              {recipe.category && (
                <View style={[styles.tag, { backgroundColor: colors.tint + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.tint }]}>
                    {recipe.category}
                  </Text>
                </View>
              )}
              {recipe.cuisine && (
                <View style={[styles.tag, { backgroundColor: colors.tint + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.tint }]}>
                    {recipe.cuisine}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <View style={styles.ingredientsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients</Text>
              <View style={styles.ingredientsControls}>
                {recipe.parsedIngredients.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowParsedIngredients(!showParsedIngredients)}
                    style={[styles.toggleButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.toggleButtonText, { color: colors.icon }]}>
                      {showParsedIngredients ? 'Original' : 'Parsed'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Serving Adjustment & Shopping List */}
            <View style={styles.controlsRow}>
              {recipe.servings && (
                <View style={styles.servingAdjustment}>
                  <Text style={[styles.servingLabel, { color: colors.icon }]}>Servings:</Text>
                  <View style={styles.servingControls}>
                    <TouchableOpacity
                      onPress={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}
                      style={[styles.servingButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.servingValue, { color: colors.text }]}>
                      {scaledServings}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setServingMultiplier(servingMultiplier + 0.5)}
                      style={[styles.servingButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  {servingMultiplier !== 1 && (
                    <TouchableOpacity onPress={() => setServingMultiplier(1)}>
                      <Text style={[styles.resetButton, { color: colors.tint }]}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {isInQueue ? (
                onRemoveFromQueue && (
                  <TouchableOpacity
                    onPress={() => onRemoveFromQueue(recipe.id)}
                    style={[styles.queueButton, { backgroundColor: colors.border }]}
                  >
                    <Ionicons name="remove-circle-outline" size={18} color={colors.text} />
                    <Text style={[styles.queueButtonText, { color: colors.text }]}>Remove from Queue</Text>
                  </TouchableOpacity>
                )
              ) : (
                onAddToQueue && (
                  <TouchableOpacity
                    onPress={() => onAddToQueue(recipe.id, servingMultiplier)}
                    style={[styles.queueButton, { backgroundColor: colors.tint }]}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={styles.queueButtonText}>Add to Queue</Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {showParsedIngredients && recipe.parsedIngredients.length > 0 ? (
              // Parsed ingredients with better formatting
              recipe.parsedIngredients.map((parsed, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.bullet, { color: colors.tint }]}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemText, { color: colors.text }]}>
                      {scaleAmount(parsed.amount)} {parsed.unit} <Text style={{ fontWeight: '600' }}>{parsed.ingredient}</Text>
                      {parsed.notes && <Text style={{ color: colors.icon, fontStyle: 'italic' }}> ({parsed.notes})</Text>}
                    </Text>
                    {parsed.aisle && (
                      <Text style={[styles.aisleText, { color: colors.icon }]}>
                        {parsed.aisle}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              // Original ingredients
              recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.bullet, { color: colors.tint }]}>•</Text>
                  <Text style={[styles.listItemText, { color: colors.text }]}>
                    {ingredient}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions</Text>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={[styles.instructionNumber, { backgroundColor: colors.tint }]}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.text }]}>
                  {instruction}
                </Text>
              </View>
            ))}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.notesHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>My Notes</Text>
              {!isEditingNotes && (
                <TouchableOpacity onPress={handleEditNotes}>
                  <Ionicons name="pencil" size={20} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
            {isEditingNotes ? (
              <View>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add your notes..."
                  placeholderTextColor={colors.icon}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.notesButtons}>
                  <TouchableOpacity
                    onPress={() => setIsEditingNotes(false)}
                    style={[styles.notesButton, { backgroundColor: colors.border }]}
                  >
                    <Text style={[styles.notesButtonText, { color: colors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveNotes}
                    style={[styles.notesButton, { backgroundColor: colors.tint }]}
                  >
                    <Text style={styles.notesButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={[styles.notesText, { color: recipe.notes ? colors.text : colors.icon }]}>
                {recipe.notes || 'No notes yet. Tap the pencil to add notes.'}
              </Text>
            )}
          </View>

          {/* Source URL */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={handleOpenUrl}
              style={[styles.urlButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="link-outline" size={20} color={colors.tint} />
              <Text style={[styles.urlText, { color: colors.tint }]} numberOfLines={1}>
                View Original Recipe
              </Text>
              <Ionicons name="open-outline" size={16} color={colors.tint} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  metaSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
  },
  tagsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientsControls: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  servingAdjustment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  servingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  resetButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  aisleText: {
    fontSize: 12,
    marginTop: 2,
  },
  queueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  queueButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 20,
    marginRight: 12,
    lineHeight: 24,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  notesButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  notesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  urlText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
