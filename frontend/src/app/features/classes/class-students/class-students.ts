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
import { iriToId } from '../../../core/utils/iri';

/**
 * Vue : liste des élèves d'une classe.
 * Route  : /classes/:classId/students
 * Accès  : teacher (sa classe) + school + admin
 */
@Component({
  selector: 'app-class-students',
  imports: [RouterLink],
  templateUrl: './class-students.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassStudents implements OnInit {
  protected readonly store = inject(ClassStore);

  protected readonly classId = input.required<string>();
  protected readonly classroom = computed(() => this.store.selected());

  /**
   * Extrait les identifiants numériques des élèves depuis leurs IRIs.
   * Ex: "/api/users/42" → 42
   */
  protected readonly studentIds = computed(() => {
    const cls = this.classroom();
    if (!cls) return [];
    return (cls.students ?? []).map((iri) => iriToId(iri));
  });

  ngOnInit(): void {
    const id = Number(this.classId());
    if (id > 0) {
      this.store.loadById(id).subscribe();
    }
  }
}
