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
    // Validate mobile number
    if (!mobileNumber || mobileNumber.length < 10) {
      return { user: null, error: "Invalid mobile number" };
    }

    // Validate password
    if (!password || password.length < 6) {
      return { user: null, error: "Password must be at least 6 characters" };
    }

    // Use mobile number as email format for Supabase auth
    const email = `${mobileNumber}@printapp.local`;

    // Sign up with Supabase auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          mobile_number: mobileNumber,
        },
      },
    });

    if (signUpError) {
      return { user: null, error: signUpError.message };
    }

    if (!data.user) {
      return { user: null, error: "Registration failed" };
    }

    // Fetch user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        name,
        mobile_number: mobileNumber,
        role: roleData?.role || 'user',
      },
      error: null,
    };
  } catch (err) {
    return { user: null, error: "An unexpected error occurred during registration" };
  }
};

export const loginUser = async (
  mobileNumber: string,
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    // Use mobile number as email format
    const email = `${mobileNumber}@printapp.local`;

    // Sign in with Supabase auth
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { user: null, error: "Invalid credentials" };
    }

    if (!data.user) {
      return { user: null, error: "Login failed" };
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    // Fetch user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        name: profile?.name || '',
        mobile_number: profile?.mobile_number || '',
        role: roleData?.role || 'user',
      },
      error: null,
    };
  } catch (err) {
    return { user: null, error: "An unexpected error occurred during login" };
  }
};