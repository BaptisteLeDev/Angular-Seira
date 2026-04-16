import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import type { Article } from '../../../core/schemas/article.schema';
import type { Chapitre } from '../../../core/schemas/chapitre.schema';
import type { Formation } from '../../../core/schemas/formation.schema';
import { ArticleStore } from '../../../core/stores/article.store';
import { FormationStore } from '../../../core/stores/formation.store';
import { slugify } from '../../../shared/utils/slug';

interface ArticleEntry {
  readonly article: Article;
  readonly chapitre: Chapitre;
  readonly index: number;
  readonly order: number;
}

@Component({
  selector: 'app-course-detail',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetail {
  private readonly router = inject(Router);
  private readonly formationStore = inject(FormationStore);
  private readonly articleStore = inject(ArticleStore);

  readonly formationSlug = input.required<string>();
  readonly articleSlug = input<string>();

  /** Formation derivee du slug + cache du store. */
  protected readonly formation = computed<Formation | null>(() => {
    const slug = this.formationSlug();
    return this.formationStore.items().find((item) => slugify(item.title) === slug) ?? null;
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
          order: article.order,
        })),
    );
  });

  protected readonly totalArticles = computed(() => this.articleEntries().length);

  protected readonly totalDurationMinutes = computed(() =>
    Math.round(
      this.articleEntries().reduce(
        (total, entry) => total + (entry.article.duration_seconds ?? 0),
        0,
      ) / 60,
    ),
  );

  protected readonly activeArticle = computed<ArticleEntry | null>(() => {
    const targetSlug = this.articleSlug();
    if (!targetSlug) return null;
    return (
      this.articleEntries().find((entry) => slugify(entry.article.title) === targetSlug) ?? null
    );
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
    // Charge la liste des formations si pas deja en cache.
    effect(() => {
      this.formationStore.load();
    });

    // Charge les chapitres une fois la formation resolue.
    effect(() => {
      const current = this.formation();
      if (current) {
        this.formationStore.loadChapitres(current.id);
      }
    });

    // Charge les articles de chaque chapitre.
    effect(() => {
      for (const chapitre of this.chapitres()) {
        this.articleStore.loadByChapitre(chapitre.id);
      }
    });

    // Redirige vers le premier article si aucun n'est selectionne.
    effect(() => {
      const formation = this.formation();
      const entries = this.articleEntries();
      if (!formation || entries.length === 0 || this.articleSlug()) {
        return;
      }
      const firstArticleSlug = slugify(entries[0].article.title);
      this.router.navigate(['/formations', slugify(formation.title), firstArticleSlug], {
        replaceUrl: true,
      });
    });
  }

  protected formationUrlSlug(formation: Formation): string {
    return slugify(formation.title);
  }

  protected articleUrlSlug(article: Article): string {
    return slugify(article.title);
  }

  protected entriesForChapitre(chapitreId: number): readonly ArticleEntry[] {
    return this.articleEntries().filter((entry) => entry.chapitre.id === chapitreId);
  }

  protected isActive(entry: ArticleEntry): boolean {
    return this.activeArticle()?.article.id === entry.article.id;
  }

  protected formationTeacher(formation: Formation): string {
    return formation.user_id ? `Prof #${formation.user_id}` : 'Professeur';
  }

  protected articleDurationMinutes(article: Article): number | null {
    if (typeof article.duration_seconds !== 'number') return null;
    return Math.max(1, Math.round(article.duration_seconds / 60));
  }
}
