# External Services - SMS & Temp Phone Integration

## Current Status: MOCK IMPLEMENTATION

This folder contains **mock implementations** of external SMS and temporary phone number services for development and testing purposes.

## 🔄 TODO: Real API Integration

To use real temporary phone numbers and SMS receiving, you need to integrate with a third-party service.

### Recommended Providers

#### 1. SMS-Activate.org
- **Website**: https://sms-activate.org/
- **Pricing**: ~$0.20 - $0.50 per number
- **Countries**: CZ, SK supported
- **API Docs**: https://sms-activate.org/en/api2

**Example Integration:**
```typescript
// Get phone number
const response = await fetch(
  `https://api.sms-activate.org/stubs/handler_api.php?` +
  `api_key=${API_KEY}&action=getNumber&service=ba&country=22`
);
const data = await response.text(); // Format: ACCESS_NUMBER:12345:+420123456789
const [status, phoneId, phoneNumber] = data.split(':');

// Poll for SMS
const statusResponse = await fetch(
  `https://api.sms-activate.org/stubs/handler_api.php?` +
  `api_key=${API_KEY}&action=getStatus&id=${phoneId}`
);
const statusData = await statusResponse.text(); // STATUS_OK:code or STATUS_WAIT_CODE

// Release number
await fetch(
  `https://api.sms-activate.org/stubs/handler_api.php?` +
  `api_key=${API_KEY}&action=setStatus&status=8&id=${phoneId}`
);
```

#### 2. 5sim.net
- **Website**: https://5sim.net/
- **Pricing**: ~$0.15 - $0.40 per number
- **Countries**: CZ, SK supported
- **API Docs**: https://5sim.net/docs

**Example Integration:**
```typescript
// Get phone number
const response = await fetch(
  `https://5sim.net/v1/user/buy/activation/czech/any/bazos`,
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
);
const data = await response.json();
const { id, phone } = data;

// Check for SMS
const statusResponse = await fetch(
  `https://5sim.net/v1/user/check/${id}`,
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
);
const statusData = await statusResponse.json();

// Finish/cancel
await fetch(
  `https://5sim.net/v1/user/finish/${id}`,
  { 
    method: 'GET',
    headers: { 'Authorization': `Bearer ${API_KEY}` } 
  }
);
```

#### 3. receive-sms-online.com
- **Website**: https://receive-sms-online.com/
- **Pricing**: Free (limited) or paid
- **Note**: Less reliable for production

---

## 📝 Implementation Steps

### Step 1: Choose Provider
Select one of the recommended providers and sign up for an account.

### Step 2: Get API Key
- Create account on chosen platform
- Navigate to API settings
- Generate API key
- Store securely (use Apify Secrets)

### Step 3: Update Configuration
Add to `Input` interface in `main.ts`:
```typescript
interface Input {
  // ... existing fields
  phoneServiceConfig?: {
    apiKey: string;
    apiUrl: string;
    provider: 'sms-activate' | '5sim' | 'custom';
  };
  smsServiceConfig?: {
    apiKey: string;
    apiUrl: string;
    provider: 'sms-activate' | '5sim' | 'custom';
  };
}
```

### Step 4: Replace Mock Code

#### `tempPhoneService.ts`
Replace the mock implementation in `getTempPhoneNumber()`:
```typescript
export async function getTempPhoneNumber(country = 'CZ'): Promise<TempPhone> {
  // Get API config from Actor input
  const input = await Actor.getInput();
  const config = input?.phoneServiceConfig;
  
  if (!config) {
    throw new Error('Phone service config not provided');
  }
  
  // Real API call here
  const response = await fetch(
    `${config.apiUrl}?api_key=${config.apiKey}&action=getNumber&country=${country}`,
  );
  
  // Parse response according to provider format
  // ...
}
```

#### `smsService.ts`
Replace the mock polling in `waitForSMS()`:
```typescript
export async function waitForSMS(phoneId: string, timeout = 120): Promise<SMSMessage> {
  const input = await Actor.getInput();
  const config = input?.smsServiceConfig;
  
  if (!config) {
    throw new Error('SMS service config not provided');
  }
  
  const startTime = Date.now();
  const timeoutMs = timeout * 1000;
  
  while (Date.now() - startTime < timeoutMs) {
    // Real API polling here
    const response = await fetch(
      `${config.apiUrl}?api_key=${config.apiKey}&action=getStatus&id=${phoneId}`,
    );
    
    // Parse response and check for SMS
    // ...
    
    await new Promise((resolve) => setTimeout(resolve, SMS_POLL_INTERVAL));
  }
  
  throw new Error('SMS timeout');
}
```

### Step 5: Add Error Handling
- Handle rate limits (429 responses)
- Implement exponential backoff
- Add retry logic for transient failures
- Log all API interactions

### Step 6: Testing
- Test with small number of requests first
- Verify costs match expectations
- Monitor success rate
- Test timeout scenarios

---

## 🔐 Security Best Practices

### Store API Keys Securely
**DON'T:**
```typescript
const API_KEY = 'my-secret-key'; // ❌ Never hardcode!
```

**DO:**
```typescript
// Use Apify Secrets or environment variables
const input = await Actor.getInput();
const apiKey = input?.phoneServiceConfig?.apiKey; // ✅
```

### Apify Platform Setup
1. Go to Apify Console → Your Actor → Input
2. Add secret fields for API keys
3. Mark fields as "Secret" type
4. Values will be encrypted

---

## 💰 Cost Management

### Set Limits
- Max phone numbers per run
- Budget alerts
- Auto-stop on threshold

### Monitor Usage
```typescript
let phoneNumbersUsed = 0;
const MAX_PHONE_NUMBERS = 10;

if (phoneNumbersUsed >= MAX_PHONE_NUMBERS) {
  log.warning('Phone number limit reached');
  throw new Error('Budget limit exceeded');
}

phoneNumbersUsed++;
```

### Cost Estimation
- **1 verification**: ~$0.20 - $0.50
- **Per 1000 ads**: ~$0.50 (only 1 verification needed, then cookies valid for ~30 days)
- **Monthly**: ~$0.50 (re-verification after cookie expiration)

---

## 🧪 Development & Testing

### Use Mock Implementation
Current mock implementation is perfect for:
- Local development
- CI/CD testing
- UI/flow testing
- Cost-free experimentation

### Switch to Real API
Only enable real API integration when:
- Ready for production
- Budget allocated
- Error handling tested
- Monitoring in place

### Feature Flag
```typescript
const USE_REAL_SMS_SERVICE = process.env.USE_REAL_SMS === 'true';

if (USE_REAL_SMS_SERVICE) {
  // Real API implementation
} else {
  // Mock implementation
}
```

---

## 📊 Monitoring

### Log Important Events
- Phone number acquisition (phoneId, cost)
- SMS received (timestamp, attempts)
- Failures (timeouts, API errors)
- Costs (track spending)

### Apify Monitoring
- Set up alerts for errors
- Track Actor runs
- Monitor compute units usage
- Review logs regularly

---

## 🐛 Troubleshooting

### Common Issues

#### "No SMS received"
- Check phone number validity
- Verify service is active for your country
- Increase timeout (some services slow)
- Try different provider

#### "API Key Invalid"
- Regenerate key
- Check account status
- Verify balance

#### "Rate Limited"
- Implement exponential backoff
- Reduce request frequency
- Check provider limits

#### "Wrong Country Code"
- SMS-Activate uses numeric codes: CZ=22, SK=23
- 5sim uses country names: "czech", "slovakia"
- Check provider documentation

---

## 📚 Additional Resources

- [SMS-Activate API Documentation](https://sms-activate.org/en/api2)
- [5sim API Documentation](https://5sim.net/docs)
- [Apify Platform - Secrets Management](https://docs.apify.com/platform/actors/development/secret-environment-variables)
- [Apify Platform - Monitoring](https://docs.apify.com/platform/monitoring)

---

## ✅ Checklist for Production

- [ ] Choose and sign up for SMS service provider
- [ ] Generate and securely store API key
- [ ] Implement real API calls in tempPhoneService.ts
- [ ] Implement real API polling in smsService.ts
- [ ] Add error handling and retries
- [ ] Set up cost limits and monitoring
- [ ] Test with small batch first
- [ ] Monitor success rate
- [ ] Document any provider-specific quirks
- [ ] Set up alerts for failures
