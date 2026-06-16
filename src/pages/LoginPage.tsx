import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { extractTokenFromUrl } from '@/utils/authUtils';
import { Loader2, Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const { login, loginWithUrlToken, isAuthenticated } = useAuth();
  const { appName, logoUrl } = useBranding();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    
    if (!username) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const attemptUrlTokenAuth = async () => {
      if (isAuthenticated) {
        navigate('/inpatient');
        return;
      }

      const urlToken = extractTokenFromUrl();
      
      if (urlToken) {
        setLoading(true);
        try {
          await loginWithUrlToken(urlToken);
          // Clear the token from URL after successful authentication
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash.split('?')[0]);
        } catch (error: any) {
          console.error('URL token authentication failed:', error);
          setError('The login link has expired or is invalid. Please use the standard login below.');
          // Clear the token from URL even on failure
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash.split('?')[0]);
        } finally {
          setLoading(false);
        }
      }
    };

    attemptUrlTokenAuth();
  }, [isAuthenticated, navigate, loginWithUrlToken]);

  if (loading && extractTokenFromUrl()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-primary/10 via-background to-medical-accent/10">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-medical-primary" />
              <p className="text-lg font-medium">Authenticating...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your login link
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-primary/10 via-background to-medical-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
         <div className='flex justify-center mb-2'>
            <img
              src={logoUrl}
              style={{ width: "140px" }}
              alt={`${appName} Logo`}
            />
          </div>
          <CardDescription className="text-center">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username / Email</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="pl-10"
                disabled={loading}
                autoFocus
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="pl-10"
                disabled={loading}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={loading || !username || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
