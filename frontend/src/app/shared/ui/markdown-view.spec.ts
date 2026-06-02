import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownView } from './markdown-view';

describe('MarkdownView (sanitisation #47)', () => {
  let fixture: ComponentFixture<MarkdownView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MarkdownView] }).compileComponents();
    fixture = TestBed.createComponent(MarkdownView);
  });

  function renderWith(source: string): string {
    fixture.componentRef.setInput('source', source);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.markdown-body') as HTMLElement;
    return el.innerHTML;
  }

  it('rend le markdown de base', () => {
    const html = renderWith('# Titre\n\n**gras**');
    expect(html).toContain('Titre');
    expect(html.toLowerCase()).toContain('<strong>');
  });

  it('supprime les balises <script>', () => {
    const html = renderWith('Bonjour <script>alert(1)</script> fin');
    expect(html.toLowerCase()).not.toContain('<script');
  });

  it('supprime les gestionnaires d’événements (onerror)', () => {
    const html = renderWith('<img src="x" onerror="alert(1)">');
    expect(html.toLowerCase()).not.toContain('onerror');
  });
});
