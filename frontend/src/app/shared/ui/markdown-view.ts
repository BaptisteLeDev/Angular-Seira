import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { marked } from 'marked';

@Component({
  selector: 'app-markdown-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<article class="markdown-body" [innerHTML]="html()"></article>`,
  styles: [
    `
      :host {
        display: block;
      }
      .markdown-body {
        color: var(--color-on-surface);
        font-size: 1rem;
        line-height: 1.6;
      }
      .markdown-body h1 {
        font-family: var(--font-headline);
        font-size: 1.625rem;
        font-weight: 800;
        letter-spacing: -0.01em;
        margin: 0.5rem 0 0.75rem;
        color: var(--color-on-surface);
      }
      .markdown-body h2 {
        font-family: var(--font-headline);
        font-size: 1.375rem;
        font-weight: 700;
        margin: 1.25rem 0 0.625rem;
        color: var(--color-on-surface);
      }
      .markdown-body h3 {
        font-family: var(--font-headline);
        font-size: 1.125rem;
        font-weight: 700;
        margin: 1rem 0 0.5rem;
        color: var(--color-on-surface);
      }
      .markdown-body h4 {
        font-weight: 700;
        margin: 0.75rem 0 0.375rem;
        color: var(--color-on-surface);
      }
      .markdown-body h5,
      .markdown-body h6 {
        font-weight: 700;
        font-size: 0.875rem;
        margin: 0.5rem 0 0.25rem;
        color: var(--color-on-surface-variant);
      }
      .markdown-body p {
        margin: 0 0 0.75rem;
      }
      .markdown-body strong {
        font-weight: 700;
      }
      .markdown-body em {
        font-style: italic;
      }
      .markdown-body a {
        color: var(--color-primary);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .markdown-body ul,
      .markdown-body ol {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      .markdown-body ul {
        list-style: disc;
      }
      .markdown-body ol {
        list-style: decimal;
      }
      .markdown-body li {
        margin: 0.125rem 0;
      }
      .markdown-body blockquote {
        background: color-mix(in srgb, var(--color-primary) 8%, transparent);
        border-left: 3px solid var(--color-primary);
        padding: 0.625rem 0.875rem;
        margin: 0.625rem 0;
        border-radius: 0.5rem;
      }
      .markdown-body code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.875rem;
        background: color-mix(in srgb, var(--color-on-surface) 6%, transparent);
        color: var(--color-primary);
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
      }
      .markdown-body pre {
        background: color-mix(in srgb, var(--color-on-surface) 6%, transparent);
        color: var(--color-on-surface);
        padding: 0.75rem;
        border-radius: 0.625rem;
        margin: 0.625rem 0;
        border: 1px solid var(--color-outline-variant);
        overflow-x: auto;
        font-size: 0.8125rem;
      }
      .markdown-body pre code {
        background: transparent;
        color: inherit;
        padding: 0;
        border-radius: 0;
        font-size: inherit;
      }
      .markdown-body hr {
        border: 0;
        border-top: 1px solid var(--color-outline-variant);
        margin: 1rem 0;
      }
      .markdown-body table {
        border: 1px solid var(--color-outline-variant);
        border-radius: 0.5rem;
        border-collapse: separate;
        border-spacing: 0;
        margin: 0.625rem 0;
        overflow: hidden;
        width: 100%;
      }
      .markdown-body th {
        background: color-mix(in srgb, var(--color-on-surface) 4%, transparent);
        text-align: left;
        font-weight: 700;
      }
      .markdown-body th,
      .markdown-body td {
        padding: 0.5rem;
        border-bottom: 1px solid var(--color-outline-variant);
      }
      .markdown-body img {
        border-radius: 0.5rem;
        max-width: 100%;
        height: auto;
        margin: 0.5rem 0;
      }
    `,
  ],
})
export class MarkdownView {
  readonly source = input.required<string>();

  /**
   * HTML du markdown rendu, lié à `[innerHTML]` qui applique la sanitisation
   * intégrée d'Angular (suppression des `<script>`, handlers `on*`, `javascript:`…).
   * On ne fait PLUS de `bypassSecurityTrustHtml` (faille XSS, #47) : le contenu
   * provient d'auteurs et doit être nettoyé.
   */
  protected readonly html = computed(
    () => marked.parse(this.source(), { async: false }) as string,
  );
}
