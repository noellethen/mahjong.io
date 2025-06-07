// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { supabase } from "../supabaseClient";
import type {
  Session,
  User,
  AuthError,
  Provider,
} from "@supabase/supabase-js";

interface SignUpResult {
  success: boolean;
  data?: { user: User | null; session: Session | null };
  error?: AuthError;
}

interface SignInResult {
  success: boolean;
  data?: { user: User | null; session: Session | null };
  error?: string;
}

interface AuthContextType {
  session: Session | null;
  signUpNewUser: (
    email: string,
    password: string
  ) => Promise<SignUpResult>;
  signInUser: (
    email: string,
    password: string
  ) => Promise<SignInResult>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);

  // Sign Up
  const signUpNewUser = async (
    email: string,
    password: string
  ): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("Sign-up error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  };

  // Sign In
  const signInUser = async (
    email: string,
    password: string
  ): Promise<SignInResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Sign-in error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  };

  // OAuth
  const signInWithGoogle = async (): Promise<void> => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google" as Provider,
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
    }
  };

  // Sign Out
  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign-out error:", error);
    }
  };

  // Sync session
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        signUpNewUser,
        signInUser,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("UserAuth must be used within AuthContextProvider");
  return ctx;
};
