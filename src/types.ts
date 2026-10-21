export type Page =
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

export type LauncherApp = { name: string; packageName: string };
