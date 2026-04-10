"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => void;
  signUp: (name: string, email: string, password: string) => void;
  signOut: () => void;
}

interface AuthUser {
  name: string;
  email: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "startscout_auth";

function loadStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUser(loadStoredUser());
    setLoaded(true);
  }, []);

  const signIn = useCallback(
    (email: string, _password: string) => {
      const authUser: AuthUser = {
        name: email.split("@")[0] ?? "User",
        email,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      router.push("/dashboard");
    },
    [router]
  );

  const signUp = useCallback(
    (name: string, email: string, _password: string) => {
      const authUser: AuthUser = { name, email };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      router.push("/dashboard");
    },
    [router]
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    router.push("/");
  }, [router]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: user !== null, user, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
