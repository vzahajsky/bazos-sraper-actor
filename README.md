Scrape ads from your favorite advertising server.

## What does Bazos.cz Scraper do?

People are not perfect. That's true even when they're trying to sell something. They can list it under really weird keywords with multiple typos.

With this scraper you can define multiple keywords and get unique listings. **No more search nightmares trying multiple keywords to find hidden gems!**

### Phone Number Extraction

This scraper can extract **phone numbers** from ads! Phone numbers on Bazos.cz require authentication cookies.

**How to enable:**
1. Get your Bazos cookies (use console script below - easiest!)
2. Add `bid` and `bkod` to Actor input
3. Phone numbers will be extracted automatically

See [Manual Cookies Setup](#manual-cookies-setup) for details.

## Manual Cookies Setup

To extract phone numbers from ads, you need to provide Bazos authentication cookies.

### Quick Method: Console Script ⚡

**Easiest way** - Copy this script to browser console:

1. **Login to Bazos.cz** in your browser
2. **Verify your phone number** - Open any ad, click "zobraz číslo" and complete verification (SMS code)
3. **Open Console** (F12 → Console tab)
4. **Paste and run this script:**

```javascript
// Extract Bazos cookies
(function() {
    const getCookie = (name) => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [key, value] = cookie.trim().split('=');
            if (key === name) return value;
        }
        return null;
    };
    
    const bid = getCookie('bid');
    const bkod = getCookie('bkod');
    
    if (!bid || !bkod) {
        console.error('❌ Cookies not found! Make sure you verified your phone number first.');
        return;
    }
    
    console.log('✅ Cookies found!\n');
    console.log('📋 Copy these values to Apify Actor input:\n');
    console.log('bid: ' + bid);
    console.log('bkod: ' + bkod);
    console.log('\n💡 Paste them into the Actor input fields.');
})();
```

5. **Copy the values** from console output

**Example output:**
```
✅ Cookies found!

📋 Copy these values to Apify Actor input:

bid: 79552379
bkod: HCIIACA50J

💡 Paste them into the Actor input fields.
```

### Manual Method: DevTools

If you prefer manual extraction:

1. **Login to Bazos.cz** and **verify your phone number** (click "zobraz číslo" on any ad)
2. **Open DevTools** (F12) → Application/Storage tab → Cookies
3. **Find and copy:**
   - `bid` - 8-digit number
   - `bkod` - 10-character token
4. **Add to Actor input** (see example below)

### Actor Input Example

```json
{
  "searchQueries": ["kočárek"],
  "maxRequestsPerCrawl": 100,
  "bid": "79552379",
  "bkod": "HCIIACA50J"
}
```

**Important:**
- `bkod` is marked as SECRET in Apify - it will be encrypted
- Cookies are valid for ~30 days
- Actor will test cookies before each run

## Output

You can easily browse the results with a thumbnail in your Apify console.

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

## Changelog

### v0.2.0(2025-11-16)
- option to provide user identification for retrieving phone numbers from ads.

### v0.1.0(2025-03-16)
- possibility to choose CZ or SK variant