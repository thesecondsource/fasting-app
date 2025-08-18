import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Clock, TrendingUp, Heart, ArrowRight, ArrowLeft, User, Bell, Target, CircleCheck as CheckCircle, Zap } from 'lucide-react-native';
import { FastingMethodCard } from '@/components/FastingMethodCard';
import { FASTING_METHODS } from '@/constants/fastingMethods';
import { storageService } from '@/utils/storage';
import { notificationService } from '@/utils/notifications';
import { FastingMethod } from '@/types';

const { width } = Dimensions.get('window');

const onboardingScreens = [
  {
    id: 'welcome',
    title: 'Welcome to FastTrack',
    subtitle: 'Your personal intermittent fasting companion',
    icon: Clock,
    content: 'Join millions who have transformed their health through intermittent fasting. Track your progress, monitor your wellness, and achieve your goals with our comprehensive fasting app.',
    color: '#3B82F6',
  },
  {
    id: 'benefits',
    title: 'Why Intermittent Fasting?',
    subtitle: 'Discover the science-backed benefits',
    icon: Zap,
    content: 'Intermittent fasting can help with weight management, improved energy levels, better sleep quality, enhanced mental clarity, and overall wellness.',
    color: '#F59E0B',
    benefits: [
      'Weight management support',
      'Increased energy levels',
      'Better sleep quality',
      'Enhanced mental clarity',
      'Improved metabolic health'
    ]
  },
  {
    id: 'tracking',
    title: 'Smart Tracking',
    subtitle: 'Monitor your progress effortlessly',
    icon: TrendingUp,
    content: 'Keep track of your fasting streaks, view detailed statistics, and see your progress over time with beautiful visualizations and insights.',
    color: '#10B981',
  },
  {
    id: 'health',
    title: 'Holistic Health Monitoring',
    subtitle: 'Track more than just fasting',
    icon: Heart,
    content: 'Log your weight, water intake, energy levels, mood, and sleep quality to get a complete picture of your health journey and see how fasting affects your overall wellness.',
    color: '#EF4444',
  },
  {
    id: 'profile',
    title: 'Tell Us About Yourself',
    subtitle: 'Personalize your experience',
    icon: User,
    content: 'Help us customize your fasting journey by sharing some basic information about your goals and preferences.',
    color: '#8B5CF6',
  },
  {
    id: 'notifications',
    title: 'Stay on Track',
    subtitle: 'Enable helpful reminders',
    icon: Bell,
    content: 'Get notified when your fasting window starts and ends, plus receive motivational reminders to help you stay consistent.',
    color: '#06B6D4',
  },
  {
    id: 'method',
    title: 'Choose Your Fasting Method',
    subtitle: 'Select your preferred approach',
    icon: Target,
    content: 'Pick the fasting method that works best for your lifestyle. You can always change this later in settings as you progress.',
    color: '#F97316',
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    subtitle: 'Ready to start your journey',
    icon: CheckCircle,
    content: 'Congratulations! You\'re ready to begin your intermittent fasting journey. Remember, consistency is key, and we\'re here to support you every step of the way.',
    color: '#10B981',
  },
];

interface UserProfile {
  name: string;
  goal: 'weight_loss' | 'health' | 'energy' | 'lifestyle';
  experience: 'beginner' | 'intermediate' | 'advanced';
  preferredStartTime: string;
}

export default function OnboardingScreen() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<FastingMethod>(FASTING_METHODS[0]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    goal: 'health',
    experience: 'beginner',
    preferredStartTime: '20:00',
  });

  const isLastScreen = currentScreen === onboardingScreens.length - 1;
  const isProfileScreen = onboardingScreens[currentScreen].id === 'profile';
  const isNotificationScreen = onboardingScreens[currentScreen].id === 'notifications';
  const isMethodScreen = onboardingScreens[currentScreen].id === 'method';

  const handleNext = async () => {
    if (isNotificationScreen) {
      if (notificationsEnabled) {
        let hasPermission = await notificationService.requestPermissions();
        
        // Also try web notifications if on web platform
        if (!hasPermission && Platform.OS === 'web') {
          hasPermission = await notificationService.requestWebNotificationPermission();
        }
        
        if (!hasPermission) {
          Alert.alert(
            'Notifications',
            Platform.OS === 'web'
              ? 'Browser notification permissions were not granted. You can enable them later in settings to get helpful reminders.'
              : 'Notification permissions were not granted. You can enable them later in settings to get helpful reminders.',
            [{ 
              text: 'Continue', 
              onPress: () => {
                setNotificationsEnabled(false);
                setCurrentScreen(prev => prev + 1);
              }
            }]
          );
          return;
        }
      }
      setCurrentScreen(prev => prev + 1);
      return;
    }

    if (isLastScreen) {
      completeOnboarding();
    } else {
      setCurrentScreen(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(prev => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      console.log('Completing onboarding...'); // Debug log
      const settings = await storageService.getUserSettings();
      console.log('Current settings before update:', settings); // Debug log
      
      await storageService.saveUserSettings({
        ...settings,
        preferredMethod: selectedMethod,
        notificationsEnabled,
        fastingStartNotification: notificationsEnabled,
        fastingEndNotification: notificationsEnabled,
        onboardingCompleted: true,
      });
      
      console.log('Onboarding completed, checking paywall status...'); // Debug log
      // Only show paywall to first-time users who haven't seen it
      if (!settings.paywallSeen) {
        console.log('Showing paywall to first-time user'); // Debug log
        router.replace('/paywall');
      } else {
        console.log('Skipping paywall, going to main app'); // Debug log
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Fallback to main app if there's an error
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Onboarding',
      'Are you sure you want to skip the setup? You can always configure these settings later.',
      [
        { text: 'Continue Setup', style: 'cancel' },
        { text: 'Skip', onPress: completeOnboarding },
      ]
    );
  };

  const screen = onboardingScreens[currentScreen];
  const IconComponent = screen.icon;

  const renderProfileScreen = () => (
    <View style={styles.profileContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What should we call you?</Text>
        <TextInput
          style={styles.textInput}
          value={userProfile.name}
          onChangeText={(text) => setUserProfile(prev => ({ ...prev, name: text }))}
          placeholder="Enter your name"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What's your primary goal?</Text>
        <View style={styles.optionsGrid}>
          {[
            { id: 'weight_loss', label: 'Weight Management', icon: '⚖️' },
            { id: 'health', label: 'Overall Health', icon: '❤️' },
            { id: 'energy', label: 'More Energy', icon: '⚡' },
            { id: 'lifestyle', label: 'Lifestyle Change', icon: '🌟' },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                userProfile.goal === option.id && styles.selectedOption
              ]}
              onPress={() => setUserProfile(prev => ({ ...prev, goal: option.id as any }))}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={[
                styles.optionText,
                userProfile.goal === option.id && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Fasting experience level?</Text>
        <View style={styles.experienceButtons}>
          {[
            { id: 'beginner', label: 'Beginner' },
            { id: 'intermediate', label: 'Intermediate' },
            { id: 'advanced', label: 'Advanced' },
          ].map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.experienceButton,
                userProfile.experience === level.id && styles.selectedExperience
              ]}
              onPress={() => setUserProfile(prev => ({ ...prev, experience: level.id as any }))}
            >
              <Text style={[
                styles.experienceText,
                userProfile.experience === level.id && styles.selectedExperienceText
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderNotificationScreen = () => (
    <View style={styles.notificationContainer}>
      <View style={styles.notificationOption}>
        <TouchableOpacity
          style={[
            styles.notificationCard,
            notificationsEnabled && styles.selectedNotification
          ]}
          onPress={() => setNotificationsEnabled(true)}
        >
          <Bell size={24} color={notificationsEnabled ? '#FFFFFF' : '#06B6D4'} />
          <Text style={[
            styles.notificationTitle,
            notificationsEnabled && styles.selectedNotificationText
          ]}>
            Enable Notifications
          </Text>
          <Text style={[
            styles.notificationDescription,
            notificationsEnabled && styles.selectedNotificationText
          ]}>
            Get helpful reminders for fasting start/end times and motivational messages
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notificationOption}>
        <TouchableOpacity
          style={[
            styles.notificationCard,
            !notificationsEnabled && styles.selectedNotification
          ]}
          onPress={() => setNotificationsEnabled(false)}
        >
          <Bell size={24} color={!notificationsEnabled ? '#FFFFFF' : '#9CA3AF'} />
          <Text style={[
            styles.notificationTitle,
            !notificationsEnabled && styles.selectedNotificationText
          ]}>
            Skip for Now
          </Text>
          <Text style={[
            styles.notificationDescription,
            !notificationsEnabled && styles.selectedNotificationText
          ]}>
            You can enable notifications later in settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBenefitsScreen = () => (
    <View style={styles.benefitsContainer}>
      <Text style={styles.benefitsIntro}>{screen.content}</Text>
      <View style={styles.benefitsList}>
        {screen.benefits?.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <CheckCircle size={20} color="#10B981" />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Skip Button */}
        {currentScreen > 0 && currentScreen < onboardingScreens.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: screen.color + '20' }]}>
            <IconComponent size={48} color={screen.color} />
          </View>
          <Text style={styles.title}>{screen.title}</Text>
          <Text style={styles.subtitle}>{screen.subtitle}</Text>
        </View>

        <View style={styles.body}>
          {isProfileScreen ? renderProfileScreen() :
           isNotificationScreen ? renderNotificationScreen() :
           screen.id === 'benefits' ? renderBenefitsScreen() :
           isMethodScreen ? (
            <View style={styles.methodSelection}>
              <Text style={styles.methodIntro}>
                {userProfile.experience === 'beginner' 
                  ? 'We recommend starting with 16:8 for beginners, but feel free to choose what feels right for you.'
                  : 'Choose the method that best fits your experience and lifestyle.'
                }
              </Text>
              <ScrollView 
                style={styles.methodScrollView}
                contentContainerStyle={styles.methodScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {FASTING_METHODS.map((method) => (
                  <FastingMethodCard
                    key={method.id}
                    method={method}
                    isSelected={selectedMethod.id === method.id}
                    onSelect={setSelectedMethod}
                  />
                ))}
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.contentText}>{screen.content}</Text>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.progressContainer}>
            {onboardingScreens.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentScreen && [styles.activeDot, { backgroundColor: screen.color }],
                  index < currentScreen && [styles.completedDot, { backgroundColor: screen.color }],
                ]}
              />
            ))}
          </View>

          <View style={styles.buttonContainer}>
            {currentScreen > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
                <ArrowLeft size={20} color="#6B7280" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.nextButton, { backgroundColor: screen.color }]} 
              onPress={handleNext}
              disabled={isProfileScreen && !userProfile.name.trim()}
            >
              <Text style={styles.nextButtonText}>
                {isLastScreen ? 'Start Fasting!' : 'Continue'}
              </Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 10,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  contentText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  benefitsIntro: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  benefitsList: {
    alignSelf: 'stretch',
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  profileContainer: {
    gap: 20,
    paddingHorizontal: 10,
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 50,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    minHeight: 80,
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  optionIcon: {
    fontSize: 20,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedOptionText: {
    color: '#3B82F6',
  },
  experienceButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  experienceButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  selectedExperience: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3E8FF',
  },
  experienceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  selectedExperienceText: {
    color: '#8B5CF6',
  },
  notificationContainer: {
    gap: 12,
    paddingHorizontal: 10,
  },
  notificationOption: {
    flex: 1,
  },
  notificationCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minHeight: 120,
    justifyContent: 'center',
  },
  selectedNotification: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  selectedNotificationText: {
    color: '#FFFFFF',
  },
  methodSelection: {
    gap: 12,
    paddingHorizontal: 5,
    flex: 1,
  },
  methodScrollView: {
    flex: 1,
    marginTop: 6,
  },
  methodScrollContent: {
    paddingBottom: 20,
  },
  methodIntro: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 15,
  },
  footer: {
    alignItems: 'center',
    gap: 20,
    paddingTop: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    width: 20,
  },
  completedDot: {
    // Completed dots use the screen color
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
    minHeight: 48,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});