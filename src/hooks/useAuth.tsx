// hooks/useAuth.ts
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Role = 'admin' | 'user';

export type UserLite = {
  id: string;
  email?: string;
  name?: string | null;
  photoUrl?: string | null;
  cvUrl?: string | null;
  role?: Role;
  employer?: { id: string; slug?: string; displayName?: string | null } | null;
};

export type AuthCtx = {
  user: UserLite | null;
  loading: boolean;
  signin: (identifier: string, password: string) => Promise<UserLite>;
  signup: (name: string, email: string, password: string) => Promise<UserLite>;
  signout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserLite | null>(null);
  const [loading, setLoading] = useState(true);

  // Cukup panggil /auth/me (server akan balikan user/admin sesuai token)
  useEffect(() => {
    (async () => {
      try {
        const me = await api<UserLite>('/auth/me');
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signin: AuthCtx['signin'] = async (identifier, password) => {
    // ada '@' => login user
    if (identifier.includes('@')) {
      const u = await api<UserLite>('/auth/signin', {
        json: { email: identifier, password },
      });
      const mapped = { ...u, role: 'user' as const };
      setUser(mapped);
      return mapped;
    }

    // tidak ada '@' => login admin (payload { username, password })
    const a = await api<UserLite>('/admin/signin', {
      json: { username: identifier, password },
    });
    const mapped: UserLite = { ...(a as any), role: 'admin' };
    setUser(mapped);
    return mapped;
  };

  const signup: AuthCtx['signup'] = async (name, email, password) => {
    const u = await api<UserLite>('/auth/signup', {
      json: { name, email, password },
    });
    const mapped = { ...u, role: 'user' as const };
    setUser(mapped);
    return mapped;
  };

  const signout = async () => {
    try { await api('/auth/signout', { method: 'POST' }); } catch {}
    try { await api('/admin/signout', { method: 'POST' }); } catch {}
    setUser(null);
  };

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, signin, signup, signout }),
    [user, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
