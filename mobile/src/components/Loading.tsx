import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function Loading() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}
