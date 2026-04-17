import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SchoolStore } from '../../../core/stores/school.store';
import { ClassStore } from '../../../core/stores/class.store';
import { AuthStore } from '../../../core/stores/auth.store';

/**
 * Vue : détail d'une école + résumé des classes + liens.
 * Route  : /schools/:schoolId
 * Accès  : admin + school (propre école)
 */
@Component({
  selector: 'app-school-detail',
  imports: [RouterLink],
  templateUrl: './school-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolDetail implements OnInit {
  protected readonly schoolStore = inject(SchoolStore);
  protected readonly classStore = inject(ClassStore);
  protected readonly auth = inject(AuthStore);

  protected readonly schoolId$ = input.required<string>();

  protected readonly school = computed(() => this.schoolStore.selected());
  protected readonly classrooms = computed(() => this.classStore.forSchool(Number(this.schoolId$())));
  protected readonly isLoading = computed(
    () => this.schoolStore.isLoading() || this.classStore.isLoading(),
  );
  protected readonly hasError = computed(
    () => this.schoolStore.hasError() || this.classStore.hasError(),
  );

  ngOnInit(): void {
    const id = Number(this.schoolId$());
    if (id > 0) {
      this.schoolStore.loadById(id).subscribe();
      this.classStore.loadBySchool(id).subscribe();
    }
  }
}
