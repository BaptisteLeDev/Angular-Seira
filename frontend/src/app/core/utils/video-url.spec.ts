import { describe, it, expect } from 'vitest';
import { youtubeEmbedUrl, youtubeVideoId } from './video-url';

describe('youtubeVideoId', () => {
  it('extrait l’id depuis watch / youtu.be / embed / shorts', () => {
    expect(youtubeVideoId('https://www.youtube.com/watch?v=ep6gKuxxCyE')).toBe('ep6gKuxxCyE');
    expect(youtubeVideoId('https://youtu.be/ep6gKuxxCyE')).toBe('ep6gKuxxCyE');
    expect(youtubeVideoId('https://www.youtube.com/embed/ep6gKuxxCyE')).toBe('ep6gKuxxCyE');
    expect(youtubeVideoId('https://www.youtube.com/shorts/ep6gKuxxCyE?x=1')).toBe('ep6gKuxxCyE');
  });
  it('null si non-YouTube ou vide', () => {
    expect(youtubeVideoId('https://example.com/x.mp4')).toBeNull();
    expect(youtubeVideoId(null)).toBeNull();
  });
});

describe('youtubeEmbedUrl', () => {
  it('convertit une URL watch?v= en URL embed', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=ep6gKuxxCyE')).toBe(
      'https://www.youtube.com/embed/ep6gKuxxCyE',
    );
  });
  it('gère le format court youtu.be', () => {
    expect(youtubeEmbedUrl('https://youtu.be/ep6gKuxxCyE')).toBe(
      'https://www.youtube.com/embed/ep6gKuxxCyE',
    );
  });
  it('gère une URL embed déjà au bon format', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/embed/ep6gKuxxCyE')).toBe(
      'https://www.youtube.com/embed/ep6gKuxxCyE',
    );
  });
  it('gère les shorts', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/shorts/ep6gKuxxCyE')).toBe(
      'https://www.youtube.com/embed/ep6gKuxxCyE',
    );
  });
  it('ignore les paramètres additionnels (t, list…)', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=ep6gKuxxCyE&t=30s')).toBe(
      'https://www.youtube.com/embed/ep6gKuxxCyE',
    );
  });
  it('retourne null pour une URL non-YouTube', () => {
    expect(youtubeEmbedUrl('https://example.com/clip.mp4')).toBeNull();
    expect(youtubeEmbedUrl('https://vimeo.com/123456')).toBeNull();
  });
  it('retourne null pour vide/null', () => {
    expect(youtubeEmbedUrl(null)).toBeNull();
    expect(youtubeEmbedUrl(undefined)).toBeNull();
    expect(youtubeEmbedUrl('')).toBeNull();
  });
});
