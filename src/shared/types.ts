// Core data types for The Tab Weaver extension

export interface TabData {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
  windowId: number;
  index: number;
  active: boolean;
  pinned: boolean;
  audible: boolean;
  mutedInfo?: { muted: boolean };
  timeOpened: number;
  timeLastActive: number;
  totalActiveDuration: number;
  hibernated: boolean;
  hibernationCount: number;
  hasUnsavedData: boolean;
  workspaceId?: string;
  collectionId?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  collections: Collection[];
  created: number;
  lastModified: number;
  isDefault: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  workspaceId: string;
  tabs: TabData[];
  created: number;
  lastModified: number;
  isActive: boolean;
}

export interface SavedSession {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  collectionId?: string;
  windows: SavedWindow[];
  created: number;
  lastRestored?: number;
  restoreCount: number;
  tags: string[];
}

export interface SavedWindow {
  id: string;
  tabs: TabData[];
  focused: boolean;
  incognito: boolean;
  type: 'normal' | 'popup';
  state: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
}

export interface HibernationSettings {
  enabled: boolean;
  timeThreshold: number; // minutes
  excludePinned: boolean;
  excludeAudible: boolean;
  excludeWithForms: boolean;
  whitelistedDomains: string[];
  blacklistedDomains: string[];
}

export interface PerformanceMetrics {
  totalTabsManaged: number;
  hibernatedTabs: number;
  memorySavedMB: number;
  cpuSavedPercent: number;
  lastCalculated: number;
}

export interface UserSettings {
  hibernation: HibernationSettings;
  ui: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    showTabFavicons: boolean;
    showPerformanceMetrics: boolean;
    commandPaletteShortcut: string;
  };
  sync: {
    enabled: boolean;
    lastSync?: number;
    syncWorkspaces: boolean;
    syncSessions: boolean;
    syncSettings: boolean;
  };
  analytics: {
    trackUsage: boolean;
    retentionDays: number;
  };
}

export interface Analytics {
  tabUsage: TabUsageData[];
  workspaceStats: WorkspaceStats[];
  sessionStats: SessionStats[];
  performanceHistory: PerformanceSnapshot[];
}

export interface TabUsageData {
  url: string;
  title: string;
  domain: string;
  visitCount: number;
  totalTime: number;
  averageSessionTime: number;
  lastVisit: number;
  hibernationHistory: HibernationEvent[];
}

export interface HibernationEvent {
  timestamp: number;
  action: 'hibernated' | 'restored';
  reason: 'timeout' | 'manual' | 'low-memory';
  memorySavedMB?: number;
}

export interface WorkspaceStats {
  workspaceId: string;
  name: string;
  totalTime: number;
  tabCount: number;
  sessionCount: number;
  lastAccessed: number;
}

export interface SessionStats {
  sessionId: string;
  name: string;
  duration: number;
  tabCount: number;
  restoreCount: number;
  lastRestored: number;
}

export interface PerformanceSnapshot {
  timestamp: number;
  totalTabs: number;
  hibernatedTabs: number;
  memorySavedMB: number;
  cpuUsagePercent: number;
  systemMemoryMB: number;
}

export interface CommandPaletteItem {
  id: string;
  title: string;
  description?: string;
  category: 'tab' | 'workspace' | 'collection' | 'session' | 'action';
  icon: string;
  data?: any;
  action: () => void;
}

export interface SyncData {
  workspaces: Workspace[];
  sessions: SavedSession[];
  settings: UserSettings;
  lastSync: number;
  deviceId: string;
}

// Message types for communication between components
export type BackgroundMessage = 
  | { type: 'HIBERNATE_TAB'; tabId: number }
  | { type: 'RESTORE_TAB'; tabId: number }
  | { type: 'GET_TAB_DATA'; tabId?: number }
  | { type: 'UPDATE_TAB_ACTIVITY'; tabId: number; timestamp: number }
  | { type: 'CHECK_FORM_DATA'; tabId: number }
  | { type: 'GET_PERFORMANCE_METRICS' }
  | { type: 'SAVE_SESSION'; workspaceId: string; collectionId?: string; name: string }
  | { type: 'RESTORE_SESSION'; sessionId: string }
  | { type: 'CREATE_WORKSPACE'; workspace: Omit<Workspace, 'id' | 'created' | 'lastModified'> }
  | { type: 'UPDATE_WORKSPACE'; workspaceId: string; updates: Partial<Workspace> }
  | { type: 'DELETE_WORKSPACE'; workspaceId: string }
  | { type: 'CREATE_COLLECTION'; collection: Omit<Collection, 'id' | 'created' | 'lastModified'> }
  | { type: 'UPDATE_COLLECTION'; collectionId: string; updates: Partial<Collection> }
  | { type: 'DELETE_COLLECTION'; collectionId: string }
  | { type: 'MOVE_TAB_TO_COLLECTION'; tabId: number; collectionId: string }
  | { type: 'SYNC_DATA' }
  | { type: 'OPEN_COMMAND_PALETTE' };

export type ContentMessage = 
  | { type: 'FORM_DATA_DETECTED'; hasUnsavedData: boolean }
  | { type: 'PAGE_ACTIVITY'; timestamp: number };

// Storage keys for chrome.storage
export const STORAGE_KEYS = {
  WORKSPACES: 'workspaces',
  SESSIONS: 'sessions',
  TAB_DATA: 'tabData',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  PERFORMANCE_METRICS: 'performanceMetrics',
  SYNC_DATA: 'syncData'
} as const;