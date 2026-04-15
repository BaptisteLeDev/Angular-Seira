import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORY_META, CategoryMeta } from '../../core/models/course-category.model';

interface Stat {
  readonly value: string;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly categories: readonly CategoryMeta[] = Object.values(CATEGORY_META);

  protected readonly stats: readonly Stat[] = [
    { value: '24+', label: 'Matières actives', icon: 'auto_stories' },
    { value: '180h', label: 'Contenu vidéo', icon: 'play_circle' },
    { value: '12', label: 'Mentors experts', icon: 'groups' },
    { value: '2.4k', label: 'Apprenants', icon: 'school' },
  ];
}
