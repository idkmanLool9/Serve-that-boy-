import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FamilyRequest } from '../types';
import { iconForType } from '../constants/presets';
import { timeAgo } from '../utils/time';
import { Button, Card, StatusBadge } from './ui';

interface RequestCardProps {
  request: FamilyRequest;
  // Server-only actions. When omitted, the card is read-only.
  onAccept?: (r: FamilyRequest) => void;
  onComplete?: (r: FamilyRequest) => void;
  onReply?: (r: FamilyRequest) => void;
  busy?: boolean;
}

export function RequestCard({ request, onAccept, onComplete, onReply, busy }: RequestCardProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const isServer = Boolean(onAccept || onComplete || onReply);

  return (
    <Card style={{ marginBottom: theme.spacing(1.5) }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 28, marginRight: 12 }}>{iconForType(request.type)}</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 16, flex: 1, paddingRight: 8 }}>
              {request.title}
            </Text>
            <StatusBadge status={request.status} />
          </View>

          {request.note ? (
            <Text style={{ color: c.textMuted, marginTop: 4 }}>{request.note}</Text>
          ) : null}

          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 6 }}>
            {request.customer ? `Van ${request.customer.name}` : 'Van een gezinslid'} ·{' '}
            {timeAgo(request.createdAt)}
            {request.server ? ` · ${request.server.name}` : ''}
          </Text>

          {request.reply ? (
            <View
              style={{
                marginTop: 10,
                backgroundColor: c.surfaceAlt,
                borderRadius: theme.radius.sm,
                padding: 10,
              }}
            >
              <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 2 }}>
                💬 {request.server?.name ?? 'Helper'} reageerde
              </Text>
              <Text style={{ color: c.text }}>{request.reply}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {isServer && request.status !== 'COMPLETED' ? (
        <View style={{ flexDirection: 'row', marginTop: theme.spacing(1.5), gap: 8 }}>
          {request.status === 'PENDING' && onAccept ? (
            <Button title="Accepteren" variant="primary" onPress={() => onAccept(request)} disabled={busy} style={{ flex: 1 }} />
          ) : null}
          {onComplete ? (
            <Button
              title="Voltooien"
              variant="success"
              onPress={() => onComplete(request)}
              disabled={busy}
              style={{ flex: 1 }}
            />
          ) : null}
          {onReply ? (
            <Button title="Antwoord" variant="secondary" onPress={() => onReply(request)} disabled={busy} style={{ flex: 1 }} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
