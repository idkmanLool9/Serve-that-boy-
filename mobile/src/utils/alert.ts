import { Alert, Platform } from 'react-native';

// React Native Web does not implement Alert, so popups/confirmations silently
// do nothing on web. These helpers fall back to the browser's dialogs.

/** Show a simple message. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/** Ask the user to confirm an action, then run onConfirm if they agree. */
export function confirmAction(opts: ConfirmOptions): void {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(opts.message ? `${opts.title}\n\n${opts.message}` : opts.title);
    if (ok) opts.onConfirm();
  } else {
    Alert.alert(opts.title, opts.message, [
      { text: opts.cancelLabel, style: 'cancel' },
      {
        text: opts.confirmLabel,
        style: opts.destructive ? 'destructive' : 'default',
        onPress: opts.onConfirm,
      },
    ]);
  }
}
