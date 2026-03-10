import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { ShoppingList, ShoppingListItem } from '../src/types/models';
import { shoppingListsApi } from '../src/services/api/shoppingLists';
import { useSettings } from '../src/contexts/SettingsContext';

export default function ShoppingListScreen() {
  const router = useRouter();
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const data = await shoppingListsApi.getAll();
      setLists(data);

      // If no active list selected, select the first one
      if (!activeListId && data.length > 0) {
        setActiveListId(data[0].id);
      }

      // Create default list if none exist
      if (data.length === 0) {
        const newList = await shoppingListsApi.create({ name: 'My Shopping List' });
        setLists([newList]);
        setActiveListId(newList.id);
      }
    } catch (error: any) {
      console.error('Failed to load shopping lists:', error);
      Alert.alert('Error', error?.error || 'Failed to load shopping lists');
    } finally {
      setIsLoading(false);
    }
  };

  const activeList = lists.find((list) => list.id === activeListId);

  const handleToggleItem = async (item: ShoppingListItem) => {
    if (!activeListId) return;

    // Optimistic update
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === activeListId
          ? {
              ...list,
              items: list.items.map((i) =>
                i.id === item.id ? { ...i, checked: !i.checked } : i
              ),
            }
          : list
      )
    );

    try {
      await shoppingListsApi.updateItem(activeListId, item.id, { checked: !item.checked });
    } catch (error) {
      console.error('Failed to toggle item:', error);
      // Revert on error
      await loadLists();
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleAddItem = async () => {
    if (!activeListId || !newItemText.trim()) return;

    try {
      await shoppingListsApi.addItem(activeListId, { ingredient: newItemText.trim() });
      setNewItemText('');
      await loadLists();
    } catch (error: any) {
      console.error('Failed to add item:', error);
      Alert.alert('Error', error?.error || 'Failed to add item');
    }
  };

  const handleDeleteItem = async (item: ShoppingListItem) => {
    if (!activeListId) return;

    Alert.alert('Delete Item', `Remove "${item.ingredient}" from the list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await shoppingListsApi.deleteItem(activeListId, item.id);
            await loadLists();
          } catch (error: any) {
            console.error('Failed to delete item:', error);
            Alert.alert('Error', error?.error || 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const handleClearChecked = async () => {
    if (!activeListId || !activeList) return;

    const checkedCount = activeList.items.filter((i) => i.checked).length;
    if (checkedCount === 0) {
      Alert.alert('No Items', 'There are no checked items to clear');
      return;
    }

    Alert.alert('Clear Checked Items', `Remove ${checkedCount} checked item${checkedCount === 1 ? '' : 's'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await shoppingListsApi.clearChecked(activeListId);
            await loadLists();
          } catch (error: any) {
            console.error('Failed to clear checked items:', error);
            Alert.alert('Error', error?.error || 'Failed to clear items');
          }
        },
      },
    ]);
  };

  // Group items by aisle
  const groupedItems = activeList?.items.reduce((acc, item) => {
    const aisle = item.aisle || 'Other';
    if (!acc[aisle]) {
      acc[aisle] = [];
    }
    acc[aisle].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const sortedAisles = groupedItems ? Object.keys(groupedItems).sort() : [];

  if (isLoading && lists.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading shopping list...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shopping List</Text>
        <TouchableOpacity onPress={handleClearChecked} style={styles.headerButton}>
          <Ionicons name="trash-outline" size={22} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Add Item Input */}
      <View style={[styles.addItemContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Ionicons name="add-circle-outline" size={24} color={colors.tint} />
        <TextInput
          style={[styles.addItemInput, { color: colors.text }]}
          value={newItemText}
          onChangeText={setNewItemText}
          placeholder="Add an item..."
          placeholderTextColor={colors.icon}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        {newItemText.trim().length > 0 && (
          <TouchableOpacity onPress={handleAddItem}>
            <Text style={[styles.addButton, { color: colors.tint }]}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Shopping List Items */}
      <ScrollView style={styles.content}>
        {!activeList || activeList.items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>Your shopping list is empty</Text>
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              Add items manually or add ingredients from a recipe
            </Text>
          </View>
        ) : (
          sortedAisles.map((aisle) => (
            <View key={aisle} style={styles.aisleSection}>
              <Text style={[styles.aisleHeader, { color: colors.icon }]}>{aisle}</Text>
              {groupedItems[aisle]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleToggleItem(item)}
                      style={styles.itemCheckbox}
                    >
                      <Ionicons
                        name={item.checked ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={item.checked ? colors.tint : colors.icon}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleToggleItem(item)}
                      style={styles.itemContent}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          {
                            color: item.checked ? colors.icon : colors.text,
                            textDecorationLine: item.checked ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {item.amount && item.unit
                          ? `${item.amount} ${item.unit} `
                          : item.amount
                          ? `${item.amount} `
                          : ''}
                        {item.ingredient}
                      </Text>
                      {item.recipeTitle && (
                        <Text style={[styles.itemRecipe, { color: colors.icon }]}>
                          from {item.recipeTitle}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.icon} />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    padding: 4,
    width: 40,
    alignItems: 'flex-end',
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  addItemInput: {
    flex: 1,
    fontSize: 16,
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  aisleSection: {
    marginTop: 16,
  },
  aisleHeader: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  itemCheckbox: {
    padding: 4,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
  },
  itemRecipe: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 4,
  },
});
