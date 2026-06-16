import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/apiService';

interface BrandingContextType {
  appName: string;
  logoUrl: string;
  isLoading: boolean;
}

const DEFAULT_LOGO = 'https://static.vizru.com/gooddoc/app/image/good_doc-logo-dark.svg';

const BrandingContext = createContext<BrandingContextType>({
  appName: 'GoodDoc',
  logoUrl: '',
  isLoading: true,
});

export const useBranding = () => useContext(BrandingContext);

// Helper to compute logo URL from base URL
const computeLogoUrl = (baseUrl: string): string => {
  // Remove trailing slash if present
  let url = baseUrl.replace(/\/$/, '');
  
  // Remove known path suffixes like /kiosk/pod1, /kiosk/pod2, etc.
  url = url.replace(/\/kiosk\/pod\d+$/, '');
  
  // Append the branding images path
  return `${url}/tenants/branding.images/st_logo`;
};

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [appName, setAppName] = useState('GoodDoc');
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {

        // Compute logo URL from VITE_API_BASE
        const apiBase = import.meta.env.VITE_API_BASE || '';

          setLogoUrl(computeLogoUrl(apiBase));

      } catch (error) {
        console.error('Failed to load branding config:', error);
        // Keep defaults on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ appName, logoUrl, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
};

