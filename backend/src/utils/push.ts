import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export interface PushPayload {
  to: string | null | undefined;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Sends an Expo push notification. Safe to call with a missing/invalid token —
 * it simply no-ops so the rest of the request flow is never blocked.
 */
export async function sendPush({ to, title, body, data }: PushPayload): Promise<void> {
  if (!to || !Expo.isExpoPushToken(to)) {
    return;
  }

  const message: ExpoPushMessage = {
    to,
    sound: 'default',
    title,
    body,
    data: data ?? {},
    priority: 'high',
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    // Never let a push failure break the API response.
    console.error('Failed to send push notification:', err);
  }
}
