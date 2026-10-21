import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { styles } from '../styles';

export function HomeScreen({
  time,
  favorites,
  dotOpacity,
  onDoubleTap,
  onOpenApp,
  onAllApps,
  onSettings,
}: {
  time: string;
  favorites: string[];
  dotOpacity: Animated.Value;
  onDoubleTap: () => void;
  onOpenApp: (name: string) => void;
  onAllApps: () => void;
  onSettings: () => void;
}) {
  return (
    <View style={styles.homeScreen} onTouchEnd={onDoubleTap}>
      <View style={styles.clockRow}>
        <Text style={styles.clock}>{time}</Text>
        <Animated.View style={[styles.clockDot, { opacity: dotOpacity }]} />
      </View>
      <View style={styles.homeApps}>
        {favorites.map(name => (
          <Pressable
            key={name}
            accessibilityRole="button"
            onTouchEnd={event => event.stopPropagation()}
            onPress={() => onOpenApp(name)}
            style={styles.homeAppRow}>
            <Text style={styles.rowTitle}>{name}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.homeBottom}>
        <Pressable
          onTouchEnd={event => event.stopPropagation()}
          onPress={onAllApps}>
          <Text style={styles.bottomLink}>All apps</Text>
        </Pressable>
        <Pressable
          onTouchEnd={event => event.stopPropagation()}
          onPress={onSettings}>
          <Text style={styles.bottomLink}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}
