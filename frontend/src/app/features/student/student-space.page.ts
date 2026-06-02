import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';
import { FormationStore } from '../../core/stores/formation.store';
import { ClassApi } from '../../core/api/class.api';
import type { Classroom } from '../../core/schemas/class.schema';
import type { Formation } from '../../core/schemas/formation.schema';

/**
 * Espace élève dédié : sa classe attribuée + ses matières + sa progression.
 * Route protégée par le rôle `student`.
 */
@Component({
  selector: 'app-student-space',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6" aria-labelledby="student-title">
      <header class="flex flex-col gap-1">
        <p class="font-headline text-xs font-bold uppercase tracking-[3px] text-primary">Mon espace</p>
        <h1 id="student-title" class="font-headline text-2xl font-bold text-on-surface">
          Bonjour {{ welcomeName() }}
        </h1>
        <p class="text-sm text-on-surface-variant">Votre classe, vos matières et votre progression.</p>
      </header>

      <!-- Ma classe -->
      @if (classroom(); as cls) {
        <article class="flex items-center gap-4 squircle-xl bg-surface-container p-5 ghost-border">
          <span class="flex size-11 items-center justify-center squircle-lg bg-primary/10 text-primary">
            <span class="icon-[heroicons--academic-cap] text-xl" aria-hidden="true"></span>
          </span>
          <div class="flex-1">
            <p class="font-headline text-base font-bold text-on-surface">{{ cls.name }}</p>
            @if (cls.level) {
              <p class="text-sm text-on-surface-variant">{{ cls.level }}</p>
            }
          </div>
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Ma classe
          </span>
        </article>
      }

      <!-- Mes matières -->
      <div class="flex flex-col gap-3">
        <h2 class="font-headline text-xs font-bold uppercase tracking-[2px] text-on-surface-variant">
          Mes matières
        </h2>
        @if (formations().length === 0) {
          <p class="squircle-xl bg-surface-container p-6 text-center text-sm text-on-surface-variant ghost-border">
            Aucune matière rattachée à votre classe pour le moment.
          </p>
        } @else {
          <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2" role="list">
            @for (f of formations(); track f.id) {
              <li>
                <a
                  [routerLink]="['/formations', f.id]"
                  class="flex h-full flex-col gap-1 squircle-xl bg-surface-container p-4 ghost-border transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span class="font-headline text-base font-bold text-on-surface">{{ f.name }}</span>
                  @if (f.description) {
                    <span class="line-clamp-2 text-sm text-on-surface-variant">{{ f.description }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        }
      </div>

      <!-- Progression -->
      <a
        routerLink="/progression"
        class="flex items-center justify-between squircle-xl bg-primary/10 p-4 ghost-border transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span class="font-headline text-sm font-bold text-on-surface">Voir ma progression</span>
        <span class="icon-[heroicons--arrow-right] text-primary" aria-hidden="true"></span>
      </a>
    </section>
  `,
})
export class StudentSpace implements OnInit {
  private readonly auth = inject(AuthStore);
  private readonly formationStore = inject(FormationStore);
  private readonly classApi = inject(ClassApi);

  protected readonly welcomeName = computed(() => this.auth.user()?.name ?? '');
  protected readonly formations = computed<readonly Formation[]>(() => this.formationStore.items());
  protected readonly classroom = signal<Classroom | null>(null);

  ngOnInit(): void {
    this.formationStore.load();
    const classroomId = this.auth.user()?.classroomId;
    if (classroomId) {
      // Best-effort : si l'élève n'a pas accès à la ressource classe, on masque
      // simplement la carte (les matières restent affichées).
      this.classApi.getById(classroomId).subscribe({
        next: (cls) => this.classroom.set(cls),
        error: () => {},
      });
    }
  }
}
