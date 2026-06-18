import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button, TextField } from './ui';

interface ReplyModalProps {
  visible: boolean;
  title: string;
  placeholder?: string;
  confirmLabel: string;
  /** When true, the message is optional (e.g. completing with no reply). */
  optional?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (message: string) => void;
}

export function ReplyModal({
  visible,
  title,
  placeholder = 'Typ een kort bericht…',
  confirmLabel,
  optional,
  loading,
  onCancel,
  onSubmit,
}: ReplyModalProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) setText('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' }}
      >
        <View
          style={{
            backgroundColor: c.background,
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            padding: theme.spacing(3),
          }}
        >
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 16 }}>
            {title}
          </Text>
          <TextField
            placeholder={placeholder}
            value={text}
            onChangeText={setText}
            multiline
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button
              title={confirmLabel}
              onPress={() => onSubmit(text.trim())}
              loading={loading}
              disabled={!optional && text.trim().length === 0}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
