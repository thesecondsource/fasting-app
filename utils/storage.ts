import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FastingSession,
  HealthMetrics,
  UserSettings,
  FastingState,
  JournalEntry,
} from '@/types';
import { DEFAULT_FASTING_METHOD } from '@/constants/fastingMethods';

const STORAGE_KEYS = {
  FASTING_SESSIONS: 'fasting_sessions',
  HEALTH_METRICS: 'health_metrics',
  USER_SETTINGS: 'user_settings',
  FASTING_STATE: 'fasting_state',
  LAST_HEALTH_SAVE: 'last_health_save',
  JOURNAL_ENTRIES: 'journal_entries',
};

export const storageService = {
  // Fasting Sessions
  async getFastingSessions(): Promise<FastingSession[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FASTING_SESSIONS);
      return data
        ? JSON.parse(data).map((session: any) => ({
            ...session,
            startTime: new Date(session.startTime),
            endTime: new Date(session.endTime),
          }))
        : [];
    } catch (error) {
      console.error('Error loading fasting sessions:', error);
      return [];
    }
  },

  async saveFastingSession(session: FastingSession): Promise<void> {
    try {
      const sessions = await this.getFastingSessions();
      const updatedSessions = [...sessions, session];
      await AsyncStorage.setItem(
        STORAGE_KEYS.FASTING_SESSIONS,
        JSON.stringify(updatedSessions)
      );
    } catch (error) {
      console.error('Error saving fasting session:', error);
    }
  },

  async saveFastingSessions(sessions: FastingSession[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FASTING_SESSIONS,
        JSON.stringify(sessions)
      );
    } catch (error) {
      console.error('Error saving fasting sessions:', error);
    }
  },

  // Health Metrics
  async getHealthMetrics(): Promise<HealthMetrics[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_METRICS);
      return data
        ? JSON.parse(data).map((metric: any) => ({
            ...metric,
            date: new Date(metric.date),
          }))
        : [];
    } catch (error) {
      console.error('Error loading health metrics:', error);
      return [];
    }
  },

  async saveHealthMetrics(metrics: HealthMetrics): Promise<void> {
    try {
      const existingMetrics = await this.getHealthMetrics();

      // Check if a metric for the same date already exists
      const existingIndex = existingMetrics.findIndex(
        (m) =>
          new Date(m.date).toDateString() ===
          new Date(metrics.date).toDateString()
      );

      let updatedMetrics;
      if (existingIndex !== -1) {
        // Update existing metric
        updatedMetrics = [...existingMetrics];
        updatedMetrics[existingIndex] = metrics;
      } else {
        // Add new metric
        updatedMetrics = [...existingMetrics, metrics];
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.HEALTH_METRICS,
        JSON.stringify(updatedMetrics)
      );
    } catch (error) {
      console.error('Error saving health metrics:', error);
    }
  },

  async saveAllHealthMetrics(metrics: HealthMetrics[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.HEALTH_METRICS,
        JSON.stringify(metrics)
      );
    } catch (error) {
      console.error('Error saving all health metrics:', error);
    }
  },

  // User Settings
  async getUserSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return data
        ? JSON.parse(data)
        : {
            preferredMethod: DEFAULT_FASTING_METHOD,
            notificationsEnabled: true,
            fastingStartNotification: true,
            fastingEndNotification: true,
            reminderInterval: 60,
            units: 'metric',
            darkMode: false,
            onboardingCompleted: false,
            paywallSeen: false,
            isPremium: false,
          };
    } catch (error) {
      console.error('Error loading user settings:', error);
      return {
        preferredMethod: DEFAULT_FASTING_METHOD,
        notificationsEnabled: true,
        fastingStartNotification: true,
        fastingEndNotification: true,
        reminderInterval: 60,
        units: 'metric',
        darkMode: false,
        onboardingCompleted: false,
        paywallSeen: false,
        isPremium: false,
      };
    }
  },

  async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  },

  // Fasting State
  async getFastingState(): Promise<FastingState | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FASTING_STATE);
      return data
        ? {
            ...JSON.parse(data),
            startTime: JSON.parse(data).startTime
              ? new Date(JSON.parse(data).startTime)
              : null,
            endTime: JSON.parse(data).endTime
              ? new Date(JSON.parse(data).endTime)
              : null,
          }
        : null;
    } catch (error) {
      console.error('Error loading fasting state:', error);
      return null;
    }
  },

  async saveFastingState(state: FastingState): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FASTING_STATE,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error('Error saving fasting state:', error);
    }
  },

  async clearFastingState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.FASTING_STATE);
    } catch (error) {
      console.error('Error clearing fasting state:', error);
    }
  },

  // Last Health Metrics Save Time
  async getLastHealthMetricsSave(): Promise<Date | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_HEALTH_SAVE);
      return data ? new Date(data) : null;
    } catch (error) {
      console.error('Error loading last health save time:', error);
      return null;
    }
  },

  async saveLastHealthMetricsSave(date: Date | null): Promise<void> {
    try {
      if (date) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.LAST_HEALTH_SAVE,
          date.toISOString()
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.LAST_HEALTH_SAVE);
      }
    } catch (error) {
      console.error('Error saving last health save time:', error);
    }
  },

  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
      return data
        ? JSON.parse(data).map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
          }))
        : [];
    } catch (error) {
      console.error('Error loading journal entries:', error);
      return [];
    }
  },

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    try {
      const entries = await this.getJournalEntries();
      const updatedEntries = [...entries, entry];
      await AsyncStorage.setItem(
        STORAGE_KEYS.JOURNAL_ENTRIES,
        JSON.stringify(updatedEntries)
      );
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  },

  async saveAllJournalEntries(entries: JournalEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.JOURNAL_ENTRIES,
        JSON.stringify(entries)
      );
    } catch (error) {
      console.error('Error saving all journal entries:', error);
    }
  },

  async updateJournalEntry(updatedEntry: JournalEntry): Promise<void> {
    try {
      const entries = await this.getJournalEntries();
      const updatedEntries = entries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.JOURNAL_ENTRIES,
        JSON.stringify(updatedEntries)
      );
    } catch (error) {
      console.error('Error updating journal entry:', error);
    }
  },

  async deleteJournalEntry(entryId: string): Promise<void> {
    try {
      const entries = await this.getJournalEntries();
      const updatedEntries = entries.filter((entry) => entry.id !== entryId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.JOURNAL_ENTRIES,
        JSON.stringify(updatedEntries)
      );
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  },
};
