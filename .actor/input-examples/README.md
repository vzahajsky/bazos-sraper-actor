# Input Configuration Examples

This folder contains example input configurations for the Bazos.cz Scraper Actor.

## Available Examples

### 1. `basic.json` - Basic Scraping
Simple configuration without phone extraction:
- Searches for multiple keywords
- No price filters
- No phone extraction
- Good for testing or when phone numbers are not needed

### 2. `with-phone-extraction.json` - With Phone Numbers
Configuration with automatic phone verification:
- **Requires external service API keys** (SMS-Activate, 5sim, etc.)
- Automatically verifies account on first run
- Extracts phone numbers from all ads
- Cookies saved for reuse (~30 days)

**Note:** Replace `YOUR_SMS_ACTIVATE_API_KEY_HERE` with your actual API key!

### 3. `advanced-filters.json` - Advanced Filtering
Using all available filters:
- Price range (minPrice, maxPrice)
- Location filtering (postalCode, distance)
- Multiple search queries
- No phone extraction (set `enableAutoVerification: true` to enable)

## How to Use

1. **Choose an example** that matches your needs
2. **Copy the JSON** to your Actor input
3. **Modify values** as needed (keywords, prices, etc.)
4. **Add API keys** if using phone extraction
5. **Run the Actor**

## Phone Extraction Setup

To use phone extraction:

1. Sign up for a temporary phone service:
   - [SMS-Activate](https://sms-activate.org/) (recommended)
   - [5sim](https://5sim.net/)
   - Or integrate your own provider

2. Get your API key from the provider

3. Update `phoneServiceConfig` and `smsServiceConfig` in your input:
   ```json
   {
     "enableAutoVerification": true,
     "phoneServiceConfig": {
       "provider": "sms-activate",
       "apiKey": "YOUR_ACTUAL_API_KEY",
       "apiUrl": "https://api.sms-activate.org/stubs/handler_api.php"
     },
     "smsServiceConfig": {
       "provider": "sms-activate",
       "apiKey": "YOUR_ACTUAL_API_KEY",
       "apiUrl": "https://api.sms-activate.org/stubs/handler_api.php"
     }
   }
   ```

4. First run will verify automatically (~30 seconds)

5. Subsequent runs will reuse saved cookies (no verification needed)

## Cost Estimation

- **Without phone extraction**: Standard Apify compute costs
- **With phone extraction**:
  - Initial verification: ~$0.20 - $0.50 (one-time per 30 days)
  - Per ad: +10% compute overhead for phone API calls
  - Monthly: ~$0.50 for cookie refresh

## Troubleshooting

**Phone numbers not showing?**
- Check if `enableAutoVerification: true`
- Verify API keys are correct
- Check Actor run logs for errors
- Ensure you have credits on your phone service account

**Verification failed?**
- Check API key is valid
- Verify provider supports Czech numbers (+420)
- Check provider's service status
- Review detailed logs in Actor console

## More Information

See the main [README.md](../README.md) for complete documentation.
