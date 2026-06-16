import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, User } from '@/types/auth';
import { authService } from '@/services/authService';
import { socketService } from '@/services/socketService';
import { isTokenExpiring } from '@/utils/authUtils';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      const refreshTokenValue = authService.getRefreshToken();

      if (token && refreshTokenValue) {
        // Check if token is expired or expiring soon (within 10 minutes)
        if (isTokenExpiring(token, 10)) {
          try {
            // Attempt to refresh token proactively
            await authService.refreshAccessToken();
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
              // Connect socket after restoring session
              socketService.connect();
            }
          } catch (error) {
            console.error('Failed to refresh token on init:', error);
            // Clear invalid tokens
            authService.clearTokens();
          }
        } else if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            // Connect socket after restoring session
            socketService.connect();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Auto-refresh token every 3 minutes
  useEffect(() => {
    // Set up proactive token refresh (check every 3 minutes, refresh if expiring within 10 minutes)
    const interval = setInterval(async () => {
      const token = authService.getToken();
      const refreshTokenValue = authService.getRefreshToken();

      if (token && refreshTokenValue) {
        // Proactively refresh if token expires within 10 minutes
        if (isTokenExpiring(token, 10)) {
          try {
            await authService.refreshAccessToken();
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
            }
          } catch (error) {
            console.error('Proactive token refresh failed:', error);
            logout();
          }
        }
      }
    }, 3 * 60 * 1000); // Check every 3 minutes

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userData = await authService.login(email, password);
      setUser(userData);

      // Connect socket after successful login
      socketService.connect();

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userData.firstName}!`,
      });
      navigate('/inpatient');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const generateOTP = async (phone: string) => {
    try {
      await authService.generateOTP(phone);
      toast({
        title: 'OTP Sent',
        description: 'Please check your WhatsApp for the verification code',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Send OTP',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const loginWithPhone = async (phone: string, otp: string) => {
    try {
      const userData = await authService.loginWithPhone(phone, otp);
      setUser(userData);

      // Connect socket after successful login
      socketService.connect();

      toast({
        title: 'Login Successful',
        description: `Welcome, ${userData.firstName}!`,
      });
      navigate('/inpatient');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid OTP',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    // Disconnect socket before clearing tokens
    socketService.disconnect();

    authService.clearTokens();
    setUser(null);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    });
    navigate('/login');
  };

  const refreshToken = async () => {
    try {
      await authService.refreshAccessToken();
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const loginWithUrlToken = async (base64Token: string) => {
    try {
      const userData = await authService.loginWithUrlToken(base64Token);
      setUser(userData);

      // Connect socket after successful login
      socketService.connect();

      toast({
        title: 'Login Successful',
        description: `Welcome, ${userData.firstName}!`,
      });
      navigate('/inpatient');
    } catch (error: any) {
      toast({
        title: 'URL Token Authentication Failed',
        description: error.message || 'Invalid or expired token',
        variant: 'destructive',
      });
      throw error;
    }
  };

  /**
   * Generates a base64 login token from the current session.
   * Use this to create a URL for logging into another app via loginWithUrlToken.
   */
  const generateLoginToken = (): string | null => {
    return authService.generateLoginToken();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    loginWithPhone,
    generateOTP,
    logout,
    refreshToken,
    loginWithUrlToken,
    generateLoginToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
