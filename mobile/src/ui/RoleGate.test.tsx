import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) =>
    require('react').createElement(require('react-native').Text, null, `redirect:${href}`),
}));

import { RoleGate } from './RoleGate';
import { useAuthStore } from '@src/stores/auth.store';

function setAuth(token: string | null, role?: string) {
  useAuthStore.setState({
    token,
    user: role ? ({ id: 1, name: 'X', email: 'x@y.fr', role } as never) : null,
  });
}

describe('RoleGate', () => {
  test('non authentifié -> redirige vers /home', () => {
    setAuth(null);
    render(
      <RoleGate allowed={['teacher']}>
        <Text>contenu</Text>
      </RoleGate>,
    );
    expect(screen.getByText('redirect:/home')).toBeTruthy();
    expect(screen.queryByText('contenu')).toBeNull();
  });

  test('mauvais rôle -> redirige vers /dashboard', () => {
    setAuth('tok', 'student');
    render(
      <RoleGate allowed={['teacher']}>
        <Text>contenu</Text>
      </RoleGate>,
    );
    expect(screen.getByText('redirect:/dashboard')).toBeTruthy();
  });

  test('rôle autorisé -> rend les enfants', () => {
    setAuth('tok', 'teacher');
    render(
      <RoleGate allowed={['teacher']}>
        <Text>contenu</Text>
      </RoleGate>,
    );
    expect(screen.getByText('contenu')).toBeTruthy();
  });
});
