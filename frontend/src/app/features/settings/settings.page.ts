import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';
import { ThemeStore, type ThemePreference } from '../../core/stores/theme.store';
import { ScreenShell } from '../../shared/layout/screen-shell.component';
import { ToastService } from '../../shared/feedback/toast.service';
import { ConfirmDialogService } from '../../shared/feedback/confirm-dialog.service';

interface ThemeOption {
  readonly value: ThemePreference;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    value: 'system',
    label: 'Système',
    icon: 'icon-[heroicons--computer-desktop]',
    description: 'Suit le thème de votre appareil.',
  },
  {
    value: 'light',
    label: 'Clair',
    icon: 'icon-[heroicons--sun]',
    description: 'Interface claire, contrastée.',
  },
  {
    value: 'dark',
    label: 'Sombre',
    icon: 'icon-[heroicons--moon]',
    description: 'Interface sombre, économe en lumière.',
  },
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrateur',
  teacher: 'Enseignant',
  student: 'Élève',
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ScreenShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-shell
      eyebrow="Compte"
      title="Paramètres"
      subtitle="Gérez votre profil, votre thème et votre session."
    >
      <div class="flex flex-col gap-10">
        <!-- Profil -->
        <section>
          <h2 class="mb-3 font-headline text-base font-bold uppercase tracking-widest text-on-surface-variant">
            Profil
          </h2>
          @if (user(); as u) {
            <div class="grid gap-3 squircle-xl bg-surface-container p-5 ghost-border sm:grid-cols-2">
              <div>
                <p class="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
                  Nom
                </p>
                <p class="mt-1 text-base text-on-surface">{{ u.name }}</p>
              </div>
              <div>
                <p class="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
                  Email
                </p>
                <p class="mt-1 break-all text-base text-on-surface">{{ u.email }}</p>
              </div>
              <div>
                <p class="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
                  Rôle
                </p>
                <p class="mt-1 text-base text-on-surface">{{ roleLabel() }}</p>
              </div>
              @if (u.schoolId != null) {
                <div>
                  <p class="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
                    École
                  </p>
                  <p class="mt-1 text-base text-on-surface">#{{ u.schoolId }}</p>
                </div>
              }
            </div>
          }
        </section>

        <!-- Thème -->
        <section>
          <h2 class="mb-3 font-headline text-base font-bold uppercase tracking-widest text-on-surface-variant">
            Apparence
          </h2>
          <div class="grid gap-3 sm:grid-cols-3">
            @for (opt of options; track opt.value) {
              <button
                type="button"
                class="flex flex-col items-start gap-2 squircle-xl p-4 text-left ghost-border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                [class.bg-primary]="theme.preference() === opt.value"
                [class.text-on-primary]="theme.preference() === opt.value"
                [class.bg-surface-container]="theme.preference() !== opt.value"
                [class.hover:bg-surface-container-high]="theme.preference() !== opt.value"
                [attr.aria-pressed]="theme.preference() === opt.value"
                (click)="setTheme(opt.value)"
              >
                <span class="text-2xl" [class]="opt.icon" aria-hidden="true"></span>
                <span class="font-headline text-sm font-bold">{{ opt.label }}</span>
                <span
                  class="text-xs"
                  [class.text-on-primary]="theme.preference() === opt.value"
                  [class.text-on-surface-variant]="theme.preference() !== opt.value"
                >
                  {{ opt.description }}
                </span>
              </button>
            }
          </div>
          <p class="mt-3 text-xs text-on-surface-variant">
            Thème résolu actuellement :
            <span class="font-mono">{{ theme.resolved() }}</span>
          </p>
        </section>

        <!-- Session -->
        <section>
          <h2 class="mb-3 font-headline text-base font-bold uppercase tracking-widest text-on-surface-variant">
            Session
          </h2>
          <button
            type="button"
            class="inline-flex items-center gap-2 squircle-lg bg-error/15 px-4 py-2.5 font-headline text-sm font-bold text-error transition-colors hover:bg-error/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            (click)="askLogout()"
          >
            <span
              class="icon-[heroicons--arrow-right-start-on-rectangle] text-base"
              aria-hidden="true"
            ></span>
            Se déconnecter
          </button>
        </section>
      </div>
    </app-screen-shell>
  `,
})
export class Settings {
  protected readonly auth = inject(AuthStore);
  protected readonly theme = inject(ThemeStore);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly router = inject(Router);

  protected readonly options = THEME_OPTIONS;
  protected readonly user = computed(() => this.auth.user());
  protected readonly roleLabel = computed(() => {
    const r = this.user()?.role ?? '';
    return ROLE_LABEL[r] ?? r;
  });

  protected setTheme(pref: ThemePreference): void {
    this.theme.setPreference(pref);
    this.toast.success('Thème mis à jour.');
  }

  protected async askLogout(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Se déconnecter ?',
      message: 'Vous devrez vous reconnecter pour accéder à votre compte.',
      confirmLabel: 'Se déconnecter',
      tone: 'danger',
    });
    if (!ok) return;
    this.auth.logout().subscribe({
      next: () => {
        this.toast.success('Déconnecté.');
        void this.router.navigateByUrl('/login');
      },
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}
