import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
} from '@angular/core';
import { AuthStore } from '../../core/stores/auth.store';
import { ClassStore } from '../../core/stores/class.store';
import { FormationStore } from '../../core/stores/formation.store';
import { ScreenShell } from '../../shared/layout/screen-shell.component';
import { LoadingView } from '../../shared/ui/loading-view';
import { EmptyState } from '../../shared/ui/empty-state';
import { iriToId } from '../../core/utils/iri';

interface StudentRef {
  readonly id: number;
  readonly classroomName: string;
}

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [ScreenShell, LoadingView, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-shell
      eyebrow="Espace prof"
      title="Mes élèves"
      [subtitle]="subtitle()"
      [back]="true"
      backFallback="/teacher"
    >
      @if (formationStore.isLoading() || classStore.isLoading()) {
        <app-loading-view label="Chargement des élèves…" />
      } @else if (students().length === 0) {
        <app-empty-state
          icon="icon-[heroicons--user-group]"
          title="Aucun élève"
          description="Vos classes ne contiennent encore aucun élève."
        />
      } @else {
        <ul role="list" class="flex flex-col gap-2">
          @for (s of students(); track s.id) {
            <li
              class="flex items-center justify-between squircle-lg bg-surface-container p-3 ghost-border"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex size-9 items-center justify-center squircle-md bg-primary/15 font-mono text-xs text-primary"
                >
                  #{{ s.id }}
                </span>
                <span class="font-headline text-sm font-medium text-on-surface">
                  Élève #{{ s.id }}
                </span>
              </div>
              <span class="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
                {{ s.classroomName }}
              </span>
            </li>
          }
        </ul>
      }
    </app-screen-shell>
  `,
})
export class TeacherStudents implements OnInit {
  private readonly auth = inject(AuthStore);
  protected readonly formationStore = inject(FormationStore);
  protected readonly classStore = inject(ClassStore);

  protected readonly subtitle = computed(
    () => `${this.students().length} élève(s) au total dans vos classes.`,
  );

  protected readonly myClassroomIris = computed(() => {
    const userId = this.auth.user()?.id;
    if (!userId) return new Set<string>();
    const set = new Set<string>();
    for (const f of this.formationStore.items()) {
      if (f.teacher && iriToId(f.teacher) === userId) {
        for (const cr of f.classrooms ?? []) set.add(cr);
      }
    }
    return set;
  });

  protected readonly students = computed<StudentRef[]>(() => {
    const ids = new Set([...this.myClassroomIris()].map(iriToId));
    if (ids.size === 0) return [];
    const all = Object.values(this.classStore.bySchool()).flat();
    const list: StudentRef[] = [];
    for (const cls of all) {
      if (!ids.has(cls.id)) continue;
      for (const studentIri of cls.students ?? []) {
        list.push({ id: iriToId(studentIri), classroomName: cls.name });
      }
    }
    return list;
  });

  constructor() {
    effect(() => {
      const schoolId = this.auth.user()?.schoolId;
      const iris = this.myClassroomIris();
      if (schoolId && iris.size > 0 && this.classStore.forSchool(schoolId).length === 0) {
        this.classStore.loadBySchool(schoolId).subscribe({ error: () => {} });
      }
    });
  }

  ngOnInit(): void {
    this.formationStore.load();
  }
}
