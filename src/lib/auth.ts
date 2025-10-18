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
      // Check if user already exists
      if (signUpError.message.includes("already registered") || 
          signUpError.message.includes("Database error saving new user")) {
        return { user: null, error: "This mobile number is already registered. Please login instead." };
      }
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
    // Validate mobile number
    if (!mobileNumber || mobileNumber.length < 10) {
      return { user: null, error: "Please enter a valid 10-digit mobile number" };
    }

    // Validate password
    if (!password || password.length < 6) {
      return { user: null, error: "Password must be at least 6 characters" };
    }

    // Use mobile number as email format
    const email = `${mobileNumber}@printapp.local`;

    // Sign in with Supabase auth
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Provide user-friendly error messages
      if (signInError.message.includes("Invalid login credentials")) {
        return { user: null, error: "Invalid mobile number or password" };
      }
      if (signInError.message.includes("Email not confirmed")) {
        return { user: null, error: "Please confirm your email before logging in" };
      }
      return { user: null, error: "Login failed. Please try again." };
    }

    if (!data.user) {
      return { user: null, error: "Login failed. Please try again." };
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Fetch user role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (roleError) {
      console.error("Error fetching role:", roleError);
    }

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
    console.error("Login error:", err);
    return { user: null, error: "An unexpected error occurred. Please try again." };
  }
};