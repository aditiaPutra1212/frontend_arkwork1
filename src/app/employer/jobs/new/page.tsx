'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/nav';
import Footer from '@/components/Footer';

export default function NewJobPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    type: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'internship',
    remote: false,
    salaryMin: '',
    salaryMax: '',
    currency: 'IDR',
    deadline: '',
    tags: '',
    description: '',
    requirements: '',
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // demo only
      await new Promise((r) => setTimeout(r, 700));
      router.push('/employer/jobs');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="min-h-[60vh] bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="text-2xl font-semibold text-slate-900">Post a Job</h1>
          <p className="mt-1 text-sm text-slate-600">Isi detail lowongan untuk dipublikasikan.</p>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Job Title</span>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Frontend Engineer"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Company Name</span>
                <input
                  value={form.company}
                  onChange={(e) => set('company', e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="PT ArkWork Indonesia"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Location</span>
                <input
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Jakarta / Remote"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Type</span>
                <select
                  value={form.type}
                  onChange={(e) => set('type', e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Currency</span>
                <select
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option>IDR</option>
                  <option>USD</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Deadline</span>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => set('deadline', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="mt-6 inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.remote}
                  onChange={(e) => set('remote', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Remote-friendly
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Salary Min</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.salaryMin}
                  onChange={(e) => set('salaryMin', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="10000000"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Salary Max</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.salaryMax}
                  onChange={(e) => set('salaryMax', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="20000000"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Tags (comma separated)</span>
              <input
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="react, nextjs, tailwind"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Describe the role, team, and responsibilities..."
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Requirements</span>
              <textarea
                value={form.requirements}
                onChange={(e) => set('requirements', e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g., 3+ years of experience, familiar with React, etc."
              />
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => history.back()}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? 'Publishing…' : 'Publish Job'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
