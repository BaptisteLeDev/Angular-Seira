import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { environment } from '../../../environments/environment';

interface Health {
  readonly ok: boolean;
  readonly latencyMs: number;
}

const POLL_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-health-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center gap-3 squircle-xl bg-surface-container p-4 ghost-border"
      role="status"
    >
      <span
        class="size-2.5 shrink-0 rounded-full"
        [class.bg-on-surface-variant]="health() === null"
        [class.bg-cat-comm]="health()?.ok === true"
        [class.bg-error]="health()?.ok === false"
      ></span>
      <span class="flex-1 font-headline text-sm font-bold text-on-surface">
        {{ label() }}
      </span>
    </div>
  `,
})
export class HealthCard {
  protected readonly health = signal<Health | null>(null);

  protected readonly label = computed(() => {
    const h = this.health();
    if (h === null) return 'Vérification…';
    return h.ok ? `Backend OK · ${h.latencyMs} ms` : 'Backend injoignable';
  });

  constructor() {
    void this.tick();
    const id = setInterval(() => void this.tick(), POLL_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  private async tick(): Promise<void> {
    // Endpoint health Laravel (cf. backend/bootstrap/app.php).
    // CORS étendu côté backend (backend/config/cors.php) pour inclure `up`,
    // sinon le browser bloque la réponse — l'app mobile n'a pas ce souci car
    // React Native ne déclenche pas la SOP / CORS.
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    const url = `${base}/up`;
    const start = Date.now();
    try {
      const res = await fetch(url, { method: 'GET' });
      this.health.set({ ok: res.ok, latencyMs: Date.now() - start });
    } catch {
      this.health.set({ ok: false, latencyMs: Date.now() - start });
    }
  }
}
