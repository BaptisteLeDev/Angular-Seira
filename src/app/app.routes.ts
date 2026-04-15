import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
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
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'formations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/courses/course-list/course-list').then((m) => m.CourseList),
  },
  {
    path: 'formations/:formationSlug',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/courses/course-detail/course-detail').then((m) => m.CourseDetail),
  },
  {
    path: 'formations/:formationSlug/:articleSlug',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/courses/course-detail/course-detail').then((m) => m.CourseDetail),
  },
  { path: 'courses', redirectTo: 'formations', pathMatch: 'full' },
  { path: 'courses/:id', redirectTo: 'formations', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/page-not-found/page-not-found').then((m) => m.PageNotFound),
  },
];
