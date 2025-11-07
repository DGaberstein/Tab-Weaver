// Background Service Worker - The Tab Weaver Core Engine
// Handles tab hibernation, performance monitoring, and message routing

class TabWeaverBackground {
  constructor() {
    this.hibernationTimer = null;
    this.tabDataCache = {};
    this.lastActivityCheck = Date.now();
    this.initialize();
  }

  async initialize() {
    try {
      console.log('Tab Weaver Background Service Worker initializing...');
      
      // Check if Chrome APIs are available
      if (!chrome || !chrome.runtime) {
        throw new Error('Chrome runtime APIs not available');
      }
      
      // Load existing tab data
      try {
        const result = await chrome.storage.local.get('tabData');
        this.tabDataCache = result.tabData || {};
      } catch (error) {
        console.error('Error loading tab data:', error);
        this.tabDataCache = {};
      }
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start hibernation monitoring
      this.startHibernationMonitoring();
      
      // Initialize performance tracking
      await this.initializePerformanceTracking();
      
      console.log('Tab Weaver Background Service Worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Tab Weaver:', error);
      // Try again after a delay
      setTimeout(() => {
        this.initialize().catch(retryError => {
          console.error('Retry initialization failed:', retryError);
        });
      }, 2000);
    }
  }

  setupEventListeners() {
    try {
      // Tab events
      if (chrome.tabs) {
        chrome.tabs.onCreated.addListener((tab) => this.handleTabCreated(tab));
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => this.handleTabUpdated(tabId, changeInfo, tab));
        chrome.tabs.onRemoved.addListener((tabId) => this.handleTabRemoved(tabId));
        chrome.tabs.onActivated.addListener((activeInfo) => this.handleTabActivated(activeInfo));
      }

      // Message handling
      if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          this.handleMessage(message, sender, sendResponse);
          return true; // Keep message channel open for async response
        });
      }

      // Command handling
      if (chrome.commands) {
        chrome.commands.onCommand.addListener((command) => this.handleCommand(command));
      }

      // Alarm handling for periodic tasks
      if (chrome.alarms) {
        chrome.alarms.onAlarm.addListener((alarm) => this.handleAlarm(alarm));
      }

      // Context menu
      this.setupContextMenu();

      // Startup/install events
      if (chrome.runtime) {
        chrome.runtime.onStartup.addListener(() => this.handleStartup());
        chrome.runtime.onInstalled.addListener((details) => this.handleInstall(details));
      }
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  async handleTabCreated(tab) {
    if (!tab.id) return;

    const tabData = {
      id: tab.id,
      url: tab.url || '',
      title: tab.title || '',
      favIconUrl: tab.favIconUrl,
      windowId: tab.windowId,
      index: tab.index,
      active: tab.active,
      pinned: tab.pinned,
      audible: tab.audible || false,
      mutedInfo: tab.mutedInfo,
      timeOpened: Date.now(),
      timeLastActive: tab.active ? Date.now() : 0,
      totalActiveDuration: 0,
      hibernated: false,
      hibernationCount: 0,
      hasUnsavedData: false
    };

    this.tabDataCache[tab.id] = tabData;
    await this.saveTabData();
    
    // Update performance metrics
    await this.updatePerformanceMetrics();
  }

  async handleTabUpdated(tabId, changeInfo, tab) {
    if (!this.tabDataCache[tabId]) {
      await this.handleTabCreated(tab);
      return;
    }

    const updates = {};

    if (changeInfo.url) updates.url = changeInfo.url;
    if (changeInfo.title) updates.title = changeInfo.title;
    if (changeInfo.favIconUrl) updates.favIconUrl = changeInfo.favIconUrl;
    if (changeInfo.pinned !== undefined) updates.pinned = changeInfo.pinned;
    if (changeInfo.audible !== undefined) updates.audible = changeInfo.audible;
    if (changeInfo.mutedInfo) updates.mutedInfo = changeInfo.mutedInfo;

    // Handle status changes that affect hibernation
    if (changeInfo.status === 'complete') {
      // Tab finished loading, check for forms
      try {
        chrome.tabs.sendMessage(tabId, { type: 'CHECK_FORM_DATA' });
      } catch (error) {
        // Ignore if content script not ready
      }
    }

    if (Object.keys(updates).length > 0) {
      Object.assign(this.tabDataCache[tabId], updates);
      await this.saveTabData();
    }
  }

  async handleTabRemoved(tabId) {
    delete this.tabDataCache[tabId];
    await this.saveTabData();
    await this.updatePerformanceMetrics();
  }

  async handleTabActivated(activeInfo) {
    const { tabId, windowId } = activeInfo;
    
    if (this.tabDataCache[tabId]) {
      const now = Date.now();
      const tabData = this.tabDataCache[tabId];
      
      // Update activity tracking
      if (tabData.timeLastActive > 0) {
        tabData.totalActiveDuration += now - tabData.timeLastActive;
      }
      
      tabData.timeLastActive = now;
      tabData.active = true;
      
      // If tab was hibernated, restore it
      if (tabData.hibernated) {
        await this.restoreTab(tabId);
      }

      // Mark other tabs in the same window as inactive
      Object.values(this.tabDataCache).forEach(tab => {
        if (tab.windowId === windowId && tab.id !== tabId) {
          tab.active = false;
        }
      });

      await this.saveTabData();
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'HIBERNATE_TAB':
          await this.hibernateTab(message.tabId);
          sendResponse({ success: true });
          break;

        case 'RESTORE_TAB':
          await this.restoreTab(message.tabId);
          sendResponse({ success: true });
          break;

        case 'GET_TAB_DATA':
          if (message.tabId) {
            sendResponse(this.tabDataCache[message.tabId]);
          } else {
            sendResponse(this.tabDataCache);
          }
          break;

        case 'UPDATE_TAB_ACTIVITY':
          if (this.tabDataCache[message.tabId]) {
            this.tabDataCache[message.tabId].timeLastActive = message.timestamp;
            await this.saveTabData();
          }
          sendResponse({ success: true });
          break;

        case 'GET_PERFORMANCE_METRICS':
          const metrics = await this.getPerformanceMetrics();
          sendResponse(metrics);
          break;

        case 'FORM_DATA_DETECTED':
          if (sender.tab && this.tabDataCache[sender.tab.id]) {
            this.tabDataCache[sender.tab.id].hasUnsavedData = message.hasUnsavedData;
            await this.saveTabData();
          }
          sendResponse({ success: true });
          break;

        case 'PAGE_ACTIVITY':
          if (sender.tab && this.tabDataCache[sender.tab.id]) {
            this.tabDataCache[sender.tab.id].timeLastActive = message.timestamp;
            await this.saveTabData();
          }
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async handleCommand(command) {
    switch (command) {
      case 'open-command-palette':
        await this.openCommandPalette();
        break;
      case 'hibernate-current-tab':
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (currentTab.id) {
          await this.hibernateTab(currentTab.id);
        }
        break;
    }
  }

  async handleAlarm(alarm) {
    switch (alarm.name) {
      case 'hibernation-check':
        await this.checkForHibernation();
        break;
      case 'performance-update':
        await this.updatePerformanceMetrics();
        break;
    }
  }

  setupContextMenu() {
    chrome.contextMenus.create({
      id: 'hibernate-tab',
      title: 'Hibernate Tab',
      contexts: ['page']
    });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      switch (info.menuItemId) {
        case 'hibernate-tab':
          if (tab?.id) await this.hibernateTab(tab.id);
          break;
      }
    });
  }

  async handleStartup() {
    console.log('Tab Weaver startup');
    await this.syncExistingTabs();
  }

  async handleInstall(details) {
    if (details.reason === 'install') {
      console.log('Tab Weaver installed');
      chrome.tabs.create({ url: chrome.runtime.getURL('dist/options.html') });
    }
    await this.syncExistingTabs();
  }

  async syncExistingTabs() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && !this.tabDataCache[tab.id]) {
        await this.handleTabCreated(tab);
      }
    }
  }

  startHibernationMonitoring() {
    // Create alarm for periodic hibernation checks
    chrome.alarms.create('hibernation-check', { periodInMinutes: 1 });
    chrome.alarms.create('performance-update', { periodInMinutes: 5 });
  }

  async checkForHibernation() {
    const settings = await this.getSettings();
    if (!settings.hibernation.enabled) return;

    const now = Date.now();
    const thresholdMs = settings.hibernation.timeThreshold * 60 * 1000;

    for (const [tabIdStr, tabData] of Object.entries(this.tabDataCache)) {
      const tabId = parseInt(tabIdStr);
      
      if (await this.shouldHibernateTab(tabId, tabData, settings.hibernation, now, thresholdMs)) {
        await this.hibernateTab(tabId);
      }
    }
  }

  async shouldHibernateTab(tabId, tabData, settings, now, thresholdMs) {
    // Already hibernated
    if (tabData.hibernated) return false;

    // Currently active
    if (tabData.active) return false;

    // Pinned tabs (if excluded)
    if (settings.excludePinned && tabData.pinned) return false;

    // Audible tabs (if excluded)
    if (settings.excludeAudible && tabData.audible) return false;

    // Tabs with unsaved form data (if excluded)
    if (settings.excludeWithForms && tabData.hasUnsavedData) return false;

    // Check time threshold
    const timeSinceActive = now - tabData.timeLastActive;
    return timeSinceActive > thresholdMs;
  }

  async hibernateTab(tabId) {
    try {
      await chrome.tabs.discard(tabId);
      
      if (this.tabDataCache[tabId]) {
        this.tabDataCache[tabId].hibernated = true;
        this.tabDataCache[tabId].hibernationCount++;
        await this.saveTabData();
      }

      console.log(`Tab ${tabId} hibernated`);
      await this.updatePerformanceMetrics();
    } catch (error) {
      console.error(`Failed to hibernate tab ${tabId}:`, error);
    }
  }

  async restoreTab(tabId) {
    try {
      if (this.tabDataCache[tabId]) {
        this.tabDataCache[tabId].hibernated = false;
        await this.saveTabData();
      }

      console.log(`Tab ${tabId} restored`);
      await this.updatePerformanceMetrics();
    } catch (error) {
      console.error(`Failed to restore tab ${tabId}:`, error);
    }
  }

  async openCommandPalette() {
    chrome.action.openPopup();
  }

  async updatePerformanceMetrics() {
    const totalTabs = Object.keys(this.tabDataCache).length;
    const hibernatedTabs = Object.values(this.tabDataCache).filter(tab => tab.hibernated).length;
    
    const metrics = {
      totalTabsManaged: totalTabs,
      hibernatedTabs,
      memorySavedMB: hibernatedTabs * 50, // Rough estimate
      cpuSavedPercent: (hibernatedTabs / Math.max(totalTabs, 1)) * 20,
      lastCalculated: Date.now()
    };

    await chrome.storage.local.set({ performanceMetrics: metrics });
  }

  async initializePerformanceTracking() {
    await this.updatePerformanceMetrics();
  }

  async saveTabData() {
    try {
      await chrome.storage.local.set({ tabData: this.tabDataCache });
    } catch (error) {
      console.error('Error saving tab data:', error);
    }
  }

  async getSettings() {
    try {
      const result = await chrome.storage.local.get('settings');
      return result.settings || {
        hibernation: {
          enabled: true,
          timeThreshold: 15,
          excludePinned: true,
          excludeAudible: true,
          excludeWithForms: true
        }
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        hibernation: {
          enabled: true,
          timeThreshold: 15,
          excludePinned: true,
          excludeAudible: true,
          excludeWithForms: true
        }
      };
    }
  }

  async getPerformanceMetrics() {
    try {
      const result = await chrome.storage.local.get('performanceMetrics');
      return result.performanceMetrics || {
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
}

// Initialize the background service worker safely
let tabWeaver = null;

// Initialize when service worker starts
if (typeof chrome !== 'undefined' && chrome.runtime) {
  try {
    tabWeaver = new TabWeaverBackground();
  } catch (error) {
    console.error('Error initializing TabWeaver:', error);
    // Retry initialization after a delay
    setTimeout(() => {
      try {
        tabWeaver = new TabWeaverBackground();
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }, 1000);
  }
} else {
  // If Chrome APIs not ready, wait and retry
  setTimeout(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      tabWeaver = new TabWeaverBackground();
    }
  }, 500);
}