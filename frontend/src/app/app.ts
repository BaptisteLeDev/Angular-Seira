import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { ThemeStore } from './core/stores/theme.store';
import { ToastHost } from './shared/feedback/toast-host.component';
import { ConfirmDialog } from './shared/feedback/confirm-dialog.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ToastHost, ConfirmDialog],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeStore);
  private currentUrl = this.router.url;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
      });
  }

  protected isHomeRoute(): boolean {
    return this.currentUrl.startsWith('/home');
  }

  protected isLoginRoute(): boolean {
    return this.currentUrl.startsWith('/login');
  }
}
