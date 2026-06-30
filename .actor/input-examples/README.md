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
Configuration with manual cookies for phone extraction:
- **Requires your Bazos cookies** (bid, bkod)
- Extracts phone numbers from all ads
- Tests cookies validity before run

**Note:** Replace `YOUR_BID_HERE` and `YOUR_BKOD_HERE` with your actual cookie values!

### 3. `advanced-filters.json` - Advanced Filtering
Using all available filters:
- Price range (minPrice, maxPrice)
- Location filtering (postalCode, distance)
- Multiple search queries
- No phone extraction (add `bid` and `bkod` to enable)

## How to Use

1. **Choose an example** that matches your needs
2. **Copy the JSON** to your Actor input
3. **Modify values** as needed (keywords, prices, etc.)
4. **Add cookies** if using phone extraction (see below)
5. **Run the Actor**

## Phone Extraction Setup

To extract phone numbers, you need to provide Bazos authentication cookies.

### Getting Cookies from Browser

1. **Login to Bazos.cz** in your browser
2. **Open DevTools** (F12) → Application/Storage → Cookies
3. **Copy these values:**
   - `bid` - 8-digit number (e.g., `79580379`)
   - `bkod` - 10-character token (e.g., `HCIIFBA50J`)

### Add to Input

```json
{
  "searchQueries": ["kočárek"],
  "maxRequestsPerCrawl": 100,
  "bid": "79580379",
  "bkod": "HCIIFBA50J"
}
```

**Important:**
- `bkod` is automatically encrypted as secret in Apify
- Cookies are valid for ~30 days
- Actor tests cookies before each run

## Troubleshooting

**Phone numbers not showing?**
- Check if `bid` and `bkod` are provided
- Verify cookies are not expired
- Make sure you can see phone numbers in browser
- Check Actor logs for validation errors

**Cookies expired?**
- Login to Bazos.cz again
- Copy new `bid` and `bkod` values
- Update Actor input

## More Information

See the main [README.md](../README.md) for complete documentation.
