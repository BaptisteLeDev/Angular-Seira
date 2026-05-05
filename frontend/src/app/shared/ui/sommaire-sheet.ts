import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { Article } from '../../core/schemas/article.schema';
import type { Chapitre } from '../../core/schemas/chapitre.schema';
import {
  articleDurationMin,
  contentTypeIcon,
  contentTypeLabel,
} from '../utils/article-meta';

export interface SommaireEntry {
  article: Article;
  chapitre: Chapitre;
  index: number;
}

@Component({
  selector: 'app-sommaire-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div
        class="fixed inset-0 z-[55] flex items-end justify-center sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-label="Sommaire"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/55 backdrop-blur-sm"
          aria-label="Fermer le sommaire"
          (click)="closed.emit()"
        ></button>

        <div
          class="relative max-h-[80vh] w-full max-w-2xl overflow-hidden squircle-2xl bg-surface-container ghost-border shadow-[var(--shadow-elev-2)] sm:max-h-[70vh]"
        >
          <header class="flex items-center justify-between px-5 pb-3 pt-4">
            <div class="flex items-center gap-2 text-on-surface-variant">
              <span
                class="icon-[heroicons--list-bullet] text-sm"
                aria-hidden="true"
              ></span>
              <span
                class="font-headline text-xs font-bold uppercase tracking-widest"
              >
                Sommaire
              </span>
            </div>
            <button
              type="button"
              class="flex size-8 items-center justify-center squircle-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Fermer"
              (click)="closed.emit()"
            >
              <span class="icon-[heroicons--x-mark] text-base" aria-hidden="true"></span>
            </button>
          </header>

          <div class="max-h-[calc(80vh-4rem)] overflow-y-auto px-4 pb-6">
            <div class="flex flex-col gap-4">
              @for (chap of chapitres(); track chap.id) {
                <section>
                  <header class="mb-2 flex items-center gap-2">
                    <span
                      class="font-headline text-xs font-bold uppercase tracking-widest text-primary"
                    >
                      {{ chap.sortOrder }}.
                    </span>
                    <h3
                      class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface"
                    >
                      {{ chap.title }}
                    </h3>
                  </header>
                  @let chapEntries = entriesByChapter().get(chap.id) ?? [];
                  @if (chapEntries.length === 0) {
                    <p class="pl-4 text-xs italic text-on-surface-variant">
                      Contenus à venir.
                    </p>
                  } @else {
                    <ul role="list" class="flex flex-col gap-1">
                      @for (entry of chapEntries; track entry.article.id) {
                        <li>
                          <button
                            type="button"
                            class="flex w-full items-start gap-3 squircle-lg border-l-2 border-transparent px-3 py-2 text-left transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            [class.bg-surface-container-high]="
                              entry.article.id === activeArticleId()
                            "
                            [class.border-primary]="
                              entry.article.id === activeArticleId()
                            "
                            [attr.aria-current]="
                              entry.article.id === activeArticleId() ? 'true' : null
                            "
                            (click)="selected.emit(entry)"
                          >
                            <span
                              class="flex size-6 items-center justify-center squircle-md"
                              [class.bg-primary]="
                                entry.article.id === activeArticleId()
                              "
                              [class.text-on-primary]="
                                entry.article.id === activeArticleId()
                              "
                              [class.bg-surface-container-highest]="
                                entry.article.id !== activeArticleId()
                              "
                              [class.text-on-surface-variant]="
                                entry.article.id !== activeArticleId()
                              "
                            >
                              <span
                                class="text-xs"
                                [class]="iconFor(entry.article.type)"
                                aria-hidden="true"
                              ></span>
                            </span>
                            <span class="flex-1">
                              <span
                                class="block text-sm text-on-surface"
                                [class.font-bold]="
                                  entry.article.id === activeArticleId()
                                "
                                [class.font-medium]="
                                  entry.article.id !== activeArticleId()
                                "
                              >
                                {{ entry.article.title }}
                              </span>
                              <span
                                class="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-on-surface-variant"
                              >
                                <span>{{ labelFor(entry.article.type) }}</span>
                                @let mins = durationFor(entry.article);
                                @if (mins) {
                                  <span class="flex items-center gap-0.5">
                                    <span
                                      class="icon-[heroicons--clock] text-[10px]"
                                      aria-hidden="true"
                                    ></span>
                                    {{ mins }} min
                                  </span>
                                }
                              </span>
                            </span>
                          </button>
                        </li>
                      }
                    </ul>
                  }
                </section>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class SommaireSheet {
  readonly visible = input<boolean>(false);
  readonly chapitres = input.required<readonly Chapitre[]>();
  readonly entries = input.required<readonly SommaireEntry[]>();
  readonly activeArticleId = input<number | null>(null);

  readonly closed = output<void>();
  readonly selected = output<SommaireEntry>();

  protected readonly entriesByChapter = computed(() => {
    const map = new Map<number, SommaireEntry[]>();
    for (const e of this.entries()) {
      const list = map.get(e.chapitre.id) ?? [];
      list.push(e);
      map.set(e.chapitre.id, list);
    }
    return map;
  });

  protected iconFor(t: Article['type']): string {
    return contentTypeIcon(t);
  }

  protected labelFor(t: Article['type']): string {
    return contentTypeLabel(t);
  }

  protected durationFor(a: Article): number | null {
    return articleDurationMin(a);
  }
}
