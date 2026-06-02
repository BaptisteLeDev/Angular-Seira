import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '@environments/environment';
import { AggregateApi } from './aggregate.api';

describe('AggregateApi', () => {
  let api: AggregateApi;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AggregateApi],
    });
    api = TestBed.inject(AggregateApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('teacher: GET /aggregates/teacher et parse matières → classes → élèves', () => {
    let result: unknown;
    api.teacher().subscribe((r) => (result = r));
    const req = http.expectOne(`${base}/aggregates/teacher`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 1,
        name: 'Maths',
        totalVideos: 4,
        totalSeconds: 1200,
        classrooms: [
          {
            id: 10,
            name: '3e A',
            level: '3e',
            students: [
              {
                id: 100,
                firstName: 'Ada',
                lastName: 'Lovelace',
                email: 'ada@x.fr',
                progress: {
                  totalVideos: 4,
                  completedVideos: 2,
                  inProgressVideos: 1,
                  notStartedVideos: 1,
                  watchedSeconds: 600,
                  totalSeconds: 1200,
                  completionPercent: 50,
                },
              },
            ],
          },
        ],
      },
    ]);
    expect(result).toHaveLength(1);
    expect((result as any)[0].classrooms[0].students[0]).toMatchObject({
      firstName: 'Ada',
      progress: { completedVideos: 2, completionPercent: 50 },
    });
  });

  it('school: GET /aggregates/school et parse classes → élèves → matières', () => {
    let result: unknown;
    api.school().subscribe((r) => (result = r));
    const req = http.expectOne(`${base}/aggregates/school`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 10,
        name: '3e A',
        level: '3e',
        students: [
          {
            id: 100,
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'ada@x.fr',
            subjects: [
              {
                subjectId: 1,
                subjectName: 'Maths',
                totalVideos: 4,
                completedVideos: 2,
                inProgressVideos: 1,
                notStartedVideos: 1,
                watchedSeconds: 600,
                totalSeconds: 1200,
                completionPercent: 50,
              },
            ],
          },
        ],
      },
    ]);
    expect((result as any)[0].students[0].subjects[0]).toMatchObject({
      subjectName: 'Maths',
      completionPercent: 50,
    });
  });
});
