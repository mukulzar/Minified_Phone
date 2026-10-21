import React from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { styles } from '../styles';
import type { LauncherApp } from '../types';
import { ActionButton, Eyebrow, ListRow, PageHeader, ToggleRow } from '../components/Ui';

export function SearchScreen({
  title,
  query,
  apps,
  autoFocus,
  onChangeQuery,
  onOpenApp,
}: {
  title: string;
  query: string;
  apps: LauncherApp[];
  autoFocus: boolean;
  onChangeQuery: (query: string) => void;
  onOpenApp: (name: string) => void;
}) {
  return (
    <>
      <PageHeader title={title} />
      <TextInput
        value={query}
        onChangeText={onChangeQuery}
        placeholder="Search apps"
        placeholderTextColor="#777c75"
        style={styles.searchInput}
        autoFocus={autoFocus}
      />
      <ScrollView keyboardShouldPersistTaps="handled">
        {apps.map(app => (
          <ListRow
            key={app.packageName || app.name}
            title={app.name}
            onPress={() => onOpenApp(app.name)}
          />
        ))}
      </ScrollView>
    </>
  );
}

export function BlockerScreen({
  blocked,
  onToggle,
  onSave,
}: {
  blocked: string[];
  onToggle: (name: string) => void;
  onSave: () => void;
}) {
  return (
    <>
      <PageHeader
        title="App blocker"
        subtitle="Choose which apps should stay out of reach."
      />
      <View style={styles.metaRow}>
        <Text style={styles.greenText}>Blocked apps · {blocked.length}</Text>
        <Text style={styles.rowTrailing}>TEMPORARY</Text>
      </View>
      {['Instagram', 'YouTube', 'TikTok', 'Reddit', 'Facebook', 'Games'].map(
        name => (
          <ToggleRow
            key={name}
            title={name}
            value={blocked.includes(name)}
            onValueChange={() => onToggle(name)}
          />
        ),
      )}
      <Eyebrow>ESSENTIALS · ALWAYS AVAILABLE</Eyebrow>
      <Text style={styles.note}>Phone, Messages, Maps</Text>
      <ActionButton title="Save changes" onPress={onSave} />
    </>
  );
}

export function SchedulesScreen({
  enabled,
  onToggle,
  onCreate,
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onCreate: () => void;
}) {
  return (
    <>
      <PageHeader
        title="Schedules"
        subtitle="Decide when distracting apps stay unavailable."
      />
      <View style={styles.scheduleItem}>
        <View style={styles.scheduleHeading}>
          <Text style={styles.rowTitle}>Deep Work</Text>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ false: '#343833', true: '#587660' }}
            thumbColor="#dce9dd"
          />
        </View>
        <Text style={styles.note}>9:00 AM — 12:00 PM</Text>
        <Text style={styles.caption}>Monday — Friday</Text>
        <Text style={styles.caption}>Instagram, YouTube, TikTok</Text>
      </View>
      <View style={styles.scheduleItem}>
        <View style={styles.scheduleHeading}>
          <Text style={styles.rowTitle}>Sleep</Text>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ false: '#343833', true: '#587660' }}
            thumbColor="#dce9dd"
          />
        </View>
        <Text style={styles.note}>10:30 PM — 7:00 AM</Text>
        <Text style={styles.caption}>Every day</Text>
        <Text style={styles.caption}>All distracting apps</Text>
      </View>
      <ActionButton title="Create schedule" onPress={onCreate} />
    </>
  );
}

export function FavoritesScreen({
  favorites,
  availableApps,
  onToggleFavorite,
}: {
  favorites: string[];
  availableApps: string[];
  onToggleFavorite: (name: string) => void;
}) {
  return (
    <>
      <PageHeader
        title="Favorites"
        subtitle="Keep only the apps you actually need."
      />
      {favorites.map(name => (
        <View key={name} style={styles.row}>
          <Text style={styles.rowTitle}>{name}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => onToggleFavorite(name)}>
            <Text style={styles.rowTrailing}>Remove</Text>
          </Pressable>
        </View>
      ))}
      <Eyebrow>ADD AN APP</Eyebrow>
      {availableApps
        .filter(name => !favorites.includes(name))
        .slice(0, 7)
        .map(name => (
          <ListRow
            key={name}
            title={name}
            onPress={() => onToggleFavorite(name)}
            trailing="+"
          />
        ))}
    </>
  );
}

export function NotificationsScreen() {
  return (
    <>
      <PageHeader title="Notifications" subtitle="Today · quietly collected" />
      {[
        ['10:42', 'WhatsApp', 'New message from Alex'],
        ['10:31', 'Calendar', 'Meeting starts in 30 minutes'],
        ['09:52', 'Gmail', 'New email'],
      ].map(([at, app, message]) => (
        <View key={app} style={styles.notification}>
          <Text style={styles.caption}>{at}</Text>
          <View>
            <Text style={styles.rowTitle}>{app}</Text>
            <Text style={styles.note}>{message}</Text>
          </View>
        </View>
      ))}
      <Eyebrow>
        Requires notification access. Clear All dismisses collected
        notifications, not the messages inside your apps.
      </Eyebrow>
      <ActionButton title="Clear all" onPress={() => {}} secondary />
    </>
  );
}

export function ScreenTimeScreen() {
  return (
    <>
      <PageHeader title="Your time" subtitle="Today’s screen time" />
      <Text style={styles.bigStat}>2h 18m</Text>
      <Text style={styles.greenText}>−42 min compared with yesterday</Text>
      <View style={styles.chart}>
        {[
          ['Social', 62],
          ['Videos', 70],
          ['Work', 88],
          ['Comms', 54],
          ['Other', 30],
        ].map(([name, height]) => (
          <View key={String(name)} style={styles.chartCol}>
            <View style={[styles.bar, { height: Number(height) }]} />
            <Text style={styles.caption}>{name}</Text>
          </View>
        ))}
      </View>
      {[
        'Social|30 min',
        'Videos|32 min',
        'Work|39 min',
        'Communication|27 min',
        'Other|10 min',
      ].map(item => {
        const [name, value] = item.split('|');
        return (
          <View key={name} style={styles.row}>
            <Text style={styles.note}>{name}</Text>
            <Text style={styles.rowTrailing}>{value}</Text>
          </View>
        );
      })}
      <Eyebrow>MOST USED APPS</Eyebrow>
      {['YouTube|32 min', 'WhatsApp|27 min', 'Chrome|21 min', 'Instagram|18 min'].map(
        item => {
          const [name, value] = item.split('|');
          return (
            <View key={name} style={styles.row}>
              <Text style={styles.note}>{name}</Text>
              <Text style={styles.rowTrailing}>{value}</Text>
            </View>
          );
        },
      )}
    </>
  );
}

export function AppBlockedScreen({
  appName,
  onGoBack,
}: {
  appName: string;
  onGoBack: () => void;
}) {
  return (
    <View style={styles.centeredPage}>
      <Eyebrow>{appName.toUpperCase()}</Eyebrow>
      <Text style={styles.title}>Not right now.</Text>
      <Text style={styles.subtitle}>This app is currently blocked.</Text>
      <ActionButton title="Go back" onPress={onGoBack} />
    </View>
  );
}
