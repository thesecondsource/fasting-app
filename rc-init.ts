import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const RC_API_KEY = Platform.select({
  ios: '<YOUR_RC_IOS_PUBLIC_SDK_KEY>',
  android: '<YOUR_RC_ANDROID_PUBLIC_SDK_KEY>',
})!;

let configured = false;

export function initRevenueCat() {
  if (configured) return; // avoid double-config in Fast Refresh
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: RC_API_KEY });
  configured = true;
  console.log('RevenueCat SDK configured.');
}
