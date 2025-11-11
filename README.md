Scrape ads from your favorite advertising server.

## What does Bazos.cz Scraper do?

People are not perfect. That's true even when they're trying to sell something. They can list it under really weird keywords with multiple typos.

With this scraper you can define multiple keywords and get unique listings. **No more search nightmares trying to find hidden gems!**

### Phone Number Extraction

This scraper can extract **phone numbers** from ads! Phone numbers on Bazos.cz require authentication, so the scraper includes an automated verification workflow:

- ✅ **Automatic verification** - Uses temporary phone numbers to verify and obtain authentication cookies
- ✅ **Cookie persistence** - Saves cookies to Apify Key-Value Store (~30 day validity)
- ✅ **Smart cookie management** - Automatically tests and refreshes expired cookies
- ✅ **Mock mode** - Test without real external services (development)

See [Phone Verification Setup](#phone-verification-setup) for configuration details.

## Output

You can easily browse the results with a thumbnail in your Apify console.

**Output fields:**
- `title` - Ad title
- `description` - Ad description
- `price` - Price (if available)
- `url` - Ad URL
- `location` - Seller location
- `phoneNumber` - Seller phone number (when cookies are available)
- `thumbnailUrl` - Image thumbnail
- ... and more

## Phone Verification Setup

To extract phone numbers from ads, you need to configure external services for phone verification.

### Quick Start (Without Phone Extraction)

By default, the scraper works without phone extraction. Just provide keywords:

```json
{
  "keywords": ["kočárek", "autosedačka"],
  "maxRequestsPerCrawl": 100
}
```

### Enable Phone Extraction

To enable phone extraction, you need:

1. **Temporary phone service** (e.g., SMS-Activate, 5sim)
2. **SMS receiving service** (usually included with phone service)

#### Configuration Example

```json
{
  "keywords": ["kočárek"],
  "maxRequestsPerCrawl": 100,
  "enableAutoVerification": true,
  "phoneServiceConfig": {
    "provider": "sms-activate",
    "apiKey": "YOUR_API_KEY",
    "apiUrl": "https://api.sms-activate.org/stubs/handler_api.php"
  },
  "smsServiceConfig": {
    "provider": "sms-activate",
    "apiKey": "YOUR_API_KEY",
    "apiUrl": "https://api.sms-activate.org/stubs/handler_api.php"
  }
}
```

#### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `enableAutoVerification` | boolean | No | `false` | Enable automatic phone verification workflow |
| `testCookiesBeforeRun` | boolean | No | `true` | Test existing cookies before scraping |
| `phoneServiceConfig` | object | No | - | Temp phone service configuration |
| `phoneServiceConfig.provider` | string | Yes* | - | Provider name: `sms-activate`, `5sim`, or `custom` |
| `phoneServiceConfig.apiKey` | string | Yes* | - | API key from provider |
| `phoneServiceConfig.apiUrl` | string | Yes* | - | Provider API endpoint |
| `smsServiceConfig` | object | No | - | SMS receiving service configuration |
| `smsServiceConfig.provider` | string | Yes* | - | Provider name (usually same as phone service) |
| `smsServiceConfig.apiKey` | string | Yes* | - | API key from provider |
| `smsServiceConfig.apiUrl` | string | Yes* | - | Provider API endpoint |

*Required when `enableAutoVerification` is `true`

### How It Works

1. **First Run**: If no cookies exist and `enableAutoVerification` is enabled:
   - Rents temporary Czech phone number
   - Submits phone to Bazos verification form
   - Receives SMS with verification code
   - Submits code to Bazos
   - Saves authentication cookies to Key-Value Store

2. **Subsequent Runs**: 
   - Loads cookies from storage
   - Tests cookies validity (if `testCookiesBeforeRun` is enabled)
   - Uses cookies for phone extraction
   - Re-verifies automatically if cookies expired

3. **Cookie Lifetime**:
   - Cookies typically valid for ~30 days
   - Automatically tested before each run
   - Only 1 verification needed per month

### Supported Providers

See detailed provider comparison in [src/services/external/README.md](./src/services/external/README.md):

- **SMS-Activate** - Most popular, 190+ countries
- **5sim** - Good prices, reliable
- **Custom** - Integrate your own provider

### Cost Estimation

- **Verification cost**: ~$0.20 - $0.50 per verification
- **Frequency**: ~1x per 30 days (cookie expiration)
- **Per 1000 ads**: +~0.5 Apify Compute Units (phone extraction overhead)
- **Monthly**: ~$0.50 for re-verification

### Troubleshooting

**Phone numbers not extracted?**
- Check if `enableAutoVerification` is `true`
- Verify API keys are correct
- Check Actor logs for verification errors
- Ensure cookies exist in Key-Value Store (`bazos-cookies`)

**"Cookies are invalid" warning?**
- Cookies expired (>30 days)
- Actor will auto-verify if `enableAutoVerification` is enabled
- Manual: Delete `bazos-cookies` from Key-Value Store to force re-verification

**Verification failed?**
- Check API credits/balance
- Verify API endpoints are correct
- Check if phone service supports Czech numbers
- Review Actor logs for detailed error messages

## Roadmap

This project is in early stage. **Stay tuned!**

Some features that will be added later:

- possibility to scrape only new ads
  - from input date
  - from last run
- search by
  - categories
- add support for Bazos in other countries 

Do you have idea/request on feature? Feel free to create issue.

## Development

### Phone Verification Architecture

The phone verification system is split into modular services:

- **`src/services/bazos/`** - Bazos.cz-specific verification logic
  - `phoneVerification.ts` - Form parsing and verification submission
  - `cookieManager.ts` - Cookie persistence and validation
  
- **`src/services/external/`** - External service integrations
  - `tempPhoneService.ts` - Temporary phone number rental
  - `smsService.ts` - SMS receiving and code extraction

- **`src/workflows/`** - Orchestration
  - `verificationWorkflow.ts` - Complete verification flow

See detailed architecture in [PHONE_VERIFICATION_IMPLEMENTATION.md](./PHONE_VERIFICATION_IMPLEMENTATION.md)

### Testing Without Real APIs

Mock implementations are included for development:

```json
{
  "keywords": ["test"],
  "enableAutoVerification": true,
  "phoneServiceConfig": {
    "provider": "custom",
    "apiKey": "mock",
    "apiUrl": "http://localhost:3000"
  },
  "smsServiceConfig": {
    "provider": "custom",
    "apiKey": "mock",
    "apiUrl": "http://localhost:3000"
  }
}
```

Mock services return predictable test data (see implementation for details).

## Changelog

### v0.2.0 (2025-11-11)
- ✨ **Phone number extraction** from ads
- ✨ Automated verification workflow with external services
- ✨ Cookie persistence and validation
- ✨ Mock implementations for development
- 📚 Comprehensive documentation

### v0.1.0 (2025-03-16)
- possibility to choose CZ or SK variant
