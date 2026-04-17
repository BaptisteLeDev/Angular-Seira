import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClassStore } from '../../../core/stores/class.store';
import { AuthStore } from '../../../core/stores/auth.store';
import { SchoolStore } from '../../../core/stores/school.store';

/**
 * Vue : toutes les classes d'une école.
 * Route  : /schools/:schoolId/classes
 * Accès  : admin + school
 */
@Component({
  selector: 'app-class-list',
  imports: [RouterLink],
  templateUrl: './class-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassList implements OnInit {
  protected readonly store = inject(ClassStore);
  protected readonly schoolStore = inject(SchoolStore);
  protected readonly auth = inject(AuthStore);

  protected readonly schoolId = input.required<string>();
  protected readonly schoolRef = computed(() => this.schoolId().trim());
  private readonly _resolvedSchoolId = signal<number | null>(null);
  protected readonly resolvedSchoolId = this._resolvedSchoolId.asReadonly();
  protected readonly classrooms = computed(() => {
    const id = this._resolvedSchoolId();
    return id ? this.store.forSchool(id) : [];
  });

  ngOnInit(): void {
    const ref = this.schoolRef();
    const id = Number(ref);

    if (Number.isInteger(id) && id > 0) {
      this._resolvedSchoolId.set(id);
      this.store.loadBySchool(id).subscribe();
      return;
    }

    this.schoolStore.load().subscribe({
      next: (schools) => {
        const school = schools.find((item) => item.slug === ref);
        if (!school) return;
        this._resolvedSchoolId.set(school.id);
        this.store.loadBySchool(school.id).subscribe();
      },
      error: () => {
        // L'etat d'erreur est deja gere par les stores.
      },
    });
  }
}
