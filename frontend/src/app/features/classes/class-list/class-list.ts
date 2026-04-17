import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClassStore } from '../../../core/stores/class.store';
import { AuthStore } from '../../../core/stores/auth.store';

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
  protected readonly auth = inject(AuthStore);

  protected readonly schoolId$ = input.required<string>();
  protected readonly classrooms = computed(() => this.store.forSchool(Number(this.schoolId$())));

  ngOnInit(): void {
    const id = Number(this.schoolId$());
    if (id > 0) {
      this.store.loadBySchool(id).subscribe();
    }
  }
}
