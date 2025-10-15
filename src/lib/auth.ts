import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  name: string;
  mobile_number: string;
  is_admin: boolean;
}

export const registerUser = async (
  name: string,
  mobileNumber: string,
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    // Validate mobile number
    if (!/^\d{10}$/.test(mobileNumber)) {
      return { user: null, error: "Mobile number must be exactly 10 digits" };
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
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("mobile_number", mobileNumber)
      .single();

    if (existingUser) {
      return { user: null, error: "Mobile number already registered" };
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data, error } = await supabase
      .from("users")
      .insert({
        name,
        mobile_number: mobileNumber,
        password_hash,
        is_admin: false
      })
      .select()
      .single();

    if (error) throw error;

    return { 
      user: {
        id: data.id,
        name: data.name,
        mobile_number: data.mobile_number,
        is_admin: data.is_admin
      }, 
      error: null 
    };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const loginUser = async (
  mobileNumber: string,
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    // Get user by mobile number
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("mobile_number", mobileNumber)
      .single();

    if (error || !user) {
      return { user: null, error: "Invalid mobile number or password" };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { user: null, error: "Invalid mobile number or password" };
    }

    return { 
      user: {
        id: user.id,
        name: user.name,
        mobile_number: user.mobile_number,
        is_admin: user.is_admin
      }, 
      error: null 
    };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};