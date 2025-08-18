export interface FastingMethod {
  id: string;
  name: string;
  fastingHours: number;
  eatingHours: number;
  description: string;
}

export interface FastingSession {
  id: string;
  method: FastingMethod;
  startTime: Date;
  endTime: Date;
  completed: boolean;
  duration: number; // in minutes
}

export interface HealthMetrics {
  id: string;
  date: Date;
  weight?: number;
  waterIntake: number; // in ml
  energyLevel: number; // 1-5 scale
  mood: number; // 1-5 scale
  sleepQuality: number; // 1-5 scale
}

export interface UserSettings {
  preferredMethod: FastingMethod;
  notificationsEnabled: boolean;
  fastingStartNotification: boolean;
  fastingEndNotification: boolean;
  reminderInterval: number; // in minutes
  units: 'metric' | 'imperial';
  darkMode: boolean;
  onboardingCompleted: boolean;
  isPremium: boolean;
  premiumExpiryDate?: Date;
  paywallSeen?: boolean;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  duration: string;
  features: string[];
  popular?: boolean;
}
export interface FastingState {
  isActive: boolean;
  currentSession: FastingSession | null;
  startTime: Date | null;
  endTime: Date | null;
  method: FastingMethod;
}

export interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  content: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  tags: string[];
}