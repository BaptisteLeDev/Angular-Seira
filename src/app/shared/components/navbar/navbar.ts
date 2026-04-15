import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly appTitle = 'SeirAngular';
  protected readonly currentUser = computed(() => this.authService.currentUser());

  protected readonly primaryNav: readonly NavItem[] = [
    { path: '/home', label: 'Accueil', icon: 'icon-[heroicons--home]' },
    { path: '/dashboard', label: 'Tableau de bord', icon: 'icon-[heroicons--squares-2x2]' },
    { path: '/courses', label: 'Matières', icon: 'icon-[heroicons--book-open]' },
  ];

  protected isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
