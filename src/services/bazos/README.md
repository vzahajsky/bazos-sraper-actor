# Bazos.cz Verification Service

## Overview

This service handles phone number verification on Bazos.cz to access phone numbers from ads.

## Current Status: MOCK/PLACEHOLDER IMPLEMENTATION

⚠️ **Important**: The current implementation is partially complete:
- ✅ **Cookie Management**: Fully functional (load, save, test, clear)
- ✅ **Phone Extraction**: Fully functional (with valid cookies)
- ⚠️ **Verification Process**: MOCK implementation (needs real Bazos API integration)

## How Bazos Verification Works

Based on analysis with Playwright MCP:

### 1. Without Authentication
```
User → Click "zobraz číslo" → Verification form appears
Form shows: "Zobrazit telefon může pouze ověřený uživatel. Ověření je zdarma."
```

### 2. Verification Flow
```
1. User enters phone number → POST to Bazos
2. Bazos sends SMS with code → User's phone
3. User enters code → POST to Bazos
4. Bazos returns cookies → bid, bkod, testcookie
5. With cookies → Can access all phone numbers
```

### 3. Cookie Details
- **bid**: User ID (8-digit number, e.g., `79580379`)
- **bkod**: Auth token (10-char alphanumeric, e.g., `HCIIFBA50J`)
- **testcookie**: Feature flag (value: `ano`)
- **Expiration**: ~30 days (estimated)

### 4. Validation
Cookies are validated server-side:
- ❌ Random/fake cookies don't work
- ✅ Must be from real verification
- ✅ Can be reused across multiple ads
- ✅ Stored in Apify Key-Value Store

## Files

### `phoneVerification.ts`
Handles the verification process.

**Functions:**
- `extractVerificationFormData(html)` - Parses verification form
- `submitPhoneForVerification(phoneNumber, adUrl)` - Submits phone for verification
- `submitVerificationCode(sessionId, code)` - Submits SMS code, returns cookies

**Status**: ⚠️ MOCK - Returns fake cookies for development

### `cookieManager.ts`
Manages cookie persistence and validation.

**Functions:**
- `saveCookies(cookies)` - Saves to Key-Value Store
- `loadCookies()` - Loads from Key-Value Store
- `areCookiesValid(cookies)` - Checks expiration
- `clearCookies()` - Removes from store
- `testCookies(cookies, testUrl)` - Validates on real ad

**Status**: ✅ FULLY FUNCTIONAL

## Real Implementation TODO

### Step 1: Research Bazos Endpoints

You need to discover the actual Bazos.cz verification endpoints:

**Method**: Use browser DevTools Network tab
1. Go to any Bazos ad
2. Open DevTools → Network tab
3. Click "zobraz číslo"
4. Look for POST requests
5. Document:
   - Request URL
   - Request headers
   - Request body format
   - Response format
   - Cookie handling

**Expected findings:**
```
POST https://www.bazos.cz/[some-endpoint].php
Content-Type: application/x-www-form-urlencoded

Body: phone=+420123456789&idi=210563707&idphone=5812530
Response: { success: true, message: "SMS byl odeslán" }
```

### Step 2: Implement Real Form Submission

Update `submitPhoneForVerification()`:

```typescript
export async function submitPhoneForVerification(
    phoneNumber: string,
    adUrl: string,
): Promise<VerificationSession> {
    // 1. Fetch ad page to get current state
    const pageResponse = await fetch(adUrl);
    const html = await pageResponse.text();
    
    // 2. Extract form data
    const formData = extractVerificationFormData(html);
    
    // 3. Extract ad-specific parameters
    const $ = load(html);
    const onclick = $('.teldetail').attr('onclick');
    const match = onclick?.match(/idi=(\d+)&idphone=(\d+)/);
    
    if (!match) {
        throw new Error('Could not extract ad parameters');
    }
    
    const [, idi, idphone] = match;
    
    // 4. Submit phone verification request
    const body = new URLSearchParams({
        phone: phoneNumber,
        idi,
        idphone,
        ...formData.hiddenFields,
    });
    
    const response = await fetch(formData.formAction, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': adUrl,
        },
        body: body.toString(),
    });
    
    const result = await response.text(); // or .json()
    
    // 5. Parse response and return session
    // TODO: Parse actual Bazos response format
    
    return {
        sessionId: extractSessionId(result),
        phoneNumber,
        timestamp: new Date(),
    };
}
```

### Step 3: Implement Code Submission

Update `submitVerificationCode()`:

```typescript
export async function submitVerificationCode(
    sessionId: string,
    code: string,
): Promise<BazosCookies> {
    // 1. Submit verification code
    const body = new URLSearchParams({
        session_id: sessionId, // or whatever Bazos uses
        code,
    });
    
    const response = await fetch('https://www.bazos.cz/verify-code.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        redirect: 'manual', // Don't follow redirects to capture cookies
    });
    
    // 2. Extract cookies from Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie();
    const cookies: Partial<BazosCookies> = {};
    
    for (const header of setCookieHeaders) {
        // Parse: "bid=79580379; Path=/; Domain=.bazos.cz; Expires=..."
        const cookieMatch = header.match(/^(bid|bkod|testcookie)=([^;]+)/);
        if (cookieMatch) {
            const [, name, value] = cookieMatch;
            cookies[name as keyof BazosCookies] = value;
        }
    }
    
    // 3. Validate we got required cookies
    if (!cookies.bid || !cookies.bkod) {
        throw new Error('Failed to obtain authentication cookies');
    }
    
    // 4. Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + COOKIE_EXPIRATION_DAYS);
    
    return {
        bid: cookies.bid,
        bkod: cookies.bkod,
        testcookie: cookies.testcookie || 'ano',
        expiresAt,
    };
}
```

### Step 4: Alternative - Use Playwright

If Bazos verification is complex (JavaScript-heavy, CAPTCHA, etc.), consider using Playwright:

```typescript
import { chromium } from 'playwright';

export async function performVerificationWithPlaywright(
    phoneNumber: string,
    code: string,
    adUrl: string,
): Promise<BazosCookies> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        // 1. Navigate to ad
        await page.goto(adUrl);
        
        // 2. Click "zobraz číslo"
        await page.click('.teldetail');
        
        // 3. Wait for verification form
        await page.waitForSelector('input[type="text"]'); // phone input
        
        // 4. Enter phone number
        await page.fill('input[type="text"]', phoneNumber);
        await page.click('button[type="submit"]'); // or appropriate selector
        
        // 5. Wait for code input (may need to wait for SMS manually or use mock)
        await page.waitForSelector('input[name="code"]');
        
        // 6. Enter verification code
        await page.fill('input[name="code"]', code);
        await page.click('button[type="submit"]');
        
        // 7. Wait for successful verification (redirect or success message)
        await page.waitForNavigation();
        
        // 8. Extract cookies from browser context
        const cookies = await page.context().cookies();
        
        const bid = cookies.find(c => c.name === 'bid')?.value;
        const bkod = cookies.find(c => c.name === 'bkod')?.value;
        const testcookie = cookies.find(c => c.name === 'testcookie')?.value;
        
        if (!bid || !bkod) {
            throw new Error('Failed to obtain cookies after verification');
        }
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + COOKIE_EXPIRATION_DAYS);
        
        return { bid, bkod, testcookie: testcookie || 'ano', expiresAt };
        
    } finally {
        await browser.close();
    }
}
```

## Testing Strategy

### 1. Unit Tests (with Mock)
Test individual functions with mock data:
```bash
npm test
```

### 2. Integration Tests (Manual)
Use real Bazos.cz for verification:
1. Run verification workflow
2. Check cookies are saved
3. Test phone extraction with saved cookies
4. Verify cookies persist across runs

### 3. End-to-End Test
Full workflow with external services:
1. Get temp phone number
2. Submit to Bazos
3. Wait for SMS
4. Extract code
5. Complete verification
6. Extract phone from ad
7. Cleanup

## Troubleshooting

### "Verification form not found"
- Bazos changed HTML structure
- Update selectors in `extractVerificationFormData()`
- Check browser DevTools for current markup

### "Invalid verification code"
- Check SMS service is receiving messages
- Verify code extraction regex patterns
- Check timeout settings (may need longer wait)

### "Cookies not working after verification"
- Verify cookie domain (.bazos.cz vs bazos.cz)
- Check cookie path (should be /)
- Ensure testcookie is set to 'ano'
- Test with `testCookies()` function

### "Session expired"
- Increase verification timeout
- Check if Bazos requires faster response
- Verify session ID format

## Production Checklist

- [ ] Research real Bazos verification endpoints
- [ ] Implement real `submitPhoneForVerification()`
- [ ] Implement real `submitVerificationCode()`
- [ ] Test with real phone number
- [ ] Verify cookies work for phone extraction
- [ ] Add error handling for edge cases
- [ ] Test cookie expiration handling
- [ ] Monitor verification success rate
- [ ] Document any Bazos-specific quirks
- [ ] Set up alerts for failures

## Notes

- Bazos.cz may change verification process
- Keep monitoring for UI/API changes
- Consider legal/TOS implications
- Rate limiting may apply
- Some categories may have different verification
