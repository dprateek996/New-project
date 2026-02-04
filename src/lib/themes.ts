import type { ThemeKey } from '@/lib/types';

export const THEMES: Record<ThemeKey, { label: string; description: string }> = {
  journal: {
    label: 'Journal',
    description: 'Warm paper, elegant serif.'
  },
  developer: {
    label: 'Developer',
    description: 'Clean sans + mono code blocks.'
  }
};
