let countryCode = 'cz';

export const setCountryCode = (code: string) => {
	countryCode = code;
};

export const getBaseUrl = () => `https://www.bazos.${countryCode}/search.php?hledat=`;
