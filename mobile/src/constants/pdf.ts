import { ENV } from './env';

// URL publique d'un PDF de démonstration (chargeable par Mozilla pdf.js viewer),
// affichée en fallback dès qu'aucune URL n'est fournie OU que la vraie source
// échoue (géré dans PdfViewer), quel que soit l'environnement.
// On utilise une URL distante plutôt qu'un asset local : WebView + pdf.js ne peut
// pas charger les `file://` (CORS). Pour changer le PDF, remplace cette URL.
export const FALLBACK_PDF_URL =
  'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

export async function resolvePdfUri(url: string | null | undefined): Promise<string> {
  if (url) {
    if (/^(https?:|file:|content:|blob:|data:|bundle-assets:)/.test(url)) return url;
    const origin = ENV.apiUrl.replace(/\/api\/?$/, '');
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  // Pas de vraie source → PDF de démonstration.
  return FALLBACK_PDF_URL;
}
