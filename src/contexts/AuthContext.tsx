import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch user profile and role
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          setUser({
            id: session.user.id,
            name: profile?.name || '',
            mobile_number: profile?.mobile_number || '',
            role: roleData?.role || 'user'
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch user profile and role
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .maybeSingle()
              .then(({ data: roleData }) => {
                setUser({
                  id: session.user.id,
                  name: profile?.name || '',
                  mobile_number: profile?.mobile_number || '',
                  role: roleData?.role || 'user'
                });
                setIsLoading(false);
              });
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleSetUser = (user: User | null) => {
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};