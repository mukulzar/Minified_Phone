import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  AppState,
  BackHandler,
  Platform,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { essentials, initialBlocks } from './src/constants';
import { useClock } from './src/hooks/useClock';
import { useFocusTimer } from './src/hooks/useFocusTimer';
import { useLauncherSetup } from './src/hooks/useLauncherSetup';
import { useLockSettings } from './src/hooks/useLockSettings';
import { launcherModule } from './src/native/launcher';
import {
  AppBlockedScreen,
  BlockerScreen,
  FavoritesScreen,
  NotificationsScreen,
  ScreenTimeScreen,
  SchedulesScreen,
  SearchScreen,
} from './src/screens/OtherScreens';
import {
  ChooseFavoritesScreen,
  DefaultHomeScreen,
  WelcomeScreen,
} from './src/screens/OnboardingScreens';
import { HomeScreen } from './src/screens/HomeScreen';
import {
  ActiveFocusScreen,
  FocusScreen,
  SettingsScreen,
} from './src/screens/SettingsScreens';
import { styles } from './src/styles';
import type { Page } from './src/types';

function App() {
  const [page, setPage] = useState<Page>(
    Platform.OS === 'android' && launcherModule ? 'welcome' : 'home',
  );
  const [previousPage, setPreviousPage] = useState<Page>('home');
  const [selectedApp, setSelectedApp] = useState('Instagram');
  const [blocked, setBlocked] = useState(initialBlocks);
  const [query, setQuery] = useState('');
  const [focusMinutes, setFocusMinutes] = useState(120);
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const systemTransition = useRef(new Animated.Value(0)).current;
  const pageTransition = useRef(new Animated.Value(1)).current;
  const navigationHistory = useRef<Page[]>([]);
  const {
    favorites,
    installedApps,
    setupError,
    setSetupError,
    setupLoaded,
    finishSetupIfDefault,
    toggleFavorite,
  } = useLauncherSetup(page, setPage);
  const { time, date, dotOpacity } = useClock();
  const { setRemaining, countdown } = useFocusTimer(page, setPage);
  const {
    doubleTapLockEnabled,
    lockAccessibilityEnabled,
    handleHomeDoubleTap,
    toggleDoubleTapLock,
  } = useLockSettings();

  const openApp = async (name: string) => {
    setSelectedApp(name);
    setPreviousPage(page === 'home' ? 'home' : page);
    if (blocked.includes(name) || (page === 'focusActive' && !essentials.includes(name))) {
      navigationHistory.current.push(page);
      setPage('appBlocked');
      return;
    }
    navigationHistory.current = [];
    setPage('home');
    const app = installedApps.find(item => item.name === name);
    if (Platform.OS === 'android' && launcherModule) {
      if (!app?.packageName) {
        Alert.alert('App unavailable', `Could not find ${name} on this device.`);
        return;
      }
      try {
        await launcherModule.launchApp(app.packageName);
      } catch {
        Alert.alert('Could not open app', `${name} could not be opened. Please try again.`);
      }
    }
  };

  const openHomeSettings = () => {
    if (!launcherModule) {
      return;
    }
    launcherModule.openHomeSettings().catch(() => {
      setSetupError('Could not open Android home app settings. Please try again.');
    });
  };

  const startFocus = () => {
    setRemaining(focusMinutes * 60);
    navigationHistory.current.push(page);
    setPage('focusActive');
  };

  const navigateTo = useCallback((nextPage: Page) => {
    if (nextPage !== page) {
      navigationHistory.current.push(page);
      setPage(nextPage);
    }
  }, [page]);

  const resetTo = useCallback((nextPage: Page) => {
    navigationHistory.current = [];
    setPage(nextPage);
  }, []);

  const goBack = useCallback(() => {
    const previous = navigationHistory.current.pop();
    if (previous) {
      setPage(previous);
    } else if (page === 'appBlocked') {
      setPage(previousPage);
    } else if (page === 'chooseFavorites') {
      setPage('welcome');
    } else if (page === 'defaultHome') {
      setPage('chooseFavorites');
    } else if (
      page === 'focus' ||
      page === 'blocker' ||
      page === 'schedules' ||
      page === 'favorites' ||
      page === 'notifications' ||
      page === 'screenTime'
    ) {
      setPage('settings');
    } else {
      setPage('home');
    }
    setQuery('');
  }, [page, previousPage]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (page === 'home') {
          return true;
        }
        goBack();
        return true;
      },
    );
    return () => subscription.remove();
  }, [goBack, page]);

  useEffect(() => {
    pageTransition.setValue(0);
    const animation = Animated.timing(pageTransition, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [page, pageTransition]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      Animated.timing(systemTransition, {
        toValue: state === 'active' ? 0 : 1,
        duration: state === 'active' ? 180 : 220,
        useNativeDriver: true,
      }).start();
    });
    return () => subscription.remove();
  }, [systemTransition]);

  const toggleBlocked = (name: string) => {
    setBlocked(current =>
      current.includes(name)
        ? current.filter(item => item !== name)
        : [...current, name],
    );
  };

  const filteredApps = installedApps.filter(app =>
    app.name.toLowerCase().includes(query.toLowerCase()),
  );

  const renderPage = () => {
    switch (page) {
      case 'welcome':
        return (
          <WelcomeScreen
            setupError={setupError}
            onContinue={() => navigateTo('chooseFavorites')}
          />
        );
      case 'chooseFavorites':
        return (
          <ChooseFavoritesScreen
            apps={installedApps}
            favorites={favorites}
            setupError={setupError}
            onToggleFavorite={toggleFavorite}
            onContinue={() => navigateTo('defaultHome')}
          />
        );
      case 'defaultHome':
        return (
          <DefaultHomeScreen
            setupError={setupError}
            onOpenSettings={openHomeSettings}
            onCheckAgain={finishSetupIfDefault}
          />
        );
      case 'home':
        return (
          <HomeScreen
            time={time}
            favorites={favorites}
            dotOpacity={dotOpacity}
            onDoubleTap={handleHomeDoubleTap}
            onOpenApp={openApp}
            onAllApps={() => navigateTo('allApps')}
            onSettings={() => navigateTo('settings')}
          />
        );
      case 'search':
      case 'allApps':
        return (
          <SearchScreen
            title={page === 'search' ? 'Find an app' : 'All apps'}
            query={query}
            apps={filteredApps}
            autoFocus={page === 'search'}
            onChangeQuery={setQuery}
            onOpenApp={openApp}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            doubleTapLockEnabled={doubleTapLockEnabled}
            lockAccessibilityEnabled={lockAccessibilityEnabled}
            showLockSetting={
              !!launcherModule?.setDoubleTapLockEnabled &&
              !!launcherModule.getDoubleTapLockEnabled
            }
            showAndroidSettings={Platform.OS === 'android' && !!launcherModule}
            blockedCount={blocked.length}
            favoritesCount={favorites.length}
            onToggleLock={toggleDoubleTapLock}
            onOpenHomeSettings={openHomeSettings}
            onNavigate={navigateTo}
          />
        );
      case 'focus':
        return (
          <FocusScreen
            minutes={focusMinutes}
            onSelectMinutes={setFocusMinutes}
            onStart={startFocus}
          />
        );
      case 'focusActive':
        return (
          <ActiveFocusScreen
            countdown={countdown}
            onEnd={() => {
              setRemaining(0);
              resetTo('home');
            }}
          />
        );
      case 'blocker':
        return (
          <BlockerScreen
            blocked={blocked}
            onToggle={toggleBlocked}
            onSave={goBack}
          />
        );
      case 'schedules':
        return (
          <SchedulesScreen
            enabled={scheduleEnabled}
            onToggle={setScheduleEnabled}
            onCreate={() => setScheduleEnabled(true)}
          />
        );
      case 'favorites':
        return (
          <FavoritesScreen
            favorites={favorites}
            availableApps={installedApps.map(app => app.name)}
            onToggleFavorite={toggleFavorite}
          />
        );
      case 'notifications':
        return <NotificationsScreen />;
      case 'screenTime':
        return <ScreenTimeScreen />;
      case 'appBlocked':
        return <AppBlockedScreen appName={selectedApp} onGoBack={goBack} />;
    }
  };

  const isHome = page === 'home';
  const isOnboarding =
    page === 'welcome' || page === 'chooseFavorites' || page === 'defaultHome';
  const pageTransitionStyle = {
    opacity: pageTransition,
    transform: [
      {
        translateX: pageTransition.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  const appLayout = (
    <Animated.View
      style={{
        ...styles.transitionRoot,
        opacity: systemTransition.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.94],
        }),
        transform: [
          {
            scale: systemTransition.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.985],
            }),
          },
          {
            translateY: systemTransition.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -6],
            }),
          },
        ],
      }}>
        <View style={styles.topBar}>
          {!isHome && (!isOnboarding || page !== 'welcome') ? (
            <Pressable
              accessibilityRole="button"
              onPress={goBack}
              style={styles.back}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
          ) : (
            <View style={isHome ? styles.homeHeaderSpacer : styles.back} />
          )}
          {isHome ? (
            <View style={styles.homeHeader}>
              <Text style={styles.date}>{date}</Text>
              <Text style={styles.brand}>MINIFIED PHONE</Text>
            </View>
          ) : (
            <Text style={styles.brand}>MINIFIED PHONE</Text>
          )}
        </View>
        {isHome ? (
            <Animated.View
              style={[styles.content, styles.homeContent, pageTransitionStyle]}>
              {setupLoaded ? (
                renderPage()
              ) : (
              <View style={styles.centeredPage}>
                <Text style={styles.subtitle}>Loading Minified Phone…</Text>
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.ScrollView
            style={[styles.content, pageTransitionStyle]}
            contentContainerStyle={styles.pageContent}
            keyboardShouldPersistTaps="handled">
            {setupLoaded ? (
              renderPage()
            ) : (
              <View style={styles.centeredPage}>
                <Text style={styles.subtitle}>Loading Minified Phone…</Text>
              </View>
            )}
          </Animated.ScrollView>
        )}
        {isHome || isOnboarding ? null : (
          <View style={styles.bottomNav}>
            <Pressable onPress={() => resetTo('home')}>
              <Text style={styles.bottomLink}>Home</Text>
            </Pressable>
            <Pressable onPress={() => resetTo('settings')}>
              <Text style={styles.bottomLink}>Settings</Text>
            </Pressable>
          </View>
        )}
    </Animated.View>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" hidden={Platform.OS === 'android'} />
      {Platform.OS === 'android' ? (
        <View style={styles.androidRoot}>{appLayout}</View>
      ) : (
        <SafeAreaView style={styles.safeArea}>
          {appLayout}
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}

export default App;
