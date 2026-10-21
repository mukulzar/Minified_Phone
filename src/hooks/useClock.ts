import { useEffect, useRef, useState } from 'react';
import { Animated, AppState } from 'react-native';

export function useClock() {
  const [clock, setClock] = useState(new Date());
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let breathing: Animated.CompositeAnimation | undefined;

    const pause = () => {
      if (interval !== undefined) {
        clearInterval(interval);
        interval = undefined;
      }
      breathing?.stop();
      breathing = undefined;
    };

    const resume = () => {
      if (interval !== undefined) {
        return;
      }
      setClock(new Date());
      interval = setInterval(() => setClock(new Date()), 1000);
      breathing = Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      );
      breathing.start();
    };

    if (AppState.currentState === 'active') {
      resume();
    }
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        resume();
      } else {
        pause();
      }
    });

    return () => {
      pause();
      subscription.remove();
    };
  }, [dotOpacity]);

  return {
    dotOpacity,
    time: clock.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    date: clock.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
  };
}
