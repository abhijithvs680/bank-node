export const MEDICATION_FREQUENCY_OPTIONS = [
  { value: 'once-daily-morning', label: 'Once Daily - Morning (1-0-0)' },
  { value: 'once-daily-afternoon', label: 'Once Daily - Afternoon (0-1-0)' },
  { value: 'once-daily-night', label: 'Once Daily - Night (0-0-1)' },
  { value: 'twice-daily', label: 'Twice Daily (1-0-1)' },
  { value: 'three-times-daily', label: 'Three Times Daily (1-1-1)' },
  { value: 'four-times-daily', label: 'Four Times Daily (1-1-1-1)' },
  { value: 'every-4-hours', label: 'Every 4 Hours (Q4H)' },
  { value: 'every-6-hours', label: 'Every 6 Hours (Q6H)' },
  { value: 'every-8-hours', label: 'Every 8 Hours (Q8H)' },
  { value: 'prn', label: 'PRN (as needed)' },
] as const;

export const AMBIENT_FREQUENCY_OPTIONS = [
  'Once Daily - Morning (1-0-0)',
  'Once Daily - Afternoon (0-1-0)',
  'Once Daily - Night (0-0-1)',
  'Twice Daily (1-0-1)',
  'Three Times Daily (1-1-1)',
  'Four Times Daily (1-1-1-1)',
  'Every 4 Hours',
  'Every 6 Hours',
  'Every 8 Hours',
  'As Needed (PRN)',
] as const;

export const MEDICATION_ROUTE_OPTIONS = [
  { value: 'oral', label: 'Oral' },
  { value: 'iv', label: 'Intravenous (IV)' },
  { value: 'im', label: 'Intramuscular (IM)' },
  { value: 'sc', label: 'Subcutaneous (SC)' },
  { value: 'topical', label: 'Topical' },
  { value: 'inhaled', label: 'Inhaled' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'vaginal', label: 'Vaginal Route' },
] as const;

export const ONCE_DAILY_NIGHT_LABEL = 'Once Daily - Night (0-0-1)';

export const normalizeFrequencyFromApi = (frequency?: string): string => {
  if (!frequency?.trim()) return frequency || '';
  const f = frequency.toLowerCase().trim().replace(/\s+/g, ' ');

  if (
    f === 'once-daily-evening' ||
    f === 'once-daily-night' ||
    f === 'once daily - evening' ||
    f === 'once daily - evening (0-0-1)' ||
    (f.includes('once daily') && f.includes('evening'))
  ) {
    return ONCE_DAILY_NIGHT_LABEL;
  }

  return frequency;
};

export const FREQUENCY_VALUE_TO_SHORT: Record<string, string> = {
  'once-daily-morning': '1-0-0',
  'once-daily-afternoon': '0-1-0',
  'once-daily-evening': '0-0-1',
  'once-daily-night': '0-0-1',
  'once-daily': '1-0-0',
  'twice-daily': '1-0-1',
  'three-times-daily': '1-1-1',
  'four-times-daily': '1-1-1-1',
  'every-4-hours': 'Q4H',
  'every-6-hours': 'Q6H',
  'every-8-hours': 'Q8H',
  'prn': 'PRN (as needed)',
};
