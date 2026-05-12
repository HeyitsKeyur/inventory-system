const FALLBACK_BASE_URL = 'https://placehold.co/400x400?text=';

/**
 * Returns a safe image URL for product cards by replacing
 * placeholder hosts that might be blocked and falling back
 * to a deterministic placeholder that works offline.
 *
 * @param {string} productName
 * @param {string[]|string} images
 * @returns {string}
 */
export function getSafeProductImage(productName = 'Product', images = []) {
    const imageList = Array.isArray(images) ? images : [images];
    const source = imageList.find(Boolean);

    const fallbackText = encodeURIComponent(productName || 'Product');

    if (!source) {
        return `${FALLBACK_BASE_URL}${fallbackText}`;
    }

    if (source.includes('via.placeholder.com')) {
        return `${FALLBACK_BASE_URL}${fallbackText}`;
    }

    return source;
}

