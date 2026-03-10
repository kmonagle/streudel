import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useSettings } from '../contexts/SettingsContext';

interface AddItemDialogProps {
  visible: boolean;
  onClose: () => void;
  onAddRecipe: (url: string) => Promise<void>;
}

export default function AddItemDialog({ visible, onClose, onAddRecipe }: AddItemDialogProps) {
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];

  const [recipeUrl, setRecipeUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const resetForm = () => {
    setRecipeUrl('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImportRecipe = async () => {
    const trimmedUrl = recipeUrl.trim();
    if (!trimmedUrl) {
      Alert.alert('URL Required', 'Please enter a recipe URL');
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsImporting(true);
    try {
      await onAddRecipe(trimmedUrl);
      handleClose();
    } catch (error: unknown) {
      console.error('Failed to add recipe:', error);
      let errorMessage = 'Failed to import recipe. Please try again.';
      const err = error as { error?: string; message?: string; details?: string };
      if (err?.error) {
        errorMessage = err.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      if (err?.details) {
        errorMessage += '\n\n' + err.details;
      }
      Alert.alert('Import Failed', errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

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
            Import Recipe
          </Text>
          <TouchableOpacity
            onPress={handleImportRecipe}
            style={styles.headerButton}
            disabled={isImporting}
          >
            <Text style={[styles.headerButtonText, { color: colors.tint }]}>
              {isImporting ? 'Importing...' : 'Import'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recipe Form */}
        <View style={styles.recipeForm}>
          <View style={styles.recipeIconContainer}>
            <Ionicons name="restaurant-outline" size={64} color={colors.tint} />
          </View>
          <Text style={[styles.recipeSubtitle, { color: colors.text }]}>
            Paste a Recipe URL
          </Text>
          <Text style={[styles.recipeDescription, { color: colors.icon }]}>
            We'll automatically extract the recipe details from the website
          </Text>
          <TextInput
            style={[styles.recipeInput, {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            }]}
            value={recipeUrl}
            onChangeText={setRecipeUrl}
            placeholder="https://example.com/recipe/..."
            placeholderTextColor={colors.icon}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={handleImportRecipe}
            editable={!isImporting}
            autoFocus
          />
          {isImporting && (
            <View style={styles.recipeLoadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.recipeLoadingText, { color: colors.icon }]}>
                Importing recipe...
              </Text>
            </View>
          )}
          <View style={styles.recipeInfoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.icon} />
            <Text style={[styles.recipeInfoText, { color: colors.icon }]}>
              Works with most popular recipe websites including AllRecipes, Food Network, NYT Cooking, and more
            </Text>
          </View>
        </View>
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
  recipeForm: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  recipeIconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  recipeSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  recipeDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  recipeInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  recipeLoadingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  recipeLoadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  recipeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 'auto',
    marginBottom: 24,
  },
  recipeInfoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
