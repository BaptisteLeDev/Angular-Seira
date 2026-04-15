import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'courses',
    loadComponent: () =>
      import('./features/courses/course-list/course-list').then((m) => m.CourseList),
  },
  {
    path: 'courses/:id',
    loadComponent: () =>
      import('./features/courses/course-detail/course-detail').then((m) => m.CourseDetail),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/page-not-found/page-not-found').then((m) => m.PageNotFound),
  },
];
