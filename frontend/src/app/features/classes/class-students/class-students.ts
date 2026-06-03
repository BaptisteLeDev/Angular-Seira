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
import { UserStore } from '../../../core/stores/user.store';
import { iriToId } from '../../../core/utils/iri';

interface StudentRow {
  readonly id: number;
  readonly name: string;
  readonly email: string | null;
}

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
  private readonly userStore = inject(UserStore);

  protected readonly classId = input.required<string>();
  protected readonly classroom = computed(() => this.store.selected());

  /** Élèves de la classe, enrichis du nom/email via le UserStore. */
  protected readonly students = computed<StudentRow[]>(() => {
    const cls = this.classroom();
    if (!cls) return [];
    const byId = new Map(this.userStore.items().map((u) => [u.id, u]));
    return (cls.students ?? []).map((iri) => {
      const id = iriToId(iri);
      const u = byId.get(id);
      return { id, name: u?.name ?? `Élève #${id}`, email: u?.email ?? null };
    });
  });

  ngOnInit(): void {
    const id = Number(this.classId());
    if (id > 0) {
      this.store.loadById(id).subscribe((cls) => {
        const schoolId = cls.school ? iriToId(cls.school) : null;
        if (schoolId) this.userStore.load({ role: 'student', schoolId });
      });
    }
  }
}
