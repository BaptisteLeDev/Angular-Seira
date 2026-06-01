import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import type { Article } from '../../../core/schemas/article.schema';
import type { Chapitre } from '../../../core/schemas/chapitre.schema';
import type { Formation } from '../../../core/schemas/formation.schema';
import { ArticleStore } from '../../../core/stores/article.store';
import { FormationStore } from '../../../core/stores/formation.store';
import { ArticleBody } from '../../../shared/article/article-body';

interface ArticleEntry {
  readonly article: Article;
  readonly chapitre: Chapitre;
  readonly index: number;
  readonly sortOrder: number;
}

@Component({
  selector: 'app-course-detail',
  imports: [RouterLink, DecimalPipe, ArticleBody],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetail {
  private readonly router = inject(Router);
  private readonly formationStore = inject(FormationStore);
  private readonly articleStore = inject(ArticleStore);

  readonly formationId = input.required<string>();
  readonly articleId = input<string>();

  protected readonly formation = computed<Formation | null>(() => {
    const id = Number(this.formationId());
    if (isNaN(id)) return null;
    return this.formationStore.byId(id)();
  });

  protected readonly chapitres = computed<readonly Chapitre[]>(() => {
    const current = this.formation();
    if (!current) return [];
    return this.formationStore.chapitresOf(current.id)();
  });

  protected readonly isLoading = computed(() => {
    if (this.formationStore.status() === 'loading') return true;
    const current = this.formation();
    if (!current) return this.formationStore.items().length === 0;
    return this.formationStore.chapitresStatusOf(current.id)() === 'loading';
  });

  protected readonly errorMessage = computed(() => {
    const storeError = this.formationStore.error();
    if (storeError) return storeError;
    const current = this.formation();
    if (!current && this.formationStore.items().length > 0) {
      return 'Formation introuvable.';
    }
    return null;
  });

  protected readonly articleEntries = computed<readonly ArticleEntry[]>(() => {
    let globalIndex = 0;
    return this.chapitres().flatMap((chapitre) =>
      this.articleStore
        .byChapitre(chapitre.id)()
        .map((article) => ({
          article,
          chapitre,
          index: ++globalIndex,
          sortOrder: article.sortOrder ?? 0,
        })),
    );
  });

  protected readonly totalArticles = computed(() => this.articleEntries().length);

  protected readonly totalDurationMinutes = computed(() =>
    Math.round(
      this.articleEntries().reduce(
        (total, entry) => total + (entry.article.durationSeconds ?? 0),
        0,
      ) / 60,
    ),
  );

  protected readonly activeArticle = computed<ArticleEntry | null>(() => {
    const targetId = Number(this.articleId());
    if (isNaN(targetId)) return null;
    return this.articleEntries().find((entry) => entry.article.id === targetId) ?? null;
  });

  protected readonly progressPercent = computed(() => {
    const total = this.totalArticles();
    const active = this.activeArticle();
    if (total === 0 || !active) return 0;
    return Math.round((active.index / total) * 100);
  });

  protected readonly previousEntry = computed<ArticleEntry | null>(() => {
    const active = this.activeArticle();
    if (!active) return null;
    return this.articleEntries().find((entry) => entry.index === active.index - 1) ?? null;
  });

  protected readonly nextEntry = computed<ArticleEntry | null>(() => {
    const active = this.activeArticle();
    if (!active) return null;
    return this.articleEntries().find((entry) => entry.index === active.index + 1) ?? null;
  });

  constructor() {
    effect(() => {
      this.formationStore.load();
    });

    effect(() => {
      const current = this.formation();
      if (current) {
        this.formationStore.loadChapitres(current.id);
      }
    });

    // Charge les contenus de chaque chapitre via ses IRIs
    effect(() => {
      for (const chapitre of this.chapitres()) {
        const contentIris = chapitre.contents ?? [];
        this.articleStore.loadByChapitre(chapitre.id, contentIris);
      }
    });

    effect(() => {
      const formation = this.formation();
      const entries = this.articleEntries();
      if (!formation || entries.length === 0 || this.articleId()) {
        return;
      }
      this.router.navigate(['/formations', formation.id, entries[0].article.id], {
        replaceUrl: true,
      });
    });
  }

  protected entriesForChapitre(chapitreId: number): readonly ArticleEntry[] {
    return this.articleEntries().filter((entry) => entry.chapitre.id === chapitreId);
  }

  protected isActive(entry: ArticleEntry): boolean {
    return this.activeArticle()?.article.id === entry.article.id;
  }

  protected articleDurationMinutes(article: Article): number | null {
    if (typeof article.durationSeconds !== 'number') return null;
    return Math.max(1, Math.round(article.durationSeconds / 60));
  }

  protected contentTypeIcon(type: string): string {
    switch (type) {
      case 'video':
        return 'icon-[heroicons--play-circle]';
      case 'pdf':
        return 'icon-[heroicons--document-arrow-down]';
      case 'markdown':
        return 'icon-[heroicons--document-text]';
      case 'link':
        return 'icon-[heroicons--link]';
      case 'file':
        return 'icon-[heroicons--paper-clip]';
      default:
        return 'icon-[heroicons--document]';
    }
  }

  protected contentTypeLabel(type: string): string {
    switch (type) {
      case 'video':
        return 'Video';
      case 'pdf':
        return 'PDF';
      case 'markdown':
        return 'Article';
      case 'link':
        return 'Lien';
      case 'file':
        return 'Fichier';
      default:
        return 'Contenu';
    }
  }
}
