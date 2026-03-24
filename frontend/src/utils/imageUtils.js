/**
 * Utility function to properly format image URLs from the database
 * Handles both:
 * - Absolute URLs (http://, https://)
 * - Relative paths (/upload/...)
 * 
 * @param {string} url - The URL from the database
 * @param {string} baseUrl - The base server URL (default: http://localhost:9999)
 * @returns {string} - Properly formatted image URL
 */
export const getImageUrl = (url, baseUrl = 'http://localhost:9999') => {
  if (!url) {
    return '';
  }
  
  // If URL already starts with http:// or https://, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Otherwise, prepend the base URL
  return `${baseUrl}${url}`;
};

export default getImageUrl;