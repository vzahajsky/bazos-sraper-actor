let countryCode = 'cz';

export const setCountryCode = (code: string) => {
	countryCode = code;
};

export const getBaseUrl = () => `https://www.bazos.${countryCode}/search.php?hledat=`;

// Test ad URL for cookie validation
export const TEST_AD_URL = 'https://zvirata.bazos.cz/inzerat/210563707/americky-stafordsirsky-terier-modra-sts-pp-k-odberu.php';

// Verification settings
export const VERIFICATION_TIMEOUT = 120000; // 2 minutes
export const SMS_POLL_INTERVAL = 5000; // 5 seconds
export const SMS_MAX_ATTEMPTS = 24; // 24 * 5s = 2 minutes

// Cookie settings
export const COOKIE_EXPIRATION_DAYS = 30; // Assumed expiration
