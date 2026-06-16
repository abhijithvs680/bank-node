import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, refreshToken } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const checkAndRefreshToken = async () => {
      const isLoginPageWithToken = location.pathname === '/login' && 
                                    new URLSearchParams(location.search).has('token');
      
      if (isLoginPageWithToken) {
        return;
      }

      if (!isAuthenticated && !loading) {
        const jwtToken = localStorage.getItem('jwtToken');
        const refreshTokenValue = localStorage.getItem('refreshToken');
        
        // Only attempt refresh if we have both tokens
        if (jwtToken && refreshTokenValue) {
          setIsRefreshing(true);
          try {
            await refreshToken();
          } catch (error) {
            console.error('Token refresh failed:', error);
          } finally {
            setIsRefreshing(false);
          }
        }
      }
    };

    checkAndRefreshToken();
  }, [isAuthenticated, loading, refreshToken, location]);

  if (loading || isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-primary/10 via-background to-medical-accent/10">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-medical-primary" />
          <p className="text-muted-foreground">
            {isRefreshing ? 'Refreshing session...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
