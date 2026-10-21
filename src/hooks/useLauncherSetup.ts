import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { initialFavorites, appNames } from '../constants';
import { launcherModule } from '../native/launcher';
import type { LauncherApp, Page } from '../types';

export function useLauncherSetup(
  page: Page,
  setPage: React.Dispatch<React.SetStateAction<Page>>,
) {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [installedApps, setInstalledApps] = useState<LauncherApp[]>(
    appNames.map(name => ({ name, packageName: '' })),
  );
  const [setupError, setSetupError] = useState('');
  const [setupLoaded, setSetupLoaded] = useState(
    Platform.OS !== 'android' || !launcherModule,
  );
  const setupCompletionInProgress = useRef(false);

  useEffect(() => {
    const module = launcherModule;
    if (Platform.OS !== 'android' || !module) {
      return;
    }
    Promise.all([
      (module.getApps?.() ?? Promise.resolve([])).catch(() => {
        setSetupError('Could not load installed apps. You can still use the default app list.');
        return [];
      }),
      module.getSetupComplete?.() ?? Promise.resolve(false),
      module.getFavorites?.() ?? Promise.resolve(null),
      module.isDefaultHome?.() ?? Promise.resolve(false),
    ])
      .then(async ([apps, setupComplete, savedFavorites, isDefaultHome]) => {
        let currentFavorites = savedFavorites;
        if (apps.length > 0) {
          setInstalledApps(apps);
          if (currentFavorites === null) {
            currentFavorites = initialFavorites.filter(name =>
              apps.some(app => app.name === name),
            );
          }
        }
        if (currentFavorites !== null) {
          setFavorites(currentFavorites);
          if (savedFavorites === null) {
            await module.saveFavorites?.(currentFavorites);
          }
        }
        if (isDefaultHome) {
          if (
            !module.setBlackWallpaper ||
            (!setupComplete && !module.completeSetup)
          ) {
            setSetupError('Update or reinstall Minified Phone to apply the black wallpaper.');
            setPage('defaultHome');
            return;
          }
          try {
            await module.setBlackWallpaper();
          } catch {
            setSetupError('Could not set the black wallpaper. Please try again.');
            setPage('defaultHome');
            return;
          }
          if (!setupComplete) {
            await module.completeSetup?.();
          }
        }
        setPage(setupComplete || isDefaultHome ? 'home' : 'welcome');
      })
      .catch(() =>
        setSetupError('Could not load your setup. Please reopen the app to try again.'),
      )
      .finally(() => setSetupLoaded(true));
  }, [setPage]);

  const finishSetupIfDefault = useCallback(async () => {
    const module = launcherModule;
    if (!module || setupCompletionInProgress.current) {
      return;
    }
    if (
      !module.isDefaultHome ||
      !module.setBlackWallpaper ||
      !module.completeSetup
    ) {
      setSetupError('Update or reinstall Minified Phone to finish setup and apply the black wallpaper.');
      return;
    }
    setupCompletionInProgress.current = true;
    try {
      if (await module.isDefaultHome()) {
        await module.setBlackWallpaper();
        await module.completeSetup();
        setSetupError('');
        setPage('home');
      } else {
        setSetupError('Choose Minified Phone in Android home app settings, then check again.');
      }
    } catch {
      setSetupError('Could not set the black wallpaper. Please try again.');
    } finally {
      setupCompletionInProgress.current = false;
    }
  }, [setPage]);

  useEffect(() => {
    if (page !== 'defaultHome' || !launcherModule) {
      return;
    }
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        finishSetupIfDefault();
      }
    });
    return () => subscription.remove();
  }, [finishSetupIfDefault, page]);

  const toggleFavorite = useCallback(
    (name: string) => {
      const updatedFavorites = favorites.includes(name)
        ? favorites.filter(item => item !== name)
        : [...favorites, name];
      setFavorites(updatedFavorites);
      if (Platform.OS === 'android' && launcherModule?.saveFavorites) {
        launcherModule.saveFavorites(updatedFavorites).catch(() => {
          setSetupError('Could not save your favorite apps. Please try again.');
        });
      }
    },
    [favorites],
  );

  return {
    favorites,
    installedApps,
    setupError,
    setSetupError,
    setupLoaded,
    finishSetupIfDefault,
    toggleFavorite,
  };
}
