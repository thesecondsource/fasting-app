import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Crown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ size = 'medium' }) => {
  const { colors } = useTheme();

  const sizeStyles = {
    small: { padding: 4, iconSize: 12, fontSize: 10 },
    medium: { padding: 6, iconSize: 14, fontSize: 12 },
    large: { padding: 8, iconSize: 16, fontSize: 14 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[
      styles.badge,
      { 
        backgroundColor: '#FFD700',
        padding: currentSize.padding,
      }
    ]}>
      <Crown size={currentSize.iconSize} color="#000000" />
      <Text style={[styles.text, { fontSize: currentSize.fontSize }]}>PRO</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    gap: 4,
  },
  text: {
    fontWeight: '700',
    color: '#000000',
  },
});