const publicApiUrl = import.meta.env.PUBLIC_API_URL || '';

export const getApiUrl = (path: string): string => `${publicApiUrl}${path}`;
