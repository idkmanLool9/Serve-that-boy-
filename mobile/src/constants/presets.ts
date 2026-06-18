import { RequestType } from '../types';

export interface Preset {
  type: RequestType;
  title: string;
  icon: string;
}

// The one-tap requests a Customer can send.
export const PRESETS: Preset[] = [
  { type: 'item', title: 'Breng iets voor me', icon: '📦' },
  { type: 'ice_cream', title: 'Haal een ijsje voor me', icon: '🍦' },
  { type: 'clothes', title: 'Breng mijn kleren naar beneden', icon: '🧺' },
  { type: 'help', title: 'Help me met iets', icon: '🙋' },
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
