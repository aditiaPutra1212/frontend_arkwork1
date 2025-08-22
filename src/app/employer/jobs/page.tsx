'use client';

import Link from 'next/link';
import Nav from '@/components/nav';
import Footer from '@/components/Footer';

const jobs = [
  { id: '1', title: 'Frontend Engineer', location: 'Jakarta / Remote', type: 'Full-time', applicants: 18, createdAt: '2025-08-01' },
  { id: '2', title: 'Backend Engineer', location: 'Bandung', type: 'Contract', applicants: 12, createdAt: '2025-07-21' },
  { id: '3', title: 'Product Designer', location: 'Remote', type: 'Part-time', applicants: 17, createdAt: '2025-07-15' },
];

export default function JobsListPage() {
  return (
    <>
      <Nav />
      <main className="min-h-[60vh] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
              <p className="text-sm text-slate-600">Kelola lowongan yang sedang tayang.</p>
            </div>
            <Link href="/employer/jobs/new" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Post a Job
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Applicants</th>
                  <th className="px-4 py-3">Posted</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{j.title}</td>
                    <td className="px-4 py-3 text-slate-700">{j.location}</td>
                    <td className="px-4 py-3 text-slate-700">{j.type}</td>
                    <td className="px-4 py-3 text-slate-700">{j.applicants}</td>
                    <td className="px-4 py-3 text-slate-700">{j.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50">Edit</button>
                        <button className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 hover:bg-rose-100">Close</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
