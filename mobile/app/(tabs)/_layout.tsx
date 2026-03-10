import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSettings } from '../../src/contexts/SettingsContext';
import ProfileModal from '../../src/components/ProfileModal';
import CustomTabBar from '../../src/components/CustomTabBar';
import AddItemDialog from '../../src/components/AddItemDialog';
import { useAddItem } from '../../src/contexts/AddItemContext';

export default function TabLayout() {
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { isVisible, closeAddDialog, onAddRecipe } = useAddItem();

  const HeaderTitle = () => (
    <View style={styles.headerContainer}>
      {/* Left spacer for balance */}
      <View style={styles.headerSpacer} />

      {/* Center branding */}
      <Text style={[styles.brandText, { color: colors.icon }]}>Streudel</Text>

      {/* Right profile button */}
      <TouchableOpacity
        onPress={() => setShowProfileModal(true)}
        style={styles.profileButton}
      >
        {user?.picture ? (
          <Image
            source={{ uri: user.picture }}
            style={styles.profileAvatar}
          />
        ) : (
          <Ionicons name="person-circle-outline" size={28} color={colors.icon} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      >
        <Tabs.Screen
          name="recipes"
          options={{
            title: 'Recipes',
            headerTitle: () => <HeaderTitle />,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="nutrition-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerTitle: () => <HeaderTitle />,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onLogout={logout}
      />
      <AddItemDialog
        visible={isVisible}
        onClose={closeAddDialog}
        onAddRecipe={onAddRecipe}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  headerSpacer: {
    width: 28, // Match profile button width for balance
  },
  brandText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  profileButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
