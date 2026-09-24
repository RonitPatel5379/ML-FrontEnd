import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext(null);
const AUTH_TIMEOUT_MS = 12000;

async function withTimeout(promise, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function createUser(authUser, profile = null) {
  if (!authUser) return null;

  return {
    id: authUser.id,
    email: authUser.email || "",
    name:
      profile?.display_name ||
      authUser.user_metadata?.display_name ||
      authUser.email?.split("@")[0] ||
      "Cinephile",
    avatarUrl: profile?.avatar_url || null,
    preferences: profile?.preferences || {},
    joined: authUser.created_at,
  };
}

async function getProfileUser(authUser) {
  if (!authUser) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, preferences")
    .eq("id", authUser.id)
    .abortSignal(AbortSignal.timeout(4000))
    .maybeSingle();

  return createUser(authUser, profile);
}

function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const authUser = parsed.user || parsed.currentSession?.user;
          if (authUser) return createUser(authUser);
        }
      }
    }
  } catch {
    // Ignore error
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [ready, setReady] = useState(() => typeof window !== "undefined");
  const profileRequest = useRef(0);

  const applyUser = useCallback((authUser) => {
    const requestId = ++profileRequest.current;
    if (!authUser) {
      setUser(null);
      setReady(true);
      return;
    }

    setUser(createUser(authUser));
    setReady(true);
    void getProfileUser(authUser)
      .then((profileUser) => {
        if (profileRequest.current === requestId) setUser(profileUser);
      })
      .catch(() => {
        // A slow optional profile request must never block authentication.
      });
  }, []);

  useEffect(() => {
    // Immediately fetch session to ensure token freshness
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        applyUser(session?.user || null);
      })
      .catch(() => {
        setReady(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "TOKEN_REFRESHED"].includes(event)) {
        applyUser(session?.user || null);
      }
    });

    return () => {
      profileRequest.current += 1;
      listener.subscription.unsubscribe();
    };
  }, [applyUser]);

  const register = useCallback(async ({ name, email, password }) => {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email: String(email).trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: name },
        },
      }),
      "Account creation is taking too long. Please try again.",
    );
    if (error) throw error;

    // New accounts must always continue through the sign-in screen. Auto
    // confirmation can return a session, so clear it before navigating.
    if (data.session) {
      await supabase.auth.signOut({ scope: "local" });
      applyUser(null);
    }
    toast.success("Account created", {
      description: "Your account is ready. Sign in to continue.",
    });
    return data;
  }, [applyUser]);

  const login = useCallback(async ({ email, password }) => {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email: String(email).trim().toLowerCase(),
        password,
      }),
      "Sign in is taking too long. Please try again.",
    );
    if (error) throw error;
    const nextUser = createUser(data.user);
    applyUser(data.user);
    toast.success(`Welcome back, ${nextUser?.name || "Cinephile"}`);
    return nextUser;
  }, [applyUser]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    toast.message("Signed out");
  }, []);

  const updateProfile = useCallback(
    async ({ name }) => {
      if (!user) return;
      try {
        await supabase.auth.updateUser({ data: { display_name: name } });
        await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
        setUser((curr) => (curr ? { ...curr, name } : curr));
        toast.success("Profile updated");
      } catch (err) {
        console.warn("Could not update profile:", err);
      }
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, ready, isAuthenticated: !!user, login, register, logout, updateProfile }),
    [user, ready, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
