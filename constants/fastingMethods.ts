import { FastingMethod } from '@/types';

export const FASTING_METHODS: FastingMethod[] = [
  {
    id: '16_8',
    name: '16:8',
    fastingHours: 16,
    eatingHours: 8,
    description: 'Fast for 16 hours, eat within 8 hours. Most popular method for beginners.',
  },
  {
    id: '18_6',
    name: '18:6',
    fastingHours: 18,
    eatingHours: 6,
    description: 'Fast for 18 hours, eat within 6 hours. Intermediate level fasting.',
  },
  {
    id: '20_4',
    name: '20:4',
    fastingHours: 20,
    eatingHours: 4,
    description: 'Fast for 20 hours, eat within 4 hours. Also known as Warrior Diet.',
  },
  {
    id: 'omad',
    name: 'OMAD',
    fastingHours: 23,
    eatingHours: 1,
    description: 'One Meal A Day. Fast for 23 hours, eat within 1 hour window.',
  },
];

export const DEFAULT_FASTING_METHOD = FASTING_METHODS[0];