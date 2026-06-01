import { youtubeEmbedUrl } from './video-url';

describe('youtubeEmbedUrl', () => {
  it('convertit watch?v= en embed', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=ep6gKuxxCyE')).toBe(
      'https://www.youtube.com/embed/ep6gKuxxCyE',
    );
  });
  it('gère youtu.be', () => {
    expect(youtubeEmbedUrl('https://youtu.be/ep6gKuxxCyE')).toBe(
      'https://www.youtube.com/embed/ep6gKuxxCyE',
    );
  });
  it('gère embed déjà au bon format', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/embed/ep6gKuxxCyE')).toBe(
      'https://www.youtube.com/embed/ep6gKuxxCyE',
    );
  });
  it('gère les shorts', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/shorts/ep6gKuxxCyE')).toBe(
      'https://www.youtube.com/embed/ep6gKuxxCyE',
    );
  });
  it('ignore les paramètres additionnels', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=ep6gKuxxCyE&t=30s')).toBe(
      'https://www.youtube.com/embed/ep6gKuxxCyE',
    );
  });
  it('null pour non-YouTube', () => {
    expect(youtubeEmbedUrl('https://example.com/clip.mp4')).toBeNull();
  });
  it('null pour vide', () => {
    expect(youtubeEmbedUrl(null)).toBeNull();
    expect(youtubeEmbedUrl(undefined)).toBeNull();
    expect(youtubeEmbedUrl('')).toBeNull();
  });
});
