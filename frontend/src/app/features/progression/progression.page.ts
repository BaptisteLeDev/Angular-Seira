import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormationStore } from '../../core/stores/formation.store';
import { ProgressStore } from '../../core/stores/progress.store';
import {
  summarizeSubjectProgress,
  totalWatchedSeconds,
  formatWatchTime,
  type SubjectProgress,
} from '../../core/utils/progress-summary';
import { aggregatePercent, type ProgressStatus } from '../../core/utils/video-progress';

const STATUS_LABELS: Record<ProgressStatus, string> = {
  not_started: 'Non commencé',
  in_progress: 'En cours',
  completed: 'Terminé',
};

@Component({
  selector: 'app-progression',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6" aria-labelledby="progression-title">
      <header class="flex flex-col gap-1">
        <h1 id="progression-title" class="font-headline text-2xl font-bold text-on-surface">
          Ma progression
        </h1>
        <p class="text-sm text-on-surface-variant">
          Suivez votre avancement matière par matière, en toute autonomie.
        </p>
      </header>

      <!-- KPIs globaux -->
      <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="flex flex-col gap-1 squircle-xl bg-surface-container p-4 ghost-border">
          <dt class="text-xs text-on-surface-variant">Temps visionné</dt>
          <dd class="font-headline text-lg font-bold text-on-surface">{{ totalTimeLabel() }}</dd>
        </div>
        <div class="flex flex-col gap-1 squircle-xl bg-surface-container p-4 ghost-border">
          <dt class="text-xs text-on-surface-variant">Avancement global</dt>
          <dd class="font-headline text-lg font-bold text-on-surface">{{ globalPercent() }} %</dd>
        </div>
        <div class="flex flex-col gap-1 squircle-xl bg-surface-container p-4 ghost-border">
          <dt class="text-xs text-on-surface-variant">Vidéos commencées</dt>
          <dd class="font-headline text-lg font-bold text-on-surface">{{ videosStarted() }}</dd>
        </div>
        <div class="flex flex-col gap-1 squircle-xl bg-surface-container p-4 ghost-border">
          <dt class="text-xs text-on-surface-variant">Vidéos terminées</dt>
          <dd class="font-headline text-lg font-bold text-on-surface">{{ videosCompleted() }}</dd>
        </div>
      </dl>

      @if (isLoading()) {
        <p class="text-sm text-on-surface-variant" aria-live="polite">Chargement…</p>
      } @else if (subjects().length === 0) {
        <p class="squircle-xl bg-surface-container p-6 text-center text-sm text-on-surface-variant ghost-border">
          Aucune matière à suivre pour le moment.
        </p>
      } @else {
        <ul class="flex flex-col gap-3" role="list">
          @for (subject of subjects(); track subject.subjectId) {
            <li class="flex flex-col gap-2 squircle-xl bg-surface-container p-4 ghost-border">
              <div class="flex items-center justify-between gap-3">
                <a
                  [routerLink]="['/formations', subject.subjectId]"
                  class="font-headline text-base font-bold text-on-surface hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {{ subject.name }}
                </a>
                <span
                  class="shrink-0 squircle-md px-2 py-0.5 text-xs font-medium"
                  [class.bg-emerald-500/15]="subject.status === 'completed'"
                  [class.text-emerald-600]="subject.status === 'completed'"
                  [class.bg-primary/15]="subject.status === 'in_progress'"
                  [class.text-primary]="subject.status === 'in_progress'"
                  [class.bg-on-surface-variant/10]="subject.status === 'not_started'"
                  [class.text-on-surface-variant]="subject.status === 'not_started'"
                >
                  {{ statusLabel(subject.status) }}
                </span>
              </div>

              <div
                class="h-2 w-full overflow-hidden rounded-full bg-on-surface-variant/15"
                role="progressbar"
                [attr.aria-valuenow]="subject.completionPercent"
                aria-valuemin="0"
                aria-valuemax="100"
                [attr.aria-label]="'Avancement ' + subject.name"
              >
                <div
                  class="h-full rounded-full bg-primary transition-[width]"
                  [style.width.%]="subject.completionPercent"
                ></div>
              </div>

              <p class="text-xs text-on-surface-variant">
                {{ subject.completionPercent }} % · {{ subject.chaptersCompleted }}/{{ subject.chaptersTotal }} chapitres
              </p>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class Progression {
  private readonly formationStore = inject(FormationStore);
  private readonly progress = inject(ProgressStore);

  protected readonly isLoading = this.formationStore.isLoading;

  /** Mapping matière -> ids de chapitres, dérivé du catalogue chargé. */
  private readonly chapterIdsBySubject = computed<Record<number, number[]>>(() => {
    const map: Record<number, number[]> = {};
    for (const formation of this.formationStore.items()) {
      map[formation.id] = this.formationStore.chapitresOf(formation.id)().map((c) => c.id);
    }
    return map;
  });

  protected readonly subjects = computed<SubjectProgress[]>(() =>
    summarizeSubjectProgress(
      this.formationStore.items().map((f) => ({ id: f.id, name: f.name })),
      this.chapterIdsBySubject(),
      this.progress.byChapterId(),
    ),
  );

  protected readonly globalPercent = computed(() =>
    aggregatePercent(this.subjects().map((s) => s.completionPercent)),
  );

  protected readonly totalTimeLabel = computed(() =>
    formatWatchTime(totalWatchedSeconds(this.progress.byVideoId())),
  );

  protected readonly videosStarted = computed(() => Object.keys(this.progress.byVideoId()).length);

  protected readonly videosCompleted = computed(
    () => this.progress.videoEntries().filter((e) => e.status === 'completed').length,
  );

  constructor() {
    effect(() => {
      void this.progress.hydrate();
      this.formationStore.load();
    });

    // Récupère les IRIs de chapitres (catalogue élève) puis les chapitres.
    effect(() => {
      for (const formation of this.formationStore.items()) {
        this.formationStore.loadOne(formation.id);
        this.formationStore.loadChapitres(formation.id);
      }
    });
  }

  protected statusLabel(status: ProgressStatus): string {
    return STATUS_LABELS[status];
  }
}
