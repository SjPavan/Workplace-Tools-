import { getItem, setItem } from '@/services/database';

const PROFILE_KEY = 'profile';

export interface LocalProfile {
  lastLogin: string;
}

export const getLocalProfile = async (): Promise<LocalProfile> => {
  const stored = await getItem(PROFILE_KEY);

  if (stored) {
    return JSON.parse(stored) as LocalProfile;
  }

  const profile: LocalProfile = {
    lastLogin: new Date().toISOString()
  };

  await setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
};

export const updateLastLogin = async () => {
  const profile: LocalProfile = {
    lastLogin: new Date().toISOString()
  };

  await setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
};
