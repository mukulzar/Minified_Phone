import { NativeModules } from 'react-native';
import type { LauncherApp } from '../types';

export type LauncherModule = {
  getApps?: () => Promise<LauncherApp[]>;
  launchApp: (packageName: string) => Promise<boolean>;
  openHomeSettings: () => Promise<void>;
  getDoubleTapLockEnabled?: () => Promise<boolean>;
  setDoubleTapLockEnabled?: (enabled: boolean) => Promise<void>;
  isLockAccessibilityServiceEnabled?: () => Promise<boolean>;
  openAccessibilitySettings?: () => Promise<void>;
  lockScreen?: () => Promise<void>;
  isDefaultHome?: () => Promise<boolean>;
  getSetupComplete?: () => Promise<boolean>;
  completeSetup?: () => Promise<void>;
  setBlackWallpaper?: () => Promise<void>;
  getFavorites?: () => Promise<string[] | null>;
  saveFavorites?: (favorites: string[]) => Promise<void>;
};

export const launcherModule = NativeModules.MindlessLauncher as
  | LauncherModule
  | undefined;
