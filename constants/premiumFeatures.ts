import { PremiumFeature, SubscriptionPlan } from '@/types';

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed insights, trends, and personalized recommendations',
    icon: 'TrendingUp',
  },
  {
    id: 'custom_fasting_plans',
    name: 'Custom Fasting Plans',
    description: 'Create and save your own personalized fasting schedules',
    icon: 'Calendar',
  },
  {
    id: 'export_data',
    name: 'Export Data',
    description: 'Export your fasting history and health metrics to CSV/PDF',
    icon: 'Download',
  },
  {
    id: 'premium_support',
    name: 'Priority Support',
    description: '24/7 premium customer support and expert guidance',
    icon: 'Headphones',
  },
  {
    id: 'unlimited_history',
    name: 'Unlimited History',
    description: 'Access your complete fasting history without limits',
    icon: 'Clock',
  },
  {
    id: 'advanced_reminders',
    name: 'Smart Reminders',
    description: 'Intelligent notifications based on your patterns and goals',
    icon: 'Bell',
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$4.99',
    duration: 'per month',
    features: [
      'All premium features',
      'Advanced analytics',
      'Custom fasting plans',
      'Export data',
      'Priority support',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$39.99',
    duration: 'per year',
    features: [
      'All premium features',
      'Advanced analytics',
      'Custom fasting plans',
      'Export data',
      'Priority support',
      'Save 33% vs monthly',
    ],
    popular: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$99.99',
    duration: 'one-time',
    features: [
      'All premium features',
      'Lifetime access',
      'Future updates included',
      'No recurring payments',
      'Best value',
    ],
  },
];