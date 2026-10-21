import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { styles } from '../styles';
import { ActionButton, Eyebrow, ListRow, PageHeader } from '../components/Ui';

export function SettingsScreen({
  doubleTapLockEnabled,
  lockAccessibilityEnabled,
  showLockSetting,
  showAndroidSettings,
  blockedCount,
  favoritesCount,
  onToggleLock,
  onOpenHomeSettings,
  onNavigate,
}: {
  doubleTapLockEnabled: boolean;
  lockAccessibilityEnabled: boolean;
  showLockSetting: boolean;
  showAndroidSettings: boolean;
  blockedCount: number;
  favoritesCount: number;
  onToggleLock: (enabled: boolean) => void;
  onOpenHomeSettings: () => void;
  onNavigate: (page: 'focus' | 'blocker' | 'schedules' | 'favorites' | 'notifications' | 'screenTime') => void;
}) {
  return (
    <>
      <PageHeader
        title="Make space"
        subtitle="A little less noise, a little more intention."
      />
      {showLockSetting ? (
        <View style={styles.row}>
          <View style={styles.settingText}>
            <Text style={styles.rowTitle}>Double-tap to lock</Text>
            <Text style={styles.caption}>
              {doubleTapLockEnabled && !lockAccessibilityEnabled
                ? 'Enable Minified Phone in Android Accessibility settings to use this.'
                : 'Lock the screen when you double-tap the home screen.'}
            </Text>
          </View>
          <Switch
            value={doubleTapLockEnabled}
            onValueChange={onToggleLock}
            trackColor={{ false: '#343833', true: '#587660' }}
            thumbColor={doubleTapLockEnabled ? '#dce9dd' : '#92968f'}
          />
        </View>
      ) : null}
      {showAndroidSettings ? (
        <ListRow
          title="Default home screen"
          onPress={onOpenHomeSettings}
          trailing="Set"
        />
      ) : null}
      <ListRow title="Focus" onPress={() => onNavigate('focus')} />
      <ListRow
        title="App blocker"
        onPress={() => onNavigate('blocker')}
        trailing={`${blockedCount} blocked`}
      />
      <ListRow title="Schedules" onPress={() => onNavigate('schedules')} />
      <ListRow
        title="Favorites"
        onPress={() => onNavigate('favorites')}
        trailing={`${favoritesCount} apps`}
      />
      <ListRow
        title="Notifications"
        onPress={() => onNavigate('notifications')}
      />
      <ListRow title="Screen time" onPress={() => onNavigate('screenTime')} />
    </>
  );
}

export function FocusScreen({
  minutes,
  onSelectMinutes,
  onStart,
}: {
  minutes: number;
  onSelectMinutes: (minutes: number) => void;
  onStart: () => void;
}) {
  return (
    <>
      <PageHeader title="Focus" subtitle="Make your phone quiet for a while." />
      <Eyebrow>CHOOSE YOUR TIME</Eyebrow>
      {[15, 30, 60, 120].map(value => (
        <Pressable
          key={value}
          onPress={() => onSelectMinutes(value)}
          style={styles.choiceRow}>
          <Text style={styles.rowTitle}>
            {value < 60
              ? `${value} min`
              : `${value / 60} hour${value > 60 ? 's' : ''}`}
          </Text>
          <Text
            style={[
              styles.checkbox,
              minutes === value && styles.checked,
            ]}>
            {minutes === value ? '✓' : ''}
          </Text>
        </Pressable>
      ))}
      <ActionButton title="Start focus" onPress={onStart} />
    </>
  );
}

export function ActiveFocusScreen({
  countdown,
  onEnd,
}: {
  countdown: string;
  onEnd: () => void;
}) {
  return (
    <View style={styles.centeredPage}>
      <Eyebrow>FOCUS MODE</Eyebrow>
      <Text style={styles.timer}>{countdown}</Text>
      <Text style={styles.mutedLine}>✓ Notifications muted</Text>
      <Text style={styles.mutedLine}>✓ Distracting apps blocked</Text>
      <ActionButton title="End focus" onPress={onEnd} secondary />
    </View>
  );
}
