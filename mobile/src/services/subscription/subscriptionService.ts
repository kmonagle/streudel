// RevenueCat SDK wrapper service
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { subscriptionApi } from '../api/subscription';

class SubscriptionService {
  private isInitialized = false;

  /**
   * Initialize RevenueCat SDK with user ID
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    try {
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

      if (!apiKey) {
        console.warn('⚠️ RevenueCat API key not found. Running in MOCK mode.');
        console.warn('💡 Subscription state will be read from backend only.');
        this.isInitialized = true;
        return;
      }

      await Purchases.configure({
        apiKey,
        appUserID: userId
      });

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      console.warn('⚠️ Falling back to MOCK mode');
      this.isInitialized = true;
    }
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<Purchases.PurchasesOfferings> {
    try {
      // Check if running in mock mode
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

      if (!apiKey) {
        console.log('🧪 MOCK: Returning mock offerings');
        // Return mock offerings for testing UI
        return {
          current: {
            identifier: 'default',
            serverDescription: 'Default offering',
            availablePackages: [
              {
                identifier: 'monthly',
                packageType: 'MONTHLY',
                product: {
                  identifier: 'premium_monthly',
                  title: 'Premium Monthly',
                  description: 'Premium subscription billed monthly',
                  priceString: '$4.99',
                  price: 4.99,
                  currencyCode: 'USD'
                }
              },
              {
                identifier: 'annual',
                packageType: 'ANNUAL',
                product: {
                  identifier: 'premium_annual',
                  title: 'Premium Annual',
                  description: 'Premium subscription billed annually',
                  priceString: '$49.99',
                  price: 49.99,
                  currencyCode: 'USD'
                }
              }
            ]
          }
        } as any;
      }

      return await Purchases.getOfferings();
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(pkg: Purchases.PurchasesPackage): Promise<any> {
    try {
      // Check if running in mock mode
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

      if (!apiKey) {
        console.log('🧪 MOCK: Simulating purchase for', pkg.product.identifier);
        // Simulate purchase by calling backend validate endpoint
        await subscriptionApi.validate({ mockPurchase: true, productId: pkg.product.identifier });
        return { mockPurchase: true };
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);

      // Validate with backend
      await subscriptionApi.validate(customerInfo);

      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
      } else {
        console.error('Purchase failed:', error);
      }
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<any> {
    try {
      // Check if running in mock mode
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

      if (!apiKey) {
        console.log('🧪 MOCK: Simulating restore purchases');
        // Call backend restore endpoint
        await subscriptionApi.restore();
        return { mockRestore: true };
      }

      const customerInfo = await Purchases.restorePurchases();

      // Sync with backend
      await subscriptionApi.restore();

      return customerInfo;
    } catch (error) {
      console.error('Restore purchases failed:', error);
      throw error;
    }
  }

  /**
   * Get current customer info from RevenueCat
   */
  async getCustomerInfo(): Promise<any> {
    try {
      // Check if running in mock mode
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

      if (!apiKey) {
        console.log('🧪 MOCK: Getting customer info from backend');
        return await subscriptionApi.getStatus();
      }

      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();
