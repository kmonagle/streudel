import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/colors';
import { useSettings } from '../contexts/SettingsContext';
import { useAddItem } from '../contexts/AddItemContext';

export default function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];
  const { openAddDialog } = useAddItem();

  // Filter to only visible routes
  const hiddenTabs = ['goals', 'tasks', 'countdowns'];
  const visibleRoutes = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => !hiddenTabs.includes(route.name));

  // Insert the add button after the 2nd visible tab (Habits)
  const addAfterVisibleIndex = 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
      {visibleRoutes.map(({ route, index }, visibleIndex) => {
        const descriptor = descriptors[route.key];
        if (!descriptor) return null;

        const { options } = descriptor;
        const label = options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const iconColor = isFocused ? colors.tint : colors.tabIconDefault;

        const tabButton = (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            {options.tabBarIcon?.({ focused: isFocused, color: iconColor, size: 24 })}
            <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
          </TouchableOpacity>
        );

        // Render the add button after the designated visible tab
        if (visibleIndex === addAfterVisibleIndex) {
          return (
            <React.Fragment key={route.key}>
              {tabButton}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.tint }]}
                onPress={() => openAddDialog()}
                accessibilityRole="button"
                accessibilityLabel="Add new item"
              >
                <Ionicons name="add" size={28} color="#fff" />
              </TouchableOpacity>
            </React.Fragment>
          );
        }

        return tabButton;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
