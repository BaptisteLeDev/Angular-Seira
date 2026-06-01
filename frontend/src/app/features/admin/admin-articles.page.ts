import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormationStore } from '../../core/stores/formation.store';
import { ArticleStore } from '../../core/stores/article.store';
import { ScreenShell } from '../../shared/layout/screen-shell.component';
import { LoadingView } from '../../shared/ui/loading-view';
import { ErrorCard } from '../../shared/ui/error-card';
import { EmptyState } from '../../shared/ui/empty-state';
import { Dropdown, type DropdownOption } from '../../shared/ui/dropdown';
import { ArticlePreviewModal } from '../../shared/article/article-preview-modal';
import { ToastService } from '../../shared/feedback/toast.service';
import { ConfirmDialogService } from '../../shared/feedback/confirm-dialog.service';
import {
  ChapterFormDialog,
  type ChapterFormPayload,
} from '../../shared/dialogs/chapter-form.dialog';
import {
  ArticleFormDialog,
  type ArticleFormPayload,
} from '../../shared/dialogs/article-form.dialog';
import {
  contentTypeIcon,
  contentTypeLabel,
} from '../../shared/utils/article-meta';
import type { Article } from '../../core/schemas/article.schema';
import { httpErrorMessage } from '../../core/utils/http-error';
import type { Chapitre } from '../../core/schemas/chapitre.schema';

@Component({
  selector: 'app-admin-articles',
  standalone: true,
  imports: [
    ScreenShell,
    LoadingView,
    ErrorCard,
    EmptyState,
    Dropdown,
    ArticlePreviewModal,
    ChapterFormDialog,
    ArticleFormDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-shell
      eyebrow="Administration"
      title="Articles & chapitres"
      subtitle="Sélectionnez une formation, gérez ses chapitres et ses contenus."
      [back]="true"
      backFallback="/admin"
    >
      <!-- Sélecteur de formation -->
      <div class="mb-6 flex flex-col gap-2">
        <span
          class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
        >
          Formation
        </span>
        @if (formationStore.isLoading()) {
          <app-loading-view label="Chargement des formations…" />
        } @else if (formationStore.items().length === 0) {
          <app-empty-state
            icon="icon-[heroicons--book-open]"
            title="Aucune formation"
            description="Créez d'abord une formation depuis l'écran école."
          />
        } @else {
          <app-dropdown
            [options]="formationOptions()"
            [value]="selectedFormationId()"
            placeholder="Sélectionner une formation"
            (valueChange)="onFormationChange($event)"
          />
        }
      </div>

      @if (selectedFormation(); as f) {
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-headline text-lg font-bold text-on-surface">
            Chapitres ({{ chapitres().length }})
          </h2>
          <button
            type="button"
            class="inline-flex items-center gap-2 squircle-md bg-primary px-3 py-1.5 text-xs font-bold text-on-primary hover:opacity-90"
            (click)="openChapterCreate()"
          >
            <span class="icon-[heroicons--plus] text-sm" aria-hidden="true"></span>
            Nouveau chapitre
          </button>
        </div>

        @if (chapStatus() === 'loading') {
          <app-loading-view label="Chargement des chapitres…" />
        } @else if (chapStatus() === 'error') {
          <app-error-card [message]="chapError() ?? 'Erreur'" />
        } @else if (chapitres().length === 0) {
          <app-empty-state
            icon="icon-[heroicons--book-open]"
            title="Pas encore de chapitre"
            description="Créez le premier chapitre pour cette formation."
          />
        } @else {
          <ul class="flex flex-col gap-3">
            @for (chap of chapitres(); track chap.id) {
              <li class="squircle-xl bg-surface-container p-4 ghost-border">
                <header class="mb-3 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-headline text-xs font-bold uppercase tracking-widest text-primary"
                    >
                      {{ chap.sortOrder }}.
                    </span>
                    <h3 class="font-headline text-base font-bold text-on-surface">
                      {{ chap.title }}
                    </h3>
                  </div>
                  <div class="flex gap-1">
                    <button
                      type="button"
                      class="flex size-8 items-center justify-center squircle-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                      aria-label="Modifier le chapitre"
                      (click)="openChapterEdit(chap)"
                    >
                      <span class="icon-[heroicons--pencil-square] text-sm" aria-hidden="true"></span>
                    </button>
                    <button
                      type="button"
                      class="flex size-8 items-center justify-center squircle-sm bg-error/10 text-error hover:bg-error/20"
                      aria-label="Supprimer le chapitre"
                      (click)="askChapterDelete(chap)"
                    >
                      <span class="icon-[heroicons--trash] text-sm" aria-hidden="true"></span>
                    </button>
                    <button
                      type="button"
                      class="ml-2 inline-flex items-center gap-1 squircle-sm bg-primary px-2.5 py-1 text-xs font-bold text-on-primary hover:opacity-90"
                      (click)="openArticleCreate(chap)"
                    >
                      <span class="icon-[heroicons--plus] text-sm" aria-hidden="true"></span>
                      Article
                    </button>
                  </div>
                </header>

                @let articles = articleStore.byChapitre(chap.id)();
                @if (articles.length === 0) {
                  <p class="pl-2 text-xs italic text-on-surface-variant">
                    Aucun contenu pour ce chapitre.
                  </p>
                } @else {
                  <ul class="flex flex-col gap-1">
                    @for (a of articles; track a.id) {
                      <li
                        class="flex items-center justify-between gap-2 squircle-lg bg-surface-container-high px-3 py-2"
                      >
                        <div class="flex min-w-0 items-center gap-2">
                          <span class="text-sm" [class]="iconFor(a.type)" aria-hidden="true"></span>
                          <span class="truncate text-sm text-on-surface">{{ a.title }}</span>
                          <span
                            class="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                          >
                            {{ labelFor(a.type) }}
                          </span>
                        </div>
                        <div class="flex shrink-0 gap-1">
                          <button
                            type="button"
                            class="flex size-7 items-center justify-center squircle-sm bg-surface-container text-on-surface hover:bg-surface-container-low"
                            aria-label="Prévisualiser"
                            (click)="preview.set(a)"
                          >
                            <span class="icon-[heroicons--eye] text-xs" aria-hidden="true"></span>
                          </button>
                          <button
                            type="button"
                            class="flex size-7 items-center justify-center squircle-sm bg-surface-container text-on-surface hover:bg-surface-container-low"
                            aria-label="Modifier"
                            (click)="openArticleEdit(chap, a)"
                          >
                            <span
                              class="icon-[heroicons--pencil-square] text-xs"
                              aria-hidden="true"
                            ></span>
                          </button>
                          <button
                            type="button"
                            class="flex size-7 items-center justify-center squircle-sm bg-error/10 text-error hover:bg-error/20"
                            aria-label="Supprimer"
                            (click)="askArticleDelete(chap, a)"
                          >
                            <span class="icon-[heroicons--trash] text-xs" aria-hidden="true"></span>
                          </button>
                        </div>
                      </li>
                    }
                  </ul>
                }
              </li>
            }
          </ul>
        }
      } @else if (formationStore.items().length > 0) {
        <p class="text-sm text-on-surface-variant">
          Sélectionnez une formation pour voir ses chapitres.
        </p>
      }
    </app-screen-shell>

    <app-article-preview-modal [article]="preview()" (closed)="preview.set(null)" />

    <app-chapter-form-dialog
      [open]="chapterDialogOpen()"
      [chapitre]="chapterDialogTarget()"
      [defaultSortOrder]="chapterDefaultOrder()"
      (submitted)="onChapterSubmit($event)"
      (closed)="chapterDialogOpen.set(false)"
    />

    <app-article-form-dialog
      [open]="articleDialogOpen()"
      [article]="articleDialogTarget()"
      [defaultSortOrder]="articleDefaultOrder()"
      (submitted)="onArticleSubmit($event)"
      (closed)="articleDialogOpen.set(false)"
    />
  `,
})
export class AdminArticles implements OnInit {
  protected readonly formationStore = inject(FormationStore);
  protected readonly articleStore = inject(ArticleStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  protected readonly selectedFormationId = signal<number | null>(null);
  protected readonly preview = signal<Article | null>(null);

  protected readonly chapterDialogOpen = signal(false);
  protected readonly chapterDialogTarget = signal<Chapitre | null>(null);

  protected readonly articleDialogOpen = signal(false);
  protected readonly articleDialogTarget = signal<Article | null>(null);
  private readonly articleDialogChapter = signal<Chapitre | null>(null);

  protected readonly formationOptions = computed<DropdownOption<number>[]>(() =>
    this.formationStore.items().map((f) => ({
      value: f.id,
      label: f.name,
      hint: f.description ?? undefined,
    })),
  );

  protected readonly selectedFormation = computed(() => {
    const id = this.selectedFormationId();
    if (id == null) return null;
    return this.formationStore.byId(id)();
  });

  protected readonly chapitres = computed(() => {
    const id = this.selectedFormationId();
    return id != null ? this.formationStore.chapitresOf(id)() : [];
  });

  protected readonly chapStatus = computed(() => {
    const id = this.selectedFormationId();
    return id != null ? this.formationStore.chapitresStatusOf(id)() : 'idle';
  });

  protected readonly chapError = computed(() => {
    const id = this.selectedFormationId();
    return id != null ? this.formationStore.chapitresErrorOf(id)() : null;
  });

  protected readonly articleDefaultOrder = computed(() => {
    const chap = this.articleDialogChapter();
    if (!chap) return 1;
    const existing = this.articleStore.byChapitre(chap.id)();
    // max(sortOrder)+1 (et non length+1) pour éviter les collisions sur la
    // contrainte unique (chapter_id, sort_order) après suppressions/réordres.
    const maxOrder = existing.reduce((m, a) => Math.max(m, a.sortOrder ?? 0), 0);
    return maxOrder + 1;
  });

  /** Prochain sort_order libre pour un nouveau chapitre (max+1). */
  protected readonly chapterDefaultOrder = computed(() => {
    const maxOrder = this.chapitres().reduce((m, c) => Math.max(m, c.sortOrder ?? 0), 0);
    return maxOrder + 1;
  });

  ngOnInit(): void {
    this.formationStore.load();

    // route param ?formationId=
    const fid = Number(this.route.snapshot.paramMap.get('formationId'));
    if (fid > 0) this.selectedFormationId.set(fid);
  }

  constructor() {
    effect(() => {
      const id = this.selectedFormationId();
      if (id != null) {
        this.formationStore.loadChapitres(id);
      }
    });
    effect(() => {
      for (const chap of this.chapitres()) {
        this.articleStore.loadByChapitre(chap.id, chap.contents ?? []);
      }
    });
  }

  protected onFormationChange(id: number | null): void {
    if (id != null && id > 0) {
      this.selectedFormationId.set(id);
      void this.router.navigate(['/admin/articles', id]);
    } else {
      this.selectedFormationId.set(null);
    }
  }

  protected iconFor(t: Article['type']): string {
    return contentTypeIcon(t);
  }
  protected labelFor(t: Article['type']): string {
    return contentTypeLabel(t);
  }

  // ── Chapitre ────────────────────────────────────────────────────────────
  protected openChapterCreate(): void {
    this.chapterDialogTarget.set(null);
    this.chapterDialogOpen.set(true);
  }

  protected openChapterEdit(c: Chapitre): void {
    this.chapterDialogTarget.set(c);
    this.chapterDialogOpen.set(true);
  }

  protected onChapterSubmit(payload: ChapterFormPayload): void {
    const fid = this.selectedFormationId();
    if (fid == null) return;
    const editing = this.chapterDialogTarget();
    const op = editing
      ? this.formationStore.updateChapitre(fid, editing.id, payload)
      : this.formationStore.createChapitre(fid, {
          title: payload.title,
          sortOrder: payload.sortOrder,
          subject_id: fid,
        });
    op.subscribe({
      next: () => {
        this.toast.success(editing ? 'Chapitre mis à jour.' : 'Chapitre créé.');
        this.chapterDialogOpen.set(false);
      },
      error: (e: unknown) => this.toast.error(httpErrorMessage(e, 'Erreur chapitre.')),
    });
  }

  protected async askChapterDelete(c: Chapitre): Promise<void> {
    const ok = await this.confirm.confirm({
      title: `Supprimer le chapitre ${c.title} ?`,
      message: 'Les contenus liés ne seront plus affichés.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    const fid = this.selectedFormationId();
    if (fid == null) return;
    this.formationStore.deleteChapitre(fid, c.id).subscribe({
      next: () => this.toast.success('Chapitre supprimé.'),
      error: (e: unknown) =>
        this.toast.error(e instanceof Error ? e.message : 'Erreur suppression.'),
    });
  }

  // ── Article ─────────────────────────────────────────────────────────────
  protected openArticleCreate(chap: Chapitre): void {
    this.articleDialogChapter.set(chap);
    this.articleDialogTarget.set(null);
    this.articleDialogOpen.set(true);
  }

  protected openArticleEdit(chap: Chapitre, a: Article): void {
    this.articleDialogChapter.set(chap);
    this.articleDialogTarget.set(a);
    this.articleDialogOpen.set(true);
  }

  protected onArticleSubmit(payload: ArticleFormPayload): void {
    const chap = this.articleDialogChapter();
    if (!chap) return;
    const editing = this.articleDialogTarget();
    const op = editing
      ? this.articleStore.update(chap.id, editing.id, payload)
      : this.articleStore.create(chap.id, {
          ...payload,
          chapter_id: chap.id,
        });
    op.subscribe({
      next: () => {
        this.toast.success(editing ? 'Contenu mis à jour.' : 'Contenu créé.');
        this.articleDialogOpen.set(false);
      },
      error: (e: unknown) => this.toast.error(httpErrorMessage(e, 'Erreur contenu.')),
    });
  }

  protected async askArticleDelete(chap: Chapitre, a: Article): Promise<void> {
    const ok = await this.confirm.confirm({
      title: `Supprimer ${a.title} ?`,
      message: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    this.articleStore.delete(chap.id, a.id).subscribe({
      next: () => this.toast.success('Contenu supprimé.'),
      error: (e: unknown) =>
        this.toast.error(e instanceof Error ? e.message : 'Erreur suppression.'),
    });
  }
}
