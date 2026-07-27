import { LoginResponse, RefreshTokenResponse, OTPResponse, User } from '@/types/auth';
import { parseJWT, decodeUrlToken, validateUrlToken, generateUrlToken, type UrlTokenPayload } from '@/utils/authUtils';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://innov-dev.beta.injomo.com';

const FASTAPI_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

class AuthService {
  // Email/Password Login
  async login(email: string, password: string): Promise<User> {
    try {
      // 1. Try the new backend session authentication
      const response = await fetch(`${FASTAPI_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (response.ok) {
        // Backend login successful, fetch status
        const statusResponse = await fetch(`${FASTAPI_BASE_URL}/auth/status`, { credentials: 'include' });
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          if (status.authenticated && status.user) {
            localStorage.setItem('useCookieAuth', 'true');
            // Return user object modeled after the backend response
            return {
              id: 1, // Fallback ID
              firstName: status.user.split('@')[0], // Derive from email
              lastName: "",
              email: status.user,
            };
          }
        }
      }
    } catch (err) {
      console.warn("Backend cookie auth failed or unavailable, falling back to mock auth.", err);
    }

    // 2. Fallback to existing mock authentication
    const isMockAdmin = (email === 'admin@gmail.com' || email === 'admin@vizru.com') && password === 'admin@123';

    if (isMockAdmin) {
      const mockPayload = {
        uid: "1472",
        fname: "Abhijith ",
        email: "abhijith@vizru.com",
        exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 // 1 year expiry
      };
      const mockPayloadBase64 = btoa(JSON.stringify(mockPayload));
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockPayloadBase64}.mock_signature`;
      const mockRefreshToken = "mock_refresh_token";

      this.setTokens(mockToken, mockRefreshToken);
      localStorage.setItem('externalSocketServer', "wss://wss.vizru.studio");
      localStorage.setItem('tenantId', "204");
      localStorage.removeItem('useCookieAuth');

      return {
        id: 1472,
        firstName: "Abhijith",
        lastName: "",
        email: "abhijith@vizru.com",
        JWTtoken: mockToken,
        refresh_token: mockRefreshToken,
        ExternalSocketServer: "wss://wss.vizru.studio",
        ChatWorkflow: "Workflow",
        TenantId: 204,
      };
    }
    throw new Error('Invalid credentials');
  }

  // Generate OTP for WhatsApp
  async generateOTP(phone: string): Promise<void> {
    console.log('[AuthService] Mock OTP generated for phone:', phone);
  }

  // Validate OTP and Login with Phone
  async loginWithPhone(phone: string, otp: string): Promise<User> {
    const mockPayload = {
      uid: "1472",
      fname: "Abhijith ",
      email: "abhijith@vizru.com",
      exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
    };
    const mockPayloadBase64 = btoa(JSON.stringify(mockPayload));
    const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockPayloadBase64}.mock_signature`;
    
    this.setTokens(mockToken, "mock_refresh_token");
    localStorage.setItem('externalSocketServer', "wss://wss.vizru.studio");
    localStorage.setItem('tenantId', "204");

    return {
      id: 1472,
      firstName: "Abhijith",
      lastName: "",
      email: "abhijith@vizru.com",
      JWTtoken: mockToken,
      refresh_token: "mock_refresh_token",
      ExternalSocketServer: "wss://wss.vizru.studio",
      ChatWorkflow: "Workflow",
      TenantId: 204,
    };
  }

  // Refresh Access Token
  async refreshAccessToken(): Promise<string> {
    const mockPayload = {
      uid: "1472",
      fname: "Abhijith ",
      email: "abhijith@vizru.com",
      exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
    };
    const mockPayloadBase64 = btoa(JSON.stringify(mockPayload));
    const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockPayloadBase64}.mock_signature`;
    
    localStorage.setItem('jwtToken', mockToken);
    return mockToken;
  }

  // Token Management
  setTokens(jwtToken: string, refreshToken: string): void {
    localStorage.setItem('jwtToken', jwtToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  getToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Check backend session status
  async checkCookieAuthStatus(): Promise<User | null> {
    try {
      if (localStorage.getItem('useCookieAuth') !== 'true') return null;
      
      const response = await fetch(`${FASTAPI_BASE_URL}/auth/status`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          return {
            id: 1, // Fallback ID
            firstName: data.user.split('@')[0], // Derive from email
            lastName: "",
            email: data.user,
          };
        }
      }
    } catch (err) {
      console.warn("Error checking cookie auth status", err);
    }
    return null;
  }

  clearTokens(): void {
    if (localStorage.getItem('useCookieAuth') === 'true') {
      fetch(`${FASTAPI_BASE_URL}/logout`, { method: 'POST', credentials: 'include' }).catch(err => console.error(err));
    }
    localStorage.removeItem('useCookieAuth');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    // Check if token is valid and not expired
    const decoded = parseJWT(token);
    if (!decoded) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp > currentTime;
  }

  getCurrentUser(): User | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded = parseJWT(token);
    if (!decoded) return null;

    return {
      id: parseInt(decoded.uid),
      firstName: decoded.fname.trim(),
      lastName: '',
      email: decoded.email,
      JWTtoken: token,
      ExternalSocketServer: localStorage.getItem('externalSocketServer') || '',
      TenantId: Number(localStorage.getItem('tenantId')) || 0,
    };
  }

  // Authenticate using URL token
  async loginWithUrlToken(base64Token: string): Promise<User> {
    const payload = decodeUrlToken(base64Token);
    if (!payload) {
      throw new Error('Invalid token format');
    }
    if (!validateUrlToken(payload)) {
      throw new Error('Token validation failed or expired');
    }
    // Store the REAL tokens from the API response
    this.setTokens(payload.JWTtoken, payload.refresh_token);
    // Optionally store additional metadata
    localStorage.setItem('tenantId', payload.TenantId.toString());
    localStorage.setItem('chatWorkflow', payload.ChatWorkflow);
    localStorage.setItem('externalSocketServer', payload.ExternalSocketServer);
    return {
      id: payload.Id,
      firstName: payload.FirstName,
      lastName: payload.LastName,
      email: payload.Email,
      TenantId: payload.TenantId,
    };
  }

  /**
   * Reverse of loginWithUrlToken — generates a base64 token string
   * from the current session stored in localStorage.
   * This token can be passed to another app's loginWithUrlToken to log in.
   */
  generateLoginToken(): string | null {
    const jwtToken = this.getToken();
    const refreshToken = this.getRefreshToken();

    if (!jwtToken || !refreshToken) {
      console.error('No active session — cannot generate login token');
      return null;
    }

    const decoded = parseJWT(jwtToken);
    if (!decoded) {
      console.error('Failed to parse current JWT');
      return null;
    }

    const payload: UrlTokenPayload = {
      Id: parseInt(decoded.uid),
      FirstName: decoded.fname.trim(),
      LastName: '',
      Email: decoded.email,
      CreatedAt: new Date().toISOString(),
      JWTtoken: jwtToken,
      refresh_token: refreshToken,
      TenantId: Number(localStorage.getItem('tenantId')) || 0,
      ChatWorkflow: localStorage.getItem('chatWorkflow') || '',
      ExternalSocketServer: localStorage.getItem('externalSocketServer') || '',
    };

    return generateUrlToken(payload);
  }
}

export const authService = new AuthService();
