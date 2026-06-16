import { DecodedToken } from '@/types/auth';

export interface UrlTokenPayload {
  Id: number;
  FirstName: string;
  LastName: string;
  Email: string;
  CreatedAt: string;
  JWTtoken: string;
  refresh_token: string;
  TenantId: number;
  ChatWorkflow: string;
  ExternalSocketServer: string;
}

export const extractTokenFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  let token = urlParams.get('token');

  // Remove surrounding quotes if present
  if (token && (token.startsWith('"') && token.endsWith('"'))) {
    token = token.slice(1, -1);
  }

  return token;
};

export const decodeUrlToken = (base64Token: string): UrlTokenPayload | null => {
  try {
    const decodedString = atob(base64Token);
    const payload: UrlTokenPayload = JSON.parse(decodedString);

    // Validate required fields
    if (!payload.Id || !payload.FirstName || !payload.Email ||
      !payload.JWTtoken || !payload.refresh_token) {
      console.error('URL token missing required fields');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Failed to decode URL token:', error);
    return null;
  }
};

/**
 * Reverse of decodeUrlToken — builds a base64-encoded token string
 * from a UrlTokenPayload so another app can use loginWithUrlToken.
 */
export const generateUrlToken = (payload: UrlTokenPayload): string => {
  const jsonString = JSON.stringify(payload);
  return btoa(jsonString);
};

export const validateUrlToken = (payload: UrlTokenPayload): boolean => {
  // Check if the JWT token itself is valid and not expired
  if (!payload.JWTtoken) {
    console.warn('URL token missing JWT');
    return false;
  }

  // Parse the actual JWT to check expiration
  const decoded = parseJWT(payload.JWTtoken);
  if (!decoded) {
    console.warn('Invalid JWT in URL token');
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (decoded.exp < currentTime) {
    console.warn('JWT token has expired');
    return false;
  }

  return true;
};


export const detectInputType = (input: string): 'email' | 'phone' => {
  // Check if input is a 10-digit phone number
  const phoneRegex = /^\d{10}$/;
  if (phoneRegex.test(input.replace(/\s/g, ''))) {
    return 'phone';
  }
  return 'email';
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\s/g, '');
};

export const parseJWT = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = parseJWT(token);
  if (!decoded || !decoded.exp) return true;

  // Check if token is expired
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

export const isTokenExpiring = (token: string, bufferMinutes: number = 5): boolean => {
  const decoded = parseJWT(token);
  if (!decoded || !decoded.exp) return true;

  // Check if token will expire within buffer time
  const currentTime = Math.floor(Date.now() / 1000);
  const bufferSeconds = bufferMinutes * 60;
  return decoded.exp < (currentTime + bufferSeconds);
};

export const getTokenExpirationTime = (token: string): number | null => {
  const decoded = parseJWT(token);
  return decoded?.exp || null;
};
