
import React, { createContext, useState, useEffect, useCallback } from 'react';
import supabase from '../services/supabaseClient';
import isSupabaseConfigured from '../services/supabaseClient';
import type { User as AppUser } from '../types';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (pass: string) => Promise<void>;
  requestPasswordResetOTP: (email: string) => Promise<void>;
  verifyOTPAndResetPassword: (email: string, otp: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updatePersonalization: (personalization: any) => Promise<void>;
  refreshSession: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getOrCreateSessionId = () => {
  let sid = localStorage.getItem('sessionId');
  if (!sid) {
    sid = uuidv4();
    localStorage.setItem('sessionId', sid);
  }
  return sid;
};


const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser | null): AppUser | null => {
  if (!supabaseUser) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'Wanderer',
    sessionId: getOrCreateSessionId(),
    personalization: supabaseUser.user_metadata?.personalization
  };
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to sync user state with current session/auth
  const syncUser = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    setUser(mapSupabaseUserToAppUser(session?.user ?? null));
    setLoading(false);
  }, []);

  useEffect(() => {
    // If supabase isn't configured, we stop loading and do nothing.
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    syncUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        console.log("AuthContext.onAuthStateChange:", _event);
        setUser(mapSupabaseUserToAppUser(session?.user ?? null));
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [syncUser]);

  const login = useCallback(async (email: string, pass: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    localStorage.removeItem('sessionId');  // important
    setUser(null);
  }, []);


  const signup = useCallback(async (name: string, email: string, pass: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name, // This adds the name to user_metadata
        }
      }
    });
    if (error) throw error;
    // NOTE: Supabase may require email confirmation. If so, the user won't be logged in
    // immediately after sign-up. This behavior is standard and secure.
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (pass: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.updateUser({ password: pass });
    if (error) throw error;
  }, []);

  const requestPasswordResetOTP = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.functions.invoke('send-password-reset-otp', {
      body: { email }
    });

    // Better error handling for Edge Functions
    if (error) {
      if ('context' in error) {
        const body = await (error as any).context.json();
        throw new Error(body.error || body.message || error.message);
      }
      throw error;
    }
    if (data?.error) throw new Error(data.error);
  }, []);

  const verifyOTPAndResetPassword = useCallback(async (email: string, otp: string, pass: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.functions.invoke('verify-otp-and-reset', {
      body: { email, otp, newPassword: pass }
    });

    if (error) {
      if ('context' in error) {
        const body = await (error as any).context.json();
        throw new Error(body.error || body.message || error.message);
      }
      throw error;
    }
    if (data?.error) throw new Error(data.error);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      }
    });
    if (error) throw error;
  }, []);

  const updatePersonalization = useCallback(async (personalization: any) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.updateUser({
      data: { personalization }
    });
    if (error) throw error;
    syncUser();
  }, [syncUser]);

  const refreshSession = useCallback(() => {
    localStorage.removeItem('sessionId');
    syncUser();
  }, [syncUser]);

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, signup, resetPassword, updatePassword,
      requestPasswordResetOTP, verifyOTPAndResetPassword,
      loginWithGoogle,
      updatePersonalization, refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
