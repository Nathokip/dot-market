import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hasSupabaseAuthConfig } from "@/lib/env";
import { ensureProfile, type Profile } from "@/lib/profileService";

interface AuthContextValue {
  isConfigured: boolean;
  isLoading: boolean;
  profile: Profile | null;
  session: Session | null;
  signOut: () => Promise<void>;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue>({
  isConfigured: hasSupabaseAuthConfig(),
  isLoading: true,
  profile: null,
  session: null,
  signOut: async () => {},
  user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = hasSupabaseAuthConfig();

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const sessionPromise = supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        try {
          const ensuredProfile = await ensureProfile(data.session.user);
          if (isMounted) setProfile(ensuredProfile);
        } catch {
          if (isMounted) setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    sessionPromise.catch(() => {
      if (isMounted) setIsLoading(false);
    });

    const timeoutId = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        try {
          const ensuredProfile = await ensureProfile(nextSession.user);
          setProfile(ensuredProfile);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  async function signOut() {
    if (!isConfigured) return;
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ isConfigured, isLoading, profile, session, signOut, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}