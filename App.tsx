import React, { useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  NativeModules,
  Platform,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type Page =
  | 'welcome'
  | 'chooseFavorites'
  | 'defaultHome'
  | 'home'
  | 'search'
  | 'allApps'
  | 'settings'
  | 'focus'
  | 'focusActive'
  | 'blocker'
  | 'schedules'
  | 'favorites'
  | 'notifications'
  | 'screenTime'
  | 'appBlocked';

const appNames = [
  'Phone', 'Messages', 'WhatsApp', 'Maps', 'Music', 'Calendar', 'Email',
  'Camera', 'Amazon', 'Authenticator', 'Chrome', 'Gmail', 'Instagram',
  'Reddit', 'Spotify', 'TikTok', 'YouTube', 'Settings',
];
const essentials = ['Phone', 'Messages', 'Maps'];
const initialFavorites = ['Phone', 'Messages', 'WhatsApp', 'Maps', 'Music', 'Calendar'];
const initialBlocks = ['Instagram', 'YouTube', 'TikTok'];
const green = '#91b69a';
type LauncherApp = { name: string; packageName: string };
const launcherModule = NativeModules.MindlessLauncher as {
  getApps: () => Promise<LauncherApp[]>;
  launchApp: (packageName: string) => Promise<boolean>;
  openHomeSettings: () => Promise<void>;
  isDefaultHome: () => Promise<boolean>;
  getSetupComplete: () => Promise<boolean>;
  completeSetup: () => Promise<void>;
  getFavorites: () => Promise<string[] | null>;
  saveFavorites: (favorites: string[]) => Promise<void>;
} | undefined;

function App() {
  const [page, setPage] = useState<Page>(Platform.OS === 'android' && launcherModule ? 'welcome' : 'home');
  const [previousPage, setPreviousPage] = useState<Page>('home');
  const [selectedApp, setSelectedApp] = useState('Instagram');
  const [favorites, setFavorites] = useState(initialFavorites);
  const [blocked, setBlocked] = useState(initialBlocks);
  const [query, setQuery] = useState('');
  const [focusMinutes, setFocusMinutes] = useState(120);
  const [remaining, setRemaining] = useState(0);
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [clock, setClock] = useState(new Date());
  const [installedApps, setInstalledApps] = useState<LauncherApp[]>(appNames.map(name => ({ name, packageName: '' })));
  const [setupError, setSetupError] = useState('');
  const [setupLoaded, setSetupLoaded] = useState(Platform.OS !== 'android' || !launcherModule);

  useEffect(() => {
    if (Platform.OS !== 'android' || !launcherModule) return;
    Promise.all([
      launcherModule.getApps().catch(() => {
        setSetupError('Could not load installed apps. You can still use the default app list.');
        return [];
      }),
      launcherModule.getSetupComplete(),
      launcherModule.getFavorites(),
    ])
      .then(([apps, setupComplete, savedFavorites]) => {
        if (apps.length > 0) {
          setInstalledApps(apps);
          if (savedFavorites === null) {
            setFavorites(initialFavorites.filter(name => apps.some(app => app.name === name)));
          }
        }
        if (savedFavorites !== null) setFavorites(savedFavorites);
        if (setupComplete) setPage('home');
      })
      .catch(() => setSetupError('Could not load your setup. Please reopen the app to try again.'))
      .finally(() => setSetupLoaded(true));
  }, []);

  const finishSetupIfDefault = async () => {
    if (!launcherModule) return;
    try {
      if (await launcherModule.isDefaultHome()) {
        await launcherModule.completeSetup();
        setSetupError('');
        setPage('home');
      } else {
        setSetupError('Choose Minified Phone in Android home app settings, then check again.');
      }
    } catch {
      setSetupError('Could not verify the default home app. Please try again.');
    }
  };

  useEffect(() => {
    if (page !== 'defaultHome' || !launcherModule) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') finishSetupIfDefault();
    });
    return () => subscription.remove();
  }, [page]);

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (page !== 'focusActive') return;
    const interval = setInterval(() => {
      setRemaining(value => {
        if (value <= 1) {
          setPage('home');
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [page]);

  const openApp = async (name: string) => {
    setSelectedApp(name);
    setPreviousPage(page === 'home' ? 'home' : page);
    if (blocked.includes(name) || (page === 'focusActive' && !essentials.includes(name))) {
      setPage('appBlocked');
      return;
    }
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
    if (!launcherModule) return;
    launcherModule.openHomeSettings().catch(() => {
      setSetupError('Could not open Android home app settings. Please try again.');
    });
  };

  const startFocus = () => {
    setRemaining(focusMinutes * 60);
    setPage('focusActive');
  };

  const goBack = () => {
    if (page === 'chooseFavorites') setPage('welcome');
    else if (page === 'defaultHome') setPage('chooseFavorites');
    else if (page === 'appBlocked') setPage(previousPage);
    else setPage('home');
    setQuery('');
  };

  const toggleFavorite = (name: string) => {
    const updatedFavorites = favorites.includes(name)
      ? favorites.filter(item => item !== name)
      : [...favorites, name];
    setFavorites(updatedFavorites);
    if (Platform.OS === 'android' && launcherModule) {
      launcherModule.saveFavorites(updatedFavorites).catch(() => {
        setSetupError('Could not save your favorite apps. Please try again.');
      });
    }
  };

  const toggleBlocked = (name: string) => {
    setBlocked(current => current.includes(name)
      ? current.filter(item => item !== name)
      : [...current, name]);
  };

  const time = clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = clock.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const countdown = `${String(Math.floor(remaining / 3600)).padStart(2, '0')}:${String(Math.floor((remaining % 3600) / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const filteredApps = installedApps.filter(app => app.name.toLowerCase().includes(query.toLowerCase()));

  const label = (text: string) => <Text style={styles.eyebrow}>{text}</Text>;
  const action = (title: string, onPress: () => void, secondary = false) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.action, secondary && styles.secondaryAction]}>
      <Text style={[styles.actionText, secondary && styles.secondaryActionText]}>{title}</Text>
    </Pressable>
  );
  const row = (title: string, onPress: () => void, trailing?: string) => (
    <Pressable key={title} accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      {trailing ? <Text style={styles.rowTrailing}>{trailing}</Text> : null}
    </Pressable>
  );
  const header = (title: string, subtitle?: string) => (
    <View style={styles.headingBlock}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
  const toggleRow = (name: string, value: boolean, onValueChange: () => void) => (
    <View key={name} style={styles.row}>
      <Text style={styles.rowTitle}>{name}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#343833', true: '#587660' }} thumbColor={value ? '#dce9dd' : '#92968f'} />
    </View>
  );

  const renderPage = () => {
    switch (page) {
      case 'welcome':
        return <View style={styles.centeredPage}>
          {header('Minified Phone', 'A calmer home screen, built around the apps you choose.')}
          {setupError ? <Text accessibilityRole="alert" style={styles.errorText}>{setupError}</Text> : null}
          {action('Set up my home screen', () => setPage('chooseFavorites'))}
        </View>;
      case 'chooseFavorites':
        return <>
          {header('Choose your favorite apps', 'These apps will appear on your home screen. Tap to select or remove them.')}
          {installedApps.map(app => <Pressable key={app.packageName || app.name} accessibilityRole="button" onPress={() => toggleFavorite(app.name)} style={styles.choiceRow}>
            <Text style={styles.rowTitle}>{app.name}</Text>
            <Text style={[styles.checkbox, favorites.includes(app.name) && styles.checked]}>{favorites.includes(app.name) ? '✓' : ''}</Text>
          </Pressable>)}
          {setupError ? <Text accessibilityRole="alert" style={styles.errorText}>{setupError}</Text> : null}
          {action('Continue', () => setPage('defaultHome'))}
        </>;
      case 'defaultHome':
        return <View style={styles.centeredPage}>
          {header('Set Minified Phone as your home app', 'Choose Minified Phone in Android home app settings. Your selected apps will then appear on your home screen.')}
          {setupError ? <Text accessibilityRole="alert" style={styles.errorText}>{setupError}</Text> : null}
          {action('Open home app settings', openHomeSettings)}
          {action('Check again', () => finishSetupIfDefault(), true)}
        </View>;
      case 'home':
        return <>
          <View style={styles.homeTop}>
            <Text style={styles.date}>{date}</Text>
            <Pressable onPress={() => setPage('settings')}><Text style={styles.link}>Settings</Text></Pressable>
          </View>
          <Text style={styles.clock}>{time}</Text>
          <View style={styles.homeApps}>{favorites.map(name => row(name, () => openApp(name)))}</View>
          <View style={styles.homeBottom}>
            <Pressable onPress={() => setPage('allApps')}><Text style={styles.bottomLink}>All apps</Text></Pressable>
            <Pressable onPress={() => { setQuery(''); setPage('search'); }}><Text style={styles.bottomLink}>Search</Text></Pressable>
          </View>
        </>;
      case 'search':
      case 'allApps':
        return <>
          {header(page === 'search' ? 'Find an app' : 'All apps')}
          <TextInput value={query} onChangeText={setQuery} placeholder="Search apps" placeholderTextColor="#777c75" style={styles.searchInput} autoFocus={page === 'search'} />
          <ScrollView keyboardShouldPersistTaps="handled">{filteredApps.map(app => row(app.name, () => openApp(app.name)))}</ScrollView>
        </>;
      case 'settings':
        return <>{header('Make space', 'A little less noise, a little more intention.')}
          {Platform.OS === 'android' && launcherModule ? row('Default home screen', openHomeSettings, 'Set') : null}
          {row('Focus', () => setPage('focus'))}
          {row('App blocker', () => setPage('blocker'), `${blocked.length} blocked`)}
          {row('Schedules', () => setPage('schedules'))}
          {row('Favorites', () => setPage('favorites'), `${favorites.length} apps`)}
          {row('Notifications', () => setPage('notifications'))}
          {row('Screen time', () => setPage('screenTime'))}
        </>;
      case 'focus':
        return <>{header('Focus', 'Make your phone quiet for a while.')}{label('CHOOSE YOUR TIME')}
          {[15, 30, 60, 120].map(minutes => <Pressable key={minutes} onPress={() => setFocusMinutes(minutes)} style={styles.choiceRow}><Text style={styles.rowTitle}>{minutes < 60 ? `${minutes} min` : `${minutes / 60} hour${minutes > 60 ? 's' : ''}`}</Text><Text style={[styles.checkbox, focusMinutes === minutes && styles.checked]}>{focusMinutes === minutes ? '✓' : ''}</Text></Pressable>)}
          {action('Start focus', startFocus)}
        </>;
      case 'focusActive':
        return <View style={styles.centeredPage}>{label('FOCUS MODE')}<Text style={styles.timer}>{countdown}</Text><Text style={styles.mutedLine}>✓  Notifications muted</Text><Text style={styles.mutedLine}>✓  Distracting apps blocked</Text>{action('End focus', () => { setRemaining(0); setPage('home'); }, true)}</View>;
      case 'blocker':
        return <>{header('App blocker', 'Choose which apps should stay out of reach.')}
          <View style={styles.metaRow}><Text style={styles.greenText}>Blocked apps · {blocked.length}</Text><Text style={styles.rowTrailing}>TEMPORARY</Text></View>
          {['Instagram', 'YouTube', 'TikTok', 'Reddit', 'Facebook', 'Games'].map(name => toggleRow(name, blocked.includes(name), () => toggleBlocked(name)))}
          {label('ESSENTIALS · ALWAYS AVAILABLE')}<Text style={styles.note}>Phone, Messages, Maps</Text>{action('Save changes', () => setPage('settings'))}
        </>;
      case 'schedules':
        return <>{header('Schedules', 'Decide when distracting apps stay unavailable.')}
          <View style={styles.scheduleItem}><View style={styles.scheduleHeading}><Text style={styles.rowTitle}>Deep Work</Text><Switch value={scheduleEnabled} onValueChange={setScheduleEnabled} trackColor={{ false: '#343833', true: '#587660' }} thumbColor="#dce9dd" /></View><Text style={styles.note}>9:00 AM — 12:00 PM</Text><Text style={styles.caption}>Monday — Friday</Text><Text style={styles.caption}>Instagram, YouTube, TikTok</Text></View>
          <View style={styles.scheduleItem}><View style={styles.scheduleHeading}><Text style={styles.rowTitle}>Sleep</Text><Switch value={scheduleEnabled} onValueChange={setScheduleEnabled} trackColor={{ false: '#343833', true: '#587660' }} thumbColor="#dce9dd" /></View><Text style={styles.note}>10:30 PM — 7:00 AM</Text><Text style={styles.caption}>Every day</Text><Text style={styles.caption}>All distracting apps</Text></View>
          {action('Create schedule', () => setScheduleEnabled(true))}
        </>;
      case 'favorites':
        return <>{header('Favorites', 'Keep only the apps you actually need.')}
          {favorites.map(name => <View key={name} style={styles.row}><Text style={styles.rowTitle}>{name}</Text><Pressable onPress={() => toggleFavorite(name)}><Text style={styles.rowTrailing}>Remove</Text></Pressable></View>)}
          {label('ADD AN APP')}{installedApps.map(app => app.name).filter(name => !favorites.includes(name)).slice(0, 7).map(name => row(name, () => toggleFavorite(name), '+'))}
        </>;
      case 'notifications':
        return <>{header('Notifications', 'Today · quietly collected')}
          {[['10:42', 'WhatsApp', 'New message from Alex'], ['10:31', 'Calendar', 'Meeting starts in 30 minutes'], ['09:52', 'Gmail', 'New email']].map(([at, app, message]) => <View key={app} style={styles.notification}><Text style={styles.caption}>{at}</Text><View><Text style={styles.rowTitle}>{app}</Text><Text style={styles.note}>{message}</Text></View></View>)}
          {label('Requires notification access. Clear All dismisses collected notifications, not the messages inside your apps.')}{action('Clear all', () => {}, true)}
        </>;
      case 'screenTime':
        return <>{header('Your time', 'Today’s screen time')}<Text style={styles.bigStat}>2h 18m</Text><Text style={styles.greenText}>−42 min compared with yesterday</Text>
          <View style={styles.chart}>{[['Social', 62], ['Videos', 70], ['Work', 88], ['Comms', 54], ['Other', 30]].map(([name, height]) => <View key={String(name)} style={styles.chartCol}><View style={[styles.bar, { height: Number(height) }]} /><Text style={styles.caption}>{name}</Text></View>)}</View>
          {['Social|30 min', 'Videos|32 min', 'Work|39 min', 'Communication|27 min', 'Other|10 min'].map(item => { const [name, value] = item.split('|'); return <View key={name} style={styles.row}><Text style={styles.note}>{name}</Text><Text style={styles.rowTrailing}>{value}</Text></View>; })}
          {label('MOST USED APPS')}{['YouTube|32 min', 'WhatsApp|27 min', 'Chrome|21 min', 'Instagram|18 min'].map(item => { const [name, value] = item.split('|'); return <View key={name} style={styles.row}><Text style={styles.note}>{name}</Text><Text style={styles.rowTrailing}>{value}</Text></View>; })}
        </>;
      case 'appBlocked':
        return <View style={styles.centeredPage}>{label(selectedApp.toUpperCase())}<Text style={styles.title}>Not right now.</Text><Text style={styles.subtitle}>This app is currently blocked.</Text>{action('Go back', goBack)}</View>;
    }
  };

  const isHome = page === 'home';
  const isOnboarding = page === 'welcome' || page === 'chooseFavorites' || page === 'defaultHome';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          {!isHome && !isOnboarding ? <Pressable accessibilityRole="button" onPress={goBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable> : isOnboarding && page !== 'welcome' ? <Pressable accessibilityRole="button" onPress={goBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable> : <View style={styles.back} />}
          <Text style={styles.brand}>MINIFIED PHONE</Text>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={isHome ? styles.homeContent : styles.pageContent} keyboardShouldPersistTaps="handled">
          {setupLoaded ? renderPage() : <View style={styles.centeredPage}><Text style={styles.subtitle}>Loading Minified Phone…</Text></View>}
        </ScrollView>
        {isHome || isOnboarding ? null : <View style={styles.bottomNav}><Pressable onPress={() => setPage('home')}><Text style={styles.bottomLink}>Home</Text></Pressable><Pressable onPress={() => setPage('settings')}><Text style={styles.bottomLink}>Settings</Text></Pressable></View>}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#090b09' },
  topBar: { height: 54, paddingHorizontal: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 38, height: 40, justifyContent: 'center' },
  backText: { color: '#e5e7e2', fontSize: 32, lineHeight: 36 },
  brand: { color: '#858b83', fontSize: 10, letterSpacing: 1.2 },
  content: { flex: 1 },
  pageContent: { paddingHorizontal: 28, paddingTop: 18, paddingBottom: 36 },
  homeContent: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 22 },
  homeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: '#858b83', fontSize: 12 },
  link: { color: '#858b83', fontSize: 13 },
  clock: { color: '#f1f2ed', fontSize: 70, fontWeight: '300', marginTop: 28, marginBottom: 22 },
  homeApps: { marginTop: 0 },
  homeBottom: { marginTop: 'auto', paddingTop: 26, flexDirection: 'row', justifyContent: 'space-between' },
  bottomLink: { color: '#e1e4dd', fontSize: 14 },
  headingBlock: { marginBottom: 22 },
  title: { color: '#eff1eb', fontSize: 31, lineHeight: 38, fontWeight: '400', marginBottom: 7 },
  subtitle: { color: '#929890', fontSize: 16, lineHeight: 24, marginTop: 3, marginBottom: 22 },
  eyebrow: { color: '#929890', fontSize: 11, lineHeight: 17, marginTop: 20, marginBottom: 10 },
  row: { minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#30342f', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { color: '#e4e7e0', fontSize: 17 },
  rowTrailing: { color: '#898f87', fontSize: 13 },
  searchInput: { color: '#f1f2ed', fontSize: 17, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#454c44', marginBottom: 12 },
  action: { backgroundColor: '#58705d', borderRadius: 6, minHeight: 54, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  actionText: { color: '#f5f6f1', fontSize: 15, fontWeight: '500' },
  disabledAction: { backgroundColor: '#292e29' },
  disabledActionText: { color: '#777e76' },
  secondaryAction: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#343a34' },
  secondaryActionText: { color: '#e4e7e0' },
  choiceRow: { minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#30342f', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: '#767d74', color: '#101410', textAlign: 'center', textAlignVertical: 'center' },
  checked: { backgroundColor: green, borderColor: green },
  centeredPage: { flex: 1, justifyContent: 'center', paddingBottom: 24 },
  timer: { color: '#eff1eb', fontSize: 54, fontWeight: '300', marginVertical: 22 },
  mutedLine: { color: '#9ba199', fontSize: 14, marginTop: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  greenText: { color: green, fontSize: 13 },
  note: { color: '#929890', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 12 },
  scheduleItem: { paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#30342f' },
  scheduleHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caption: { color: '#828981', fontSize: 12, marginTop: 8 },
  notification: { flexDirection: 'row', gap: 18, minHeight: 84, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#30342f', alignItems: 'center' },
  bigStat: { color: '#eff1eb', fontSize: 48, fontWeight: '300', marginBottom: 8 },
  chart: { height: 142, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingTop: 20, marginBottom: 14 },
  chartCol: { alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 28, backgroundColor: '#58705d', marginBottom: 8 },
  bottomNav: { minHeight: 54, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#252a25', paddingHorizontal: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorText: { color: '#e7a59a', fontSize: 14, lineHeight: 21, marginVertical: 8 },
});

export default App;
