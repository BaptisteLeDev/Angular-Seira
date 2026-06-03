import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '@environments/environment';
import { FormationApi } from './formation.api';
import { ArticleApi } from './article.api';
import { ClassApi } from './class.api';

const base = environment.apiUrl;

describe('Cache par IRI — déduplication et invalidation (issue #48)', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FormationApi,
        ArticleApi,
        ClassApi,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('FormationApi.getChapitresByIris', () => {
    const chap = (id: number) => ({ id, title: `C${id}`, sortOrder: id });

    it('met en cache : un 2ᵉ appel sur le même IRI ne refait aucune requête', () => {
      const api = TestBed.inject(FormationApi);
      api.getChapitresByIris(['/api/chapters/1']).subscribe();
      http.expectOne(`${base}/chapters/1`).flush(chap(1));

      let second: { id: number }[] | undefined;
      api.getChapitresByIris(['/api/chapters/1']).subscribe((r) => (second = r));
      http.expectNone(`${base}/chapters/1`);
      expect(second?.[0].id).toBe(1);
    });

    it('updateChapitre invalide l’entrée du chapitre (re-fetch ensuite)', () => {
      const api = TestBed.inject(FormationApi);
      api.getChapitresByIris(['/api/chapters/1']).subscribe();
      http.expectOne(`${base}/chapters/1`).flush(chap(1));

      api.updateChapitre(1, { title: 'X' }).subscribe();
      http.expectOne({ method: 'PATCH', url: `${base}/chapters/1` }).flush(chap(1));

      api.getChapitresByIris(['/api/chapters/1']).subscribe();
      http.expectOne(`${base}/chapters/1`).flush(chap(1));
    });

    it('deleteChapitre invalide l’entrée du chapitre', () => {
      const api = TestBed.inject(FormationApi);
      api.getChapitresByIris(['/api/chapters/1']).subscribe();
      http.expectOne(`${base}/chapters/1`).flush(chap(1));

      api.deleteChapitre(1).subscribe();
      http.expectOne({ method: 'DELETE', url: `${base}/chapters/1` }).flush(null);

      api.getChapitresByIris(['/api/chapters/1']).subscribe();
      http.expectOne(`${base}/chapters/1`).flush(chap(1));
    });
  });

  describe('ArticleApi.listByIris', () => {
    const art = (id: number) => ({ id, type: 'markdown', title: `A${id}` });

    it('met en cache : un 2ᵉ appel sur le même IRI ne refait aucune requête', () => {
      const api = TestBed.inject(ArticleApi);
      api.listByIris(['/api/chapter-contents/7']).subscribe();
      http.expectOne(`${base}/chapter-contents/7`).flush(art(7));

      api.listByIris(['/api/chapter-contents/7']).subscribe();
      http.expectNone(`${base}/chapter-contents/7`);
    });

    it('update invalide l’entrée du contenu', () => {
      const api = TestBed.inject(ArticleApi);
      api.listByIris(['/api/chapter-contents/7']).subscribe();
      http.expectOne(`${base}/chapter-contents/7`).flush(art(7));

      api.update(7, { title: 'X' }).subscribe();
      http.expectOne({ method: 'PATCH', url: `${base}/chapter-contents/7` }).flush(art(7));

      api.listByIris(['/api/chapter-contents/7']).subscribe();
      http.expectOne(`${base}/chapter-contents/7`).flush(art(7));
    });
  });

  describe('ClassApi.getByIris', () => {
    const cls = (id: number) => ({
      id,
      name: `Classe ${id}`,
      slug: `c${id}`,
      level: '6e',
    });

    it('met en cache : un 2ᵉ appel sur le même IRI ne refait aucune requête', () => {
      const api = TestBed.inject(ClassApi);
      api.getByIris(['/api/classrooms/3']).subscribe();
      http.expectOne(`${base}/classrooms/3`).flush(cls(3));

      api.getByIris(['/api/classrooms/3']).subscribe();
      http.expectNone(`${base}/classrooms/3`);
    });
  });
});
