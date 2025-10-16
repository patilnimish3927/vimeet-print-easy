import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  name: string;
  mobile_number: string;
  role: string;
}

export const registerUser = async (
  name: string,
  mobileNumber: string,
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    // Validate mobile number (Indian format)
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return { user: null, error: "Mobile number must be a valid 10-digit Indian number starting with 6-9" };
    }

    // Validate password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      return { 
        user: null, 
        error: "Password must be at least 6 characters with at least one letter, one number, and one special character" 
      };
    }

    // Check if mobile number already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("mobile_number", mobileNumber)
      .maybeSingle();

    if (existingProfile) {
      return { user: null, error: "Mobile number already registered" };
    }

    // Create user with Supabase Auth using mobile as email
    const email = `${mobileNumber}@vimeet.app`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          mobile_number: mobileNumber
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Registration failed");

    // Fetch the created profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    // Get user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    return { 
      user: {
        id: authData.user.id,
        name: profile?.name || name,
        mobile_number: profile?.mobile_number || mobileNumber,
        role: roleData?.role || 'user'
      }, 
      error: null 
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { user: null, error: "Registration failed. Please try again." };
  }
};

export const loginUser = async (
  mobileNumber: string,
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    // Sign in with Supabase Auth using mobile as email
    const email = `${mobileNumber}@vimeet.app`;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return { user: null, error: "Invalid mobile number or password" };
    }
    if (!authData.user) {
      return { user: null, error: "Invalid mobile number or password" };
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    // Get user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    return { 
      user: {
        id: authData.user.id,
        name: profile?.name || '',
        mobile_number: profile?.mobile_number || '',
        role: roleData?.role || 'user'
      }, 
      error: null 
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return { user: null, error: "Login failed. Please try again." };
  }
};