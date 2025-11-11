/**
 * Phone Verification Service for Bazos.cz
 * Handles the verification process for accessing phone numbers on ads
 * 
 * ⚠️ PARTIALLY IMPLEMENTED - Form submission NOT FULLY IMPLEMENTED
 * 
 * The extractVerificationFormData() function works for parsing HTML.
 * The submit functions (submitPhoneForVerification, submitVerificationCode) are MOCK implementations.
 * 
 * The Actor now uses MANUAL COOKIES (bid, bkod) from input instead of auto-verification.
 * 
 * To fully implement auto-verification:
 * 1. Implement real form submission with proper headers/cookies
 * 2. Handle Bazos anti-bot protection
 * 3. Test with real phone numbers
 * 4. Uncomment auto-verification code in main.ts
 * 
 * Based on analysis:
 * - Clicking "zobraz číslo" without cookies triggers verification form
 * - Form asks for user's phone number
 * - SMS with code is sent to that number
 * - Submitting code returns cookies (bid, bkod)
 */

import { log } from 'apify';
import { load } from 'cheerio';
import { COOKIE_EXPIRATION_DAYS } from '../../const.js';

export interface VerificationSession {
    sessionId: string;
    phoneNumber: string;
    timestamp: Date;
}

export interface BazosCookies {
    bid: string;
    bkod: string;
    testcookie: string;
    expiresAt: Date;
}

export interface VerificationFormData {
    formAction: string;
    hiddenFields: Record<string, string>;
}

/**
 * Extracts verification form data from Bazos HTML response
 * @param html - HTML content containing the verification form
 * @returns Parsed form data including action URL and hidden fields
 */
export function extractVerificationFormData(html: string): VerificationFormData {
    const $ = load(html);
    
    log.debug('Extracting verification form data from HTML');
    
    // The verification form appears in the overlaytel element
    // After clicking "zobraz číslo", Bazos shows:
    // "Zobrazit telefon může pouze ověřený uživatel. Ověření je zdarma."
    // With input field for phone number
    
    // Look for the phone input field
    const phoneInput = $('input[type="text"]').filter(function() {
        const placeholder = $(this).attr('placeholder');
        const label = $(this).prev('text').text();
        return placeholder?.includes('telefon') || label?.includes('telefon');
    });
    
    if (phoneInput.length === 0) {
        log.warning('Phone input field not found in verification form');
    }
    
    // Extract any hidden fields (CSRF tokens, session IDs, etc.)
    const hiddenFields: Record<string, string> = {};
    $('input[type="hidden"]').each((_, elem) => {
        const name = $(elem).attr('name');
        const value = $(elem).attr('value');
        if (name && value) {
            hiddenFields[name] = value;
        }
    });
    
    // Find form action - typically a POST endpoint
    let formAction = $('form').attr('action') || '/verify-phone.php';
    
    // If form action is relative, make it absolute
    if (formAction.startsWith('/')) {
        formAction = `https://www.bazos.cz${formAction}`;
    }
    
    log.debug('Extracted form data', { 
        formAction,
        hiddenFieldCount: Object.keys(hiddenFields).length,
    });
    
    return {
        formAction,
        hiddenFields,
    };
}

/**
 * Submits phone number to Bazos verification form
 * @param phoneNumber - Phone number in format +420XXXXXXXXX
 * @param adUrl - URL of the ad being accessed
 * @returns Verification session for tracking
 */
export async function submitPhoneForVerification(
    phoneNumber: string,
    adUrl: string,
): Promise<VerificationSession> {
    log.info('Submitting phone number for verification', { phoneNumber, adUrl });
    
    // NOTE: This is a MOCK/PLACEHOLDER implementation
    // TODO: Real implementation needs to:
    // 1. Navigate to ad page or trigger phone reveal
    // 2. Extract verification form from response
    // 3. POST phone number to form action
    // 4. Handle response (confirmation, errors)
    // 5. Store session/tracking info
    
    // For now, we'll simulate the process
    // In real implementation, this would involve:
    // - Making POST request to Bazos verification endpoint
    // - Handling cookies/session management
    // - Parsing response for success/error messages
    
    // Extract ad ID from URL for tracking
    const adIdMatch = adUrl.match(/\/inzerat\/(\d+)\//);
    const adId = adIdMatch ? adIdMatch[1] : 'unknown';
    
    // Generate session ID (in real impl, this would come from Bazos)
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock: In reality, we'd POST to something like:
    // POST https://www.bazos.cz/verify-phone.php
    // Body: { phone: phoneNumber, ad_id: adId, ...hiddenFields }
    // Response: { success: true, session_id: "xyz", message: "SMS byl odeslán" }
    
    const session: VerificationSession = {
        sessionId,
        phoneNumber,
        timestamp: new Date(),
    };
    
    log.info('Phone verification request submitted (MOCK)', { 
        sessionId,
        phoneNumber,
        adId,
    });
    
    // TODO: Real implementation example:
    /*
    const formData = new URLSearchParams();
    formData.append('phone', phoneNumber);
    formData.append('ad_id', adId);
    Object.entries(hiddenFields).forEach(([key, value]) => {
        formData.append(key, value);
    });
    
    const response = await fetch(formAction, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(`Verification failed: ${result.message}`);
    }
    
    return {
        sessionId: result.session_id,
        phoneNumber,
        timestamp: new Date(),
    };
    */
    
    return session;
}

/**
 * Submits SMS verification code to complete authentication
 * @param sessionId - Session ID from submitPhoneForVerification
 * @param code - Verification code from SMS
 * @returns Bazos cookies for authenticated access
 */
export async function submitVerificationCode(
    sessionId: string,
    code: string,
): Promise<BazosCookies> {
    log.info('Submitting verification code', { sessionId, code });
    
    // NOTE: This is a MOCK/PLACEHOLDER implementation
    // TODO: Real implementation needs to:
    // 1. POST code to Bazos verification endpoint
    // 2. Extract cookies from response headers (Set-Cookie)
    // 3. Parse bid, bkod, testcookie values
    // 4. Calculate expiration date
    // 5. Handle errors (invalid code, expired session, etc.)
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Mock: Generate fake cookies
    // In reality, these would come from Bazos response headers after successful verification
    const fakeBid = Math.floor(Math.random() * 90000000) + 10000000;
    const fakeBkod = Math.random().toString(36).substring(2, 12).toUpperCase();
    
    // Calculate expiration (typically 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + COOKIE_EXPIRATION_DAYS);
    
    const cookies: BazosCookies = {
        bid: fakeBid.toString(),
        bkod: fakeBkod,
        testcookie: 'ano',
        expiresAt,
    };
    
    log.info('Verification successful, cookies obtained (MOCK)', {
        sessionId,
        bid: cookies.bid,
        expiresAt: cookies.expiresAt,
    });
    
    // TODO: Real implementation example:
    /*
    const formData = new URLSearchParams();
    formData.append('session_id', sessionId);
    formData.append('code', code);
    
    const response = await fetch('https://www.bazos.cz/verify-code.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        // Important: Don't follow redirects automatically to capture cookies
        redirect: 'manual',
    });
    
    // Extract cookies from Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie();
    const cookies: Partial<BazosCookies> = {};
    
    setCookieHeaders.forEach(header => {
        const match = header.match(/^(bid|bkod|testcookie)=([^;]+)/);
        if (match) {
            const [, name, value] = match;
            cookies[name] = value;
        }
    });
    
    if (!cookies.bid || !cookies.bkod) {
        throw new Error('Failed to obtain authentication cookies from response');
    }
    
    // Parse expiration from cookie or use default
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + COOKIE_EXPIRATION_DAYS);
    
    return {
        bid: cookies.bid,
        bkod: cookies.bkod,
        testcookie: cookies.testcookie || 'ano',
        expiresAt,
    };
    */
    
    return cookies;
}
