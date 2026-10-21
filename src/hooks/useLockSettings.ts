import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { launcherModule } from '../native/launcher';

export function useLockSettings() {
  const [doubleTapLockEnabled, setDoubleTapLockEnabled] = useState(false);
  const [lockAccessibilityEnabled, setLockAccessibilityEnabled] = useState(false);
  const lastHomeTap = useRef(0);

  useEffect(() => {
    const module = launcherModule;
    if (Platform.OS !== 'android' || !module) {
      return;
    }
    const refreshLockSettings = () => {
      Promise.all([
        module.getDoubleTapLockEnabled?.() ?? Promise.resolve(false),
        module.isLockAccessibilityServiceEnabled?.() ?? Promise.resolve(false),
      ])
        .then(([lockEnabled, serviceEnabled]) => {
          setDoubleTapLockEnabled(lockEnabled);
          setLockAccessibilityEnabled(serviceEnabled);
        })
        .catch(() =>
          Alert.alert('Settings unavailable', 'Could not check the screen-lock setting.'),
        );
    };
    refreshLockSettings();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshLockSettings();
      }
    });
    return () => subscription.remove();
  }, []);

  const handleHomeDoubleTap = async () => {
    const now = Date.now();
    if (now - lastHomeTap.current < 350) {
      lastHomeTap.current = 0;
      if (!doubleTapLockEnabled || !lockAccessibilityEnabled) {
        return;
      }
      try {
        await launcherModule?.lockScreen?.();
      } catch {
        Alert.alert(
          'Could not lock screen',
          'Android Accessibility access is needed to lock the screen.',
        );
      }
      return;
    }
    lastHomeTap.current = now;
  };

  const toggleDoubleTapLock = async (enabled: boolean) => {
    if (!launcherModule) {
      return;
    }
    try {
      if (!launcherModule.setDoubleTapLockEnabled) {
        Alert.alert('Unavailable', 'Update Minified Phone to change double-tap lock.');
        return;
      }
      await launcherModule.setDoubleTapLockEnabled(enabled);
      setDoubleTapLockEnabled(enabled);
      if (enabled) {
        if (!launcherModule.openAccessibilitySettings) {
          Alert.alert('Unavailable', 'Update Minified Phone to open Accessibility settings.');
          return;
        }
        await launcherModule.openAccessibilitySettings();
      }
    } catch {
      Alert.alert(
        'Could not update setting',
        'Android did not allow changing the Accessibility setting.',
      );
    }
  };

  return {
    doubleTapLockEnabled,
    lockAccessibilityEnabled,
    handleHomeDoubleTap,
    toggleDoubleTapLock,
  };
}
