import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { storageService } from '@/utils/storage';

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    determineRedirectPath();
  }, []);

  const determineRedirectPath = async () => {
    try {
      const settings = await storageService.getUserSettings();
      
      console.log('Settings loaded:', settings); // Debug log
      
      if (!settings.onboardingCompleted) {
        console.log('Redirecting to onboarding'); // Debug log
        setRedirectPath('/onboarding');
      } else if (!settings.isPremium && !settings.paywallSeen) {
        console.log('Redirecting to paywall'); // Debug log
        setRedirectPath('/paywall');
      } else {
        console.log('Redirecting to main app'); // Debug log
        setRedirectPath('/(tabs)');
      }
    } catch (error) {
      console.error('Error determining redirect path:', error);
      console.log('Error occurred, defaulting to onboarding'); // Debug log
      setRedirectPath('/onboarding'); // Default fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading || !redirectPath) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>FastTrack</Text>
          <Text style={styles.loadingSubtext}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <Redirect href={redirectPath} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#6B7280',
  },
});