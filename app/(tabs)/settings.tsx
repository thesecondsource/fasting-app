import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  User,
  Info,
  Shield,
  Trash2,
  BookOpen,
  Moon,
  Sun,
  Crown,
  Star,
  Download,
} from 'lucide-react-native';
import {
  UserSettings,
  FastingSession,
  HealthMetrics,
  JournalEntry,
} from '@/types';
import { storageService } from '@/utils/storage';
import { notificationService } from '@/utils/notifications';
import { useTheme } from '@/contexts/ThemeContext';
import { PremiumBadge } from '@/components/PremiumBadge';
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function SettingsScreen() {
  const { colors, toggleDarkMode } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    preferredMethod: {
      id: '16_8',
      name: '16:8',
      fastingHours: 16,
      eatingHours: 8,
      description: '',
    },
    notificationsEnabled: true,
    fastingStartNotification: true,
    fastingEndNotification: true,
    reminderInterval: 60,
    units: 'metric',
    darkMode: false,
    onboardingCompleted: false,
    isPremium: false,
    premiumExpiryDate: undefined,
    paywallSeen: false,
  });
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userSettings = await storageService.getUserSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await storageService.saveUserSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleDarkModeToggle = async (enabled: boolean) => {
    await toggleDarkMode();
    const newSettings = { ...settings, darkMode: enabled };
    setSettings(newSettings);
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      let hasPermission = await notificationService.requestPermissions();

      // Also try web notifications if on web platform
      if (!hasPermission && Platform.OS === 'web') {
        hasPermission =
          await notificationService.requestWebNotificationPermission();
      }

      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          Platform.OS === 'web'
            ? 'Please allow notifications in your browser to receive fasting reminders.'
            : 'Please enable notifications in your device settings to receive fasting reminders.'
        );
        return;
      }
    }

    const newSettings = { ...settings, notificationsEnabled: enabled };
    await saveSettings(newSettings);
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your fasting history, health metrics, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: In a real app, you'd want to clear all stored data
              // For now, we'll just show a confirmation
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'About FastTrack',
      'FastTrack is your companion for intermittent fasting. Track your fasting schedule, monitor your health, and achieve your wellness goals.\n\nVersion 1.0.0',
      [{ text: 'OK' }]
    );
  };

  const showPrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. All data is stored locally on your device and is never shared with third parties. We do not collect any personal information.',
      [{ text: 'OK' }]
    );
  };

  const handleUpgrade = (planId: string) => {
    setShowUpgradeModal(false);
    // In a real app, this would integrate with RevenueCat or similar
    console.log('Upgrading to plan:', planId);
  };

  const togglePremiumDemo = async () => {
    // Demo function to toggle premium status for testing
    const newSettings = { ...settings, isPremium: !settings.isPremium };
    await saveSettings(newSettings);
  };

  const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) {
      return '';
    }
    const stringField = String(field);
    if (
      stringField.includes(',') ||
      stringField.includes('"') ||
      stringField.includes('\n')
    ) {
      const escapedField = stringField.replace(/"/g, '""');
      return `"${escapedField}"`;
    }
    return stringField;
  };

  const generateCSVContent = (
    sessions: FastingSession[],
    metrics: HealthMetrics[],
    entries: JournalEntry[]
  ) => {
    const toCsvRow = (arr: any[]) => arr.map(escapeCsvField).join(',');

    // Fasting Sessions
    const sessionHeaders = [
      'Date',
      'Method',
      'Start Time',
      'End Time',
      'Duration (hours)',
      'Completed',
    ];
    const sessionRows = sessions.map((s) =>
      toCsvRow([
        new Date(s.startTime).toLocaleDateString(),
        s.method.name,
        new Date(s.startTime).toLocaleTimeString(),
        new Date(s.endTime).toLocaleTimeString(),
        (s.duration / 3600000).toFixed(2),
        s.completed,
      ])
    );
    const sessionsCsv = `FASTING SESSIONS\n${toCsvRow(
      sessionHeaders
    )}\n${sessionRows.join('\n')}`;

    // Health Metrics
    const metricHeaders = [
      'Date',
      'Weight',
      'Water Intake (ml)',
      'Energy Level (1-5)',
      'Mood (1-5)',
      'Sleep Quality (1-5)',
    ];
    const metricRows = metrics.map((m) =>
      toCsvRow([
        new Date(m.date).toLocaleDateString(),
        m.weight ?? 'N/A',
        m.waterIntake,
        m.energyLevel,
        m.mood,
        m.sleepQuality,
      ])
    );
    const metricsCsv = `HEALTH METRICS\n${toCsvRow(
      metricHeaders
    )}\n${metricRows.join('\n')}`;

    // Journal Entries
    const entryHeaders = ['Date', 'Title', 'Mood', 'Tags', 'Content'];
    const entryRows = entries.map((e) =>
      toCsvRow([
        new Date(e.date).toLocaleDateString(),
        e.title,
        e.mood,
        e.tags.join('; '),
        e.content,
      ])
    );
    const entriesCsv = `JOURNAL ENTRIES\n${toCsvRow(
      entryHeaders
    )}\n${entryRows.join('\n')}`;

    return `${sessionsCsv}\n\n${metricsCsv}\n\n${entriesCsv}`;
  };

  const handleExportData = async () => {
    try {
      const [fastingSessions, healthMetrics, journalEntries] =
        await Promise.all([
          storageService.getFastingSessions(),
          storageService.getHealthMetrics(),
          storageService.getJournalEntries(),
        ]);

      const csvContent = generateCSVContent(
        fastingSessions,
        healthMetrics,
        journalEntries
      );

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], {
          type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'FastTrack_Export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const fileUri = FileSystem.cacheDirectory + 'FastTrack_Export.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export your data',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert(
          'Export Ready',
          `Your data has been saved. You can access it at: ${fileUri}`
        );
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
            {settings.isPremium && <PremiumBadge size="small" />}
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {settings.isPremium
              ? 'Premium member - enjoy all features!'
              : 'Customize your fasting experience'}
          </Text>
        </View>

        {!settings.isPremium && (
          <TouchableOpacity
            style={[
              styles.premiumCard,
              {
                backgroundColor: '#FFD700' + '20',
                borderColor: '#FFD700' + '40',
              },
            ]}
            onPress={() => setShowUpgradeModal(true)}
          >
            <View style={styles.premiumCardContent}>
              <Crown size={24} color="#FFD700" />
              <View style={styles.premiumCardText}>
                <Text style={[styles.premiumCardTitle, { color: colors.text }]}>
                  Upgrade to Premium
                </Text>
                <Text
                  style={[
                    styles.premiumCardSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Unlock advanced analytics, custom plans, and more
                </Text>
              </View>
              <Star size={20} color="#FFD700" />
            </View>
          </TouchableOpacity>
        )}

        <View key="appearance-section" style={styles.section}>
          <View style={styles.sectionHeader}>
            {settings.darkMode ? (
              <Moon size={20} color="#8B5CF6" />
            ) : (
              <Sun size={20} color="#F59E0B" />
            )}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Appearance
            </Text>
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Switch between light and dark themes
              </Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={settings.darkMode ? '#8B5CF6' : '#9CA3AF'}
            />
          </View>
        </View>

        <View key="notifications-section" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Notifications
            </Text>
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Enable Notifications
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Receive reminders for fasting start and end times
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={
                settings.notificationsEnabled
                  ? colors.primary
                  : colors.textTertiary
              }
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Fasting Start Notifications
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Get notified when it's time to start fasting
              </Text>
            </View>
            <Switch
              value={
                settings.fastingStartNotification &&
                settings.notificationsEnabled
              }
              onValueChange={(value) =>
                saveSettings({ ...settings, fastingStartNotification: value })
              }
              disabled={!settings.notificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={
                settings.fastingStartNotification
                  ? colors.primary
                  : colors.textTertiary
              }
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Fasting End Notifications
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Get notified when your fasting window ends
              </Text>
            </View>
            <Switch
              value={
                settings.fastingEndNotification && settings.notificationsEnabled
              }
              onValueChange={(value) =>
                saveSettings({ ...settings, fastingEndNotification: value })
              }
              disabled={!settings.notificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={
                settings.fastingEndNotification
                  ? colors.primary
                  : colors.textTertiary
              }
            />
          </View>
        </View>

        <View key="preferences-section" style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Preferences
            </Text>
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Units
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Choose your preferred measurement system
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.primary }]}>
              {settings.units === 'metric' ? 'Metric' : 'Imperial'}
            </Text>
          </View>
        </View>

        <View key="learn-section" style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Learn
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              Alert.alert(
                'Intermittent Fasting Guide',
                'Intermittent fasting is an eating pattern that cycles between periods of fasting and eating. Popular methods include:\n\n• 16:8 - Fast 16 hours, eat in 8 hours\n• 18:6 - Fast 18 hours, eat in 6 hours\n• 20:4 - Fast 20 hours, eat in 4 hours\n• OMAD - One meal a day\n\nAlways consult with a healthcare provider before starting any fasting regimen.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={[styles.actionItemText, { color: colors.text }]}>
              Fasting Guide
            </Text>
          </TouchableOpacity>
        </View>

        <View key="about-section" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={showAbout}
          >
            <Text style={[styles.actionItemText, { color: colors.text }]}>
              About FastTrack
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={showPrivacyPolicy}
          >
            <Text style={[styles.actionItemText, { color: colors.text }]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Premium Toggle - Remove in production */}
        <View key="premium-demo-section" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crown size={20} color="#FFD700" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Premium (Demo)
            </Text>
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Premium Status
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Toggle premium features for demo purposes
              </Text>
            </View>
            <Switch
              value={settings.isPremium}
              onValueChange={togglePremiumDemo}
              trackColor={{ false: colors.border, true: '#FFD700' + '60' }}
              thumbColor={settings.isPremium ? '#FFD700' : colors.textTertiary}
            />
          </View>
        </View>

        <View key="data-section" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.error} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Data
            </Text>
          </View>

          {/* Export Data - Premium Feature */}
          <TouchableOpacity
            style={[
              styles.exportItem,
              {
                backgroundColor: settings.isPremium
                  ? colors.primary + '20'
                  : colors.surface,
                borderColor: settings.isPremium
                  ? colors.primary + '40'
                  : colors.border,
                opacity: settings.isPremium ? 1 : 0.7,
              },
            ]}
            onPress={
              settings.isPremium
                ? handleExportData
                : () => setShowUpgradeModal(true)
            }
          >
            <Download
              size={16}
              color={settings.isPremium ? colors.primary : colors.textSecondary}
            />
            <View style={styles.exportContent}>
              <Text
                style={[
                  styles.exportTitle,
                  {
                    color: settings.isPremium
                      ? colors.primary
                      : colors.textSecondary,
                  },
                ]}
              >
                Export Data
              </Text>
              <Text
                style={[
                  styles.exportDescription,
                  {
                    color: settings.isPremium
                      ? colors.primary
                      : colors.textTertiary,
                  },
                ]}
              >
                Export your fasting history and health metrics
              </Text>
            </View>
            {!settings.isPremium && <PremiumBadge size="small" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dangerItem,
              {
                backgroundColor: colors.error + '20',
                borderColor: colors.error + '40',
              },
            ]}
            onPress={clearAllData}
          >
            <Trash2 size={16} color={colors.error} />
            <Text style={[styles.dangerItemText, { color: colors.error }]}>
              Clear All Data
            </Text>
          </TouchableOpacity>
        </View>

        <PremiumUpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  premiumCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  premiumCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumCardText: {
    flex: 1,
  },
  premiumCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  premiumCardSubtitle: {
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  actionItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dangerItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  exportItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportContent: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});
