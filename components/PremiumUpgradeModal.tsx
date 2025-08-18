import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Crown, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SUBSCRIPTION_PLANS } from '@/constants/premiumFeatures';

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: (planId: string) => void;
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  visible,
  onClose,
  onUpgrade,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.titleSection}>
              <View style={[styles.crownContainer, { backgroundColor: '#FFD700' + '20' }]}>
                <Crown size={32} color="#FFD700" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Upgrade to Premium</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Unlock advanced features and take your fasting journey to the next level
              </Text>
            </View>

            <View style={styles.plansContainer}>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    plan.popular && { borderColor: '#FFD700', borderWidth: 2 }
                  ]}
                  onPress={() => onUpgrade(plan.id)}
                >
                  {plan.popular && (
                    <View style={[styles.popularBadge, { backgroundColor: '#FFD700' }]}>
                      <Text style={styles.popularText}>MOST POPULAR</Text>
                    </View>
                  )}
                  
                  <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: colors.primary }]}>{plan.price}</Text>
                    <Text style={[styles.duration, { color: colors.textSecondary }]}>{plan.duration}</Text>
                  </View>

                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Check size={16} color={colors.success} />
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
              Cancel anytime. No hidden fees. 7-day free trial for new subscribers.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  crownContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    gap: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
  },
  duration: {
    fontSize: 14,
    fontWeight: '500',
  },
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});