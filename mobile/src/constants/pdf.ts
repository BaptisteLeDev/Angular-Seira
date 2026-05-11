import { ENV } from './env';

// Toggle pour remplacer tous les PDFs par le PDF dev.
// Mets à false pour utiliser les vraies URLs de formation.
export const USE_DEV_PDF = true;

// URL publique d'un PDF de test (chargeable par Mozilla pdf.js viewer).
// On utilise une URL plutôt qu'un asset local : WebView + pdf.js ne peut pas
// charger les `file://` (CORS). Pour changer le PDF dev, remplace cette URL.
const DEV_PDF_URL =
  'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

export async function resolvePdfUri(
  url: string | null | undefined,
): Promise<string | null> {
  if (ENV.isDev && USE_DEV_PDF) return DEV_PDF_URL;
  if (!url) return null;
  if (/^(https?:|file:|content:|blob:|data:|bundle-assets:)/.test(url)) return url;
  const origin = ENV.apiUrl.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
