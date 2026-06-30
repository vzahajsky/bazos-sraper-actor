export type Nullable<T> = T | null;

export type CountryCode = 'cz' | 'sk';

// External service configuration
export interface PhoneServiceConfig {
    apiKey: string;
    apiUrl: string;
    provider: 'sms-activate' | '5sim' | 'custom';
}

export interface SMSServiceConfig {
    apiKey: string;
    apiUrl: string;
    provider: 'sms-activate' | '5sim' | 'custom';
}

// Verification state
export interface VerificationState {
    isVerified: boolean;
    cookies: import('./services/bazos/phoneVerification.js').BazosCookies | null;
    lastVerificationAt: Date | null;
    verificationCount: number;
}
