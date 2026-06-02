import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import type { SchoolClassroomAggregate, SchoolStudent } from '../../core/schemas/aggregate.schema';
import { AggregateApi } from '../../core/api/aggregate.api';

@Component({
  selector: 'app-school-progress',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6" aria-labelledby="sp-title">
      <header class="flex flex-col gap-1">
        <p class="font-headline text-xs font-bold uppercase tracking-[3px] text-primary">École</p>
        <h1 id="sp-title" class="font-headline text-2xl font-bold text-on-surface">Suivi global</h1>
        <p class="text-sm text-on-surface-variant">Progression des élèves par classe et par matière.</p>
      </header>

      @if (loading()) {
        <p class="text-sm text-on-surface-variant" aria-live="polite">Chargement…</p>
      } @else if (error()) {
        <p class="squircle-xl bg-error-container p-4 text-sm text-on-error-container ghost-border">{{ error() }}</p>
      } @else if (classrooms().length === 0) {
        <p class="squircle-xl bg-surface-container p-6 text-center text-sm text-on-surface-variant ghost-border">
          Aucune classe à suivre.
        </p>
      } @else {
        @for (classroom of classrooms(); track classroom.id) {
          <article class="flex flex-col gap-3 squircle-xl bg-surface-container p-4 ghost-border">
            <h2 class="font-headline text-lg font-bold text-on-surface">
              {{ classroom.name }}{{ classroom.level ? ' · ' + classroom.level : '' }}
            </h2>
            @if (classroom.students.length === 0) {
              <p class="text-xs text-on-surface-variant">Aucun élève.</p>
            }
            <ul class="flex flex-col gap-2" role="list">
              @for (student of classroom.students; track student.id) {
                <li class="flex flex-col gap-2 squircle-lg bg-surface-container-high p-3">
                  <span class="text-sm font-medium text-on-surface">{{ studentName(student) }}</span>
                  @if (student.subjects.length === 0) {
                    <span class="text-xs text-on-surface-variant">Aucune matière.</span>
                  }
                  <div class="flex flex-col gap-1.5">
                    @for (subject of student.subjects; track subject.subjectId) {
                      <div class="flex items-center gap-2">
                        <span class="w-28 shrink-0 truncate text-xs text-on-surface-variant">{{ subject.subjectName }}</span>
                        <div
                          class="h-1.5 flex-1 overflow-hidden rounded-full bg-on-surface-variant/15"
                          role="progressbar"
                          [attr.aria-valuenow]="subject.completionPercent"
                          aria-valuemin="0"
                          aria-valuemax="100"
                          [attr.aria-label]="studentName(student) + ' — ' + subject.subjectName"
                        >
                          <div class="h-full rounded-full bg-primary" [style.width.%]="subject.completionPercent"></div>
                        </div>
                        <span class="w-10 shrink-0 text-right text-xs tabular-nums text-on-surface-variant">{{ subject.completionPercent }} %</span>
                      </div>
                    }
                  </div>
                </li>
              }
            </ul>
          </article>
        }
      }
    </section>
  `,
})
export class SchoolProgress implements OnInit {
  private readonly api = inject(AggregateApi);

  protected readonly classrooms = signal<SchoolClassroomAggregate[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.school().subscribe({
      next: (data) => {
        this.classrooms.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(err instanceof Error ? err.message : 'Impossible de charger le suivi.');
        this.loading.set(false);
      },
    });
  }

  protected studentName(s: SchoolStudent): string {
    return [s.firstName, s.lastName].filter(Boolean).join(' ') || s.email;
  }
}
