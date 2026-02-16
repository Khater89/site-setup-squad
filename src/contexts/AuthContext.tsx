import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "provider" | "customer" | "cs";

interface Profile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  provider_status: string;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_status: string | null;
  created_at: string;
  date_of_birth: string | null;
  role_type: string | null;
  experience_years: number | null;
  tools: string[] | null;
  languages: string[] | null;
  specialties: string[] | null;
  last_active_at: string | null;
  available_now: boolean;
  schedule_json: any | null;
  radius_km: number | null;
  address_text: string | null;
  license_id: string | null;
  profile_completed: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  rolesLoaded: boolean;
  isAdmin: boolean;
  isCS: boolean;
  isProvider: boolean;
  isCustomer: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const fetchUserData = useCallback(async (userId: string) => {
    setRolesLoaded(false);
    const [rolesResult, profileResult] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    if (rolesResult.data) {
      setRoles(rolesResult.data.map((r) => r.role as AppRole));
    }
    if (profileResult.data) {
      setProfile(profileResult.data as Profile);
    }
    setRolesLoaded(true);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          // Apply pending provider profile on first verified sign-in
          if (_event === "SIGNED_IN") {
            const pending = localStorage.getItem("pending_provider_profile");
            if (pending) {
              try {
                const profileData = JSON.parse(pending);
                await supabase.from("profiles").upsert({
                  user_id: newSession.user.id,
                  ...profileData,
                });
              } catch {
                // ignore
              }
              localStorage.removeItem("pending_provider_profile");
            }
          }
          setTimeout(() => fetchUserData(newSession.user.id), 0);
        } else {
          setRoles([]);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchUserData(s.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setProfile(null);
    setRolesLoaded(false);
  };

  const refreshUserData = async () => {
    if (user) await fetchUserData(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, roles, loading, rolesLoaded,
        isAdmin: roles.includes("admin"),
        isCS: roles.includes("cs"),
        isProvider: roles.includes("provider"),
        isCustomer: roles.includes("customer"),
        signOut, refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
