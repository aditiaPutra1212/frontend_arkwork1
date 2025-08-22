'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

function fmt(d: string | Date | null | undefined) {
  if (!d) return '-';
  const dd = typeof d === 'string' ? new Date(d) : d;
  return dd.toLocaleString();
}

export default function UsersMgmtPage() {
  const { data, error, isLoading, mutate } = useSWR<{ sessions: any[] }>(
    '/auth/sessions',
    fetcher,
    { refreshInterval: 10_000 }
  );

  // heartbeat: per 30 detik
  useEffect(() => {
    const id = setInterval(() => {
      fetch('/auth/sessions/heartbeat', { method: 'POST', credentials: 'include' }).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const [busy, setBusy] = useState<string | null>(null);

  async function terminate(sid: string) {
    setBusy(sid);
    try {
      const r = await fetch(`/auth/sessions/${sid}/terminate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as any));
        throw new Error(j?.message || 'Failed to terminate session');
      }
      mutate(); // refresh list
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const rows = useMemo(() => data?.sessions ?? [], [data]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">User Sessions</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Pantau siapa yang sedang login, kapan terakhir aktif, dan putuskan sesi bila diperlukan.
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="mt-6 text-sm text-neutral-500">Memuat sesi...</div>
      )}
      {error && (
        <div className="mt-6 text-sm text-red-600">
          Gagal memuat sesi. Pastikan kamu login sebagai admin.
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-neutral-50 text-neutral-700">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">User Agent</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Last Seen</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-neutral-500" colSpan={8}>
                    Tidak ada sesi.
                  </td>
                </tr>
              )}
              {rows.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {s.user?.photoUrl ? (
                        <img
                          src={s.user.photoUrl}
                          alt={s.user?.name || s.user?.email}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-neutral-200" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900">
                          {s.user?.name || '—'}
                        </span>
                        <span className="text-xs text-neutral-500">UID: {s.user?.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{s.user?.email}</td>
                  <td className="px-3 py-2">{s.ip || '—'}</td>
                  <td className="px-3 py-2 max-w-[280px] truncate" title={s.userAgent || ''}>
                    {s.userAgent || '—'}
                  </td>
                  <td className="px-3 py-2">{fmt(s.createdAt)}</td>
                  <td className="px-3 py-2">{fmt(s.lastSeenAt)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        'rounded-md px-2 py-0.5 text-xs ' +
                        (s.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.status === 'revoked'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-neutral-50 text-neutral-700 border border-neutral-200')
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => terminate(s.id)}
                      disabled={busy === s.id || s.status !== 'active'}
                      className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy === s.id ? '...' : 'Terminate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 text-xs text-neutral-500">
            Auto-refresh setiap 10 detik. Browser mengirim heartbeat tiap 30 detik.
          </div>
        </div>
      )}
    </div>
  );
}
