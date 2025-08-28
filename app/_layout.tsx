// This import must be at the top of the file to polyfill the crypto object
import 'react-native-get-random-values';

import React, { useEffect } from 'react';
import { Stack, router, SplashScreen } from 'expo-router';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import {
  SubscriptionProvider,
  useSubscription,
} from '@/contexts/SubscriptionContext';
import { storageService } from '@/utils/storage';
import { initRevenueCat } from '@/rc-init';

// Prevent the splash screen from auto-hiding until we know where to navigate.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colors } = useTheme();
  const { isPremium, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    initRevenueCat();
  }, []);

  useEffect(() => {
    if (subscriptionLoading) {
      return; // Wait for subscription status to be loaded
    }

    storageService
      .getUserSettings()
      .then((settings) => {
        if (!settings.onboardingCompleted) {
          router.replace('/onboarding');
        } else if (!isPremium && !settings.paywallSeen) {
          // Only show paywall if user is not premium and hasn't seen it
          router.replace('/paywall');
        } else {
          router.replace('/(tabs)');
        }
      })
      .catch((err) => {
        console.error('Failed to read user settings', err);
        router.replace('/onboarding'); // Fallback to onboarding
      })
      .finally(() => {
        SplashScreen.hideAsync();
      });
  }, [subscriptionLoading, isPremium]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="paywall" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SubscriptionProvider>
        <RootLayoutNav />
      </SubscriptionProvider>
    </ThemeProvider>
  );
}
