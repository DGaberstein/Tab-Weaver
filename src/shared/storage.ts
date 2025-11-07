import { STORAGE_KEYS, UserSettings, Workspace, Collection, SavedSession, TabData, Analytics, PerformanceMetrics } from './types';

/**
 * Storage manager for The Tab Weaver extension
 * Handles all chrome.storage operations with proper error handling and data validation
 */
export class StorageManager {
  private static instance: StorageManager;
  
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Settings operations
  async getSettings(): Promise<UserSettings> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      return result[STORAGE_KEYS.SETTINGS] || this.getDefaultSettings();
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.getDefaultSettings();
    }
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  private getDefaultSettings(): UserSettings {
    return {
      hibernation: {
        enabled: true,
        timeThreshold: 15,
        excludePinned: true,
        excludeAudible: true,
        excludeWithForms: true,
        whitelistedDomains: [],
        blacklistedDomains: []
      },
      ui: {
        theme: 'auto',
        compactMode: false,
        showTabFavicons: true,
        showPerformanceMetrics: true,
        commandPaletteShortcut: 'Ctrl+Shift+Space'
      },
      sync: {
        enabled: false,
        syncWorkspaces: true,
        syncSessions: true,
        syncSettings: true
      },
      analytics: {
        trackUsage: true,
        retentionDays: 90
      }
    };
  }

  // Workspace operations
  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.WORKSPACES);
      return result[STORAGE_KEYS.WORKSPACES] || [this.getDefaultWorkspace()];
    } catch (error) {
      console.error('Error getting workspaces:', error);
      return [this.getDefaultWorkspace()];
    }
  }

  async saveWorkspaces(workspaces: Workspace[]): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.WORKSPACES]: workspaces });
    } catch (error) {
      console.error('Error saving workspaces:', error);
      throw error;
    }
  }

  async createWorkspace(workspace: Omit<Workspace, 'id' | 'created' | 'lastModified'>): Promise<Workspace> {
    const newWorkspace: Workspace = {
      ...workspace,
      id: this.generateId(),
      created: Date.now(),
      lastModified: Date.now()
    };

    const workspaces = await this.getWorkspaces();
    workspaces.push(newWorkspace);
    await this.saveWorkspaces(workspaces);
    
    return newWorkspace;
  }

  async updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Promise<void> {
    const workspaces = await this.getWorkspaces();
    const index = workspaces.findIndex(w => w.id === workspaceId);
    
    if (index !== -1) {
      workspaces[index] = { 
        ...workspaces[index], 
        ...updates, 
        lastModified: Date.now() 
      };
      await this.saveWorkspaces(workspaces);
    }
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const workspaces = await this.getWorkspaces();
    const filtered = workspaces.filter(w => w.id !== workspaceId);
    await this.saveWorkspaces(filtered);
  }

  private getDefaultWorkspace(): Workspace {
    return {
      id: 'default',
      name: 'Default Workspace',
      description: 'Your main workspace',
      color: '#3b82f6',
      icon: '🏠',
      collections: [this.getDefaultCollection()],
      created: Date.now(),
      lastModified: Date.now(),
      isDefault: true
    };
  }

  private getDefaultCollection(): Collection {
    return {
      id: 'default-collection',
      name: 'General',
      description: 'General tab collection',
      color: '#6b7280',
      icon: '📁',
      workspaceId: 'default',
      tabs: [],
      created: Date.now(),
      lastModified: Date.now(),
      isActive: true
    };
  }

  // Collection operations
  async createCollection(collection: Omit<Collection, 'id' | 'created' | 'lastModified'>): Promise<Collection> {
    const newCollection: Collection = {
      ...collection,
      id: this.generateId(),
      created: Date.now(),
      lastModified: Date.now()
    };

    const workspaces = await this.getWorkspaces();
    const workspaceIndex = workspaces.findIndex(w => w.id === collection.workspaceId);
    
    if (workspaceIndex !== -1) {
      workspaces[workspaceIndex].collections.push(newCollection);
      workspaces[workspaceIndex].lastModified = Date.now();
      await this.saveWorkspaces(workspaces);
    }
    
    return newCollection;
  }

  async updateCollection(collectionId: string, updates: Partial<Collection>): Promise<void> {
    const workspaces = await this.getWorkspaces();
    
    for (const workspace of workspaces) {
      const collectionIndex = workspace.collections.findIndex(c => c.id === collectionId);
      if (collectionIndex !== -1) {
        workspace.collections[collectionIndex] = {
          ...workspace.collections[collectionIndex],
          ...updates,
          lastModified: Date.now()
        };
        workspace.lastModified = Date.now();
        break;
      }
    }
    
    await this.saveWorkspaces(workspaces);
  }

  async deleteCollection(collectionId: string): Promise<void> {
    const workspaces = await this.getWorkspaces();
    
    for (const workspace of workspaces) {
      const originalLength = workspace.collections.length;
      workspace.collections = workspace.collections.filter(c => c.id !== collectionId);
      if (workspace.collections.length !== originalLength) {
        workspace.lastModified = Date.now();
        break;
      }
    }
    
    await this.saveWorkspaces(workspaces);
  }

  // Session operations
  async getSessions(): Promise<SavedSession[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.SESSIONS);
      return result[STORAGE_KEYS.SESSIONS] || [];
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  async saveSessions(sessions: SavedSession[]): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions });
    } catch (error) {
      console.error('Error saving sessions:', error);
      throw error;
    }
  }

  async createSession(session: Omit<SavedSession, 'id' | 'created'>): Promise<SavedSession> {
    const newSession: SavedSession = {
      ...session,
      id: this.generateId(),
      created: Date.now()
    };

    const sessions = await this.getSessions();
    sessions.push(newSession);
    await this.saveSessions(sessions);
    
    return newSession;
  }

  // Tab data operations
  async getTabData(): Promise<{ [tabId: number]: TabData }> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.TAB_DATA);
      return result[STORAGE_KEYS.TAB_DATA] || {};
    } catch (error) {
      console.error('Error getting tab data:', error);
      return {};
    }
  }

  async saveTabData(tabData: { [tabId: number]: TabData }): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.TAB_DATA]: tabData });
    } catch (error) {
      console.error('Error saving tab data:', error);
      throw error;
    }
  }

  async updateTabData(tabId: number, updates: Partial<TabData>): Promise<void> {
    const tabData = await this.getTabData();
    if (tabData[tabId]) {
      tabData[tabId] = { ...tabData[tabId], ...updates };
      await this.saveTabData(tabData);
    }
  }

  // Analytics operations
  async getAnalytics(): Promise<Analytics> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.ANALYTICS);
      return result[STORAGE_KEYS.ANALYTICS] || {
        tabUsage: [],
        workspaceStats: [],
        sessionStats: [],
        performanceHistory: []
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        tabUsage: [],
        workspaceStats: [],
        sessionStats: [],
        performanceHistory: []
      };
    }
  }

  async saveAnalytics(analytics: Analytics): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.ANALYTICS]: analytics });
    } catch (error) {
      console.error('Error saving analytics:', error);
      throw error;
    }
  }

  // Performance metrics operations
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.PERFORMANCE_METRICS);
      return result[STORAGE_KEYS.PERFORMANCE_METRICS] || {
        totalTabsManaged: 0,
        hibernatedTabs: 0,
        memorySavedMB: 0,
        cpuSavedPercent: 0,
        lastCalculated: Date.now()
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        totalTabsManaged: 0,
        hibernatedTabs: 0,
        memorySavedMB: 0,
        cpuSavedPercent: 0,
        lastCalculated: Date.now()
      };
    }
  }

  async savePerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.PERFORMANCE_METRICS]: metrics });
    } catch (error) {
      console.error('Error saving performance metrics:', error);
      throw error;
    }
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async clearAllData(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  async getStorageUsage(): Promise<{ bytesInUse: number; quota: number }> {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse();
      return {
        bytesInUse,
        quota: chrome.storage.local.QUOTA_BYTES || 5242880 // 5MB default
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { bytesInUse: 0, quota: 5242880 };
    }
  }
}