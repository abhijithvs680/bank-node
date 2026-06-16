export interface LoginResponse {
  Echo: null;
  Status: [number, string];
  Time: string;
  Errors: null;
  Body: {
    Id: number;
    FirstName: string;
    LastName: string;
    Email: string;
    CreatedAt: string;
    JWTtoken: string;
    refresh_token: string;
    ChatWorkflow: string;
    ExternalSocketServer: string;
    TenantId: number;
  };
}

export interface RefreshTokenResponse {
  Echo: null;
  Status: [number, string];
  Time: string;
  Errors: null;
  Body: {
    JWTtoken: string;
    TenantId: number;
  };
}

export interface OTPResponse {
  Echo: null;
  Status: [number, string];
  Time: string;
  Errors: null;
  Body: any;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  TenantId?: number;
  ChatWorkflow?: string;
  ExternalSocketServer?: string;
  JWTtoken?: string;
  refresh_token?: string;
  kioskToken?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, otp: string) => Promise<void>;
  generateOTP: (phone: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  loginWithUrlToken: (base64Token: string) => Promise<void>;
  generateLoginToken: () => string | null;
}

export interface DecodedToken {
  fname: string;
  uid: string;
  email: string;
  exp: number;
  domain: string;
  persistent: string;
}

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
