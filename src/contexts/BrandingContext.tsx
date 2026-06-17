import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/apiService';

interface BrandingContextType {
  appName: string;
  logoUrl: string;
  isLoading: boolean;
}

const DEFAULT_LOGO = './dist/logo.png';

const BrandingContext = createContext<BrandingContextType>({
  appName: 'FinBridge',
  logoUrl: './dist/logo.png',
  isLoading: false,
});

export const useBranding = () => useContext(BrandingContext);

// Helper to compute logo URL from base URL
const computeLogoUrl = (baseUrl: string): string => {
  return './dist/logo.png';
};

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [appName, setAppName] = useState('FinBridge');
  const [logoUrl, setLogoUrl] = useState('./dist/logo.png');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAppName('FinBridge');
    setLogoUrl('./dist/logo.png');
    setIsLoading(false);
  }, []);

  return (
    <BrandingContext.Provider value={{ appName, logoUrl, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
};

