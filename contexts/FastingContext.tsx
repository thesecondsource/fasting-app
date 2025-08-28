import React, { createContext, useContext } from 'react';
import { useFasting } from '@/hooks/useFasting';

type FastingContextType = ReturnType<typeof useFasting>;

const FastingContext = createContext<FastingContextType | undefined>(undefined);

export const FastingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const fasting = useFasting();
  return (
    <FastingContext.Provider value={fasting}>
      {children}
    </FastingContext.Provider>
  );
};

export const useFastingContext = () => {
  const context = useContext(FastingContext);
  if (context === undefined) {
    throw new Error('useFastingContext must be used within a FastingProvider');
  }
  return context;
};
