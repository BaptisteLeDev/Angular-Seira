import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PercentPipe } from '@angular/common';
import { Course } from '../../../core/models/course.model';
import {
  CATEGORY_META,
  CategoryMeta,
  CourseCategory,
} from '../../../core/models/course-category.model';
import { CourseService } from '../../../core/services/course.service';

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
export class CourseList implements OnInit {
  private readonly courseService = inject(CourseService);

  protected courses: CourseView[] = [];
  protected isLoading = true;
  protected errorMessage: string | null = null;

  protected readonly selectedCourseId = signal<number | null>(null);

  protected readonly selectedCourse = computed(() => {
    const id = this.selectedCourseId();
    return id === null ? null : this.courses.find((course) => course.id === id) ?? null;
  });

  protected meta(category: CourseCategory): CategoryMeta {
    return CATEGORY_META[category];
  }

  ngOnInit(): void {
    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.courses = courses.map((course) => this.toCourseView(course));
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage =
          error instanceof Error
            ? error.message
            : 'Le chargement des matieres est indisponible pour le moment.';
        this.isLoading = false;
      },
    });
  }

  private toCourseView(course: Course): CourseView {
    return {
      ...course,
      // Squelette TP: categorisation statique en attendant un champ API dedie.
      category: 'dev',
    };
  }

  selectCourse(id: number): void {
    this.selectedCourseId.update((current) => (current === id ? null : id));
  }
}
