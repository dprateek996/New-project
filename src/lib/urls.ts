const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'ref_src',
  'fbclid',
  'gclid'
]);

export type SourceType = 'article' | 'x';

export function normalizeUrls(rawUrls: string[]) {
  const cleaned = rawUrls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => canonicalizeUrl(url))
    .filter((url): url is string => Boolean(url));

  const deduped = Array.from(new Set(cleaned));
  return deduped;
}

export function canonicalizeUrl(input: string) {
  try {
    const url = new URL(input);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (isPrivateHost(url.hostname)) return null;

    TRACKING_PARAMS.forEach((param) => url.searchParams.delete(param));
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function detectSourceType(url: string): SourceType {
  const hostname = new URL(url).hostname.replace('www.', '');
  if (hostname === 'x.com' || hostname === 'twitter.com') return 'x';
  return 'article';
}

function isPrivateHost(hostname: string) {
  if (hostname === 'localhost' || hostname.endsWith('.local')) return true;
  const ipMatch = hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/);
  if (!ipMatch) return false;

  const parts = hostname.split('.').map(Number);
  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}
