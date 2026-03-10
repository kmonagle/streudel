import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useSettings } from '../contexts/SettingsContext';
import { Goal, Task, RecipeQueueItem } from '../types/models';
import { goalsApi } from '../services/api/goals';
import { tasksApi } from '../services/api/tasks';
import { recipeQueueApi } from '../services/api/recipeQueue';

interface ShoppingListTabProps {
  refreshKey?: number;
  recipeQueue: RecipeQueueItem[];
  onBuildShoppingList: () => void;
  isBuildingShoppingList: boolean;
}

export default function ShoppingListTab({
  refreshKey,
  recipeQueue,
  onBuildShoppingList,
  isBuildingShoppingList,
}: ShoppingListTabProps) {
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];

  const [shoppingGoals, setShoppingGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [allGoals, allTasks] = await Promise.all([
        goalsApi.getAll(),
        tasksApi.getAll(),
      ]);

      const shopGoals = allGoals.filter(g => g.type === 'shopping');
      setShoppingGoals(shopGoals);

      const shopGoalIds = new Set(shopGoals.map(g => g.id));
      setTasks(allTasks.filter(t => t.goalId && shopGoalIds.has(t.goalId)));

      // Auto-expand all categories on first load
      if (expandedGoals.size === 0 && shopGoals.length > 0) {
        setExpandedGoals(new Set(shopGoals.map(g => g.id)));
      }
    } catch (error) {
      console.error('Failed to load shopping list:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const getGoalTasks = (goalId: string) => {
    return tasks
      .filter(t => t.goalId === goalId)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.sortOrder - b.sortOrder;
      });
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: newCompleted } : t
    ));

    try {
      await tasksApi.update(taskId, { completed: newCompleted });
    } catch (error) {
      // Revert on error
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: !newCompleted } : t
      ));
      console.error('Failed to toggle task:', error);
    }
  };

  const toggleGoalExpanded = (goalId: string) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const handleClearCompleted = async (goalId: string, goalName: string) => {
    const completedCount = tasks.filter(t => t.goalId === goalId && t.completed).length;
    if (completedCount === 0) return;

    Alert.alert(
      'Clear Completed',
      `Remove ${completedCount} completed item${completedCount === 1 ? '' : 's'} from ${goalName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalsApi.deleteCompletedTasks(goalId);
              setTasks(prev => prev.filter(t => !(t.goalId === goalId && t.completed)));
            } catch (error) {
              console.error('Failed to clear completed:', error);
              Alert.alert('Error', 'Failed to clear completed items');
            }
          },
        },
      ]
    );
  };

  const handleDeleteShoppingList = () => {
    if (shoppingGoals.length === 0) return;

    Alert.alert(
      'Delete Shopping List',
      'Delete this entire shopping list and all its items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(shoppingGoals.map(g => goalsApi.delete(g.id)));
              setShoppingGoals([]);
              setTasks([]);
            } catch (error) {
              console.error('Failed to delete shopping list:', error);
              Alert.alert('Error', 'Failed to delete shopping list');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const totalActive = tasks.filter(t => !t.completed).length;
  const totalCompleted = tasks.filter(t => t.completed).length;
  const hasShoppingList = shoppingGoals.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Queued Recipes Summary */}
      {recipeQueue.length > 0 && (
        <View style={[styles.queuedRecipesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.queuedRecipesHeader}>
            <Ionicons name="layers" size={18} color="#10B981" />
            <Text style={[styles.queuedRecipesTitle, { color: colors.text }]}>
              Queued Recipes ({recipeQueue.length})
            </Text>
          </View>
          {recipeQueue.map(item => (
            <View key={item.id} style={styles.queuedRecipeItem}>
              <Ionicons name="restaurant-outline" size={14} color={colors.icon} />
              <Text style={[styles.queuedRecipeName, { color: colors.icon }]} numberOfLines={1}>
                {item.recipe?.title || 'Unknown Recipe'}
              </Text>
            </View>
          ))}
          {!hasShoppingList && (
            <TouchableOpacity
              style={[styles.buildButton, { backgroundColor: '#10B981' }]}
              onPress={onBuildShoppingList}
              disabled={isBuildingShoppingList}
            >
              {isBuildingShoppingList ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cart" size={18} color="#fff" />
                  <Text style={styles.buildButtonText}>Build Shopping List</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Shopping List Content */}
      {hasShoppingList ? (
        <>
          {/* Shopping List Header */}
          <View style={styles.listHeaderRow}>
            <View>
              <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
                Shopping List
              </Text>
              <Text style={[styles.listHeaderSubtitle, { color: colors.icon }]}>
                {totalActive} item{totalActive === 1 ? '' : 's'} remaining
                {totalCompleted > 0 && ` · ${totalCompleted} done`}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {recipeQueue.length > 0 && (
                <TouchableOpacity
                  style={[styles.rebuildButton, { borderColor: '#10B981' }]}
                  onPress={onBuildShoppingList}
                  disabled={isBuildingShoppingList}
                >
                  {isBuildingShoppingList ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <Ionicons name="refresh" size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleDeleteShoppingList}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Sections */}
          {shoppingGoals.map(goal => {
            const goalColor = goal.color || colors.tint;
            const goalTasks = getGoalTasks(goal.id);
            const activeCount = goalTasks.filter(t => !t.completed).length;
            const completedCount = goalTasks.filter(t => t.completed).length;
            const goalExpanded = expandedGoals.has(goal.id);

            return (
              <View key={goal.id} style={styles.categoryContainer}>
                {/* Category header */}
                <TouchableOpacity
                  style={[
                    styles.categoryHeader,
                    {
                      backgroundColor: goalColor + '0D',
                      borderColor: goalColor + '30',
                      borderLeftColor: goalColor,
                      borderLeftWidth: 3,
                    },
                  ]}
                  onPress={() => toggleGoalExpanded(goal.id)}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {goal.title || goal.name}
                    </Text>
                    <Text style={[styles.categoryCount, { color: colors.icon }]}>
                      {activeCount} item{activeCount === 1 ? '' : 's'}
                      {completedCount > 0 && ` · ${completedCount} done`}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {completedCount > 0 && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleClearCompleted(goal.id, goal.title || goal.name || '');
                        }}
                        style={styles.actionButton}
                      >
                        <Ionicons name="checkmark-done" size={18} color={colors.icon} />
                      </TouchableOpacity>
                    )}
                    <Ionicons
                      name={goalExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.icon}
                    />
                  </View>
                </TouchableOpacity>

                {/* Tasks */}
                {goalExpanded && goalTasks.map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskItem,
                      {
                        backgroundColor: goalColor + '08',
                        borderColor: goalColor + '20',
                        borderLeftColor: goalColor,
                        borderLeftWidth: 3,
                      },
                    ]}
                    onPress={() => toggleTask(task.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={task.completed ? colors.success : goalColor + '80'}
                      style={styles.checkbox}
                    />
                    <View style={styles.taskContent}>
                      <Text
                        style={[
                          styles.taskName,
                          { color: colors.text },
                          task.completed && styles.taskCompleted,
                        ]}
                      >
                        {task.title || task.name}
                      </Text>
                      {task.notes && (
                        <Text
                          style={[styles.taskNotes, { color: colors.icon }]}
                          numberOfLines={1}
                        >
                          {task.notes}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </>
      ) : (
        /* Empty State */
        recipeQueue.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No shopping list yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              Queue some recipes and build a shopping list to get started
            </Text>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queuedRecipesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  queuedRecipesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  queuedRecipesTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  queuedRecipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 4,
  },
  queuedRecipeName: {
    fontSize: 14,
    flex: 1,
  },
  buildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buildButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  listHeaderSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rebuildButton: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButton: {
    padding: 6,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryHeaderLeft: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 13,
    marginTop: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkbox: {
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  taskNotes: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
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
    textAlign: 'center',
  },
});
