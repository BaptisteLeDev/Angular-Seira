import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PercentPipe } from '@angular/common';
import { Course } from '../../../core/models/course.model';
import {
  CATEGORY_META,
  CategoryMeta,
  CourseCategory,
} from '../../../core/models/course-category.model';

interface CourseDetails extends Course {
  readonly category: CourseCategory;
}

const COURSES: readonly CourseDetails[] = [
  {
    id: 1,
    title: 'Angular Avancé',
    description: 'Composants, signals, RxJS et Forms pour des applications performantes.',
    totalHours: 20,
    videoCount: 12,
    progressPercent: 45,
    category: 'dev',
  },
  {
    id: 2,
    title: 'Laravel & API Platform',
    description: 'REST, JWT, RBAC : concevez des API sécurisées et résilientes.',
    totalHours: 15,
    videoCount: 8,
    progressPercent: 0,
    category: 'dev',
  },
  {
    id: 3,
    title: 'Sécurité Applicative',
    description: 'OWASP, XSS, CSRF : bétonnez vos applications contre les attaques.',
    totalHours: 10,
    videoCount: 6,
    progressPercent: 80,
    category: 'security',
  },
  {
    id: 4,
    title: 'Design Systems & UI',
    description: 'Figma, tokens, composants : créez des interfaces cohérentes et scalables.',
    totalHours: 12,
    videoCount: 9,
    progressPercent: 25,
    category: 'design',
  },
  {
    id: 5,
    title: 'Agile & Scrum',
    description: 'Sprints, backlog, rituels : pilotez vos projets en méthode agile.',
    totalHours: 8,
    videoCount: 5,
    progressPercent: 60,
    category: 'project',
  },
  {
    id: 6,
    title: 'Communication pro',
    description: 'Présenter, convaincre, écrire : les soft skills qui font la différence.',
    totalHours: 6,
    videoCount: 4,
    progressPercent: 10,
    category: 'comm',
  },
];

@Component({
  selector: 'app-course-detail',
  imports: [RouterLink, PercentPipe],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetail {
  readonly id = input.required<string>();

  protected readonly course = computed<CourseDetails | null>(() => {
    const numericId = Number(this.id());
    if (Number.isNaN(numericId)) return null;
    return COURSES.find((course) => course.id === numericId) ?? null;
  });

  protected readonly meta = computed<CategoryMeta | null>(() => {
    const data = this.course();
    return data ? CATEGORY_META[data.category] : null;
  });
}
