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

  readonly appTitle = 'MontoMaster';
  protected readonly currentUser = computed(() => this.auth.user());
  protected readonly isAuthenticated = computed(() => this.auth.isAuthenticated());

  /**
   * Navigation adaptée au rôle :
   * - admin   → + Espace prof + Admin (Écoles + Utilisateurs + Articles via /admin)
   * - teacher → + Espace prof
   * - student → base uniquement
   * Settings ajouté pour tous les rôles authentifiés.
   */
  protected readonly navItems = computed<readonly NavItem[]>(() => {
    const items: NavItem[] = [...BASE_NAV];
    if (this.auth.isTeacher() || this.auth.isAdmin()) {
      items.push({
        path: '/teacher',
        label: 'Espace prof',
        icon: 'icon-[heroicons--user-group]',
      });
    }
    if (this.auth.isAdmin()) {
      items.push({
        path: '/admin',
        label: 'Admin',
        icon: 'icon-[heroicons--shield-check]',
      });
    }
    if (this.auth.isAuthenticated()) {
      items.push({
        path: '/settings',
        label: 'Paramètres',
        icon: 'icon-[heroicons--cog-6-tooth]',
      });
    }
    return items;
  });

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
