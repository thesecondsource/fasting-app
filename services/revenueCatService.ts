import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

// --- IMPORTANT ---
// In a real app, you would use environment variables for these keys.
// Never hardcode API keys in your source code in production.
const API_KEYS = {
  apple: 'YOUR_APPLE_API_KEY',
  google: 'YOUR_GOOGLE_API_KEY',
};

const ENTITLEMENT_ID = 'premium'; // This should match the Entitlement ID in your RevenueCat dashboard

class RevenueCatService {
  isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;

    const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
    Purchases.configure({ apiKey });
    this.isInitialized = true;
    console.log('RevenueCat SDK initialized.');
  }

  public async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (e) {
      console.error('Error getting offerings:', e);
      return null;
    }
  }

  public async purchasePackage(
    packageToPurchase: PurchasesPackage
  ): Promise<CustomerInfo | null> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(
        packageToPurchase
      );
      return customerInfo;
    } catch (e: unknown) {
      const userCancelled =
        typeof e === 'object' &&
        e !== null &&
        (e as { userCancelled?: boolean }).userCancelled;
      if (!userCancelled) {
        console.error('Error purchasing package:', e);
        Alert.alert('Purchase Error', 'There was an issue with your purchase.');
      }
      return null;
    }
  }

  public async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (e) {
      console.error('Error restoring purchases:', e);
      Alert.alert('Restore Error', 'Could not restore purchases.');
      return null;
    }
  }

  public async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (e) {
      console.error('Error getting customer info:', e);
      return null;
    }
  }

  public isUserPremium(customerInfo: CustomerInfo | null): boolean {
    return customerInfo?.entitlements.active[ENTITLEMENT_ID] !== undefined;
  }
}

export const revenueCatService = new RevenueCatService();
