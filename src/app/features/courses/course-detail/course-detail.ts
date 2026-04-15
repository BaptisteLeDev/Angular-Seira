import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-course-detail',
  imports: [RouterLink],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetail {
  readonly id = input.required<string>();
}
