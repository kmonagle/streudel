// API client with cookie/session management
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../../constants/api';
import { secureStorage } from '../storage/secureStorage';
import { ApiError } from '../../types/api';
import { DEV_SESSION_COOKIE, USE_DEV_COOKIE } from '../../constants/devConfig';

// Retry configuration for transient failures
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,       // 1 second base
  maxDelay: 10000,       // 10 second cap
  jitterFactor: 0.3,     // +/- 30% random jitter
  retryableStatusCodes: [500, 502, 503, 504, 408],
  retryableMethods: ['get', 'head', 'options', 'put', 'delete'],
};

interface RetryableAxiosConfig extends InternalAxiosRequestConfig {
  _401RetryCount?: number;
  _transientRetryCount?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private onUnauthorized?: () => void;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      // Removed withCredentials - not needed when manually setting Cookie header
      // and may cause CORS issues in React Native
    });

    this.setupInterceptors();
  }

  private isRetryableError(error: AxiosError): boolean {
    // Network errors (no response received) are always retryable
    if (!error.response) {
      return true;
    }
    return RETRY_CONFIG.retryableStatusCodes.includes(error.response.status);
  }

  private isRetryableMethod(method?: string): boolean {
    if (!method) return false;
    return RETRY_CONFIG.retryableMethods.includes(method.toLowerCase());
  }

  private shouldRetryRequest(error: AxiosError, config: RetryableAxiosConfig): boolean {
    const retryCount = config._transientRetryCount || 0;
    if (retryCount >= RETRY_CONFIG.maxRetries) return false;

    // 401s have their own dedicated retry logic
    if (error.response?.status === 401) return false;

    // Don't retry other 4xx client errors
    if (error.response && error.response.status >= 400 && error.response.status < 500) return false;

    // For non-idempotent methods (POST, PATCH), only retry network errors
    // where no response was received (request may not have reached server).
    // Exclude timeouts (ECONNABORTED) since the server may have processed it.
    if (!this.isRetryableMethod(config.method)) {
      return !error.response && error.code !== 'ECONNABORTED';
    }

    return this.isRetryableError(error);
  }

  private getRetryDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
      RETRY_CONFIG.maxDelay
    );
    // Add jitter: +/- 30%
    const jitter = delay * RETRY_CONFIG.jitterFactor * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  private setupInterceptors() {
    // Request interceptor: Add session cookie to requests
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        let cookieValue: string | null = null;

        // Use dev cookie if enabled (for testing without OAuth)
        if (USE_DEV_COOKIE && DEV_SESSION_COOKIE) {
          cookieValue = DEV_SESSION_COOKIE;
          console.log('Using dev session cookie');
        } else {
          // Otherwise use stored cookie from OAuth
          cookieValue = await secureStorage.getSessionCookie();

          // If no cookie found, retry multiple times with increasing delays
          // This handles race conditions where cookie is being written to SecureStore
          if (!cookieValue) {
            const maxRetries = 5;
            const delays = [100, 200, 300, 500, 1000]; // Progressive backoff

            for (let i = 0; i < maxRetries && !cookieValue; i++) {
              console.log(`⚠️ No cookie found, retry ${i + 1}/${maxRetries}, waiting ${delays[i]}ms...`);
              await new Promise(resolve => setTimeout(resolve, delays[i]));
              cookieValue = await secureStorage.getSessionCookie();

              if (cookieValue) {
                console.log(`✅ Cookie found on retry ${i + 1}`);
                break;
              }
            }

            if (!cookieValue) {
              console.error('❌ No cookie found after all retries - request will fail with 401');
            }
          }
        }

        // Add dev bypass header for development
        // COMMENTED OUT: Using Google OAuth instead
        // config.headers['X-Dev-Bypass'] = 'Airhog88!123';
        config.headers['Accept'] = 'application/json, text/plain, */*';

        console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
        // console.log('🔓 Using dev bypass header');

        // Use Authorization: Bearer for auth — React Native's native HTTP layer
        // strips Cookie headers silently. The server converts Bearer tokens to
        // connect.sid cookies in its Authorization middleware.
        if (cookieValue && config.headers) {
          // Extract the session value (strip "connect.sid=" prefix if present)
          const sessionValue = cookieValue.startsWith('connect.sid=')
            ? cookieValue.slice('connect.sid='.length)
            : cookieValue;

          config.headers['Authorization'] = `Bearer ${sessionValue}`;
          console.log('🔑 Sending Authorization header, session preview:', sessionValue.substring(0, 30) + '...');
        } else {
          console.log('⚠️ No session available for request');
        }
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle errors and extract cookies
    this.client.interceptors.response.use(
      async (response) => {
        console.log('✅ API Response:', response.status, response.config.url);

        // Extract and store Set-Cookie if present
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          // In React Native, set-cookie might be a string or array
          const cookieString = Array.isArray(setCookie) ? setCookie[0] : setCookie;
          if (cookieString) {
            console.log('🍪 Backend sent Set-Cookie header (length:', cookieString.length, ') for endpoint:', response.config.url);
            console.log('🍪 Cookie preview:', cookieString.substring(0, 50) + '...');

            // CRITICAL: Only store connect.sid cookies, ignore infrastructure cookies
            // Backend may send Google Cloud cookies (GAESA=, __Secure-) or other cookies
            // that should NOT replace our session cookie
            if (cookieString.includes('connect.sid=')) {
              console.log('✅ Valid connect.sid cookie detected - storing');
              await secureStorage.setSessionCookie(cookieString);
              console.log('✅ Stored new session cookie from response');
            } else {
              console.log('⚠️ Ignoring non-session cookie (not connect.sid):', cookieString.substring(0, 50) + '...');
              console.log('⚠️ This is likely an infrastructure cookie (GAESA, __Secure-, etc.) - keeping existing session cookie');
            }
          }
        }
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const status = error.response?.status;
        const url = error.config?.url;
        const config = error.config as RetryableAxiosConfig;

        console.error('❌ API Error:', status || 'NETWORK', url);
        if (error.response?.data) {
          console.error('📋 Error details:', JSON.stringify(error.response.data, null, 2));
        }

        // Phase 1: General transient retry (network errors, 5xx, timeouts)
        if (config && this.shouldRetryRequest(error, config)) {
          const retryCount = config._transientRetryCount || 0;
          const delay = this.getRetryDelay(retryCount);
          config._transientRetryCount = retryCount + 1;

          console.log(
            `🔄 Transient error (${status || 'network'}), retry ${retryCount + 1}/${RETRY_CONFIG.maxRetries} after ${delay}ms:`,
            url
          );

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.client.request(config);
        }

        // Phase 2: Handle 401 Unauthorized - session expired or server cold start
        if (status === 401) {
          const cookieValue = await secureStorage.getSessionCookie();
          console.log('🔒 401 Unauthorized received');
          console.log('🍪 Current cookie status:', cookieValue ? 'Cookie exists' : 'No cookie found');
          console.log('📍 Failed endpoint:', url);

          // Only logout if we actually had a cookie (means backend rejected it)
          // If no cookie, it's likely a race condition, don't logout
          if (cookieValue && config) {
            const retryCount = config._401RetryCount || 0;

            // Retry once before logging out (handles server cold starts)
            if (retryCount === 0) {
              console.log('⏳ Retrying request after 1.5s (possible server cold start)...');
              config._401RetryCount = 1;

              // Wait 1.5 seconds for server to warm up
              await new Promise(resolve => setTimeout(resolve, 1500));

              // Retry the original request
              try {
                console.log('🔄 Retrying request:', url);
                return await this.client.request(config);
              } catch (retryError) {
                console.error('❌ Retry also failed');
                // Continue to logout logic below
              }
            }

            // If retry also failed, or this was already a retry, logout
            console.log('🔒 Session expired after retry - auto logout');
            await secureStorage.clearAll();
            if (this.onUnauthorized) {
              this.onUnauthorized();
            }
          } else {
            console.log('⚠️ 401 but no cookie was sent - likely race condition, not logging out');
          }
        }

        // Phase 3: Format error for consistent handling
        const apiError: ApiError = {
          error: error.response?.data?.error || error.message || 'An unexpected error occurred',
          details: error.response?.data?.details,
        };

        return Promise.reject(apiError);
      }
    );
  }

  // Set callback for unauthorized errors (logout handler)
  setUnauthorizedCallback(callback: () => void) {
    this.onUnauthorized = callback;
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClientInstance = new ApiClient();
export const apiClient = apiClientInstance.getInstance();
