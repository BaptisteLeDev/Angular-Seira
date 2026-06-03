import { describe, it, expect } from 'vitest';
import { isContentPayloadValid, requiredFieldByType } from './content-validation';

describe('requiredFieldByType', () => {
  it('markdown -> content', () => expect(requiredFieldByType('markdown')).toBe('content'));
  it('video/link -> sourceUrl', () => {
    expect(requiredFieldByType('video')).toBe('sourceUrl');
    expect(requiredFieldByType('link')).toBe('sourceUrl');
  });
  it('pdf/file -> filePath', () => {
    expect(requiredFieldByType('pdf')).toBe('filePath');
    expect(requiredFieldByType('file')).toBe('filePath');
  });
});

describe('isContentPayloadValid', () => {
  it('markdown valide si content rempli', () => {
    expect(isContentPayloadValid('markdown', { content: 'abc' })).toBe(true);
    expect(isContentPayloadValid('markdown', { content: '  ' })).toBe(false);
    expect(isContentPayloadValid('markdown', {})).toBe(false);
  });
  it('video valide si sourceUrl rempli', () => {
    expect(isContentPayloadValid('video', { sourceUrl: 'https://x' })).toBe(true);
    expect(isContentPayloadValid('video', { sourceUrl: null })).toBe(false);
  });
  it('pdf valide si filePath rempli', () => {
    expect(isContentPayloadValid('pdf', { filePath: '/f.pdf' })).toBe(true);
    expect(isContentPayloadValid('pdf', {})).toBe(false);
  });
});
