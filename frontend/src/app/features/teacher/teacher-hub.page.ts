import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';
import { FormationStore } from '../../core/stores/formation.store';
import { ScreenShell } from '../../shared/layout/screen-shell.component';
import { iriToId } from '../../core/utils/iri';

@Component({
  selector: 'app-teacher-hub',
  standalone: true,
  imports: [RouterLink, ScreenShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-shell
      eyebrow="Espace prof"
      [title]="welcomeTitle()"
      subtitle="Pilotez vos classes, vos formations et vos élèves."
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <a
          routerLink="/teacher/classes"
          class="group flex flex-col gap-3 squircle-2xl bg-surface-container p-6 ghost-border transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span
            class="flex size-12 items-center justify-center squircle-lg cat-comm-gradient text-white"
          >
            <span class="icon-[heroicons--academic-cap-solid] text-2xl" aria-hidden="true"></span>
          </span>
          <span class="font-headline text-xl font-extrabold text-on-surface">Mes classes</span>
          <span class="text-sm text-on-surface-variant">
            {{ classroomsCount() }} classe(s) liée(s) à mes formations.
          </span>
          <span
            class="mt-auto inline-flex items-center gap-1 font-headline text-xs font-bold uppercase tracking-widest text-primary group-hover:underline"
          >
            Ouvrir
            <span class="icon-[heroicons--arrow-right] text-base" aria-hidden="true"></span>
          </span>
        </a>

        <a
          routerLink="/teacher/students"
          class="group flex flex-col gap-3 squircle-2xl bg-surface-container p-6 ghost-border transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span
            class="flex size-12 items-center justify-center squircle-lg cat-data-gradient text-white"
          >
            <span class="icon-[heroicons--user-group] text-2xl" aria-hidden="true"></span>
          </span>
          <span class="font-headline text-xl font-extrabold text-on-surface">Mes élèves</span>
          <span class="text-sm text-on-surface-variant">
            Vue agrégée des élèves de mes classes.
          </span>
          <span
            class="mt-auto inline-flex items-center gap-1 font-headline text-xs font-bold uppercase tracking-widest text-primary group-hover:underline"
          >
            Ouvrir
            <span class="icon-[heroicons--arrow-right] text-base" aria-hidden="true"></span>
          </span>
        </a>
      </div>
    </app-screen-shell>
  `,
})
export class TeacherHub implements OnInit {
  private readonly auth = inject(AuthStore);
  private readonly formationStore = inject(FormationStore);

  protected readonly welcomeTitle = computed(() => {
    const u = this.auth.user();
    return u ? `Bonjour ${u.name}` : 'Espace enseignant';
  });

  protected readonly classroomsCount = computed(() => {
    const userId = this.auth.user()?.id;
    if (!userId) return 0;
    const classroomIris = new Set<string>();
    for (const f of this.formationStore.items()) {
      if (f.teacher && iriToId(f.teacher) === userId) {
        for (const cr of f.classrooms ?? []) classroomIris.add(cr);
      }
    }
    return classroomIris.size;
  });

  ngOnInit(): void {
    this.formationStore.load();
  }
}
