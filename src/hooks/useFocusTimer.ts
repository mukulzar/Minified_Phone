import { useEffect, useState } from 'react';
import type { Page } from '../types';

export function useFocusTimer(page: Page, setPage: (page: Page) => void) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (page !== 'focusActive') {
      return;
    }
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
  }, [page, setPage]);

  const countdown = `${String(Math.floor(remaining / 3600)).padStart(2, '0')}:${String(
    Math.floor((remaining % 3600) / 60),
  ).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  return { remaining, setRemaining, countdown };
}
