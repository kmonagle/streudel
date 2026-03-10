import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { useSettings } from '../src/contexts/SettingsContext';
import { Recipe, RecipeQueueItem } from '../src/types/models';
import { recipesApi } from '../src/services/api/recipes';
import { recipeQueueApi } from '../src/services/api/recipeQueue';
import { tasksApi } from '../src/services/api/tasks';
import RecipeDetailModal from '../src/components/RecipeDetailModal';
import { useAddItem } from '../src/contexts/AddItemContext';
import { useFocusEffect } from 'expo-router';

export default function RecipeManagerScreen() {
  console.log('🍳🍳🍳 RECIPE MANAGER SCREEN MOUNTED 🍳🍳🍳');

  const router = useRouter();
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];

  console.log('🍳 Recipe Manager initialized, theme:', effectiveTheme);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeQueue, setRecipeQueue] = useState<RecipeQueueItem[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);
  const [isBuildingShoppingList, setIsBuildingShoppingList] = useState(false);
  const { openAddDialog, registerOnAddRecipe } = useAddItem();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, selectedCategory, recipes]);

  useFocusEffect(
    useCallback(() => {
      registerOnAddRecipe(async (url: string) => {
        await recipesApi.createFromUrl({ url });
        await loadData();
      });
    }, [])
  );

  const loadData = async () => {
    try {
      const [recipesData, queueData] = await Promise.all([
        recipesApi.getAll(),
        recipeQueueApi.getAll().catch(() => []),
      ]);

      setRecipes(recipesData);
      setRecipeQueue(queueData);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      Alert.alert('Error', 'Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterRecipes = () => {
    let filtered = [...recipes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.category?.toLowerCase().includes(query) ||
        recipe.cuisine?.toLowerCase().includes(query)
      );
    }

    // Category filter (case-insensitive)
    if (selectedCategory) {
      filtered = filtered.filter(recipe =>
        recipe.category?.trim().toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredRecipes(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeDetail(true);
  };

  const handleToggleQueue = async (recipe: Recipe) => {
    const queueItem = recipeQueue.find(qi => qi.recipeId === recipe.id);

    try {
      if (queueItem) {
        // Remove from queue and delete corresponding task
        await recipeQueueApi.remove(queueItem.id);

        // Find and delete the task for this recipe
        const allTasks = await tasksApi.getAll();
        const recipeTask = allTasks.find(task => task.notes === `recipe:${recipe.id}`);
        if (recipeTask) {
          await tasksApi.delete(recipeTask.id);
        }
      } else {
        // Add to queue and create a task
        await recipeQueueApi.add({ recipeId: recipe.id });

        // Create a task for this recipe
        await tasksApi.create({
          title: `Cook: ${recipe.title}`,
          notes: `recipe:${recipe.id}`,
          isToday: false,
          completed: false,
        });
      }
      await loadData();
    } catch (error) {
      console.error('Failed to toggle queue:', error);
      Alert.alert('Error', 'Failed to update recipe queue');
    }
  };

  const handleBuildShoppingList = async () => {
    if (recipeQueue.length === 0) {
      Alert.alert('No Recipes in Queue', 'Add some recipes to your queue first by tapping the cart icon on recipe cards.');
      return;
    }

    if (isBuildingShoppingList) {
      return; // Prevent multiple clicks
    }

    Alert.alert(
      'Build Shopping List',
      `Create a shopping list from ${recipeQueue.length} queued recipe${recipeQueue.length === 1 ? '' : 's'}?\n\nThis may take a few moments...`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Build',
          onPress: async () => {
            setIsBuildingShoppingList(true);
            try {
              await recipeQueueApi.buildShoppingList({
                goalName: 'Shopping List'
              });

              await loadData();
              setIsBuildingShoppingList(false);

              Alert.alert(
                'Shopping List Created',
                `Created shopping list from ${recipeQueue.length} recipe${recipeQueue.length === 1 ? '' : 's'}. View it in the My Stuff tab.`,
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              setIsBuildingShoppingList(false);
              console.error('Failed to build shopping list:', error);
              Alert.alert('Error', error?.error || 'Failed to build shopping list');
            }
          },
        },
      ]
    );
  };

  // Extract unique categories, normalized and deduplicated (case-insensitive)
  const categoryMap = new Map<string, string>();
  recipes.forEach(r => {
    const category = r.category?.trim();
    if (category) {
      const lowerKey = category.toLowerCase();
      // Keep the first casing we encounter for each unique category
      if (!categoryMap.has(lowerKey)) {
        categoryMap.set(lowerKey, category);
      }
    }
  });
  const categories = Array.from(categoryMap.values()).sort();

  const renderRecipe = ({ item }: { item: Recipe }) => {
    const isInQueue = recipeQueue.some(qi => qi.recipeId === item.id);

    return (
      <TouchableOpacity
        style={[styles.recipeCard, {
          backgroundColor: colors.card,
          borderColor: colors.border,
        }]}
        onPress={() => handleViewRecipe(item)}
      >
        <View style={styles.recipeCardContent}>
          {/* Recipe Image */}
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.recipeImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.recipeImagePlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="restaurant" size={24} color={colors.icon} />
            </View>
          )}

          <View style={styles.recipeInfo}>
            <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.category && (
              <Text style={[styles.recipeCategory, { color: colors.icon }]}>
                {item.category}
                {item.cuisine && ` • ${item.cuisine}`}
              </Text>
            )}
            {item.totalTime && (
              <Text style={[styles.recipeTime, { color: colors.icon }]}>
                <Ionicons name="time-outline" size={12} /> {item.totalTime}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => handleToggleQueue(item)}
            style={styles.queueButton}
          >
            <Ionicons
              name={isInQueue ? "layers" : "layers-outline"}
              size={24}
              color={isInQueue ? '#10B981' : colors.icon}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mystuff')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Recipe Manager</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isBuildingShoppingList ? (
            <ActivityIndicator size="small" color={colors.tint} />
          ) : (
            <TouchableOpacity
              onPress={handleBuildShoppingList}
              style={styles.cartButton}
              disabled={recipeQueue.length === 0}
            >
              <Ionicons
                name="cart"
                size={24}
                color={recipeQueue.length > 0 ? colors.tint : colors.icon}
              />
              {recipeQueue.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                  <Text style={styles.badgeText}>{recipeQueue.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search recipes..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      {categories.length > 0 && (
        <View style={styles.categoryContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === item ? colors.tint : colors.card,
                    borderColor: selectedCategory === item ? colors.tint : colors.border,
                  }
                ]}
                onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
              >
                <Text style={[
                  styles.categoryChipText,
                  { color: selectedCategory === item ? '#fff' : colors.text }
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={[styles.resultsText, { color: colors.icon }]}>
          {filteredRecipes.length} recipe{filteredRecipes.length === 1 ? '' : 's'}
          {searchQuery || selectedCategory ? ' found' : ''}
        </Text>
        {recipeQueue.length > 0 && (
          <View style={[styles.queueBadge, { backgroundColor: '#10B981' + '15' }]}>
            <Ionicons name="layers" size={16} color="#10B981" />
            <Text style={[styles.queueBadgeText, { color: '#10B981' }]}>
              {recipeQueue.length} in queue
            </Text>
          </View>
        )}
      </View>

      {/* Recipe List */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              {searchQuery || selectedCategory ? 'No recipes match your search' : 'No recipes yet'}
            </Text>
            {!searchQuery && !selectedCategory && (
              <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                Add recipes from URLs to get started
              </Text>
            )}
          </View>
        }
      />

      {/* Floating Action Button - Add Recipe */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={() => openAddDialog('recipe')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          visible={showRecipeDetail}
          recipe={selectedRecipe}
          onClose={() => {
            setShowRecipeDetail(false);
            setSelectedRecipe(null);
          }}
          onUpdate={loadData}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  queueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  queueBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  recipeCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  recipeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recipeImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  recipeImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recipeCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  recipeTime: {
    fontSize: 12,
  },
  queueButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
