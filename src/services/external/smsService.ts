/**
 * SMS Service
 * Handles receiving and parsing SMS messages with verification codes
 * 
 * NOTE: This is a MOCK implementation for development.
 * TODO: Integrate with real SMS service (sms-activate.org, 5sim.net, etc.)
 */

import { log } from 'apify';
import { SMS_POLL_INTERVAL } from '../../const.js';

export interface SMSMessage {
    messageId: string;
    from: string; // Sender (e.g., "Bazos")
    text: string;
    receivedAt: Date;
}

/**
 * Waits for incoming SMS message (polling mechanism)
 * @param phoneId - Phone ID to check for messages
 * @param timeout - Timeout in seconds (default: 120)
 * @returns Received SMS message
 */
export async function waitForSMS(
    phoneId: string,
    timeout = 120,
): Promise<SMSMessage> {
    // TODO: Replace with real API polling
    // Example for sms-activate.org:
    // const response = await fetch(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${API_KEY}&action=getStatus&id=${phoneId}`);
    // const data = await response.text(); // Format: STATUS_OK:verification_code or STATUS_WAIT_CODE
    
    log.info('Waiting for SMS (MOCK)', { phoneId, timeout });
    
    const startTime = Date.now();
    const timeoutMs = timeout * 1000;
    let attempt = 0;
    
    while (Date.now() - startTime < timeoutMs) {
        attempt++;
        
        // Simulate polling delay
        await new Promise((resolve) => setTimeout(resolve, SMS_POLL_INTERVAL));
        
        log.debug('Polling for SMS (MOCK)', { 
            phoneId, 
            attempt,
            elapsed: Math.round((Date.now() - startTime) / 1000),
        });
        
        // MOCK: Simulate receiving SMS after 3 attempts (~15 seconds)
        if (attempt >= 3) {
            const mockCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
            const sms: SMSMessage = {
                messageId: `mock_sms_${Date.now()}`,
                from: 'Bazos',
                text: `Váš ověřovací kód je: ${mockCode}. Platnost kódu je 10 minut.`,
                receivedAt: new Date(),
            };
            
            log.info('SMS received (MOCK)', { 
                phoneId,
                from: sms.from,
                code: mockCode,
            });
            
            return sms;
        }
    }
    
    // Timeout reached
    throw new Error(`SMS timeout: No message received within ${timeout} seconds`);
}

/**
 * Extracts verification code from SMS text
 * @param smsText - SMS message content
 * @returns Extracted code or null if not found
 */
export function extractVerificationCode(smsText: string): string | null {
    log.debug('Extracting verification code from SMS', { 
        textPreview: smsText.substring(0, 100),
    });
    
    // Try multiple regex patterns for verification codes
    const patterns = [
        /\b(\d{4,6})\b/,                           // 4-6 digit code
        /kód(?:\s+je)?:\s*(\d{4,6})/i,            // "kód: 1234" or "kód je: 1234"
        /code(?:\s+is)?:\s*(\d{4,6})/i,           // "code: 1234" or "code is: 1234"
        /verification(?:\s+code)?:\s*(\d{4,6})/i, // "verification code: 1234"
        /ověřovací\s+kód:\s*(\d{4,6})/i,         // "ověřovací kód: 1234"
    ];
    
    for (const pattern of patterns) {
        const match = smsText.match(pattern);
        if (match && match[1]) {
            log.info('Verification code extracted', { code: match[1] });
            return match[1];
        }
    }
    
    log.warning('Could not extract verification code from SMS', { smsText });
    return null;
}

