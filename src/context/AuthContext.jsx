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

function syncCookie(hasSession) {
  if (typeof document !== "undefined") {
    if (hasSession) {
      document.cookie = "cineverse_session=1; path=/; max-age=2592000; SameSite=Lax";
    } else {
      document.cookie = "cineverse_session=; path=/; max-age=0; SameSite=Lax";
    }
  }
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
          if (authUser) {
            syncCookie(true);
            return createUser(authUser);
          }
        }
      }
    }
    syncCookie(false);
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
      syncCookie(false);
      return;
    }

    setUser(createUser(authUser));
    setReady(true);
    syncCookie(true);
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

    // If session or user is returned, keep user logged in immediately
    if (data.session?.user || data.user) {
      applyUser(data.session?.user || data.user);
      syncCookie(true);
      toast.success("Account created!", {
        description: `Welcome to CineVerse, ${name || "Cinephile"}!`,
      });
      return data;
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
    syncCookie(true);
    toast.success(`Welcome back, ${nextUser?.name || "Cinephile"}`);
    return nextUser;
  }, [applyUser]);

  const loginAsDemo = useCallback(async () => {
    return await login({ email: "demo@cineverse.app", password: "Cineverse123!" });
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out warning:", e);
    }
    applyUser(null);
    syncCookie(false);
    toast.message("Signed out");
  }, [applyUser]);

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
    () => ({ user, ready, isAuthenticated: !!user, login, loginAsDemo, register, logout, updateProfile }),
    [user, ready, login, loginAsDemo, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
