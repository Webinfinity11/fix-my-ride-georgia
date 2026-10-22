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
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: any | null }>;
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
    console.log('🔑 Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔄 Auth state changed:', event, currentSession?.user?.id);
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Use setTimeout to prevent potential deadlocks with Supabase
          setTimeout(async () => {
            console.log('👤 Fetching user profile for:', currentSession.user.id);
            // Get user profile data
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", currentSession.user.id)
              .single();

            if (profileError) {
              console.error('❌ Profile fetch error:', profileError);
            }

            if (profile) {
              console.log('✅ Profile loaded:', profile.role);
              setState({
                user: {
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  avatarUrl: profile.avatar_url,
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  fullName: profile.full_name || `${profile.first_name} ${profile.last_name}`.trim(),
                  role: profile.role,
                  isVerified: profile.is_verified,
                  phone: profile.phone,
                  city: profile.city,
                  district: profile.district,
                  street: profile.street,
                  building: profile.building,
                  apartment: profile.apartment,
                  fullAddress: profile.full_address,
                },
                initialized: true,
                loading: false,
              });
            } else {
              console.log('⚠️ No profile found for user');
              setState({
                user: null,
                initialized: true,
                loading: false,
              });
            }
          }, 0);
        } else {
          console.log('🚪 User logged out');
          setState({
            user: null,
            initialized: true,
            loading: false,
          });
        }
      }
    );

    // Check for existing session
    console.log('🔍 Checking for existing session');
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error('❌ Session check error:', error);
      }
      
      console.log('📋 Existing session:', currentSession?.user?.id || 'none');
      setSession(currentSession);
      
      if (currentSession?.user) {
        // Get user profile data
        supabase
          .from("profiles")
          .select("*")
          .eq("id", currentSession.user.id)
          .single()
          .then(({ data: profile, error: profileError }) => {
            if (profileError) {
              console.error('❌ Initial profile fetch error:', profileError);
            }
            
            if (profile) {
              console.log('✅ Initial profile loaded:', profile.role);
              setState({
                user: {
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  avatarUrl: profile.avatar_url,
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  fullName: profile.full_name || `${profile.first_name} ${profile.last_name}`.trim(),
                  role: profile.role,
                  isVerified: profile.is_verified,
                  phone: profile.phone,
                  city: profile.city,
                  district: profile.district,
                  street: profile.street,
                  building: profile.building,
                  apartment: profile.apartment,
                  fullAddress: profile.full_address,
                },
                initialized: true,
                loading: false,
              });
            } else {
              console.log('⚠️ No initial profile found');
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
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Signing in user:', email);
    setState(prev => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('❌ Sign in error:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
    return { error };
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    console.log('📝 Signing up user:', email, 'as:', userData.role);
    setState(prev => ({ ...prev, loading: true }));
    
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          full_name: userData.fullName,
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup error:', authError);
      setState(prev => ({ ...prev, loading: false }));
      return { error: authError, data: null };
    }

    if (authData.user) {
      console.log('✅ Auth user created:', authData.user.id);
      // Create the profile
      const { error: profileError, data: profileData } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: email,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          full_name: userData.fullName,
          phone: userData.phone,
          city: userData.city,
          district: userData.district,
          street: userData.street,
          building: userData.building,
          apartment: userData.apartment,
          full_address: userData.fullAddress,
          role: userData.role || 'customer',
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        setState(prev => ({ ...prev, loading: false }));
        return { error: profileError, data: null };
      }
      
      console.log('✅ Profile created successfully');
      
      // If user is a mechanic, create mechanic profile
      if (userData.role === 'mechanic') {
        console.log('🔧 Creating mechanic profile entry');
        const { error: mechanicError } = await supabase
          .from("mechanic_profiles")
          .insert({
            id: authData.user.id
          });

        if (mechanicError) {
          console.error('❌ Mechanic profile creation error:', mechanicError);
          setState(prev => ({ ...prev, loading: false }));
          return { error: mechanicError, data: null };
        }
        console.log('✅ Mechanic profile created');
      }

      // Don't set loading to false here - let the auth state change handler do it
      // This ensures the user stays logged in after registration
      return { error: null, data: { user: authData.user, profile: profileData } };
    }

    setState(prev => ({ ...prev, loading: false }));
    return { error: new Error("Failed to create user"), data: null };
  };

  const signOut = async () => {
    console.log('🚪 Signing out user');
    setState(prev => ({ ...prev, loading: true }));
    await supabase.auth.signOut();
    setState({ user: null, initialized: true, loading: false });
  };

  const resetPassword = async (email: string) => {
    console.log('🔑 Requesting password reset for:', email);
    setState(prev => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setState(prev => ({ ...prev, loading: false }));
    if (error) {
      console.error('❌ Password reset error:', error);
    } else {
      console.log('✅ Password reset email sent');
    }
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    console.log('🔑 Updating password');
    setState(prev => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    setState(prev => ({ ...prev, loading: false }));
    if (error) {
      console.error('❌ Password update error:', error);
    } else {
      console.log('✅ Password updated successfully');
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', state.user.id).single();
    if (error) throw error;
    setState(previous => ({ ...previous, user: previous.user ? { ...previous.user,
      firstName: data.first_name, lastName: data.last_name, fullName: data.full_name,
      avatarUrl: data.avatar_url, phone: data.phone, city: data.city, district: data.district,
      street: data.street, fullAddress: data.full_address,
    } : null }));
  };

  const value = {
    session,
    user: state.user,
    initialized: state.initialized,
    loading: state.loading,
    signIn,
    signUp,
    refreshProfile,
    signOut,
    resetPassword,
    updatePassword,
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
