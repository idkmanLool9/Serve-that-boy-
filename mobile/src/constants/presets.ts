import { RequestType } from '../types';

export interface Preset {
  type: RequestType;
  title: string;
  icon: string;
}

// The one-tap requests a Customer can send.
export const PRESETS: Preset[] = [
  { type: 'item', title: 'Bring me an item', icon: '📦' },
  { type: 'ice_cream', title: 'Get me an ice cream', icon: '🍦' },
  { type: 'clothes', title: 'Bring my clothes downstairs', icon: '🧺' },
  { type: 'help', title: 'Help me with something', icon: '🙋' },
];

const ICON_BY_TYPE: Record<RequestType, string> = {
  item: '📦',
  ice_cream: '🍦',
  clothes: '🧺',
  help: '🙋',
  custom: '✨',
};

export function iconForType(type: RequestType): string {
  return ICON_BY_TYPE[type] ?? '✨';
}
