import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext({
  session: undefined,
  signUpNewUser: async () => {},
  signInUser: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
});

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);

  // Sign Up
  const signUpNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error("There was a problem signing up: ", error);
      return { success: false, error };
    }

    return { success: true, data };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Sign In
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Sign-in error occurred: ", error);
        return { success: false, error: error.message };
      }

      console.log("Sign-in success: ", data);
      return { success: true, data };
    } catch (err) {
      console.error("An error occurred: ", err);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
      });
    } catch (err) {
      console.error("Google Sign-in error: ", err);
    }
  };

  // Sign Out
  const signOut = async () => {
    const { error } = supabase.auth.signOut();
    if (error) {
      console.error("There was an error: ", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, signUpNewUser, signInUser, signOut, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
