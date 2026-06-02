import React from 'react';
import { render, screen } from '@testing-library/react-native';

const marker = (label: string) => () =>
  require('react').createElement(require('react-native').Text, null, label);

jest.mock('@src/ui/VideoPlayer', () => ({ VideoPlayer: marker('VIDEO') }));
jest.mock('@src/ui/PdfViewer', () => ({ PdfViewer: marker('PDF') }));
jest.mock('@src/ui/MarkdownView', () => ({ MarkdownView: marker('MD') }));
jest.mock('@src/ui/SpeakButton', () => ({ SpeakButton: marker('SPEAK') }));

import { ArticleBody } from './ArticleBody';
import type { Article } from '@src/schemas/article.schema';

function article(partial: Partial<Article>): Article {
  return {
    id: 1,
    type: 'markdown',
    title: 'T',
    ...partial,
  } as Article;
}

describe('ArticleBody (dispatch par type)', () => {
  test('video -> VideoPlayer', () => {
    render(<ArticleBody article={article({ type: 'video', sourceUrl: 'http://x', videoId: 1 })} />);
    expect(screen.getByText('VIDEO')).toBeTruthy();
  });
  test('pdf -> PdfViewer', () => {
    render(<ArticleBody article={article({ type: 'pdf', filePath: '/x.pdf' })} />);
    expect(screen.getByText('PDF')).toBeTruthy();
  });
  test('markdown -> MarkdownView', () => {
    render(<ArticleBody article={article({ type: 'markdown', content: '# Hi' })} />);
    expect(screen.getByText('MD')).toBeTruthy();
  });
  test('link -> carte "Ouvrir le lien"', () => {
    render(<ArticleBody article={article({ type: 'link', sourceUrl: 'http://x' })} />);
    expect(screen.getByText('Ouvrir le lien')).toBeTruthy();
  });
  test('file -> carte "Fichier joint"', () => {
    render(<ArticleBody article={article({ type: 'file', filePath: 'http://x/f.zip' })} />);
    expect(screen.getByText('Fichier joint')).toBeTruthy();
  });
});
