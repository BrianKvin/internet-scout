"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { meRequest, signInRequest, signUpRequest, type AuthUser } from "@/services/auth.service";
import { clearAuthToken, getAuthToken, setAuthToken, onUnauthorized } from "@/services/api";

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "startscout_auth_user";

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

function persistUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      const token = getAuthToken();
      if (!token) {
        setUser(loadStoredUser());
        setLoaded(true);
        return;
      }

      try {
        const freshUser = await meRequest();
        persistUser(freshUser);
        setUser(freshUser);
      } catch {
        clearAuthToken();
        persistUser(null);
        setUser(null);
      } finally {
        setLoaded(true);
      }
    };

    void bootstrap();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await signInRequest(email, password);
      setAuthToken(result.token);
      persistUser(result.user);
      setUser(result.user);
      router.push("/dashboard");
    },
    [router]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await signUpRequest(name, email, password);
      setAuthToken(result.token);
      persistUser(result.user);
      setUser(result.user);
      router.push("/dashboard");
    },
    [router]
  );

  const signOut = useCallback(() => {
    clearAuthToken();
    persistUser(null);
    setUser(null);
    router.push("/");
  }, [router]);

  // Listen for 401 events from the API client — auto-logout on expired tokens
  useEffect(() => {
    return onUnauthorized(() => {
      clearAuthToken();
      persistUser(null);
      setUser(null);
      router.push("/sign-in");
    });
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
