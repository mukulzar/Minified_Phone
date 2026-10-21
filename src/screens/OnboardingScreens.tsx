import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LauncherApp } from '../types';
import { styles } from '../styles';
import { ActionButton, PageHeader } from '../components/Ui';

export function WelcomeScreen({
  setupError,
  onContinue,
}: {
  setupError: string;
  onContinue: () => void;
}) {
  return (
    <View style={styles.centeredPage}>
      <PageHeader
        title="Minified Phone"
        subtitle="A calmer home screen, built around the apps you choose."
      />
      {setupError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {setupError}
        </Text>
      ) : null}
      <ActionButton title="Set up my home screen" onPress={onContinue} />
    </View>
  );
}

export function ChooseFavoritesScreen({
  apps,
  favorites,
  setupError,
  onToggleFavorite,
  onContinue,
}: {
  apps: LauncherApp[];
  favorites: string[];
  setupError: string;
  onToggleFavorite: (name: string) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <PageHeader
        title="Choose your favorite apps"
        subtitle="These apps will appear on your home screen. Tap to select or remove them."
      />
      {apps.map(app => (
        <Pressable
          key={app.packageName || app.name}
          accessibilityRole="button"
          onPress={() => onToggleFavorite(app.name)}
          style={styles.choiceRow}>
          <Text style={styles.rowTitle}>{app.name}</Text>
          <Text
            style={[
              styles.checkbox,
              favorites.includes(app.name) && styles.checked,
            ]}>
            {favorites.includes(app.name) ? '✓' : ''}
          </Text>
        </Pressable>
      ))}
      {setupError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {setupError}
        </Text>
      ) : null}
      <ActionButton title="Continue" onPress={onContinue} />
    </>
  );
}

export function DefaultHomeScreen({
  setupError,
  onOpenSettings,
  onCheckAgain,
}: {
  setupError: string;
  onOpenSettings: () => void;
  onCheckAgain: () => void;
}) {
  return (
    <View style={styles.centeredPage}>
      <PageHeader
        title="Set Minified Phone as your home app"
        subtitle="Choose Minified Phone in Android home app settings. Your selected apps will then appear on your home screen."
      />
      {setupError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {setupError}
        </Text>
      ) : null}
      <ActionButton title="Open home app settings" onPress={onOpenSettings} />
      <ActionButton
        title="Check again"
        onPress={onCheckAgain}
        secondary
      />
    </View>
  );
}
