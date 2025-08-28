import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import { revenueCatService } from '@/services/revenueCatService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionContextType {
  isPremium: boolean;
  isRevenueCatPremium: boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  refetchCustomerInfo: () => Promise<void>;
  devPremiumEnabled: boolean;
  toggleDevPremium: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isRevenueCatPremium, setIsRevenueCatPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [devPremiumEnabled, setDevPremiumEnabled] = useState(false);

  useEffect(() => {
    const loadDevMode = async () => {
      try {
        const devMode = await AsyncStorage.getItem('@dev_premium_enabled');
        if (__DEV__) {
          setDevPremiumEnabled(devMode === 'true');
        }
      } catch (e) {
        console.error('Failed to load dev premium mode', e);
      }
    };

    // Initialize the service
    revenueCatService.init();
    // Fetch initial customer info
    refetchCustomerInfo();
    loadDevMode();
  }, []);

  const refetchCustomerInfo = async () => {
    setLoading(true);
    try {
      const info = await revenueCatService.getCustomerInfo();
      if (info) {
        setCustomerInfo(info);
        setIsRevenueCatPremium(revenueCatService.isUserPremium(info));
      }
    } catch (error) {
      console.error('Error refetching customer info:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDevPremium = async () => {
    try {
      const newStatus = !devPremiumEnabled;
      setDevPremiumEnabled(newStatus);
      await AsyncStorage.setItem('@dev_premium_enabled', String(newStatus));
    } catch (e) {
      console.error('Failed to save dev premium mode', e);
    }
  };

  const isPremium = isRevenueCatPremium || devPremiumEnabled;

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isRevenueCatPremium,
        customerInfo,
        loading,
        refetchCustomerInfo,
        devPremiumEnabled,
        toggleDevPremium,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider'
    );
  }
  return context;
};
