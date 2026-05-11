import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { UserStore } from '../../core/stores/user.store';
import type { User, UserRole } from '../../core/schemas/user.schema';
import { ScreenShell } from '../../shared/layout/screen-shell.component';
import { LoadingView } from '../../shared/ui/loading-view';
import { ErrorCard } from '../../shared/ui/error-card';
import { EmptyState } from '../../shared/ui/empty-state';
import { SearchableList } from '../../shared/ui/searchable-list';
import { Chip } from '../../shared/ui/chip';
import { ToastService } from '../../shared/feedback/toast.service';
import { ConfirmDialogService } from '../../shared/feedback/confirm-dialog.service';
import { UserFormDialog, type UserFormPayload } from '../../shared/dialogs/user-form.dialog';

const ROLE_FILTERS: readonly { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'admin', label: 'Admins' },
  { value: 'teacher', label: 'Profs' },
  { value: 'student', label: 'Élèves' },
];

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    ScreenShell,
    LoadingView,
    ErrorCard,
    EmptyState,
    SearchableList,
    Chip,
    UserFormDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-shell
      eyebrow="Administration"
      title="Utilisateurs"
      subtitle="Gérez les comptes admin, enseignants et élèves."
      [back]="true"
      backFallback="/admin"
    >
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          @for (f of filters; track f.value) {
            <button
              type="button"
              class="squircle-md px-3 py-1.5 text-xs font-headline font-bold uppercase tracking-widest ghost-border transition-colors"
              [class.bg-primary]="roleFilter() === f.value"
              [class.text-on-primary]="roleFilter() === f.value"
              [class.bg-surface-container]="roleFilter() !== f.value"
              [class.text-on-surface]="roleFilter() !== f.value"
              (click)="setFilter(f.value)"
            >
              {{ f.label }}
            </button>
          }
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 squircle-md bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          (click)="openCreate()"
        >
          <span class="icon-[heroicons--plus] text-base" aria-hidden="true"></span>
          Nouvel utilisateur
        </button>
      </div>

      @if (store.isLoading()) {
        <app-loading-view label="Chargement des utilisateurs…" />
      } @else if (store.error()) {
        <app-error-card [message]="store.error()!" />
      } @else if (filtered().length === 0 && store.items().length === 0) {
        <app-empty-state
          icon="icon-[heroicons--users]"
          title="Aucun utilisateur"
          description="Créez votre premier utilisateur pour démarrer."
        />
      } @else {
        <app-searchable-list
          [items]="filtered()"
          [searchKeys]="searchKeys"
          placeholder="Rechercher par nom ou email…"
          [trackFn]="trackById"
        >
          <ng-template #item let-u>
            <div
              class="flex items-center justify-between gap-3 squircle-lg bg-surface-container p-3 ghost-border"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="flex size-9 shrink-0 items-center justify-center squircle-md bg-primary/15 font-mono text-xs text-primary"
                >
                  #{{ u.id }}
                </span>
                <div class="min-w-0">
                  <p class="truncate font-headline text-sm font-bold text-on-surface">
                    {{ u.name }}
                  </p>
                  <p class="truncate font-mono text-[11px] text-on-surface-variant">
                    {{ u.email }}
                  </p>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <app-chip
                  [label]="roleLabel(u.role)"
                  [category]="roleCategory(u.role)"
                  variant="soft"
                />
                <button
                  type="button"
                  class="flex size-9 items-center justify-center squircle-md bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label="Modifier"
                  (click)="openEdit(u)"
                >
                  <span class="icon-[heroicons--pencil-square] text-sm" aria-hidden="true"></span>
                </button>
                <button
                  type="button"
                  class="flex size-9 items-center justify-center squircle-md bg-error/10 text-error transition-colors hover:bg-error/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label="Supprimer"
                  (click)="askDelete(u)"
                >
                  <span class="icon-[heroicons--trash] text-sm" aria-hidden="true"></span>
                </button>
              </div>
            </div>
          </ng-template>
        </app-searchable-list>
      }
    </app-screen-shell>

    <app-user-form-dialog
      [open]="dialogOpen()"
      [user]="dialogUser()"
      (submitted)="onSubmit($event)"
      (closed)="dialogOpen.set(false)"
    />
  `,
})
export class AdminUsers implements OnInit {
  protected readonly store = inject(UserStore);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  protected readonly filters = ROLE_FILTERS;
  protected readonly searchKeys = ['name', 'email'];
  protected readonly roleFilter = signal<UserRole | 'all'>('all');

  protected readonly dialogOpen = signal(false);
  protected readonly dialogUser = signal<User | null>(null);

  protected readonly filtered = computed(() => {
    const r = this.roleFilter();
    if (r === 'all') return this.store.items();
    return this.store.items().filter((u) => u.role === r);
  });

  protected readonly trackById = (u: User) => u.id;

  ngOnInit(): void {
    this.store.load();
  }

  protected setFilter(v: UserRole | 'all'): void {
    this.roleFilter.set(v);
  }

  protected roleLabel(r: UserRole): string {
    if (r === 'admin') return 'Admin';
    if (r === 'teacher') return 'Prof';
    return 'Élève';
  }

  protected roleCategory(r: UserRole): 'security' | 'comm' | 'data' {
    if (r === 'admin') return 'security';
    if (r === 'teacher') return 'comm';
    return 'data';
  }

  protected openCreate(): void {
    this.dialogUser.set(null);
    this.dialogOpen.set(true);
  }

  protected openEdit(u: User): void {
    this.dialogUser.set(u);
    this.dialogOpen.set(true);
  }

  protected onSubmit(payload: UserFormPayload): void {
    const editing = this.dialogUser();
    if (editing) {
      this.store
        .update(editing.id, {
          name: payload.name,
          email: payload.email,
          role: payload.role,
          schoolId: payload.schoolId,
          ...(payload.password ? { password: payload.password } : {}),
        })
        .subscribe({
          next: () => {
            this.toast.success('Utilisateur mis à jour.');
            this.dialogOpen.set(false);
          },
          error: (e: unknown) => {
            this.toast.error(e instanceof Error ? e.message : 'Erreur mise à jour.');
          },
        });
    } else {
      if (!payload.password) {
        this.toast.error('Mot de passe requis pour la création.');
        return;
      }
      this.store
        .create({
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: payload.role,
          schoolId: payload.schoolId,
        })
        .subscribe({
          next: () => {
            this.toast.success('Utilisateur créé.');
            this.dialogOpen.set(false);
          },
          error: (e: unknown) => {
            this.toast.error(e instanceof Error ? e.message : 'Erreur création.');
          },
        });
    }
  }

  protected async askDelete(u: User): Promise<void> {
    const ok = await this.confirm.confirm({
      title: `Supprimer ${u.name} ?`,
      message: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    this.store.delete(u.id).subscribe({
      next: () => this.toast.success('Utilisateur supprimé.'),
      error: (e: unknown) =>
        this.toast.error(e instanceof Error ? e.message : 'Erreur suppression.'),
    });
  }
}
