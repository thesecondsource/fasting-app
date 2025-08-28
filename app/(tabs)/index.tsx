import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Square, Timer } from 'lucide-react-native';
import { useFasting } from '@/hooks/useFasting';
import { ProgressCircle } from '@/components/ProgressCircle';
import { FastingMethodCard } from '@/components/FastingMethodCard';
import { FastingMethod } from '@/types';
import { FASTING_METHODS } from '@/constants/fastingMethods';
import { dateUtils } from '@/utils/dateUtils';
import { useTheme } from '@/contexts/ThemeContext';
import { storageService } from '@/utils/storage';

export default function TimerScreen() {
  const { colors } = useTheme();
  const {
    fastingState,
    loading,
    startFasting,
    stopFasting,
    getTimeRemaining,
    getProgress,
  } = useFasting();
  const [selectedMethod, setSelectedMethod] = useState<FastingMethod>(
    FASTING_METHODS[0]
  );
  const [showMethodSelection, setShowMethodSelection] = useState(false);

  useEffect(() => {
    const loadInitialMethod = async () => {
      if (fastingState.isActive && fastingState.method) {
        setSelectedMethod(fastingState.method);
      } else {
        try {
          const settings = await storageService.getUserSettings();
          if (settings.preferredMethod) {
            setSelectedMethod(settings.preferredMethod);
          }
        } catch (error) {
          console.error('Failed to load preferred method', error);
        }
      }
    };

    if (!loading) {
      loadInitialMethod();
    }
  }, [loading, fastingState.isActive, fastingState.method]);

  const handleStartFasting = () => {
    Alert.alert(
      'Start Fasting',
      `Are you ready to start your ${selectedMethod.name} fast?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => startFasting(selectedMethod) },
      ]
    );
  };

  const handleStopFasting = () => {
    Alert.alert(
      'Stop Fasting',
      'Are you sure you want to end your fast early?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', onPress: stopFasting, style: 'destructive' },
      ]
    );
  };

  const handleSelectMethod = async (method: FastingMethod) => {
    setSelectedMethod(method);
    setShowMethodSelection(false);
    try {
      const settings = await storageService.getUserSettings();
      await storageService.saveUserSettings({
        ...settings,
        preferredMethod: method,
      });
    } catch (error) {
      console.error('Failed to save preferred method', error);
    }
  };

  const getEndTimeDisplay = () => {
    if (!fastingState.startTime || !fastingState.endTime) return '';

    const start = new Date(fastingState.startTime);
    const end = new Date(fastingState.endTime);

    const isSameDay =
      start.getDate() === end.getDate() &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();

    if (isSameDay) {
      return dateUtils.formatTime(end);
    }

    const tomorrow = new Date(start);
    tomorrow.setDate(start.getDate() + 1);
    const isTomorrow = end.getDate() === tomorrow.getDate();

    return isTomorrow
      ? `${dateUtils.formatTime(end)} (Tomorrow)`
      : `${dateUtils.formatTime(end)} on ${dateUtils.formatDate(end)}`;
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={[styles.title, { color: colors.text }]}>
            Intermittent Fasting
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {fastingState.isActive ? 'Fasting in Progress' : 'Ready to Start'}
          </Text>
        </View>

        <View style={styles.timerSection}>
          <ProgressCircle
            progress={fastingState.isActive ? getProgress() : 0}
            size={280}
            strokeWidth={12}
            color={colors.primary}
            backgroundColor={colors.border}
          >
            <View style={styles.timerContent}>
              <Timer size={32} color={colors.primary} />
              <Text style={[styles.timerText, { color: colors.text }]}>
                {fastingState.isActive
                  ? getTimeRemaining()
                  : `${selectedMethod.fastingHours}h 0m`}
              </Text>
              <Text
                style={[styles.timerLabel, { color: colors.textSecondary }]}
              >
                {fastingState.isActive ? 'Remaining' : 'Duration'}
              </Text>
            </View>
          </ProgressCircle>
        </View>

        {fastingState.isActive && (
          <View
            style={[
              styles.activeInfo,
              {
                backgroundColor: colors.primary + '20',
                borderColor: colors.primary + '40',
              },
            ]}
          >
            <Text style={[styles.activeInfoText, { color: colors.primary }]}>
              Started: {dateUtils.formatTime(fastingState.startTime!)}
            </Text>
            <Text style={[styles.activeInfoText, { color: colors.primary }]}>
              Ends: {getEndTimeDisplay()}
            </Text>
            <Text style={[styles.methodText, { color: colors.primary }]}>
              Method: {fastingState.method.name}
            </Text>
          </View>
        )}

        {!fastingState.isActive && !showMethodSelection && (
          <View style={styles.methodInfo}>
            <Text style={[styles.methodTitle, { color: colors.text }]}>
              Selected Method
            </Text>
            <FastingMethodCard
              method={selectedMethod}
              isSelected={true}
              onSelect={() => setShowMethodSelection(true)}
            />
          </View>
        )}

        {showMethodSelection && !fastingState.isActive && (
          <View style={styles.methodSelection}>
            <Text style={[styles.methodTitle, { color: colors.text }]}>
              Choose Your Method
            </Text>
            {FASTING_METHODS.map((method) => (
              <FastingMethodCard
                key={method.id}
                method={method}
                isSelected={selectedMethod.id === method.id}
                onSelect={handleSelectMethod}
              />
            ))}
          </View>
        )}

        <View style={styles.buttonContainer}>
          {fastingState.isActive ? (
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: colors.error }]}
              onPress={handleStopFasting}
            >
              <Square size={24} color="#FFFFFF" />
              <Text style={[styles.stopButtonText, { color: '#FFFFFF' }]}>
                Stop Fast
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleStartFasting}
              >
                <Play size={24} color="#FFFFFF" />
                <Text style={[styles.startButtonText, { color: '#FFFFFF' }]}>
                  Start Fast
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerContent: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 40,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeInfo: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  activeInfoText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  methodInfo: {
    marginBottom: 32,
  },
  methodSelection: {
    marginBottom: 32,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 'auto',
  },
  startButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  stopButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
