const PROXY_PORT = 8855;

export function getProxiedImageUrl(originalUrl: string) {
  if (typeof window === 'undefined') return originalUrl;
  return `http://localhost:${PROXY_PORT}/api/proxy?url=${encodeURIComponent(originalUrl)}`;
}