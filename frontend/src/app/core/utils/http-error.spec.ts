import { describe, it, expect } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { httpErrorMessage } from './http-error';

describe('httpErrorMessage', () => {
  it('extrait le detail API Platform (409)', () => {
    const err = new HttpErrorResponse({
      status: 409,
      error: { detail: 'Sort order already exists for this chapter.' },
    });
    expect(httpErrorMessage(err, 'fallback')).toBe('Sort order already exists for this chapter.');
  });
  it('gère hydra:description', () => {
    const err = new HttpErrorResponse({ status: 422, error: { 'hydra:description': 'title: invalide' } });
    expect(httpErrorMessage(err, 'fallback')).toBe('title: invalide');
  });
  it('message selon le status si pas de detail', () => {
    expect(httpErrorMessage(new HttpErrorResponse({ status: 409, error: {} }), 'fb')).toBe(
      'Conflit : cette valeur est déjà utilisée.',
    );
    expect(httpErrorMessage(new HttpErrorResponse({ status: 422, error: null }), 'fb')).toBe(
      'Données invalides : vérifiez les champs.',
    );
    expect(httpErrorMessage(new HttpErrorResponse({ status: 0 }), 'fb')).toBe(
      'Problème de connexion réseau.',
    );
  });
  it('status inconnu -> fallback', () => {
    expect(httpErrorMessage(new HttpErrorResponse({ status: 500, error: {} }), 'fb')).toBe('fb');
  });
  it('Error standard -> son message', () => {
    expect(httpErrorMessage(new Error('boom'), 'fb')).toBe('boom');
  });
  it('inconnu -> fallback', () => {
    expect(httpErrorMessage(null, 'fb')).toBe('fb');
    expect(httpErrorMessage('x', 'fb')).toBe('fb');
  });
});
