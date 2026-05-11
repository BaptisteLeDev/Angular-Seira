import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScreenShell } from '../../shared/layout/screen-shell.component';

interface AdminCard {
  readonly path: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly gradient: string;
}

const ADMIN_CARDS: readonly AdminCard[] = [
  {
    path: '/schools',
    label: 'Écoles',
    description: 'Gérer les écoles, classes et formations.',
    icon: 'icon-[heroicons--building-office-2-solid]',
    gradient: 'cat-data-gradient',
  },
  {
    path: '/admin/users',
    label: 'Utilisateurs',
    description: 'Créer et gérer les comptes admin/prof/élève.',
    icon: 'icon-[heroicons--users-solid]',
    gradient: 'cat-comm-gradient',
  },
  {
    path: '/admin/articles',
    label: 'Articles',
    description: 'Éditer les chapitres et contenus pédagogiques.',
    icon: 'icon-[heroicons--document-text-solid]',
    gradient: 'cat-design-gradient',
  },
];

@Component({
  selector: 'app-admin-hub',
  standalone: true,
  imports: [RouterLink, ScreenShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-shell
      eyebrow="Administration"
      title="Tableau de bord administrateur"
      subtitle="Pilotez les écoles, les utilisateurs et les contenus depuis un seul endroit."
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (card of cards; track card.path) {
          <a
            [routerLink]="card.path"
            class="group flex flex-col gap-3 squircle-2xl bg-surface-container p-6 ghost-border transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span
              class="flex size-12 items-center justify-center squircle-lg text-white"
              [class]="card.gradient"
            >
              <span class="text-2xl" [class]="card.icon" aria-hidden="true"></span>
            </span>
            <span class="font-headline text-xl font-extrabold text-on-surface">
              {{ card.label }}
            </span>
            <span class="text-sm text-on-surface-variant">{{ card.description }}</span>
            <span
              class="mt-auto inline-flex items-center gap-1 font-headline text-xs font-bold uppercase tracking-widest text-primary group-hover:underline"
            >
              Ouvrir
              <span class="icon-[heroicons--arrow-right] text-base" aria-hidden="true"></span>
            </span>
          </a>
        }
      </div>
    </app-screen-shell>
  `,
})
export class AdminHub {
  protected readonly cards = ADMIN_CARDS;
}
