import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

const BASE_NAV: readonly NavItem[] = [
  { path: '/home', label: 'Accueil', icon: 'icon-[heroicons--home]' },
  { path: '/dashboard', label: 'Tableau de bord', icon: 'icon-[heroicons--squares-2x2]' },
  { path: '/formations', label: 'Matières', icon: 'icon-[heroicons--book-open]' },
];

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly appTitle = 'SeirAngular';
  protected readonly isAuthenticated = computed(() => this.auth.isAuthenticated());

  /**
   * Navigation adaptée au rôle :
   * - admin   → + "Écoles" (/schools)
   * - teacher/student → base uniquement
   */
  protected readonly navItems = computed<readonly NavItem[]>(() => {
    if (this.auth.isAdmin()) {
      return [
        ...BASE_NAV,
        {
          path: '/schools',
          label: 'Écoles',
          icon: 'icon-[heroicons--building-office-2]',
        },
      ];
    }
    return BASE_NAV;
  });

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
