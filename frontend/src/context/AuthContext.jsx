import React, { createContext, useCallback, useEffect, useState } from "react";
import { UserService } from "../api/services";
export const AuthContext = createContext();
function restore() {
  try {
    const u = JSON.parse(sessionStorage.getItem("user"));
    return u?.token && u.expiresAt > Date.now() ? u : null;
  } catch {
    return null;
  }
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(restore),
    [ready, setReady] = useState(false);
  const clear = useCallback(() => {
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    localStorage.removeItem("aravinda_saved_addresses");
    localStorage.removeItem("aravinda_cart");
    window.dispatchEvent(new Event("auth-cleared"));
    setUser(null);
  }, []);
  const login = useCallback((data) => {
    const u = {
      ...data.user,
      token: data.token,
      expiresAt: Date.now() + data.expiresInSeconds * 1000,
    };
    sessionStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  }, []);
  const refreshUser = useCallback(async () => {
    const res = await UserService.me();
    setUser((old) => {
      if (!old) return null;
      const next = {
        ...old,
        ...res.data,
      };
      sessionStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);
  const logout = useCallback(async () => {
    try {
      await UserService.logout();
    } finally {
      clear();
    }
  }, [clear]);
  useEffect(() => {
    if (restore())
      refreshUser()
        .catch((error) => {
          if (error.response?.status === 401) clear();
        })
        .finally(() => setReady(true));
    else {
      if (sessionStorage.getItem("user")) clear();
      else {
        localStorage.removeItem("user");
        localStorage.removeItem("aravinda_saved_addresses");
      }
      setReady(true);
    }
  }, [clear, refreshUser]);
  useEffect(() => {
    window.addEventListener("auth-expired", clear);
    return () => window.removeEventListener("auth-expired", clear);
  }, [clear]);
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(clear, Math.max(0, user.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [user, clear]);
  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        logout,
        refreshUser,
        clearSession: clear,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
