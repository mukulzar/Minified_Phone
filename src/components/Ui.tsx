import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { styles } from '../styles';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.headingBlock}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function ActionButton({
  title,
  onPress,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.action, secondary && styles.secondaryAction]}>
      <Text style={[styles.actionText, secondary && styles.secondaryActionText]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function ListRow({
  title,
  onPress,
  trailing,
}: {
  title: string;
  onPress: () => void;
  trailing?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      {trailing ? <Text style={styles.rowTrailing}>{trailing}</Text> : null}
    </Pressable>
  );
}

export function ToggleRow({
  title,
  value,
  onValueChange,
}: {
  title: string;
  value: boolean;
  onValueChange: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#343833', true: '#587660' }}
        thumbColor={value ? '#dce9dd' : '#92968f'}
      />
    </View>
  );
}
