import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PercentPipe } from '@angular/common';
import { Course } from '../../../core/models/course.model';
import {
  CATEGORY_META,
  CategoryMeta,
  CourseCategory,
} from '../../../core/models/course-category.model';

interface CourseView extends Course {
  readonly category: CourseCategory;
}

@Component({
  selector: 'app-course-list',
  imports: [RouterLink, PercentPipe],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseList {
  protected readonly courses: readonly CourseView[] = [
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

  protected readonly selectedCourseId = signal<number | null>(null);

  protected readonly selectedCourse = computed(() => {
    const id = this.selectedCourseId();
    return id === null ? null : this.courses.find((course) => course.id === id) ?? null;
  });

  protected meta(category: CourseCategory): CategoryMeta {
    return CATEGORY_META[category];
  }

  selectCourse(id: number): void {
    this.selectedCourseId.update((current) => (current === id ? null : id));
  }
}
