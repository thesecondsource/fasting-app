import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FastingMethod } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface FastingMethodCardProps {
  method: FastingMethod;
  isSelected: boolean;
  onSelect: (method: FastingMethod) => void;
}

export const FastingMethodCard: React.FC<FastingMethodCardProps> = ({
  method,
  isSelected,
  onSelect,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isSelected && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
      ]}
      onPress={() => onSelect(method)}
    >
      <Text style={[
        styles.title, 
        { color: isSelected ? colors.primary : colors.text }
      ]}>
        {method.name}
      </Text>
      <Text style={[
        styles.subtitle, 
        { color: isSelected ? colors.primary : colors.textSecondary }
      ]}>
        {method.fastingHours}h fast • {method.eatingHours}h eating
      </Text>
      <Text style={[
        styles.description, 
        { color: isSelected ? colors.primary : colors.textSecondary }
      ]}>
        {method.description}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});