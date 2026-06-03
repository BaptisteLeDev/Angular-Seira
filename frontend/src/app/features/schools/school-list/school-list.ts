import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SchoolStore } from '../../../core/stores/school.store';
import { ToastService } from '../../../shared/feedback/toast.service';
import { SchoolFormDialog, type SchoolFormPayload } from '../../../shared/dialogs/school-form.dialog';

/**
 * Vue : liste de toutes les écoles.
 * Route  : /schools
 * Accès  : admin uniquement
 */
@Component({
  selector: 'app-school-list',
  imports: [RouterLink, SchoolFormDialog],
  templateUrl: './school-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolList implements OnInit {
  protected readonly store = inject(SchoolStore);
  private readonly toast = inject(ToastService);

  protected readonly dialogOpen = signal(false);

  ngOnInit(): void {
    this.store.load().subscribe();
  }

  protected openCreate(): void {
    this.dialogOpen.set(true);
  }

  protected onSubmit(payload: SchoolFormPayload): void {
    const body = payload.slug ? { name: payload.name, slug: payload.slug } : { name: payload.name };
    this.store.create(body).subscribe({
      next: (s) => {
        this.dialogOpen.set(false);
        this.toast.success(`École « ${s.name} » créée.`);
      },
      error: (err: unknown) => {
        this.toast.error(err instanceof Error ? err.message : 'Erreur lors de la création.');
      },
    });
  }
}
