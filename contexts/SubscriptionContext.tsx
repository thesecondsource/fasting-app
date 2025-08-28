import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import { revenueCatService } from '@/services/revenueCatService';

interface SubscriptionContextType {
  isPremium: boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  refetchCustomerInfo: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize the service
    revenueCatService.init();

    // Fetch initial customer info
    refetchCustomerInfo();
  }, []);

  const refetchCustomerInfo = async () => {
    setLoading(true);
    try {
      const info = await revenueCatService.getCustomerInfo();
      if (info) {
        setCustomerInfo(info);
        setIsPremium(revenueCatService.isUserPremium(info));
      }
    } catch (error) {
      console.error('Error refetching customer info:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{ isPremium, customerInfo, loading, refetchCustomerInfo }}
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
