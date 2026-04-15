import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PercentPipe } from '@angular/common';
import { Course } from '../../../core/models/course.model';

@Component({
  selector: 'app-course-list',
  imports: [RouterLink, PercentPipe],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseList {
  readonly courses: Course[] = [
    {
      id: 1,
      title: 'Angular Avancé',
      description: 'Composants, RxJS, Forms',
      totalHours: 20,
      videoCount: 12,
      progressPercent: 45,
    },
    {
      id: 2,
      title: 'Laravel & API Platform',
      description: 'REST, JWT, RBAC',
      totalHours: 15,
      videoCount: 8,
      progressPercent: 0,
    },
    {
      id: 3,
      title: 'Sécurité Applicative',
      description: 'OWASP, XSS, CSRF',
      totalHours: 10,
      videoCount: 6,
      progressPercent: 80,
    },
  ];

  readonly selectedCourseId = signal<number | null>(null);

  selectCourse(id: number): void {
    this.selectedCourseId.set(id);
  }
}
