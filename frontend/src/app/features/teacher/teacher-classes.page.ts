import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';
import { ClassStore } from '../../core/stores/class.store';
import { FormationStore } from '../../core/stores/formation.store';
import { ScreenShell } from '../../shared/layout/screen-shell.component';
import { LoadingView } from '../../shared/ui/loading-view';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorCard } from '../../shared/ui/error-card';
import { iriToId } from '../../core/utils/iri';

@Component({
  selector: 'app-teacher-classes',
  standalone: true,
  imports: [RouterLink, ScreenShell, LoadingView, EmptyState, ErrorCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-shell
      eyebrow="Espace prof"
      title="Mes classes"
      subtitle="Classes auxquelles vos formations sont rattachées."
      [back]="true"
      backFallback="/teacher"
    >
      @if (formationStore.isLoading() || classStore.isLoading()) {
        <app-loading-view label="Chargement des classes…" />
      } @else if (formationStore.error()) {
        <app-error-card [message]="formationStore.error()!" />
      } @else if (classes().length === 0) {
        <app-empty-state
          icon="icon-[heroicons--academic-cap]"
          title="Aucune classe"
          description="Aucune formation ne vous est rattachée pour l'instant."
        />
      } @else {
        <ul role="list" class="grid gap-3 sm:grid-cols-2">
          @for (cls of classes(); track cls.id) {
            <li>
              <a
                [routerLink]="['/classes', cls.id, 'students']"
                class="flex flex-col gap-2 squircle-xl bg-surface-container p-5 ghost-border transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span class="font-headline text-lg font-bold text-on-surface">
                  {{ cls.name }}
                </span>
                @if (cls.level) {
                  <span class="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
                    {{ cls.level }}
                  </span>
                }
                <span class="mt-2 inline-flex items-center gap-2 text-xs text-on-surface-variant">
                  <span class="icon-[heroicons--user-group] text-sm" aria-hidden="true"></span>
                  {{ (cls.students?.length ?? 0) }} élève(s)
                </span>
              </a>
            </li>
          }
        </ul>
      }
    </app-screen-shell>
  `,
})
export class TeacherClasses implements OnInit {
  private readonly auth = inject(AuthStore);
  protected readonly formationStore = inject(FormationStore);
  protected readonly classStore = inject(ClassStore);

  /** IRIs distinctes des classrooms rattachées aux formations du prof. */
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

  /** Liste des classrooms hydratées pour les IRIs ci-dessus. */
  protected readonly classes = computed(() => {
    const iris = this.myClassroomIris();
    if (iris.size === 0) return [];
    const ids = new Set([...iris].map(iriToId));
    const map = this.classStore.bySchool();
    const all = Object.values(map).flat();
    return all.filter((c) => ids.has(c.id));
  });

  constructor() {
    // Quand les formations changent → s'assurer que les classes de l'école sont chargées
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
