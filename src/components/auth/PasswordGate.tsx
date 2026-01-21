import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import shieldIcon from '@/assets/shield.png';
import rudolphBg from '@/assets/rudolph-bg.jpg';

const SITE_PASSWORD = 'theshield';
const STORAGE_KEY = 'site-authenticated';

interface PasswordGateProps {
  children: React.ReactNode;
}

export const PasswordGate = ({ children }: PasswordGateProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user has already authenticated
    const authenticated = localStorage.getItem(STORAGE_KEY);
    setIsAuthenticated(authenticated === 'true');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src={shieldIcon} alt="Loading..." className="h-12 w-12 animate-pulse" />
      </div>
    );
  }

  // Already authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show password form
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${rudolphBg})` }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <img src={shieldIcon} alt="Shield" className="w-20 h-20 mb-4" />
            <h1 className="font-display text-2xl font-bold text-center">MEN'S LEAGUE</h1>
            <p className="text-muted-foreground text-center mt-2">
              Enter the password to access the site
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full">
              Enter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
