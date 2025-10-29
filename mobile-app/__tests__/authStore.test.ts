import { act } from '@testing-library/react-native';

import { useAuthStore } from '@/store/authStore';

const sampleUser = {
  id: 'user-1',
  email: 'user@example.com'
};

describe('auth store', () => {
  beforeEach(async () => {
    await act(async () => {
      const store = useAuthStore.getState();
      await store.signOut();
      useAuthStore.setState({ user: null, isHydrated: false });
    });
  });

  it('persistently stores and hydrates the user session', async () => {
    await act(async () => {
      await useAuthStore.getState().setUser(sampleUser);
    });

    useAuthStore.setState({ user: null, isHydrated: false });

    await act(async () => {
      await useAuthStore.getState().hydrate();
    });

    expect(useAuthStore.getState().user).toEqual(sampleUser);
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });

  it('clears the session on sign out', async () => {
    await act(async () => {
      await useAuthStore.getState().setUser(sampleUser);
    });

    await act(async () => {
      await useAuthStore.getState().signOut();
    });

    expect(useAuthStore.getState().user).toBeNull();
  });
});
