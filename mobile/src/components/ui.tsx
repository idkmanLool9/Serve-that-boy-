import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RequestStatus } from '../types';

// ---- Button ----

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const bg: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: c.primary,
    secondary: c.surfaceAlt,
    ghost: 'transparent',
    success: c.success,
    danger: c.danger,
  };
  const fg: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: c.primaryText,
    secondary: c.text,
    ghost: c.primary,
    success: '#FFFFFF',
    danger: '#FFFFFF',
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg[variant],
          borderRadius: theme.radius.md,
          paddingVertical: 14,
          paddingHorizontal: 18,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: c.primary,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <Text style={{ color: fg[variant], fontWeight: '700', fontSize: 16 }}>{title}</Text>
      )}
    </Pressable>
  );
}

// ---- Card ----

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing(2),
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ---- TextField ----

interface TextFieldProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextField({ label, containerStyle, style, ...rest }: TextFieldProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={[{ marginBottom: theme.spacing(2) }, containerStyle]}>
      {label ? (
        <Text style={{ color: c.textMuted, marginBottom: 6, fontWeight: '600', fontSize: 13 }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={c.textMuted}
        style={[
          {
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: theme.radius.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: c.text,
            fontSize: 16,
          },
          style as StyleProp<TextStyle>,
        ]}
        {...rest}
      />
    </View>
  );
}

// ---- StatusBadge ----

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { theme } = useTheme();
  const color =
    status === 'PENDING'
      ? theme.colors.pending
      : status === 'ACCEPTED'
        ? theme.colors.accepted
        : theme.colors.completed;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${color}22`,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: theme.radius.pill,
        alignSelf: 'flex-start',
      }}
    >
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: color,
          marginRight: 6,
        }}
      />
      <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

// ---- EmptyState ----

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: theme.spacing(6) }}>
      <Text style={{ fontSize: 48, marginBottom: 8 }}>{icon}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 18, marginBottom: 4 }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', paddingHorizontal: 32 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
