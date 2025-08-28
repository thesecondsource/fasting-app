import { useState, useEffect, useCallback } from 'react';
import { FastingState, FastingMethod, FastingSession } from '@/types';
import { storageService } from '@/utils/storage';
import { notificationService } from '@/utils/notifications';
import { dateUtils } from '@/utils/dateUtils';
import { DEFAULT_FASTING_METHOD } from '@/constants/fastingMethods';

export const useFasting = () => {
  const [fastingState, setFastingState] = useState<FastingState>({
    isActive: false,
    currentSession: null,
    startTime: null,
    endTime: null,
    method: DEFAULT_FASTING_METHOD,
  });

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadFastingState();
  }, []);

  // Update current time every minute when fasting is active
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (fastingState.isActive) {
      interval = setInterval(() => {
        const now = new Date();
        setCurrentTime(now);

        // Check if fasting period has ended
        if (fastingState.endTime && now >= fastingState.endTime) {
          completeFasting();
        }
      }, 1000); // Update every second
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fastingState.isActive, fastingState.endTime]);

  const loadFastingState = async () => {
    try {
      const savedState = await storageService.getFastingState();
      if (savedState) {
        // Check if the saved fasting session is still active
        const now = new Date();
        if (savedState.endTime && now < savedState.endTime) {
          setFastingState(savedState);
          setCurrentTime(now);
        } else {
          // Session has ended, complete it and clear state
          if (savedState.currentSession) {
            const completedSession: FastingSession = {
              ...savedState.currentSession,
              endTime: savedState.endTime,
              completed: true,
              duration: savedState.method.fastingHours * 60,
            };
            await storageService.saveFastingSession(completedSession);
          }
          await storageService.clearFastingState();
        }
      }
    } catch (error) {
      console.error('Error loading fasting state:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeFasting = useCallback(async () => {
    try {
      if (fastingState.currentSession) {
        const completedSession: FastingSession = {
          ...fastingState.currentSession,
          endTime: fastingState.endTime || new Date(),
          completed: true,
          duration: fastingState.method.fastingHours * 60,
        };

        await storageService.saveFastingSession(completedSession);
      }

      setFastingState({
        isActive: false,
        currentSession: null,
        startTime: null,
        endTime: null,
        method: fastingState.method,
      });

      await storageService.clearFastingState();
    } catch (error) {
      console.error('Error completing fasting:', error);
    }
  }, [fastingState]);

  const startFasting = useCallback(async (method: FastingMethod) => {
    try {
      const startTime = new Date();
      const endTime = dateUtils.addHoursToDate(startTime, method.fastingHours);

      const newSession: FastingSession = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
        method,
        startTime,
        endTime,
        completed: false,
        duration: method.fastingHours * 60,
      };

      const newState: FastingState = {
        isActive: true,
        currentSession: newSession,
        startTime,
        endTime,
        method,
      };

      setFastingState(newState);
      setCurrentTime(startTime);
      await storageService.saveFastingState(newState);

      // Schedule notifications
      const hasPermission = await notificationService.requestPermissions();
      if (hasPermission) {
        const notificationId = await notificationService.scheduleNotification(
          'Fasting Complete! 🎉',
          `Your ${method.name} fasting period has ended. You can now eat!`,
          endTime
        );

        // Store notification ID for potential cancellation
        if (notificationId) {
          console.log('Scheduled fasting end notification:', notificationId);
        }

        // Schedule a reminder notification 30 minutes before end
        const reminderTime = new Date(endTime.getTime() - 30 * 60 * 1000);
        if (reminderTime > new Date()) {
          await notificationService.scheduleNotification(
            'Fasting Almost Complete! ⏰',
            `Your ${method.name} fast ends in 30 minutes. Get ready to break your fast!`,
            reminderTime
          );
        }
      }
    } catch (error) {
      console.error('Error starting fasting:', error);
    }
  }, []);

  const stopFasting = useCallback(async () => {
    try {
      if (fastingState.currentSession) {
        const completedSession: FastingSession = {
          ...fastingState.currentSession,
          endTime: new Date(),
          completed: true,
          duration: Math.round(
            (new Date().getTime() - fastingState.startTime!.getTime()) / 60000
          ),
        };

        await storageService.saveFastingSession(completedSession);
      }

      setFastingState({
        isActive: false,
        currentSession: null,
        startTime: null,
        endTime: null,
        method: fastingState.method,
      });

      await storageService.clearFastingState();
      await notificationService.cancelAllNotifications();
    } catch (error) {
      console.error('Error stopping fasting:', error);
    }
  }, [fastingState]);

  const getTimeRemaining = useCallback((): string => {
    if (!fastingState.endTime) return '0m';
    return dateUtils.formatTimeRemaining(fastingState.endTime, currentTime);
  }, [fastingState.endTime, currentTime]);

  const getProgress = useCallback((): number => {
    if (!fastingState.startTime || !fastingState.endTime) return 0;
    return dateUtils.getProgressPercentage(
      fastingState.startTime,
      fastingState.endTime,
      currentTime
    );
  }, [fastingState.startTime, fastingState.endTime, currentTime]);

  return {
    fastingState,
    loading,
    startFasting,
    stopFasting,
    getTimeRemaining,
    getProgress,
  };
};
