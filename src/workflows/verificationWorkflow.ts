/**
 * Verification Workflow
 * Orchestrates the complete phone verification process for Bazos.cz
 * 
 * Flow:
 * 1. Get temp phone number from external service
 * 2. Submit phone to Bazos for verification
 * 3. Wait for SMS with code (polling)
 * 4. Extract code from SMS
 * 5. Submit code to Bazos
 * 6. Receive and save cookies
 * 7. Cleanup (release phone)
 */

import { log } from 'apify';
import type { BazosCookies } from '../services/bazos/phoneVerification.js';
import { 
    submitPhoneForVerification, 
    submitVerificationCode 
} from '../services/bazos/phoneVerification.js';
import { saveCookies } from '../services/bazos/cookieManager.js';
import { 
    getTempPhoneNumber, 
    releaseTempPhoneNumber 
} from '../services/external/tempPhoneService.js';
import { 
    waitForSMS, 
    extractVerificationCode 
} from '../services/external/smsService.js';
import { 
    TEST_AD_URL, 
    SMS_MAX_ATTEMPTS,
    SMS_POLL_INTERVAL,
} from '../const.js';

/**
 * Performs the complete verification workflow:
 * 1. Obtains temporary phone number
 * 2. Submits phone to Bazos verification
 * 3. Waits for SMS with code
 * 4. Submits code to complete verification
 * 5. Returns authenticated cookies
 * 
 * @returns Validated Bazos cookies
 * @throws Error if verification fails at any step
 */
export async function performVerificationWorkflow(): Promise<BazosCookies> {
    log.info('=== Starting Verification Workflow ===');
    
    let tempPhone: Awaited<ReturnType<typeof getTempPhoneNumber>> | null = null;
    
    try {
        // Step 1: Get temporary phone number
        log.info('Step 1/7: Obtaining temporary phone number...');
        tempPhone = await getTempPhoneNumber('CZ');
        log.info('✓ Temporary phone obtained', {
            phoneId: tempPhone.phoneId,
            phoneNumber: tempPhone.phoneNumber,
        });
        
        // Step 2: Submit phone to Bazos
        log.info('Step 2/7: Submitting phone to Bazos verification...');
        const session = await submitPhoneForVerification(
            tempPhone.phoneNumber,
            TEST_AD_URL,
        );
        log.info('✓ Phone submitted, waiting for SMS', {
            sessionId: session.sessionId,
        });
        
        // Step 3: Wait for SMS (with retry)
        log.info('Step 3/7: Waiting for SMS with verification code...');
        let sms: Awaited<ReturnType<typeof waitForSMS>> | null = null;
        let attempts = 0;
        const maxAttempts = SMS_MAX_ATTEMPTS;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            try {
                sms = await waitForSMS(tempPhone.phoneId, SMS_POLL_INTERVAL / 1000);
                if (sms) {
                    log.info('✓ SMS received', {
                        from: sms.from,
                        receivedAt: sms.receivedAt,
                    });
                    break;
                }
            } catch (error) {
                if (attempts === maxAttempts) {
                    throw new Error(`SMS timeout: No message received after ${maxAttempts} attempts`);
                }
                
                log.debug('SMS not yet received, retrying...', {
                    attempt: attempts,
                    maxAttempts,
                });
                
                await new Promise((resolve) => setTimeout(resolve, SMS_POLL_INTERVAL));
            }
        }
        
        if (!sms) {
            throw new Error('Failed to receive SMS');
        }
        
        // Step 4: Extract verification code
        log.info('Step 4/7: Extracting verification code from SMS...');
        const code = extractVerificationCode(sms.text);
        
        if (!code) {
            throw new Error('Could not extract verification code from SMS');
        }
        
        log.info('✓ Verification code extracted', { code });
        
        // Step 5: Submit verification code
        log.info('Step 5/7: Submitting verification code to Bazos...');
        const cookies = await submitVerificationCode(session.sessionId, code);
        log.info('✓ Verification successful, cookies obtained', {
            bid: cookies.bid,
            expiresAt: cookies.expiresAt,
        });
        
        // Step 6: Save cookies
        log.info('Step 6/7: Saving cookies to Key-Value Store...');
        await saveCookies(cookies);
        log.info('✓ Cookies saved');
        
        // Step 7: Cleanup
        log.info('Step 7/7: Releasing temporary phone number...');
        await releaseTempPhoneNumber(tempPhone.phoneId);
        log.info('✓ Phone number released');
        
        log.info('=== Verification Workflow Completed Successfully ===', {
            bid: cookies.bid,
            phoneUsed: tempPhone.phoneNumber,
            totalAttempts: attempts,
        });
        
        return cookies;
        
    } catch (error) {
        log.error('=== Verification Workflow Failed ===', {
            error: error instanceof Error ? error.message : String(error),
            step: 'unknown', // Could be enhanced to track current step
        });
        
        // Cleanup: Release phone number even on failure
        if (tempPhone) {
            try {
                log.info('Attempting cleanup: releasing phone number...');
                await releaseTempPhoneNumber(tempPhone.phoneId);
                log.info('✓ Cleanup successful');
            } catch (cleanupError) {
                log.error('Cleanup failed', {
                    error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
                });
            }
        }
        
        // Re-throw original error
        throw error;
    }
}

