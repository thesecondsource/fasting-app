import React, { useEffect } from 'react';
import { Stack, router, SplashScreen } from 'expo-router';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { storageService } from '@/utils/storage';

// Prevent the splash screen from auto-hiding until we know where to navigate.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colors } = useTheme();

  useEffect(() => {
    storageService
      .getUserSettings()
      .then((settings) => {
        if (!settings.onboardingCompleted) {
          router.replace('/onboarding');
        } else if (!settings.paywallSeen) {
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
  }, []);

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
      <RootLayoutNav />
    </ThemeProvider>
  );
}
