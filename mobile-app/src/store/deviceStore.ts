import { create } from 'zustand';

interface DeviceState {
  pushToken: string | null;
  setPushToken: (token: string | null) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  pushToken: null,
  setPushToken: (pushToken) => set({ pushToken })
}));
