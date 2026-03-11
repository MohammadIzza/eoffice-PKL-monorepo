/**
 * Utility to handle base path prefixing for navigation.
 * This ensures that links work correctly behind the Nginx proxy.
 */
export const withBasePath = (path: string): string => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    // Prevent double slashes and handle empty base path
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // If base path is already at the start, don't add it again
    if (basePath && cleanPath.startsWith(basePath)) {
        return cleanPath;
    }

    return `${basePath}${cleanPath}`;
};
