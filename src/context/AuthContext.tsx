
import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { AuthState, User } from "@/types/auth";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: any | null, data: any | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<AuthState>({
    user: null,
    initialized: false,
    loading: true,
  });

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Use setTimeout to prevent potential deadlocks with Supabase
          setTimeout(async () => {
            // Get user profile data
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", currentSession.user.id)
              .single();

            if (profile) {
              setState({
                user: {
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  role: profile.role,
                  isVerified: profile.is_verified,
                  phone: profile.phone,
                  city: profile.city,
                  district: profile.district,
                  street: profile.street,
                },
                initialized: true,
                loading: false,
              });
            } else {
              setState({
                user: null,
                initialized: true,
                loading: false,
              });
            }
          }, 0);
        } else {
          setState({
            user: null,
            initialized: true,
            loading: false,
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        // Get user profile data
        supabase
          .from("profiles")
          .select("*")
          .eq("id", currentSession.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setState({
                user: {
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  role: profile.role,
                  isVerified: profile.is_verified,
                  phone: profile.phone,
                  city: profile.city,
                  district: profile.district,
                  street: profile.street,
                },
                initialized: true,
                loading: false,
              });
            } else {
              setState({
                user: null,
                initialized: true,
                loading: false,
              });
            }
          });
      } else {
        setState({
          user: null,
          initialized: true,
          loading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setState(prev => ({ ...prev, loading: false }));
    return { error };
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    setState(prev => ({ ...prev, loading: true }));
    
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
        }
      }
    });

    if (authError) {
      setState(prev => ({ ...prev, loading: false }));
      return { error: authError, data: null };
    }

    if (authData.user) {
      // Create the profile
      const { error: profileError, data: profileData } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: email,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          phone: userData.phone,
          city: userData.city,
          district: userData.district,
          role: userData.role || 'customer',
        })
        .select()
        .single();

      if (profileError) {
        setState(prev => ({ ...prev, loading: false }));
        return { error: profileError, data: null };
      }
      
      // If user is a mechanic, create mechanic profile
      if (userData.role === 'mechanic') {
        const { error: mechanicError } = await supabase
          .from("mechanic_profiles")
          .insert({
            id: authData.user.id
          });

        if (mechanicError) {
          setState(prev => ({ ...prev, loading: false }));
          return { error: mechanicError, data: null };
        }
      }

      setState(prev => ({ ...prev, loading: false }));
      return { error: null, data: { user: authData.user, profile: profileData } };
    }

    setState(prev => ({ ...prev, loading: false }));
    return { error: new Error("Failed to create user"), data: null };
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));
    await supabase.auth.signOut();
    setState({ user: null, initialized: true, loading: false });
  };

  const value = {
    session,
    user: state.user,
    initialized: state.initialized,
    loading: state.loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
