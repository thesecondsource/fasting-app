import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Crown,
  X,
  Check,
  Star,
  TrendingUp,
  ChartBar as BarChart3,
  Calendar,
  Download,
  Headphones,
  Bell,
  Zap,
  Target,
  Award,
} from 'lucide-react-native';
import { storageService } from '@/utils/storage';
import { revenueCatService } from '@/services/revenueCatService';
import { PurchasesPackage } from 'react-native-purchases';
import { useSubscription } from '@/contexts/SubscriptionContext';

const { width } = Dimensions.get('window');

const premiumFeatures = [
  {
    icon: TrendingUp,
    title: 'Advanced Analytics',
    description: 'Detailed insights, trends, and personalized recommendations',
    color: '#3B82F6',
  },
  {
    icon: BarChart3,
    title: 'Comprehensive Charts',
    description: 'Weight tracking, mood analysis, and energy level monitoring',
    color: '#10B981',
  },
  {
    icon: Calendar,
    title: 'Custom Fasting Plans',
    description: 'Create and save your own personalized fasting schedules',
    color: '#F59E0B',
  },
  {
    icon: Download,
    title: 'Export Data',
    description: 'Export your fasting history and health metrics to CSV/PDF',
    color: '#8B5CF6',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Intelligent notifications based on your patterns and goals',
    color: '#06B6D4',
  },
  {
    icon: Headphones,
    title: 'Priority Support',
    description: '24/7 premium customer support and expert guidance',
    color: '#EF4444',
  },
];

export default function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PurchasesPackage | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const { refetchCustomerInfo } = useSubscription();

  const handleContinueWithFree = async () => {
    try {
      const settings = await storageService.getUserSettings();
      await storageService.saveUserSettings({
        ...settings,
        isPremium: false,
        paywallSeen: true,
      });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error continuing with free version:', error);
      router.replace('/(tabs)');
    }
  };

  useEffect(() => {
    const fetchOfferings = async () => {
      const offerings = await revenueCatService.getOfferings();
      if (
        offerings?.current &&
        offerings.current.availablePackages.length > 0
      ) {
        setPackages(offerings.current.availablePackages);
        // Default to the annual package if available, otherwise the first one
        const annual = offerings.current.availablePackages.find(
          (p) => p.packageType === 'ANNUAL'
        );
        setSelectedPlan(annual || offerings.current.availablePackages[0]);
      }
    };
    fetchOfferings();
  }, []);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    setLoading(true);

    try {
      const customerInfo = await revenueCatService.purchasePackage(
        selectedPlan
      );

      if (!customerInfo || !revenueCatService.isUserPremium(customerInfo)) {
        throw new Error(
          'Purchase failed or did not grant premium entitlement.'
        );
      }

      await refetchCustomerInfo();

      Alert.alert(
        'Welcome to Premium! 🎉',
        'Thank you for upgrading! You now have access to all premium features.',
        [
          {
            text: 'Start Using Premium',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      Alert.alert(
        'Upgrade Failed',
        'There was an issue processing your upgrade. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    const customerInfo = await revenueCatService.restorePurchases();
    if (customerInfo && revenueCatService.isUserPremium(customerInfo)) {
      await refetchCustomerInfo();
      Alert.alert(
        'Purchases Restored',
        'Your premium access has been restored.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } else {
      Alert.alert(
        'No Purchases Found',
        'We could not find any active subscriptions to restore.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleContinueWithFree}
          >
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.crownContainer}>
            <Crown size={48} color="#FFD700" />
          </View>

          <Text style={styles.title}>Unlock Premium</Text>
          <Text style={styles.subtitle}>
            Take your fasting journey to the next level with advanced features
            and insights
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Premium Features</Text>
          {premiumFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <View key={index} style={styles.featureItem}>
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: feature.color + '20' },
                  ]}
                >
                  <IconComponent size={20} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
                <Check size={20} color="#10B981" />
              </View>
            );
          })}
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingContainer}>
          <Text style={styles.pricingTitle}>Choose Your Plan</Text>
          {packages.map((plan) => (
            <TouchableOpacity
              key={plan.identifier}
              style={[
                styles.planCard,
                selectedPlan?.identifier === plan.identifier &&
                  styles.selectedPlan,
                plan.packageType === 'ANNUAL' && styles.popularPlan,
              ]}
              onPress={() => setSelectedPlan(plan)}
            >
              {plan.packageType === 'ANNUAL' && (
                <View style={styles.popularBadge}>
                  <Star size={12} color="#000000" />
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.product.title}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{plan.product.priceString}</Text>
                  <Text style={styles.duration}>
                    / {plan.packageType === 'ANNUAL' ? 'year' : 'month'}
                  </Text>
                </View>
              </View>

              <View style={styles.planFeatures}>
                {[
                  'Advanced Analytics',
                  'Comprehensive Charts',
                  'Export Data',
                ].map((feature, index) => (
                  <View key={index} style={styles.planFeatureItem}>
                    <Check size={14} color="#10B981" />
                    <Text style={styles.planFeatureText}>{feature}</Text>
                  </View>
                ))}
                {plan.packageType === 'ANNUAL' && (
                  <Text style={styles.moreFeatures}>
                    + All premium features
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              (loading || !selectedPlan) && styles.disabledButton,
            ]}
            onPress={handleUpgrade}
            disabled={loading || !selectedPlan}
          >
            <Crown size={20} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>
              {loading
                ? 'Processing...'
                : `Start ${selectedPlan?.product.title || 'Plan'}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.freeButton}
            onPress={handleContinueWithFree}
          >
            <Text style={styles.freeButtonText}>
              Continue with Free Version
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            • Cancel anytime • No hidden fees • 7-day free trial for new
            subscribers
          </Text>
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 16,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  pricingContainer: {
    marginBottom: 32,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  popularPlan: {
    borderColor: '#FFD700',
    backgroundColor: '#FFFBEB',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    right: 20,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  planHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  duration: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  planFeatures: {
    gap: 6,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  ctaContainer: {
    gap: 12,
    marginBottom: 32,
  },
  upgradeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  freeButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  freeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  termsText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 14,
  },
});
