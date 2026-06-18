import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthScreen } from '../screens/AuthScreen';
import { SetupScreen } from '../screens/SetupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ServeScreen } from '../screens/ServeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Loading } from '../components/Loading';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused, color }: { emoji: string; focused: boolean; color: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          marginTop: 3,
          backgroundColor: focused ? color : 'transparent',
        }}
      />
    </View>
  );
}

function MainTabs() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const c = theme.colors;
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {isCustomer ? (
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Request',
            tabBarIcon: ({ focused, color }) => <TabIcon emoji="🛎️" focused={focused} color={color} />,
          }}
        />
      ) : (
        <Tab.Screen
          name="Serve"
          component={ServeScreen}
          options={{
            tabBarLabel: 'Serve',
            tabBarIcon: ({ focused, color }) => <TabIcon emoji="🏃" focused={focused} color={color} />,
          }}
        />
      )}
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="🗂️" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="⚙️" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, needsSetup, initializing } = useAuth();
  const { theme } = useTheme();

  const navTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  const themed = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      primary: theme.colors.primary,
      border: theme.colors.border,
    },
  };

  if (initializing) {
    return <Loading />;
  }

  return (
    <NavigationContainer theme={themed}>
      {user ? <MainTabs /> : needsSetup ? <SetupScreen /> : <AuthScreen />}
    </NavigationContainer>
  );
}
