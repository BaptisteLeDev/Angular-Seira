import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Page 403 — Accès refusé.
 * Affichée quand roleGuard bloque l'accès à une route protégée par rôle.
 */
@Component({
  selector: 'app-unauthorized',
  imports: [RouterLink],
  templateUrl: './unauthorized.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Unauthorized {}
