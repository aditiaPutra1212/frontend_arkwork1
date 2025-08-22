// frontend/src/lib/api.ts

/* ====================== Backend helper (admin & lainnya) ====================== */

function cleanBase(url: string | undefined): string {
  return (url || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n+|\r+/g, '')
    .replace(/\/+$/, '');
}

// Urutan prioritas: NEXT_PUBLIC_API_BASE > NEXT_PUBLIC_API_URL > localhost (dev)
export const API_BASE =
  cleanBase(process.env.NEXT_PUBLIC_API_BASE) ||
  cleanBase(process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:4000';

type ApiOpts = RequestInit & {
  /** Jika diisi, otomatis set Content-Type dan body=JSON.stringify(json), method default POST.
   *  Jika `json` ada, maka `body` manual akan diabaikan agar tidak ambigu. */
  json?: unknown;
  /** Jika respons 204 No Content, default return null */
  expectJson?: boolean; // default: true
};

/**
 * Panggil backend Express (cookie ikut terkirim).
 * Contoh:
 *   await api('/admin/signin', { json: { username, password } })
 *   await api('/admin/plans/123', { method: 'PUT', json: payload })
 *   await api('/admin/plans/123', { method: 'PUT', headers: {...}, body: JSON.stringify(payload) })
 *   const me = await api('/auth/me')
 */
export async function api<T = any>(path: string, opts: ApiOpts = {}): Promise<T> {
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_BASE belum diset');

  const { json, headers, expectJson = true, ...rest } = opts;

  const finalHeaders: HeadersInit = { ...(headers || {}) };
  let finalMethod: string | undefined = rest.method;
  let finalBody: BodyInit | null | undefined = rest.body as BodyInit | null | undefined;

  // Jika caller pakai json, kita override body & (default) method
  if (json !== undefined) {
    if (!('Content-Type' in (finalHeaders as any))) {
      finalHeaders['Content-Type'] = 'application/json';
    }
    finalBody = JSON.stringify(json);
    if (!finalMethod) finalMethod = 'POST';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    method: finalMethod ?? (finalBody != null ? 'POST' : 'GET'),
    headers: finalHeaders,
    body: finalBody ?? undefined,
    credentials: 'include', // ⬅️ wajib supaya cookie token ikut
    cache: 'no-store',
  });

  if (!res.ok) {
    let msg = `Request failed ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {
      // bukan JSON, biarkan msg default
    }
    throw new Error(msg);
  }

  if (res.status === 204 || !expectJson) return null as unknown as T;

  const text = await res.text();
  if (!text) return null as unknown as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* ================== Energy News (Google News RSS → rss2json) ================= */

export type Scope = 'id' | 'global' | 'both';

export interface FetchEnergyNewsParams {
  scope: Scope;        // 'id' | 'global' | 'both'
  limit: number;       // jumlah item
  lang: string;        // 'id' | 'en'
  country: string;     // 'ID' | 'US' | ISO-2 lain
  keywords?: string;   // "pertamina, geothermal"
}

export interface EnergyNewsItem {
  title: string;
  link: string;
  pubDate?: string;
  source?: string;
  description?: string;
  summary?: string;
  image?: string | null;
}

export interface EnergyNewsResponse {
  items: EnergyNewsItem[];
}

// Utilities
function stripHtml(input?: string): string {
  if (!input) return '';
  return input.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
function getDomain(url?: string): string {
  try {
    if (!url) return '';
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Build Google News RSS URL
function buildGoogleNewsRssUrl(params: { q: string; lang: string; country: string }) {
  const { q, lang, country } = params;
  const hl = `${lang}-${country}`;
  const ceid = `${country}:${lang}`;
  const usp = new URLSearchParams({ q, hl, gl: country, ceid });
  return `https://news.google.com/rss/search?${usp.toString()}`;
}

async function fetchRssAsJson(rssUrl: string) {
  const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(rss2jsonUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<{
    items: Array<{
      title: string;
      link: string;
      pubDate?: string;
      author?: string;
      description?: string;
      content?: string;
      enclosure?: { link?: string };
    }>;
  }>;
}

function buildQuery(baseKeywords?: string) {
  const defaults = [
    'oil', 'gas', 'energy', 'petroleum', 'geothermal', 'renewable',
    'minyak', 'energi', 'migas',
  ];
  const extra = (baseKeywords || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const all = Array.from(new Set([...defaults, ...extra]));
  return all.map(k => `"${k}"`).join(' OR ');
}

function extractImageFromHtml(html?: string): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] || null;
}

function mapItem(it: any): EnergyNewsItem {
  const desc = stripHtml(it.description || it.content || '');
  const image =
    it?.enclosure?.link && /^https?:\/\//i.test(it.enclosure.link)
      ? it.enclosure.link
      : extractImageFromHtml(it.description || it.content) || null;

  return {
    title: it.title,
    link: it.link,
    pubDate: it.pubDate,
    source: it.author || getDomain(it.link),
    description: desc,
    summary: desc,
    image,
  };
}

/**
 * Ambil berita energi dari Google News (via rss2json).
 * NOTE: Public API ini ada rate limit. Untuk produksi, pertimbangkan proxy/route server sendiri.
 */
export async function fetchEnergyNews(
  params: FetchEnergyNewsParams
): Promise<EnergyNewsResponse> {
  const { scope, limit, lang, country, keywords } = params;
  const q = buildQuery(keywords);

  const urls: string[] = [];
  if (scope === 'id' || scope === 'both') {
    urls.push(buildGoogleNewsRssUrl({ q, lang: 'id', country: 'ID' }));
  }
  if (scope === 'global' || scope === 'both') {
    urls.push(buildGoogleNewsRssUrl({ q, lang: 'en', country: 'US' }));
  }
  // Jika scope spesifik & user menentukan lang/country lain, pakai itu saja
  if (
    scope !== 'both' &&
    !((scope === 'id' && lang === 'id' && country === 'ID') ||
      (scope === 'global' && lang === 'en' && country === 'US'))
  ) {
    urls.length = 0;
    urls.push(buildGoogleNewsRssUrl({ q, lang, country }));
  }

  const results = await Promise.allSettled(urls.map(u => fetchRssAsJson(u)));

  const items: EnergyNewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const it of r.value.items ?? []) {
        items.push(mapItem(it));
      }
    }
  }

  // de-dupe by link/title
  const seen = new Set<string>();
  const deduped = items.filter(it => {
    const key = it.link || it.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => {
    const ta = a.pubDate ? +new Date(a.pubDate) : 0;
    const tb = b.pubDate ? +new Date(b.pubDate) : 0;
    return tb - ta;
  });

  return { items: deduped.slice(0, Math.max(1, limit)) };
}
