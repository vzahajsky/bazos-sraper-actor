/**
 * Temporary Phone Number Service
 * Integration with external services for temporary phone numbers
 * 
 * NOTE: This is a MOCK implementation for development.
 * TODO: Integrate with real SMS service (sms-activate.org, 5sim.net, etc.)
 */

import { log } from 'apify';

export interface TempPhone {
    phoneId: string;
    phoneNumber: string; // Format: +420XXXXXXXXX
    country: string;
    expiresAt: Date;
}

/**
 * Obtains a temporary phone number from external service
 * @param country - Country code (default: 'CZ')
 * @returns Temporary phone details
 */
export async function getTempPhoneNumber(country = 'CZ'): Promise<TempPhone> {
    // TODO: Replace with real API call
    // Example for sms-activate.org:
    // const response = await fetch(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=ba&country=22`);
    // const data = await response.text(); // Format: ACCESS_NUMBER:12345:+420123456789
    
    log.info('Getting temporary phone number (MOCK)', { country });
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Generate mock phone number
    const randomDigits = Math.floor(Math.random() * 900000000) + 100000000;
    const phoneNumber = `+420${randomDigits}`;
    const phoneId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const tempPhone: TempPhone = {
        phoneId,
        phoneNumber,
        country,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    };
    
    log.info('Temporary phone number obtained (MOCK)', {
        phoneId: tempPhone.phoneId,
        phoneNumber: tempPhone.phoneNumber,
        expiresAt: tempPhone.expiresAt,
    });
    
    return tempPhone;
}

/**
 * Releases temporary phone number back to the pool
 * @param phoneId - Phone ID to release
 */
export async function releaseTempPhoneNumber(phoneId: string): Promise<void> {
    // TODO: Replace with real API call
    // Example for sms-activate.org:
    // const response = await fetch(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${API_KEY}&action=setStatus&status=8&id=${phoneId}`);
    
    log.info('Releasing temporary phone number (MOCK)', { phoneId });
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    log.debug('Temporary phone number released (MOCK)', { phoneId });
}

