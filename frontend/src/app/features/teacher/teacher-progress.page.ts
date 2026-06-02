import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AggregateApi } from '../../core/api/aggregate.api';
import type { TeacherSubjectAggregate, TeacherStudent } from '../../core/schemas/aggregate.schema';

@Component({
  selector: 'app-teacher-progress',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6" aria-labelledby="tp-title">
      <header class="flex flex-col gap-1">
        <p class="font-headline text-xs font-bold uppercase tracking-[3px] text-primary">Professeur</p>
        <h1 id="tp-title" class="font-headline text-2xl font-bold text-on-surface">Suivi des élèves</h1>
        <p class="text-sm text-on-surface-variant">Progression par matière et par classe.</p>
      </header>

      @if (loading()) {
        <p class="text-sm text-on-surface-variant" aria-live="polite">Chargement…</p>
      } @else if (error()) {
        <p class="squircle-xl bg-error-container p-4 text-sm text-on-error-container ghost-border">{{ error() }}</p>
      } @else if (subjects().length === 0) {
        <p class="squircle-xl bg-surface-container p-6 text-center text-sm text-on-surface-variant ghost-border">
          Aucune matière à suivre.
        </p>
      } @else {
        @for (subject of subjects(); track subject.id) {
          <article class="flex flex-col gap-3 squircle-xl bg-surface-container p-4 ghost-border">
            <h2 class="font-headline text-lg font-bold text-on-surface">{{ subject.name }}</h2>
            @for (classroom of subject.classrooms; track classroom.id) {
              <div class="flex flex-col gap-2">
                <h3 class="text-xs font-bold uppercase tracking-[2px] text-on-surface-variant">
                  {{ classroom.name }}{{ classroom.level ? ' · ' + classroom.level : '' }}
                </h3>
                @if (classroom.students.length === 0) {
                  <p class="text-xs text-on-surface-variant">Aucun élève.</p>
                }
                <ul class="flex flex-col gap-2" role="list">
                  @for (student of classroom.students; track student.id) {
                    <li class="flex flex-col gap-1 squircle-lg bg-surface-container-high p-3">
                      <div class="flex items-center justify-between gap-3">
                        <span class="truncate text-sm font-medium text-on-surface">{{ studentName(student) }}</span>
                        <span class="shrink-0 text-xs text-on-surface-variant">
                          {{ student.progress.completedVideos }}/{{ student.progress.totalVideos }} vidéos · {{ student.progress.completionPercent }} %
                        </span>
                      </div>
                      <div
                        class="h-1.5 w-full overflow-hidden rounded-full bg-on-surface-variant/15"
                        role="progressbar"
                        [attr.aria-valuenow]="student.progress.completionPercent"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        [attr.aria-label]="'Avancement de ' + studentName(student)"
                      >
                        <div class="h-full rounded-full bg-primary" [style.width.%]="student.progress.completionPercent"></div>
                      </div>
                    </li>
                  }
                </ul>
              </div>
            }
          </article>
        }
      }
    </section>
  `,
})
export class TeacherProgress implements OnInit {
  private readonly api = inject(AggregateApi);

  protected readonly subjects = signal<TeacherSubjectAggregate[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.teacher().subscribe({
      next: (data) => {
        this.subjects.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(err instanceof Error ? err.message : 'Impossible de charger le suivi.');
        this.loading.set(false);
      },
    });
  }

  protected studentName(s: TeacherStudent): string {
    return [s.firstName, s.lastName].filter(Boolean).join(' ') || s.email;
  }
}
