import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });

      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const ensureProfile = async (authenticatedUser: User) => {
      const displayName =
        typeof authenticatedUser.user_metadata?.display_name === 'string'
          ? authenticatedUser.user_metadata.display_name
          : null;
      const avatarUrl =
        typeof authenticatedUser.user_metadata?.avatar_url === 'string'
          ? authenticatedUser.user_metadata.avatar_url
          : null;

      const { error } = await supabase.from('profiles').upsert(
        { id: authenticatedUser.id, display_name: displayName, avatar_url: avatarUrl },
        { onConflict: 'id', ignoreDuplicates: true },
      );
      if (error) console.error('Error ensuring profile:', error);
    };

    const applySession = async (nextSession: Session | null) => {
      if (cancelled) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setRoleLoading(true);

      if (nextSession?.user) {
        const authenticatedUser = nextSession.user;
        const hasAdminRole = await checkAdminRole(authenticatedUser.id);
        if (!cancelled) {
          setIsAdmin(hasAdminRole);
          setRoleLoading(false);
        }
        void ensureProfile(authenticatedUser);
      } else {
        setIsAdmin(false);
        setRoleLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => void applySession(nextSession), 0);
    });

    // THEN get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        void applySession(initialSession);
      })
      .catch((error) => {
        console.error('getSession() failed:', error);
        if (!cancelled) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          setRoleLoading(false);
        }
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Ensure context updates immediately so the UI can redirect without waiting
    // for onAuthStateChange/getSession timing.
    setSession(data.session ?? null);
    setUser(data.user ?? null);

    if (data.user) {
      setRoleLoading(true);
      const hasAdminRole = await checkAdminRole(data.user.id);
      setIsAdmin(hasAdminRole);
      setRoleLoading(false);
    } else {
      setIsAdmin(false);
      setRoleLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setRoleLoading(false);
  };

  const value = {
    user,
    session,
    loading,
    roleLoading,
    signIn,
    signOut,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
