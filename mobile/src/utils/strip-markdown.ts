// Convertit du markdown en texte brut lisible par TTS.
// Garde le contenu, retire la syntaxe (titres, emphase, code, listes, liens).
export function stripMarkdown(input: string): string {
  let s = input;

  // Code blocks ```...```
  s = s.replace(/```[\s\S]*?```/g, ' ');
  // Inline code `...`
  s = s.replace(/`([^`]+)`/g, '$1');
  // Images ![alt](url) → alt
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  // Links [text](url) → text
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Headings (# ...)
  s = s.replace(/^#{1,6}\s+/gm, '');
  // Blockquotes
  s = s.replace(/^>\s?/gm, '');
  // Bullets / ordered list markers
  s = s.replace(/^\s*[-*+]\s+/gm, '');
  s = s.replace(/^\s*\d+\.\s+/gm, '');
  // Bold/italic markers
  s = s.replace(/(\*\*|__)(.*?)\1/g, '$2');
  s = s.replace(/(\*|_)(.*?)\1/g, '$2');
  // Strikethrough
  s = s.replace(/~~(.*?)~~/g, '$1');
  // Horizontal rules
  s = s.replace(/^\s*([-*_])\1{2,}\s*$/gm, '');
  // HTML tags
  s = s.replace(/<[^>]+>/g, '');
  // Collapse whitespace
  s = s.replace(/\n{2,}/g, '. ');
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}
