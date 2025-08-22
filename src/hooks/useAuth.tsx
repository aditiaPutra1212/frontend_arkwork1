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

export type SignupCompanyPayload = {
  companyName: string;
  email: string;
  password: string;
  website?: string;
};

export type AuthCtx = {
  user: UserLite | null;
  loading: boolean;

  signin: (identifier: string, password: string) => Promise<UserLite>;
  signup: (name: string, email: string, password: string) => Promise<UserLite>;
  signout: () => Promise<void>;

  signupCompany?: (payload: SignupCompanyPayload) => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserLite | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session
  useEffect(() => {
    (async () => {
      try {
        const me: any = await api('/auth/me');
        setUser({ ...me, role: 'user' });
      } catch {
        try {
          const adm: any = await api('/admin/me');
          setUser({
            id: adm?.id || `admin:${adm?.username || 'unknown'}`,
            email: `${adm?.username || 'admin'}@local`,
            name: adm?.username || 'Admin',
            role: 'admin',
          });
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signin: AuthCtx['signin'] = async (identifier, password) => {
    const idTrim = identifier.trim();

    // 1) Jika ada '@' → coba user dulu
    if (idTrim.includes('@')) {
      try {
        const u: any = await api('/auth/signin', {
          json: { email: idTrim, password },
        });
        const mapped: UserLite = { ...u, role: 'user' };
        setUser(mapped);
        return mapped;
      } catch (e1: any) {
        // 2) Fallback admin (percobaan 1: kirim apa adanya utk backend yg dukung usernameOrEmail)
        try {
          const a1: any = await api('/admin/signin', {
            json: { usernameOrEmail: idTrim, password },
          });
          const mapped: UserLite = {
            id: a1?.admin?.id || `admin:${idTrim}`,
            email: idTrim,
            name: a1?.admin?.username || 'Admin',
            role: 'admin',
          };
          setUser(mapped);
          return mapped;
        } catch (e2: any) {
          // 3) Fallback admin (percobaan 2: pakai bagian sebelum '@' sebagai username murni)
          const usernameOnly = idTrim.split('@')[0];
          const a2: any = await api('/admin/signin', {
            json: { username: usernameOnly, password },
          });
          const mapped: UserLite = {
            id: a2?.admin?.id || `admin:${usernameOnly}`,
            email: idTrim,
            name: a2?.admin?.username || usernameOnly || 'Admin',
            role: 'admin',
          };
          setUser(mapped);
          return mapped;
        }
      }
    }

    // Tidak ada '@' → anggap username admin
    const a: any = await api('/admin/signin', {
      json: { username: idTrim, password },
    });
    const mapped: UserLite = {
      id: a?.admin?.id || `admin:${idTrim}`,
      email: `${idTrim}@local`,
      name: a?.admin?.username || 'Admin',
      role: 'admin',
    };
    setUser(mapped);
    return mapped;
  };

  const signup: AuthCtx['signup'] = async (name, email, password) => {
    const u: any = await api('/auth/signup', {
      json: { name, email, password },
    });
    const mapped: UserLite = { ...u, role: 'user' };
    setUser(mapped);
    return mapped;
  };

  const signupCompany: AuthCtx['signupCompany'] = async (payload) => {
    await api('/companies/signup', { json: payload });
  };

  const signout = async () => {
    try { await api('/auth/signout', { method: 'POST' }); } catch {}
    try { await api('/admin/signout', { method: 'POST' }); } catch {}
    setUser(null);
  };

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      signin,
      signup,
      signout,
      signupCompany,
    }),
    [user, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
