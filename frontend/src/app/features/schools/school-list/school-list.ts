import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SchoolStore } from '../../../core/stores/school.store';

/**
 * Vue : liste de toutes les écoles.
 * Route  : /schools
 * Accès  : admin uniquement
 */
@Component({
  selector: 'app-school-list',
  imports: [RouterLink],
  templateUrl: './school-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolList implements OnInit {
  protected readonly store = inject(SchoolStore);

  ngOnInit(): void {
    this.store.load().subscribe();
  }
}
