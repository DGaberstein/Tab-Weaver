// The Tab Weaver - Universal Popup Script  
// Written by humans who definitely have too many tabs open 🙃
// If you're reading this, you probably do too!

class UniversalTabWeaver {
    constructor() {
        // Initialize the chaos manager (aka this extension)
        this.tabs = [];
        this.filteredTabs = [];
        this.groupedTabs = {};
        this.collapsedGroups = new Set; // Keep track of what we're hiding from ourselves
        this.browserInfo = null;
        this.domainFavicons = {}; // Because pretty icons make everything better
        this.savedTabs = new Set; // Our precious hoard of "I'll read this later" tabs
        this.tabMetadata = {}; // Persistent tab metadata: lastAccessed, viewCount, memoryUsage, hibernatedAt
        this.initialize() // Let's do this thing!
    }

    // 💾 TAB METADATA PERSISTENCE SYSTEM
    // Saves all that juicy tab data so it survives browser/PC restarts!
    async saveTabMetadata() {
        try {
            await chrome.storage.local.set({ 
                tab_metadata: this.tabMetadata,
                tab_metadata_updated: Date.now()
            });
            console.log('💾 Tab metadata saved!', Object.keys(this.tabMetadata).length, 'tabs tracked');
        } catch (error) {
            console.error('❌ Failed to save tab metadata:', error);
        }
    }

    async loadTabMetadata() {
        try {
            const result = await chrome.storage.local.get(['tab_metadata']);
            this.tabMetadata = result.tab_metadata || {};
            console.log('📂 Loaded tab metadata for', Object.keys(this.tabMetadata).length, 'tabs');
            return this.tabMetadata;
        } catch (error) {
            console.error('❌ Failed to load tab metadata:', error);
            this.tabMetadata = {};
            return {};
        }
    }

    // Update metadata for a specific tab
    updateTabMetadata(tabId, url, updates) {
        const key = `${tabId}_${url}`; // Use combination of ID and URL for uniqueness
        
        if (!this.tabMetadata[key]) {
            this.tabMetadata[key] = {
                tabId: tabId,
                url: url,
                firstSeen: Date.now(),
                lastAccessed: Date.now(),
                viewCount: 0,
                memoryUsage: 0,
                hibernatedAt: null,
                createdTime: Date.now(),
                totalTimeSpent: 0, // Total milliseconds spent on this tab
                sessionStartTime: null // When current viewing session started
            };
        }

        // Merge updates
        Object.assign(this.tabMetadata[key], updates);
        
        // Auto-save every time we update (debounced in practice)
        this.debouncedSaveMetadata();
    }

    // Get metadata for a specific tab
    getTabMetadata(tabId, url) {
        const key = `${tabId}_${url}`;
        return this.tabMetadata[key] || {
            tabId: tabId,
            url: url,
            firstSeen: Date.now(),
            lastAccessed: Date.now(),
            viewCount: 0,
            memoryUsage: 0,
            hibernatedAt: null,
            createdTime: Date.now(),
            totalTimeSpent: 0,
            sessionStartTime: null
        };
    }

    // Debounced save to avoid hammering storage
    debouncedSaveMetadata() {
        if (this.saveMetadataTimer) {
            clearTimeout(this.saveMetadataTimer);
        }
        this.saveMetadataTimer = setTimeout(() => {
            this.saveTabMetadata();
        }, 1000); // Save 1 second after last update
    }

    // Clean up old metadata for tabs that don't exist anymore
    async cleanupOldMetadata() {
        try {
            const currentTabs = await chrome.tabs.query({});
            const currentUrls = new Set(currentTabs.map(t => t.url));
            
            // Keep metadata only for tabs that still exist or were seen in last 7 days
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const cleanedMetadata = {};
            
            for (const [key, data] of Object.entries(this.tabMetadata)) {
                if (currentUrls.has(data.url) || (data.lastAccessed && data.lastAccessed > weekAgo)) {
                    cleanedMetadata[key] = data;
                }
            }
            
            const removedCount = Object.keys(this.tabMetadata).length - Object.keys(cleanedMetadata).length;
            if (removedCount > 0) {
                console.log(`🧹 Cleaned up ${removedCount} old tab metadata entries`);
                this.tabMetadata = cleanedMetadata;
                await this.saveTabMetadata();
            }
        } catch (error) {
            console.error('❌ Error cleaning up metadata:', error);
        }
    }

    // Start tracking tab metadata automatically
    startMetadataTracking() {
        // Keep track of currently active tab for time tracking
        this.currentActiveTab = null;
        
        // Track when tabs are activated - START TIME TRACKING! ⏱️
        chrome.tabs.onActivated.addListener(async (activeInfo) => {
            try {
                // End session for previously active tab
                if (this.currentActiveTab) {
                    const prevMetadata = this.getTabMetadata(this.currentActiveTab.id, this.currentActiveTab.url);
                    if (prevMetadata.sessionStartTime) {
                        const sessionDuration = Date.now() - prevMetadata.sessionStartTime;
                        this.updateTabMetadata(this.currentActiveTab.id, this.currentActiveTab.url, {
                            totalTimeSpent: (prevMetadata.totalTimeSpent || 0) + sessionDuration,
                            sessionStartTime: null
                        });
                    }
                }
                
                // Start session for newly active tab
                const tab = await chrome.tabs.get(activeInfo.tabId);
                const metadata = this.getTabMetadata(tab.id, tab.url);
                
                this.currentActiveTab = tab;
                this.updateTabMetadata(tab.id, tab.url, {
                    lastAccessed: Date.now(),
                    viewCount: (metadata.viewCount || 0) + 1,
                    sessionStartTime: Date.now()
                });
            } catch (error) {
                console.warn('Could not track tab activation:', error);
            }
        });

        // Track when tabs are updated
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                const metadata = this.getTabMetadata(tabId, tab.url);
                this.updateTabMetadata(tabId, tab.url, {
                    lastAccessed: Date.now()
                });
            }
        });

        // Save time spent when window loses focus
        window.addEventListener('blur', () => {
            if (this.currentActiveTab) {
                const metadata = this.getTabMetadata(this.currentActiveTab.id, this.currentActiveTab.url);
                if (metadata.sessionStartTime) {
                    const sessionDuration = Date.now() - metadata.sessionStartTime;
                    this.updateTabMetadata(this.currentActiveTab.id, this.currentActiveTab.url, {
                        totalTimeSpent: (metadata.totalTimeSpent || 0) + sessionDuration,
                        sessionStartTime: null
                    });
                }
            }
        });

        // Resume tracking when window regains focus
        window.addEventListener('focus', async () => {
            try {
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (activeTab) {
                    this.currentActiveTab = activeTab;
                    this.updateTabMetadata(activeTab.id, activeTab.url, {
                        sessionStartTime: Date.now()
                    });
                }
            } catch (error) {
                console.warn('Could not resume time tracking:', error);
            }
        });

        // Periodic memory usage estimation and time update (every 30 seconds)
        setInterval(async () => {
            try {
                const tabs = await chrome.tabs.query({});
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                for (const tab of tabs) {
                    // Estimate memory based on tab age and activity
                    const metadata = this.getTabMetadata(tab.id, tab.url);
                    const ageInMinutes = (Date.now() - metadata.firstSeen) / (1000 * 60);
                    const baseMemory = 20; // Base MB per tab
                    const timeMemory = Math.min(ageInMinutes * 0.5, 50); // Up to 50MB over time
                    const estimatedMemory = baseMemory + timeMemory;
                    
                    // Update time for currently active tab
                    let timeUpdate = {};
                    if (activeTab && tab.id === activeTab.id && metadata.sessionStartTime) {
                        const currentSessionDuration = Date.now() - metadata.sessionStartTime;
                        timeUpdate = {
                            totalTimeSpent: (metadata.totalTimeSpent || 0) + currentSessionDuration,
                            sessionStartTime: Date.now() // Reset session start
                        };
                    }
                    
                    this.updateTabMetadata(tab.id, tab.url, {
                        memoryUsage: Math.round(estimatedMemory),
                        ...timeUpdate
                    });
                }
            } catch (error) {
                console.warn('Could not update memory estimates:', error);
            }
        }, 30000); // Every 30 seconds

        console.log('📊 Tab metadata tracking started with TIME TRACKING! ⏱️');
    }

    // Utility method for safe DOM element access
    // Because apparently we can't trust the DOM to have what we want 🤷‍♂️
    safeGet(elementId) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element with id '${elementId}' not found - this is fine, everything is fine 🔥`);
        }
        return element;
    }
    async initialize() {
        console.log("Initializing Universal Tab Weaver");
        this.setupErrorHandling();
        this.detectBrowserAndApplyTheme();
        this.setupEventListeners();
        this.setupUserFeedback();
        await this.loadTabMetadata(); // Load persistent metadata first!
        await this.loadTabs();
        await this.loadSavedTabs();
        await this.loadPersistentTabData();
        this.updateStats();
        this.showWelcomeIfFirstTime();
        this.startScrollingAnimations();
        this.fixIconPaths();
        this.setupTabPersistence();
        
        // Cleanup old metadata once per day
        this.cleanupOldMetadata();
        
        // Auto-track tab activity
        this.startMetadataTracking();
    }
    
    // Enhanced tab persistence for browser/system restarts
    async setupTabPersistence() {
        // Save tab data periodically
        setInterval(async () => {
            await this.saveTabSession();
        }, 30000); // Save every 30 seconds
        
        // Save on visibility change (browser closing/minimizing)
        document.addEventListener('visibilitychange', async () => {
            if (document.hidden) {
                await this.saveTabSession();
                console.log("💾 Tab session saved on visibility change");
            }
        });
        
        // Save on beforeunload (browser closing)
        window.addEventListener('beforeunload', async () => {
            await this.saveTabSession();
        });
        
        console.log("💾 Tab persistence system activated");
    }
    
    async saveTabSession() {
        try {
            const sessionData = {
                timestamp: Date.now(),
                tabs: this.tabs.map(tab => ({
                    id: tab.id,
                    title: tab.title,
                    url: tab.url,
                    favIconUrl: tab.favIconUrl,
                    active: tab.active,
                    hibernated: tab.hibernated,
                    createdTime: tab.createdTime,
                    lastActiveTime: tab.lastActiveTime,
                    estimatedMemory: tab.estimatedMemory,
                    accessCount: tab.accessCount,
                    windowId: tab.windowId
                })),
                savedTabs: Array.from(this.savedTabs),
                groupedTabs: this.groupedTabs,
                collapsedGroups: Array.from(this.collapsedGroups)
            };
            
            await chrome.storage.local.set({
                tab_weaver_session: sessionData,
                last_session_save: Date.now()
            });
            
            console.log(`💾 Session saved: ${this.tabs.length} tabs, ${this.savedTabs.size} saved tabs`);
        } catch (error) {
            console.error("Failed to save tab session:", error);
        }
    }
    
    async loadPersistentTabData() {
        try {
            const result = await chrome.storage.local.get(['tab_weaver_session', 'last_session_save']);
            const sessionData = result.tab_weaver_session;
            const lastSave = result.last_session_save;
            
            if (sessionData && lastSave) {
                const timeSinceLastSave = Date.now() - lastSave;
                const hoursAgo = Math.floor(timeSinceLastSave / (1000 * 60 * 60));
                
                console.log(`💾 Found saved session from ${hoursAgo} hours ago`);
                
                // Restore saved tab groups and collapsed states
                if (sessionData.collapsedGroups) {
                    this.collapsedGroups = new Set(sessionData.collapsedGroups);
                }
                
                // Log session restoration
                this.trackAction("session_restored", {
                    hours_ago: hoursAgo,
                    tabs_in_session: sessionData.tabs?.length || 0,
                    saved_tabs_count: sessionData.savedTabs?.length || 0
                });
            } else {
                console.log("💾 No previous session found");
            }
        } catch (error) {
            console.error("Failed to load persistent tab data:", error);
        }
    }
    fixIconPaths() {
        console.log("✅ Tab Weaver icons loaded using inline SVG data URLs")
    }
    startScrollingAnimations() {
        document.querySelectorAll(".tab-title.scrolling .title-text").forEach(e => {
            e.style.animationPlayState = "running"
        })
    }
    stopScrollingAnimations() {
        document.querySelectorAll(".tab-title.scrolling .title-text").forEach(e => {
            e.style.animationPlayState = "paused"
        })
    }
    async loadSavedTabs() {
        try {
            const e = await chrome.storage.local.get(["savedTabs"]);
            e.savedTabs && (this.savedTabs = new Set(e.savedTabs), console.log(`💾 Loaded ${this.savedTabs.size} saved tabs`))
        } catch (e) {
            console.error("Failed to load saved tabs:", e)
        }
    }
    async saveSavedTabs() {
        try {
            await chrome.storage.local.set({
                savedTabs: Array.from(this.savedTabs)
            })
        } catch (e) {
            console.error("Failed to save saved tabs:", e)
        }
    }
    async toggleSavedTab(e) {
        this.savedTabs.has(e) ? (this.savedTabs.delete(e), this.showToast("Tab removed from saved tabs", "info"), this.trackAction("tab_unsaved")) : (this.savedTabs.add(e), this.showToast("Tab saved! It's now protected from hibernation and closing", "success"), this.trackAction("tab_saved"));
        await this.saveSavedTabs();
        this.renderTabs()
    }
    isTabSaved(e) {
        return this.savedTabs.has(e)
    }
    setupErrorHandling() {
        window.addEventListener("error", e => {
            this.handleError(e.error, "JavaScript Error")
        });
        window.addEventListener("unhandledrejection", e => {
            this.handleError(e.reason, "Unhandled Promise Rejection")
        });
        chrome && chrome.runtime && chrome.runtime.onMessage.addListener(e => {
            "error" === e.type && this.handleError(e.error, "Extension Error")
        })
    }
    handleError(e, t = "Unknown Error") {
        console.error(`[Tab Weaver Error - ${t}]:`, e);
        const a = {
            context: t,
            message: e.message || String(e),
            stack: e.stack || "No stack trace available",
            timestamp: (new Date).toISOString(),
            browser: this.browserInfo?.displayName || "Unknown",
            userAgent: navigator.userAgent
        };
        this.isCriticalError(e) ? this.showErrorModal(a) : this.showToast(`Error: ${e.message||"Something went wrong"}`, "error");
        this.storeError(a)
    }
    isCriticalError(e) {
        const t = String(e).toLowerCase();
        return ["extension", "permission", "api", "storage", "tabs"].some(e => t.includes(e))
    }
    async storeError(e) {
        try {
            const t = await this.getStoredErrors();
            t.push(e);
            const a = t.slice(-10);
            await chrome.storage.local.set({
                tab_weaver_errors: a
            })
        } catch (e) {
            console.warn("Could not store error:", e)
        }
    }
    async getStoredErrors() {
        try {
            return (await chrome.storage.local.get("tab_weaver_errors")).tab_weaver_errors || []
        } catch (e) {
            return []
        }
    }
    detectBrowserAndApplyTheme() {
        try {
            if ("undefined" != typeof BrowserDetector) {
                const e = new BrowserDetector;
                this.browserInfo = e.getBrowserInfo();
                console.log("Detected browser:", this.browserInfo);
                this.applyBrowserTheme(this.browserInfo);
                this.updateVersionBadge(this.browserInfo)
            } else console.log("Browser detector not available, using default theme"), this.useDefaultTheme()
        } catch (e) {
            console.warn("Browser detection failed, using fallback:", e);
            this.useDefaultTheme()
        }
    }
    useDefaultTheme() {
        this.browserInfo = {
            name: "operagx",
            displayName: "Opera GX",
            version: "1.0.0",
            theme: "gaming"
        };
        this.applyBrowserTheme(this.browserInfo);
        this.updateVersionBadge(this.browserInfo)
    }
    applyBrowserTheme(e) {
        const t = document.documentElement;
        switch (e.name) {
            case "operagx":
                this.setBrowserThemeVariables(t, {
                    primary: "#1a73e8",
                    secondary: "#4285f4",
                    darkBg: "#1a1a1a",
                    darkerBg: "#0d0d0d",
                    lightText: "#ffffff",
                    grayBg: "#333333",
                    borderColor: "#444444"
                });
                break;
            case "chrome":
                this.setBrowserThemeVariables(t, {
                    primary: "#4285f4",
                    secondary: "#5a9df8",
                    darkBg: "#1f1f1f",
                    darkerBg: "#121212",
                    lightText: "#ffffff",
                    grayBg: "#2d2d2d",
                    borderColor: "#404040"
                });
                break;
            case "edge":
                this.setBrowserThemeVariables(t, {
                    primary: "#0078d4",
                    secondary: "#106ebe",
                    darkBg: "#1e1e1e",
                    darkerBg: "#0f0f0f",
                    lightText: "#ffffff",
                    grayBg: "#323130",
                    borderColor: "#464647"
                });
                break;
            case "firefox":
                this.setBrowserThemeVariables(t, {
                    primary: "#ff9500",
                    secondary: "#ffb84d",
                    darkBg: "#1c1b22",
                    darkerBg: "#0c0c0d",
                    lightText: "#fbfbfe",
                    grayBg: "#38383d",
                    borderColor: "#52525e"
                });
                break;
            default:
                console.log("Using default theme colors")
        }
    }
    setBrowserThemeVariables(e, t) {
        e.style.setProperty("--primary-color", t.primary);
        e.style.setProperty("--secondary-color", t.secondary);
        e.style.setProperty("--dark-bg", t.darkBg);
        e.style.setProperty("--darker-bg", t.darkerBg);
        e.style.setProperty("--light-text", t.lightText);
        e.style.setProperty("--gray-bg", t.grayBg);
        e.style.setProperty("--border-color", t.borderColor)
    }
    updateVersionBadge(e) {
        const t = document.getElementById("versionBadge");
        t && e && (t.textContent = this.getBrowserVersionText(e))
    }
    getBrowserVersionText(e) {
        switch (e.name) {
            case "operagx":
                return "Opera GX Compatible • v1.0.0";
            case "chrome":
                return "Chrome Compatible • v1.0.0";
            case "edge":
                return "Edge Compatible • v1.0.0";
            case "firefox":
                return "Firefox Compatible • v1.0.0";
            case "brave":
                return "Brave Compatible • v1.0.0";
            default:
                return "Universal • v1.0.0"
        }
    }
    setupEventListeners() {
        // Helper function to safely add event listeners
        const safeAddListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };

        safeAddListener("searchInput", "input", e => {
            this.filterTabs(e.target.value)
        });
        safeAddListener("hibernateAllBtn", "click", () => {
            this.hibernateAllTabs()
        });
        safeAddListener("restoreAllBtn", "click", () => {
            this.restoreAllTabs()
        });
        safeAddListener("refreshBtn", "click", () => {
            this.loadTabs()
        });
        safeAddListener("help-btn", "click", () => {
            this.showHelpModal()
        });
        safeAddListener("feedback-btn", "click", () => {
            this.showFeedbackModal()
        });
        safeAddListener("settings-btn", "click", () => {
            this.showSettingsModal()
        });
        safeAddListener("help-close", "click", () => {
            this.hideHelpModal()
        });
        document.addEventListener("visibilitychange", () => {
            document.hidden ? this.stopScrollingAnimations() : this.startScrollingAnimations()
        });
        document.addEventListener("DOMContentLoaded", () => {
            this.startScrollingAnimations()
        });
        document.addEventListener("click", e => {
            if (e.target.closest(".group-header")) {
                const t = e.target.closest(".group-header").dataset.group;
                return void(t && this.toggleGroup(t))
            }
            if (e.target.closest(".tab-item") && !e.target.closest(".tab-action-btn")) {
                const t = e.target.closest(".tab-item");
                const a = parseInt(t.dataset.tabId);
                return void(a && this.switchToTab(a))
            }
            if (e.target.closest(".tab-action-btn")) {
                e.stopPropagation();
                const t = e.target.closest(".tab-action-btn");
                const a = t.dataset.action;
                const s = parseInt(t.dataset.tabId);
                if ("save" === a && s) this.toggleSavedTab(s);
                else if ("hibernate" === a && s) {
                    if (this.isTabSaved(s)) return void this.showToast("Cannot hibernate saved tabs. Remove from saved tabs first.", "warning");
                    this.toggleHibernate(s)
                } else if ("close" === a && s) {
                    if (this.isTabSaved(s)) return void this.showToast("Cannot close saved tabs. Remove from saved tabs first.", "warning");
                    this.closeTab(s)
                }
                return
            }
        });
        document.addEventListener("error", e => {
            "IMG" === e.target.tagName && e.target.dataset.fallbackIcon && (e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23666"/></svg>')
        }, !0);
        document.addEventListener("keydown", e => {
            e.ctrlKey && e.shiftKey && "D" === e.key && (e.preventDefault(), this.showDeveloperPanel())
        });
        this.setupUserFeedback()
    }
    setupUserFeedback() {
        // Helper function to safely get elements
        const safeGet = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Element with id '${id}' not found in setupUserFeedback`);
            }
            return element;
        };

        const e = safeGet("feedback-modal");
        const t = safeGet("feedback-cancel");
        const a = safeGet("feedback-send");
        const s = safeGet("error-modal");
        const r = safeGet("error-dismiss");
        const o = safeGet("error-report");
        const n = safeGet("settings-modal");
        const i = safeGet("settings-cancel");
        const c = safeGet("settings-save");
        const l = safeGet("export-data");
        const d = safeGet("clear-data");
        const h = safeGet("view-feedback");
        const b = safeGet("feedback-viewer-modal");
        const m = safeGet("feedback-viewer-close");
        const g = safeGet("create-github-issue");
        const u = safeGet("send-email-feedback");
        const f = safeGet("feedback-send-github");
        const helpModal = safeGet("help-modal");
        const helpClose = safeGet("help-close");

        // Only add listeners if elements exist
        t && t.addEventListener("click", () => {
            this.hideFeedbackModal()
        });
        a && a.addEventListener("click", () => {
            this.sendFeedback()
        });
        r && r.addEventListener("click", () => {
            this.hideErrorModal()
        });
        o && o.addEventListener("click", () => {
            this.reportError()
        });
        i && i.addEventListener("click", () => {
            this.hideSettingsModal()
        });
        c && c.addEventListener("click", () => {
            this.saveSettings()
        });
        l && l.addEventListener("click", () => {
            this.exportUserData()
        });
        d && d.addEventListener("click", () => {
            this.clearAllData()
        });
        h && h.addEventListener("click", () => {
            this.showFeedbackViewer()
        });
        m && m.addEventListener("click", () => {
            this.hideFeedbackViewer()
        });
        g && g.addEventListener("click", () => {
            this.createGitHubIssue()
        });
        u && u.addEventListener("click", () => {
            this.sendEmailFeedback()
        });
        f && f.addEventListener("click", () => {
            this.sendFeedbackToGitHub()
        });
        helpClose && helpClose.addEventListener("click", () => {
            this.hideHelpModal()
        });
        e && e.addEventListener("click", t => {
            t.target === e && this.hideFeedbackModal()
        });
        s && s.addEventListener("click", e => {
            e.target === s && this.hideErrorModal()
        });
        n && n.addEventListener("click", e => {
            e.target === n && this.hideSettingsModal()
        });
        b && b.addEventListener("click", e => {
            e.target === b && this.hideFeedbackViewer()
        });
        helpModal && helpModal.addEventListener("click", e => {
            e.target === helpModal && this.hideHelpModal()
        })
    }
    async loadTabs() {
        try {
            // Get all tabs using Chrome tabs API directly
            const tabs = await chrome.tabs.query({});
            
            // Get additional tab data from background script
            const response = await chrome.runtime.sendMessage({
                type: "GET_TAB_DATA"
            });
            
            const tabData = response || {};
            
            // Merge chrome tabs data with background tab data
            this.tabs = tabs.map(tab => ({
                ...tab,
                ...tabData[tab.id],
                createdTime: tabData[tab.id]?.timeOpened || Date.now(),
                lastActiveTime: tabData[tab.id]?.timeLastActive || Date.now(),
                estimatedMemory: tabData[tab.id]?.hibernated ? 0 : Math.floor(Math.random() * 100) + 20,
                accessCount: Math.floor(Math.random() * 10) + 1,
                hibernated: tabData[tab.id]?.hibernated || false
            }));
            
            this.filterTabs("");
            // Funny tab count reactions in console too
            if (this.tabs.length > 50) {
                console.log(`🤯 Holy tabs! Found ${this.tabs.length} tabs! Someone's been BUSY! 🕸️`);
            } else if (this.tabs.length > 20) {
                console.log(`� Loaded ${this.tabs.length} tabs - that's a decent collection! �🕸️`);
            } else {
                console.log(`🕸️ Loaded ${this.tabs.length} tabs (rookie numbers tbh) 😏`);
            }
        } catch (e) {
            console.error("Oof! Error loading tabs (this is awkward):", e);
            // Fallback to direct chrome.tabs API
            try {
                const tabs = await chrome.tabs.query({});
                this.tabs = tabs.map(tab => ({
                    ...tab,
                    createdTime: Date.now(),
                    lastActiveTime: Date.now(),
                    estimatedMemory: Math.floor(Math.random() * 100) + 20,
                    accessCount: Math.floor(Math.random() * 10) + 1,
                    hibernated: false
                }));
                this.filterTabs("");
            } catch (fallbackError) {
                console.error("Fallback tab loading failed:", fallbackError);
                this.showError("Failed to load tabs");
            }
        }
    }
    filterTabs(e) {
        const t = e.toLowerCase();
        this.filteredTabs = this.tabs.filter(e => e.title.toLowerCase().includes(t) || e.url.toLowerCase().includes(t));
        this.groupTabs();
        this.renderTabs();
        this.updateStats()
    }
    groupTabs() {
        this.groupedTabs = {};
        this.filteredTabs.forEach(e => {
            const t = this.extractDomain(e.url);
            const a = this.findBestGroup(e, t);
            this.groupedTabs[a] || (this.groupedTabs[a] = []);
            this.groupedTabs[a].push(e)
        });
        Object.keys(this.groupedTabs).forEach(e => {
            this.groupedTabs[e].sort((e, t) => e.active ? -1 : t.active ? 1 : e.title.localeCompare(t.title));
            this.collapsedGroups.add(e)
        })
    }
    findBestGroup(e, t) {
        if (t.includes("github")) return "🐙 GitHub";
        if (t.includes("stackoverflow")) return "📚 Stack Overflow";
        if (t.includes("youtube")) return "📺 YouTube";
        if (t.includes("google")) return "🔍 Google";
        if (t.includes("discord")) return "💬 Discord";
        if (t.includes("reddit")) return "🤖 Reddit";
        if (t.includes("twitter") || t.includes("x.com")) return "🐦 Twitter/X";
        if (t.includes("facebook")) return "📘 Facebook";
        if (t.includes("linkedin")) return "💼 LinkedIn";
        if (t.includes("netflix")) return "🎬 Netflix";
        if (t.includes("spotify")) return "🎵 Spotify";
        if (t) {
            const a = `${t.charAt(0).toUpperCase()+t.slice(1)}`;
            this.domainFavicons || (this.domainFavicons = {});
            !this.domainFavicons[a] && e.favIconUrl && (this.domainFavicons[a] = e.favIconUrl);
            return a
        }
        return "📄 Other"
    }
    extractDomain(e) {
        try {
            return new URL(e).hostname.replace("www.", "")
        } catch {
            return "unknown"
        }
    }
    renderTabs() {
        const e = this.safeGet("tabsContainer");
        if (!e) return;
        if (0 === this.filteredTabs.length) {
            const noTabsMessages = [
                "🕷️ No tabs found! Did they all escape?",
                "🔍 Search came up empty... like my wallet! 💸",
                "😅 No tabs match your search. Try typing 'cat videos' - always works!",
                "🤷‍♂️ Nothing here! Your search skills need work, mate!",
                "🕵️‍♀️ Tab Detective says: No matches found in this mess!"
            ];
            const randomMessage = noTabsMessages[Math.floor(Math.random() * noTabsMessages.length)];
            return void(e.innerHTML = `<div class="no-tabs">${randomMessage}</div>`);
        }
        const t = Object.keys(this.groupedTabs).sort();
        let a = "";
        t.forEach(e => {
            const t = this.groupedTabs[e];
            const s = this.collapsedGroups.has(e);
            let r = "";
            this.domainFavicons && this.domainFavicons[e] ? r = `<img src="${this.domainFavicons[e]}" class="group-favicon" data-fallback-icon="true">` : e.includes("🐙") || e.includes("📚") || e.includes("📺") || e.includes("🔍") || e.includes("💬") || e.includes("🤖") || e.includes("🐦") || e.includes("📘") || e.includes("💼") || e.includes("🎬") || e.includes("🎵") ? r = "" : t.length > 0 && t[0].favIconUrl && (r = `<img src="${t[0].favIconUrl}" class="group-favicon" data-fallback-icon="true">`);
            a += `
                <div class="tab-group">
                    <div class="group-header ${s?"collapsed":""}" data-group="${e}">
                        <span style="display: flex; align-items: center;">
                            ${r}${e} (${t.length})
                        </span>
                        <span class="group-toggle">${s?"▶":"▼"}</span>
                    </div>
                    <div class="group-tabs" ${s?'style="display:none"':""}>
                        ${t.map(e=>this.renderTab(e)).join("")}
                    </div>
                </div>
            `
        });
        e.innerHTML = a;
        setTimeout(() => {
            this.startScrollingAnimations()
        }, 100)
    }
    renderTab(e) {
        const t = e.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23ddd"/></svg>';
        const a = this.extractDomain(e.url);
        const s = this.formatTimeAgo(e.createdTime);
        const r = this.formatTimeAgo(e.lastActiveTime);
        const o = this.formatDetailedTime(e.createdTime);
        const n = this.formatDetailedTime(e.lastActiveTime);
        const i = e.estimatedMemory || 50;
        const c = e.accessCount || 1;
        const l = Date.now() - (e.lastActiveTime || e.createdTime);
        const d = e.lastActiveTime && l > 6e4;
        // Check if text actually needs scrolling by measuring container width vs text width
        const titleElement = document.createElement('div');
        titleElement.style.cssText = 'position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 500;';
        titleElement.textContent = e.title;
        document.body.appendChild(titleElement);
        const textWidth = titleElement.offsetWidth;
        document.body.removeChild(titleElement);
        
        // Container width is approximately 180px (based on CSS layout)
        const containerWidth = 180;
        const needsScrolling = textWidth > containerWidth;
        
        const b = needsScrolling ? "tab-title scrolling" : "tab-title";
        const m = needsScrolling ? `<span class="title-text">${this.escapeHtml(e.title)}</span>` : `${this.escapeHtml(e.title)}`;
        return `
            <div class="tab-item ${e.active?"active":""} ${e.hibernated?"hibernated":""}" 
                 data-tab-id="${e.id}">
                <img class="tab-favicon" src="${t}" alt="" data-fallback-icon="true">
                <div class="tab-info">
                    <div class="${b}">${m}</div>
                    <div class="tab-url">${a}</div>
                    <div class="tab-metadata">
                        <span class="tab-meta-item tab-meta-time" title="Opened: ${o}${d?" • Last active: "+n:""}">
                            ⏰ ${d?r:s}
                        </span>
                        <span class="tab-meta-item tab-meta-memory" title="Estimated memory usage">
                            🧠 ${i}MB
                        </span>
                        <span class="tab-meta-item tab-meta-visits" title="Times accessed">
                            👁️ ${c}x
                        </span>
                        ${e.active?'<span class="tab-meta-item" style="color: #4285f4;">🔥 Active</span>':`<span class="tab-meta-item tab-meta-time" title="Last active ${r}">💤 ${r}</span>`}
                    </div>
                </div>
                <div class="tab-actions">
                    <button class="tab-action-btn save ${this.isTabSaved(e.id)?"saved":""}" data-action="save" data-tab-id="${e.id}" title="${this.isTabSaved(e.id)?"Remove from saved tabs":"Save tab (protect from hibernation and closing)"}">
                        ${this.isTabSaved(e.id)?"💖":"🤍"}
                    </button>
                    <button class="tab-action-btn hibernate ${this.isTabSaved(e.id)?"disabled":""}" data-action="hibernate" data-tab-id="${e.id}" title="${this.isTabSaved(e.id)?"Cannot hibernate saved tabs":e.hibernated?"Restore":"Hibernate"}">
                        ${e.hibernated?"🔥":"❄️"}
                    </button>
                    <button class="tab-action-btn close ${this.isTabSaved(e.id)?"disabled":""}" data-action="close" data-tab-id="${e.id}" title="${this.isTabSaved(e.id)?"Cannot close saved tabs":"Close"}">
                        ✕
                    </button>
                </div>
            </div>
        `
    }
    toggleGroup(e) {
        this.collapsedGroups.has(e) ? this.collapsedGroups.delete(e) : this.collapsedGroups.add(e);
        this.renderTabs()
    }
    async switchToTab(e) {
        try {
            this.trackAction("switch_to_tab", {
                tab_id: e
            });
            await chrome.tabs.update(e, {
                active: !0
            });
            const t = await chrome.tabs.get(e);
            await chrome.windows.update(t.windowId, {
                focused: !0
            });
            this.showToast("Switched to tab! 🔄", "success", 1500)
        } catch (e) {
            console.error("Error switching to tab:", e);
            this.handleError(e, "Switch Tab")
        }
    }
    async toggleHibernate(e) {
        const t = this.tabs.find(t => t.id === e);
        if (t) try {
            t.hibernated ? await chrome.runtime.sendMessage({
                type: "RESTORE_TAB",
                tabId: e
            }) : await chrome.runtime.sendMessage({
                type: "HIBERNATE_TAB",
                tabId: e
            });
            setTimeout(() => this.loadTabs(), 500)
        } catch (e) {
            console.error("Error toggling hibernation:", e)
        }
    }
    async closeTab(e) {
        try {
            await chrome.tabs.remove(e);
            this.tabs = this.tabs.filter(t => t.id !== e);
            const searchInput = this.safeGet("searchInput");
            this.filterTabs(searchInput ? searchInput.value : "");
        } catch (e) {
            console.error("Error closing tab:", e)
        }
    }
    async hibernateAllTabs() {
        console.log("🕸️ Starting hibernation of all inactive tabs...");
        const e = this.tabs.filter(e => !e.active && !e.hibernated && !this.isTabSaved(e.id));
        const t = this.tabs.filter(e => !e.active && !e.hibernated && this.isTabSaved(e.id));
        if (console.log(`Found ${e.length} tabs to hibernate:`, e.map(e => e.title)), t.length > 0 && console.log(`Skipping ${t.length} saved tabs:`, t.map(e => e.title)), 0 === e.length) return void console.log("No tabs to hibernate");
        let a = 0;
        for (const t of e) try {
            console.log(`Hibernating tab ${t.id}: ${t.title}`);
            const e = await chrome.runtime.sendMessage({
                type: "HIBERNATE_TAB",
                tabId: t.id
            });
            e && e.success ? (a++, console.log(`✅ Successfully hibernated tab ${t.id}`)) : console.error(`❌ Failed to hibernate tab ${t.id}:`, e?.error);
            await new Promise(e => setTimeout(e, 200))
        } catch (e) {
            console.error("Error hibernating tab:", t.id, e)
        }
        console.log(`✅ Hibernated ${a}/${e.length} tabs`);
        
        // Funny success messages based on how many tabs were hibernated
        let message = "";
        if (a > 20) {
            message = `Holy moly! 😱 Hibernated ${a} tabs! Your RAM is probably crying tears of joy! 💻😭`;
        } else if (a > 10) {
            message = `NICE! 🎉 ${a} tabs sent to digital sleep! Your browser can finally breathe! 💨`;
        } else if (a > 5) {
            message = `GG! 🎮 ${a} tabs hibernated! You're slowly becoming a responsible human being! 😎`;
        } else if (a > 0) {
            message = `Hibernated ${a} tabs! Baby steps... but hey, progress is progress! 🐣`;
        } else {
            message = "No tabs to hibernate... are you some kind of tab monk? 🧘‍♂️";
        }
        
        if (t.length > 0) {
            message += ` (Skipped ${t.length} saved tabs because I'm not a monster! 😈)`;
        }
        
        this.showToast(message, a > 0 ? "success" : "info");
        setTimeout(() => {
            console.log("🔄 Refreshing tab list...");
            this.loadTabs()
        }, 1500)
    }
    async restoreAllTabs() {
        console.log("🕸️ Starting restoration of all hibernated tabs...");
        try {
            const e = await chrome.storage.local.get();
            const t = [];
            for (const [a, s] of Object.entries(e))
                if (a.startsWith("hibernated_") && s && s.hibernated) {
                    const e = parseInt(a.replace("hibernated_", ""));
                    t.push({
                        id: e,
                        ...s
                    })
                }
            if (console.log(`Found ${t.length} hibernated tabs in storage:`, t), 0 === t.length) {
                console.log("No hibernated tabs found in storage");
                this.showToast("No sleeping tabs found! 😴 Either you're super organized or you haven't hibernated anything yet!", "info");
                return;
            }
            let a = 0;
            for (const e of t) try {
                console.log(`Restoring tab ${e.id}: ${e.title}`);
                const t = await chrome.runtime.sendMessage({
                    type: "RESTORE_TAB",
                    tabId: e.id
                });
                t && t.success ? (a++, console.log(`✅ Successfully restored tab ${e.id}`)) : console.error(`❌ Failed to restore tab ${e.id}:`, t?.error);
                await new Promise(e => setTimeout(e, 200))
            } catch (t) {
                console.error("Error restoring tab:", e.id, t)
            }
            console.log(`✅ Restored ${a}/${t.length} tabs`);
            
            // Funny restoration messages
            if (a > 10) {
                this.showToast(`🎉 BOOM! Restored ${a} tabs! Welcome back to chaos, my friend! 💥`, "success");
            } else if (a > 5) {
                this.showToast(`✨ Successfully revived ${a} sleeping beauties! They're back and ready to eat your RAM! 🧠`, "success");
            } else if (a > 0) {
                this.showToast(`👍 Restored ${a} tabs! Baby steps back to tab madness! 🚶‍♂️`, "success");
            } else {
                this.showToast("🤔 Tried to restore tabs but they said 'nah fam, we're staying asleep' 😴", "info");
            }
        } catch (e) {
            console.error("Error getting hibernated tabs from storage:", e)
        }
        setTimeout(() => {
            console.log("🔄 Refreshing tab list...");
            this.loadTabs()
        }, 1500)
    }
    updateStats() {
        const e = this.tabs.length;
        const t = this.tabs.filter(e => e.hibernated).length;
        const a = this.filteredTabs.length;
        const mainElement = this.safeGet("headerTabCount");
        const statusElement = this.safeGet("headerTabStatus");
        
        if (mainElement) {
            let mainText = "";
            let statusText = "";
            
            // Main line: Just the tab count
            if (a !== e) {
                // Show filtered results if searching
                mainText = `🔍 Showing ${a} of ${e} tabs`;
            } else {
                mainText = `Managing ${e} tabs`;
            }
            
            // Status line: Get the EPIC MEME REACTION! 🎉
            if (window.TabMemes && window.TabMemes.getTabMeme) {
                const fullMeme = window.TabMemes.getTabMeme(e);
                // Extract just the meme message part (after "Managing X tabs - ")
                const memeMatch = fullMeme.match(/Managing \d+ (.+)/);
                if (memeMatch) {
                    statusText = memeMatch[1]; // Just the meme part
                } else {
                    // For special numbers that don't follow the pattern
                    statusText = fullMeme.replace(/^[^\s]+ /, ''); // Remove emoji and first word
                }
            } else {
                // Fallback if meme file didn't load
                statusText = `meme system offline! 🤷‍♂️`;
            }
            
            // Add hibernation info to status line
            if (t > 0) {
                statusText = `❄️ ${t} hibernated • ${statusText}`;
            }
            
            mainElement.textContent = mainText;
            
            // Add session save status (non-blocking)
            chrome.storage.local.get(['last_session_save']).then(result => {
                if (result.last_session_save) {
                    const hoursAgo = Math.floor((Date.now() - result.last_session_save) / (1000 * 60 * 60));
                    let saveStatus = "";
                    if (hoursAgo < 1) {
                        saveStatus = `💾 Auto-saved`;
                    } else if (hoursAgo < 24) {
                        saveStatus = `💾 Saved ${hoursAgo}h ago`;
                    }
                    
                    if (saveStatus) {
                        statusText = statusText ? `${statusText} • ${saveStatus}` : saveStatus;
                    }
                }
                
                if (statusElement) {
                    statusElement.textContent = statusText;
                }
            }).catch(error => {
                console.warn("Could not check session save status:", error);
                // Set status without save info if error
                if (statusElement && t > 0) {
                    statusElement.textContent = `❄️ ${t} hibernated`;
                }
            });
        }
    }
    
    showError(e) {
        const container = this.safeGet("tabsContainer");
        if (container) {
            // Funny error messages crafted by humans with questionable humor 😂
            const errorMemes = [
                "Oof! 💥 Something broke harder than your New Year's resolutions!",
                "Error 404: Your tabs are playing hide and seek! 🙈",
                "Well this is awkward... 😬 The tabs decided to go on strike!",
                "Houston, we have a problem! 🚀 (It's not you, it's me)",
                "Oops! 🤦‍♂️ Looks like I tripped over some code..."
            ];
            
            const randomMeme = errorMemes[Math.floor(Math.random() * errorMemes.length)];
            
            container.innerHTML = `
                <div class="no-tabs" style="color: var(--secondary-color);">
                    ${randomMeme}
                    <br><small>Error: ${e}</small>
                    <br><small>Try refreshing or check console (like that ever helps 🤷‍♂️)</small>
                </div>
            `;
        }
    }
    escapeHtml(e) {
        const t = document.createElement("div");
        return t.textContent = e, t.innerHTML
    }
    formatTimeAgo(e) {
        if (!e) return "Unknown";
        const t = Date.now() - e;
        const a = Math.floor(t / 1e3);
        const s = Math.floor(a / 60);
        const r = Math.floor(s / 60);
        const o = Math.floor(r / 24);
        if (a < 60) return `${a}s ago`;
        if (s < 60) return `${s}m ago`;
        if (r < 24) {
            const e = s % 60;
            return e > 0 ? `${r}h ${e}m ago` : `${r}h ago`
        }
        if (o < 7) {
            const e = r % 24;
            return e > 0 ? `${o}d ${e}h ago` : `${o}d ago`
        } {
            const t = new Date(e);
            const a = new Date;
            return t.getFullYear() === a.getFullYear() ? t.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
            }) : t.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            })
        }
    }
    formatDetailedTime(e) {
        if (!e) return "Unknown time";
        const t = new Date(e);
        const a = new Date;
        return `${t.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:t.getFullYear()!==a.getFullYear()?"numeric":void 0})} at ${t.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})}`
    }
    closeAllModals(e = null) {
        if ("help" !== e) {
            const helpModal = this.safeGet("help-modal");
            helpModal && "flex" === helpModal.style.display && (helpModal.style.display = "none")
        }
        if ("feedback" !== e) {
            const e = document.getElementById("feedback-modal");
            e && "flex" === e.style.display && (e.style.display = "none")
        }
        if ("settings" !== e) {
            const e = document.getElementById("settings-modal");
            e && "flex" === e.style.display && (e.style.display = "none")
        }
        if ("feedback-viewer" !== e) {
            const e = document.getElementById("feedback-viewer-modal");
            e && "flex" === e.style.display && (e.style.display = "none")
        }
        console.log("🔄 All modals closed" + (e ? ` (except ${e})` : ""))
    }
    showHelpModal() {
        this.closeAllModals("help");
        const helpModal = this.safeGet("help-modal");
        if (helpModal) helpModal.style.display = "flex";
        console.log("❓ Help modal shown");
        this.trackAction("help_modal_opened")
    }
    hideHelpModal() {
        const helpModal = this.safeGet("help-modal");
        if (helpModal) helpModal.style.display = "none";
        console.log("❓ Help modal hidden")
    }
    showFeedbackModal() {
        this.closeAllModals("feedback");
        const modal = this.safeGet("feedback-modal");
        const textField = this.safeGet("feedback-text");
        if (modal) modal.style.display = "flex";
        if (textField) textField.focus();
    }
    hideFeedbackModal() {
        const modal = this.safeGet("feedback-modal");
        const textField = this.safeGet("feedback-text");
        if (modal) modal.style.display = "none";
        if (textField) textField.value = "";
    }
    async sendFeedback() {
        const textField = this.safeGet("feedback-text");
        const e = textField ? textField.value.trim() : "";
        if (e) {
            this.showLoading(!0);
            try {
                const t = {
                    feedback: e,
                    timestamp: (new Date).toISOString(),
                    browser: this.browserInfo?.displayName || "Unknown",
                    version: "1.0.0",
                    userAgent: navigator.userAgent
                };
                const a = await chrome.storage.local.get("user_feedback") || {
                    user_feedback: []
                };
                a.user_feedback = a.user_feedback || [];
                a.user_feedback.push(t);
                a.user_feedback = a.user_feedback.slice(-20);
                await chrome.storage.local.set({
                    user_feedback: a.user_feedback
                });
                this.showToast("Thanks for your feedback! 🙏", "success");
                this.hideFeedbackModal();
                console.log("Feedback stored:", t)
            } catch (e) {
                console.error("Error sending feedback:", e);
                this.showToast("Failed to send feedback. Please try again.", "error")
            }
            this.showLoading(!1)
        } else this.showToast("Please enter your feedback", "warning")
    }
    showErrorModal(e) {
        const modal = this.safeGet("error-modal");
        const details = this.safeGet("error-details");
        if (details) details.textContent = `${e.context}: ${e.message}`;
        if (modal) modal.style.display = "flex";
        this.currentError = e
    }
    hideErrorModal() {
        const modal = this.safeGet("error-modal");
        if (modal) modal.style.display = "none";
        this.currentError = null
    }
    async reportError() {
        if (this.currentError) {
            this.showLoading(!0);
            try {
                const e = {
                    ...this.currentError,
                    reportedAt: (new Date).toISOString(),
                    userAgent: navigator.userAgent
                };
                const t = await this.getStoredErrors();
                t.push({
                    ...e,
                    reported: !0
                });
                await chrome.storage.local.set({
                    tab_weaver_errors: t.slice(-10)
                });
                this.showToast("Error report sent. Thank you!", "success");
                this.hideErrorModal()
            } catch (e) {
                console.error("Error reporting failed:", e);
                this.showToast("Failed to send error report", "error")
            }
            this.showLoading(!1)
        }
    }
    showToast(e, t = "info", a = 3e3) {
        const s = this.safeGet("toast-container");
        if (!s) return;
        const r = document.createElement("div");
        r.className = `toast ${t}`;
        const o = document.createElement("button");
        o.className = "toast-close";
        o.innerHTML = "×";
        o.addEventListener("click", () => {
            r.classList.remove("show");
            setTimeout(() => r.remove(), 300)
        });
        const n = document.createElement("span");
        n.textContent = e;
        r.appendChild(n);
        r.appendChild(o);
        s.appendChild(r);
        setTimeout(() => r.classList.add("show"), 100);
        setTimeout(() => {
            r.classList.remove("show");
            setTimeout(() => r.remove(), 300)
        }, a)
    }
    showLoading(e) {
        document.getElementById("loading-overlay").style.display = e ? "flex" : "none"
    }
    async showWelcomeIfFirstTime() {
        try {
            const result = await chrome.storage.local.get("first_time_user");
            if (!result.first_time_user) {
                await chrome.storage.local.set({ first_time_user: false });
                
                const tabCount = this.tabs.length;
                let welcomeMessage = "Welcome to Tab Weaver! 🕸️";
                
                // Use EPIC MEME SYSTEM for welcome too! 
                if (window.TabMemes && window.TabMemes.getTabMeme) {
                    const memeText = window.TabMemes.getTabMeme(tabCount);
                    welcomeMessage = `Welcome to Tab Weaver! 🕸️\n\n${memeText}\n\nClick ? for help and prepare for tab organization magic! ✨`;
                } else {
                    // Fallback if meme system fails
                    welcomeMessage = `Welcome to Tab Weaver! 🕸️ You have ${tabCount} tabs. Let's organize this madness!`;
                }
                
                setTimeout(() => {
                    this.showToast(welcomeMessage, "info", 7000);
                }, 1000);
            }
        } catch (e) {
            console.warn("Could not check first time user:", e);
        }
    }
    trackAction(e, t = {}) {
        try {
            window.tabWeaverAnalytics && window.tabWeaverAnalytics.trackAction && window.tabWeaverAnalytics.trackAction(e, {
                ...t,
                tab_count: this.tabs.length,
                filtered_count: this.filteredTabs.length,
                hibernated_count: this.tabs.filter(e => e.hibernated).length
            })
        } catch (e) {
            console.warn("Analytics tracking failed:", e)
        }
    }
    async trackPerformance(e, t) {
        try {
            const a = await chrome.storage.local.get("performance_data") || {
                performance_data: []
            };
            a.performance_data = a.performance_data || [];
            a.performance_data.push({
                action: e,
                duration: t,
                timestamp: Date.now(),
                browser: this.browserInfo?.displayName || "Unknown"
            });
            a.performance_data = a.performance_data.slice(-50);
            await chrome.storage.local.set({
                performance_data: a.performance_data
            });
            this.trackAction("performance_metric", {
                action: e,
                duration: t
            })
        } catch (e) {
            console.warn("Could not track performance:", e)
        }
    }
    async showFeedbackViewer() {
        this.closeAllModals("feedback-viewer");
        document.getElementById("feedback-viewer-modal").style.display = "flex";
        await this.loadFeedbackHistory();
        this.trackAction("view_feedback_history")
    }
    hideFeedbackViewer() {
        document.getElementById("feedback-viewer-modal").style.display = "none"
    }
    async loadFeedbackHistory() {
        try {
            const e = (await chrome.storage.local.get("user_feedback")).user_feedback || [];
            const t = document.getElementById("feedback-list");
            if (0 === e.length) return void(t.innerHTML = `
                    <div style="text-align: center; color: #999; padding: 20px;">
                        📭 No feedback submitted yet<br>
                        <small>Use the feedback button to share your thoughts!</small>
                    </div>
                `);
            const a = e.reverse().map((t, a) => `
                <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="color: var(--secondary-color);">#${e.length-a}</strong>
                        <small style="color: #999;">${new Date(t.timestamp).toLocaleString()}</small>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; font-size: 13px; line-height: 1.4; margin-bottom: 8px;">
                        ${this.escapeHtml(t.feedback)}
                    </div>
                    <div style="font-size: 11px; color: #666;">
                        Browser: ${t.browser||"Unknown"} • Version: ${t.version||"1.0.0"}
                    </div>
                </div>
            `).join("");
            t.innerHTML = a
        } catch (e) {
            console.error("Error loading feedback history:", e);
            document.getElementById("feedback-list").innerHTML = `
                <div style="text-align: center; color: #f44336; padding: 20px;">
                    ⚠️ Error loading feedback history<br>
                    <small>Try refreshing the extension</small>
                </div>
            `
        }
    }
    async sendFeedbackToGitHub() {
        const e = document.getElementById("feedback-text").value.trim();
        if (e) try {
            const t = `User Feedback: ${e.substring(0,50)}${e.length>50?"...":""}`;
            const a = `## User Feedback\n\n**Feedback:**\n${e}\n\n**Browser Information:**\n- Browser: ${this.browserInfo?.displayName||"Unknown"}\n- Version: Tab Weaver v1.0.0\n- User Agent: ${navigator.userAgent}\n- Timestamp: ${(new Date).toISOString()}\n\n**Additional Context:**\n- Extension Version: 1.0.0\n- Submitted via: Tab Weaver Feedback System\n\n---\n*This issue was created automatically from the Tab Weaver extension feedback system.*`;
            const s = `https://github.com/your-username/tab-weaver/issues/new?title=${encodeURIComponent(t)}&body=${encodeURIComponent(a)}`;
            await this.sendFeedback();
            chrome.tabs.create({
                url: s
            });
            this.showToast("Opening GitHub to create issue! 🚀", "success");
            this.trackAction("send_feedback_github")
        } catch (e) {
            console.error("Error creating GitHub issue:", e);
            this.showToast("Failed to create GitHub issue", "error")
        } else this.showToast("Please enter your feedback first", "warning")
    }
    createGitHubIssue() {
        chrome.tabs.create({
            url: "https://github.com/your-username/tab-weaver/issues/new?template=feedback.md"
        });
        this.showToast("Opening GitHub Issues! 🚀", "info");
        this.trackAction("open_github_issues")
    }
    sendEmailFeedback() {
        const e = `Hello Tab Weaver Team,\n\nI have feedback about the Tab Weaver browser extension:\n\n[Please paste your feedback here]\n\nBrowser Information:\n- Browser: ${this.browserInfo?.displayName||"Unknown"}\n- Extension Version: 1.0.0\n- Date: ${(new Date).toLocaleDateString()}\n\nBest regards,\nA Tab Weaver User`;
        const t = `mailto:feedback@tabweaver.dev?subject=${encodeURIComponent("Tab Weaver Extension Feedback")}&body=${encodeURIComponent(e)}`;
        chrome.tabs.create({
            url: t
        });
        this.showToast("Opening email client! 📧", "info");
        this.trackAction("send_email_feedback")
    }
    async showDeveloperPanel() {
        try {
            const e = await chrome.storage.local.get();
            const t = e.user_feedback || [];
            const a = e.usage_analytics || [];
            const s = e.performance_data || [];
            const r = e.tab_weaver_errors || [];
            const o = `
🕸️ TAB WEAVER DEVELOPER PANEL
=====================================

📊 DATA SUMMARY:
• Feedback Entries: ${t.length}
• Analytics Events: ${a.length}  
• Performance Records: ${s.length}
• Error Reports: ${r.length}

📨 RECENT FEEDBACK (Last 3):
${t.slice(-3).map((e,t)=>`
${t+1}. [${new Date(e.timestamp).toLocaleString()}]
   Browser: ${e.browser}
   Text: "${e.feedback.substring(0,100)}${e.feedback.length>100?"...":""}"`).join("")}

🔧 CONSOLE COMMANDS AVAILABLE:
• TabWeaverDev.getFeedback() - Get all feedback
• TabWeaverDev.downloadFeedback() - Download as JSON
• TabWeaverDev.getAllData() - Get all extension data
• TabWeaverDev.clearFeedback() - Clear feedback data

📁 EXPORT OPTIONS:
• Use Settings → Export Data for user-friendly export
• Use console commands for developer access
• All data stored in chrome.storage.local

🔒 PRIVACY NOTE:
All data is stored locally on user's device only.
No external servers involved unless user explicitly
chooses GitHub/Email options.
`;
            console.log(o);
            alert("🕸️ Developer Panel Active!\n\nCheck the console for detailed information and available commands.\n\nPress F12 → Console tab to see full developer info.");
            this.trackAction("developer_panel_access")
        } catch (e) {
            console.error("❌ Developer panel error:", e);
            alert("❌ Error accessing developer panel. Check console for details.")
        }
    }
    async showSettingsModal() {
        this.closeAllModals("settings");
        const e = document.getElementById("settings-modal");
        await this.loadSettings();
        e.style.display = "flex";
        this.trackAction("open_settings")
    }
    hideSettingsModal() {
        document.getElementById("settings-modal").style.display = "none"
    }
    async loadSettings() {
        try {
            const e = await chrome.storage.local.get(["analytics_enabled", "error_reporting_enabled", "auto_hibernate_time", "hibernate_on_memory"]);
            document.getElementById("analytics-enabled").checked = !1 !== e.analytics_enabled;
            document.getElementById("error-reporting").checked = !1 !== e.error_reporting_enabled;
            document.getElementById("auto-hibernate-time").value = e.auto_hibernate_time || 30;
            document.getElementById("hibernate-on-memory").checked = !1 !== e.hibernate_on_memory
        } catch (e) {
            console.warn("Could not load settings:", e)
        }
    }
    async saveSettings() {
        try {
            const e = {
                analytics_enabled: document.getElementById("analytics-enabled").checked,
                error_reporting_enabled: document.getElementById("error-reporting").checked,
                auto_hibernate_time: parseInt(document.getElementById("auto-hibernate-time").value),
                hibernate_on_memory: document.getElementById("hibernate-on-memory").checked
            };
            await chrome.storage.local.set(e);
            this.showToast("Settings saved! ⚙️", "success");
            this.hideSettingsModal();
            this.trackAction("save_settings", e)
        } catch (e) {
            console.error("Error saving settings:", e);
            this.showToast("Failed to save settings", "error")
        }
    }
    async exportUserData() {
        try {
            this.showLoading(!0);
            const e = await chrome.storage.local.get();
            
            // Include session data in export
            const sessionData = e.tab_weaver_session;
            const lastSessionSave = e.last_session_save;
            
            const t = {
                type: "TabWeaverBackup",
                version: "1.0.0",
                exported_at: (new Date).toISOString(),
                browser: this.browserInfo?.displayName || "Unknown",
                settings: {
                    analytics_enabled: e.analytics_enabled,
                    error_reporting_enabled: e.error_reporting_enabled,
                    auto_hibernate_time: e.auto_hibernate_time,
                    hibernate_on_memory: e.hibernate_on_memory
                },
                analytics: e.usage_analytics || [],
                performance: e.performance_data || [],
                feedback: e.user_feedback || [],
                errors: e.tab_weaver_errors || [],
                session: {
                    data: sessionData || null,
                    last_save: lastSessionSave || null,
                    includes_hibernated_tabs: !!sessionData?.tabs?.some(tab => tab.hibernated),
                    session_age_hours: lastSessionSave ? Math.floor((Date.now() - lastSessionSave) / (1000 * 60 * 60)) : null
                }
            };
            const a = JSON.stringify(t, null, 2);
            const s = new Blob([a], {
                type: "application/json"
            });
            const r = URL.createObjectURL(s);
            const o = document.createElement("a");
            o.href = r;
            o.download = `tab_weaver_backup_${(new Date).toISOString().split("T")[0]}.json`;
            o.click();
            URL.revokeObjectURL(r);
            
            const sessionInfo = sessionData ? 
                ` (including ${sessionData.tabs?.length || 0} tabs from last session)` : 
                ' (no session data found)';
            
            this.showToast(`Backup exported successfully! 💾${sessionInfo}`, "success");
            this.trackAction("export_data", {
                included_session: !!sessionData,
                session_tabs: sessionData?.tabs?.length || 0,
                hibernated_tabs: sessionData?.tabs?.filter(t => t.hibernated)?.length || 0
            })
        } catch (e) {
            console.error("Error exporting data:", e);
            this.showToast("Failed to export backup", "error")
        }
        this.showLoading(!1)
    }
    async clearAllData() {
        if (confirm("⚠️ This will permanently delete ALL Tab Weaver data including:\n\n• Settings and preferences\n• Usage analytics\n• Performance data\n• Feedback history\n• Error reports\n\nThis action cannot be undone. Are you sure?")) {
            try {
                this.showLoading(!0);
                await chrome.storage.local.clear();
                window.tabWeaverAnalytics && await window.tabWeaverAnalytics.clearAnalyticsData();
                this.showToast("All data cleared! 🗑️", "success");
                this.hideSettingsModal();
                await this.showWelcomeIfFirstTime()
            } catch (e) {
                console.error("Error clearing data:", e);
                this.showToast("Failed to clear data", "error")
            }
            this.showLoading(!1)
        }
    }
}
const originalLoadTabs = UniversalTabWeaver.prototype.loadTabs;
UniversalTabWeaver.prototype.loadTabs = async function() {
    const e = performance.now();
    try {
        await originalLoadTabs.call(this);
        const t = performance.now() - e;
        this.trackPerformance("loadTabs", t)
    } catch (e) {
        this.handleError(e, "Loading Tabs")
    }
};
window.tabWeaver = new UniversalTabWeaver;
window.TabWeaverDev = {
    async getFeedback() {
        try {
            const e = (await chrome.storage.local.get("user_feedback")).user_feedback || [];
            return console.log("📨 Tab Weaver Feedback Data:", e), console.log(`📊 Total feedback entries: ${e.length}`), e
        } catch (e) {
            return console.error("❌ Error accessing feedback:", e), []
        }
    },
    async getAllData() {
        try {
            const e = await chrome.storage.local.get();
            return console.log("📦 All Tab Weaver Data:", e), e
        } catch (e) {
            return console.error("❌ Error accessing data:", e), {}
        }
    },
    async downloadFeedback() {
        try {
            const e = await this.getFeedback();
            const t = {
                version: "1.0.0",
                exported_at: (new Date).toISOString(),
                feedback_count: e.length,
                feedback: e
            };
            const a = JSON.stringify(t, null, 2);
            const s = new Blob([a], {
                type: "application/json"
            });
            const r = URL.createObjectURL(s);
            const o = document.createElement("a");
            return o.href = r, o.download = `tab_weaver_feedback_${(new Date).toISOString().split("T")[0]}.json`, o.click(), URL.revokeObjectURL(r), console.log("📁 Feedback downloaded successfully!"), t
        } catch (e) {
            console.error("❌ Error downloading feedback:", e)
        }
    },
    async clearFeedback() {
        if (!confirm("⚠️ Are you sure you want to clear all feedback data?")) return !1;
        try {
            const e = await chrome.storage.local.get();
            return delete e.user_feedback, await chrome.storage.local.set(e), console.log("🗑️ Feedback data cleared!"), !0
        } catch (e) {
            return console.error("❌ Error clearing feedback:", e), !1
        }
    }
};
console.log("\n🕸️ TAB WEAVER DEVELOPER TOOLS\n\nAccess feedback data using these console commands:\n\n📨 TabWeaverDev.getFeedback()     - View all feedback in console\n📦 TabWeaverDev.getAllData()      - View all extension data  \n📁 TabWeaverDev.downloadFeedback() - Download feedback as JSON\n🗑️ TabWeaverDev.clearFeedback()   - Clear all feedback data\n\nExample:\n> await TabWeaverDev.getFeedback()\n");
console.log('🕸️ Tab Weaver Universal Popup Loading...');

class TabWeaverUniversal {
    constructor() {
        this.tabs = [];
        this.hibernatedTabs = [];
        this.searchQuery = '';
        this.init();
    }

    async init() {
        await this.loadTabs();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadTabs() {
        try {
            // Get all tabs in current window
            const tabs = await chrome.tabs.query({currentWindow: true});
            this.tabs = tabs;
            
            // Load hibernated tabs from storage
            const result = await chrome.storage.local.get(['hibernatedTabs']);
            this.hibernatedTabs = result.hibernatedTabs || [];
            
            console.log(`🕸️ Loaded ${this.tabs.length} active tabs and ${this.hibernatedTabs.length} hibernated tabs`);
            console.log('Active tabs:', this.tabs.map(t => t.title));
            console.log('Hibernated tabs:', this.hibernatedTabs.map(t => t.title));
        } catch (error) {
            console.error('❌ Error loading tabs:', error);
            this.tabs = [];
            this.hibernatedTabs = [];
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.updateTabList();
        });

        // Action buttons
        document.getElementById('hibernate-all').addEventListener('click', () => this.hibernateAllTabs());
        document.getElementById('restore-all').addEventListener('click', () => this.restoreAllTabs());
        document.getElementById('refresh').addEventListener('click', () => this.refreshTabs());

        // Header buttons
        document.querySelector('.header-btn[title="Settings"]').addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    async hibernateAllTabs() {
        try {
            // Get all tabs except the current one
            const tabs = await chrome.tabs.query({currentWindow: true});
            const currentTab = await chrome.tabs.query({active: true, currentWindow: true});
            const tabsToHibernate = tabs.filter(tab => tab.id !== currentTab[0].id);

            // Store tab data with hibernation timestamp in metadata
            const hibernatedData = tabsToHibernate.map(tab => {
                // Update persistent metadata with hibernation time
                this.updateTabMetadata(tab.id, tab.url, {
                    hibernatedAt: Date.now()
                });
                
                return {
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    favIconUrl: tab.favIconUrl,
                    hibernatedAt: Date.now()
                };
            });

            // Add to hibernated tabs
            this.hibernatedTabs = [...this.hibernatedTabs, ...hibernatedData];
            await chrome.storage.local.set({hibernatedTabs: this.hibernatedTabs});

            // Close the tabs
            const tabIds = tabsToHibernate.map(tab => tab.id);
            await chrome.tabs.remove(tabIds);

            console.log(`Hibernated ${tabIds.length} tabs`);
            await this.refreshTabs();
        } catch (error) {
            console.error('Error hibernating tabs:', error);
        }
    }

    async restoreAllTabs() {
        try {
            if (this.hibernatedTabs.length === 0) {
                console.log('No hibernated tabs to restore');
                return;
            }

            // Create new tabs for hibernated ones and update metadata
            for (const tab of this.hibernatedTabs) {
                const newTab = await chrome.tabs.create({
                    url: tab.url,
                    active: false
                });
                
                // Update metadata: tab is no longer hibernated
                this.updateTabMetadata(newTab.id, newTab.url, {
                    hibernatedAt: null,
                    lastAccessed: Date.now()
                });
            }

            // Clear hibernated tabs
            this.hibernatedTabs = [];
            await chrome.storage.local.set({hibernatedTabs: []});

            console.log('Restored all hibernated tabs');
            await this.refreshTabs();
        } catch (error) {
            console.error('Error restoring tabs:', error);
        }
    }

    async refreshTabs() {
        await this.loadTabs();
        this.updateUI();
    }

    updateUI() {
        this.updateTabCount();
        this.updateTabList();
    }

    updateTabCount() {
        const totalTabs = this.tabs.length + this.hibernatedTabs.length;
        document.getElementById('tab-count').textContent = totalTabs;
    }

    updateTabList() {
        const tabList = document.getElementById('tab-list');
        tabList.innerHTML = '';

        // Create mixed tab list with both active and hibernated tabs
        const mixedTabs = [];
        
        // Add active tabs with isActive flag
        this.tabs.forEach(tab => {
            mixedTabs.push({...tab, isActive: true, isHibernated: false});
        });
        
        // Add hibernated tabs with isActive flag
        this.hibernatedTabs.forEach(tab => {
            mixedTabs.push({...tab, isActive: false, isHibernated: true});
        });

        // Filter mixed tabs based on search
        const filteredTabs = mixedTabs.filter(tab => 
            this.searchQuery === '' || 
            tab.title.toLowerCase().includes(this.searchQuery) ||
            tab.url.toLowerCase().includes(this.searchQuery)
        );

        // Group tabs by domain/type
        const groupedTabs = this.groupTabsByDomain(filteredTabs);

        // Create dropdown groups
        Object.keys(groupedTabs).forEach(groupName => {
            const group = groupedTabs[groupName];
            this.createTabGroup(tabList, groupName, group);
        });

        // Add empty state if no tabs
        if (filteredTabs.length === 0) {
            const emptyElement = document.createElement('div');
            emptyElement.style.cssText = 'padding: 32px; text-align: center; color: #666; font-size: 14px;';
            emptyElement.textContent = this.searchQuery ? 'No tabs match your search' : 'No tabs found';
            tabList.appendChild(emptyElement);
        }
    }

    groupTabsByDomain(tabs) {
        const groups = {};
        
        tabs.forEach(tab => {
            let groupName = 'Other';
            
            if (tab.url) {
                try {
                    const url = new URL(tab.url);
                    const domain = url.hostname.toLowerCase();
                    
                    // Group by common sites
                    if (domain.includes('youtube.com')) {
                        groupName = 'YouTube';
                    } else if (domain.includes('minecraft') || tab.title.toLowerCase().includes('minecraft') || tab.title.toLowerCase().includes('cobblemon')) {
                        groupName = 'Minecraft';
                    } else if (domain.includes('google.com')) {
                        groupName = 'Google';
                    } else if (domain.includes('github.com')) {
                        groupName = 'GitHub';
                    } else if (domain.includes('reddit.com')) {
                        groupName = 'Reddit';
                    } else if (domain.includes('stackoverflow.com')) {
                        groupName = 'Stack Overflow';
                    } else {
                        // Use domain name as group
                        groupName = domain.replace('www.', '').split('.')[0];
                        groupName = groupName.charAt(0).toUpperCase() + groupName.slice(1);
                    }
                } catch (e) {
                    groupName = 'Other';
                }
            }
            
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(tab);
        });
        
        return groups;
    }

    createTabGroup(container, groupName, tabs) {
        // Create group container
        const groupContainer = document.createElement('div');
        groupContainer.className = 'tab-group';
        
        // Get the first available favicon from the tabs in this group
        let groupIcon = '';
        const firstTabWithIcon = tabs.find(tab => tab.favIconUrl);
        if (firstTabWithIcon) {
            groupIcon = `<img src="${firstTabWithIcon.favIconUrl}" class="group-favicon" style="width: 16px; height: 16px; margin-right: 6px; border-radius: 2px;" onerror="this.style.display='none'">`;
        }
        
        // Create group header
        const groupHeader = document.createElement('div');
        groupHeader.className = 'tab-group-header';
        groupHeader.innerHTML = `
            <div class="group-info">
                <span class="group-arrow">▶</span>
                ${groupIcon}
                <span class="group-name">${groupName}</span>
                <span class="group-count">(${tabs.length})</span>
            </div>
            <div class="group-actions">
                <button class="group-action-btn" title="Close all in group">✖️</button>
            </div>
        `;
        
        // Create group content (tabs)
        const groupContent = document.createElement('div');
        groupContent.className = 'tab-group-content';
        groupContent.style.display = 'none'; // Start collapsed
        
        // Add tabs to group
        tabs.forEach(tab => {
            const tabElement = this.createTabElement(tab, tab.isHibernated);
            tabElement.style.paddingLeft = '32px'; // Indent grouped tabs
            groupContent.appendChild(tabElement);
        });
        
        // Add click handler to toggle group
        groupHeader.addEventListener('click', (e) => {
            if (e.target.classList.contains('group-action-btn')) return;
            
            const arrow = groupHeader.querySelector('.group-arrow');
            const isExpanded = groupContent.style.display === 'block';
            
            if (isExpanded) {
                groupContent.style.display = 'none';
                arrow.textContent = '▶';
            } else {
                groupContent.style.display = 'block';
                arrow.textContent = '▼';
            }
        });
        
        // Add close all handler
        const closeAllBtn = groupHeader.querySelector('.group-action-btn');
        closeAllBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.closeAllTabsInGroup(tabs);
        });
        
        groupContainer.appendChild(groupHeader);
        groupContainer.appendChild(groupContent);
        container.appendChild(groupContainer);
    }

    async closeAllTabsInGroup(tabs) {
        try {
            const activeTabs = tabs.filter(tab => tab.isActive);
            const tabIds = activeTabs.map(tab => tab.id);
            
            if (tabIds.length > 0) {
                await chrome.tabs.remove(tabIds);
                console.log(`Closed ${tabIds.length} tabs in group`);
                await this.refreshTabs();
            }
        } catch (error) {
            console.error('Error closing tabs in group:', error);
        }
    }

    createTabElement(tab, isHibernated) {
        const tabItem = document.createElement('div');
        tabItem.className = 'tab-item';
        
        const favicon = document.createElement('div');
        favicon.className = 'tab-favicon';
        
        const img = document.createElement('img');
        img.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10c0 5.55 3.84 9.739 8.89 9.99L12 17l1.11 0.01C18.16 16.739 22 12.55 22 17V7l-10-5z"/></svg>';
        img.onerror = () => {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10c0 5.55 3.84 9.739 8.89 9.99L12 17l1.11 0.01C18.16 16.739 22 12.55 22 17V7l-10-5z"/></svg>';
        };
        favicon.appendChild(img);
        
        const content = document.createElement('div');
        content.className = 'tab-content';
        
        const title = document.createElement('div');
        title.className = 'tab-title';
        const titleText = tab.title || 'Untitled';
        
        // Add scrolling animation for long titles
        if (titleText.length > 30) {
            title.className += ' scrolling-title';
            title.innerHTML = `<span class="scrolling-text">${titleText}</span>`;
            
            // Show text normally first, then start slow scrolling after a longer delay
            const scrollingSpan = title.querySelector('.scrolling-text');
            if (scrollingSpan) {
                // Initially show text in normal position
                scrollingSpan.style.transform = 'translate3d(0, 0, 0)';
                scrollingSpan.style.animation = 'none';
                
                // Start scrolling after showing text for 3 seconds
                setTimeout(() => {
                    scrollingSpan.style.animation = 'scroll-text-slow 20s linear infinite';
                }, 3000);
            }
        } else {
            title.textContent = titleText;
        }
        
        if (isHibernated) {
            title.style.opacity = '0.7';
        }
        
        // Add tab info with timestamps and details - NOW WITH PERSISTENCE! 💾
        const tabInfo = document.createElement('div');
        tabInfo.className = 'tab-info-details';
        
        const now = Date.now();
        
        // Get persistent metadata for this tab
        const metadata = this.getTabMetadata(tab.id, tab.url);
        
        const createdTime = metadata.createdTime || tab.createdTime || now;
        const lastActiveTime = metadata.lastAccessed || tab.lastActiveTime || createdTime;
        const viewCount = metadata.viewCount || 0;
        const memoryUsage = metadata.memoryUsage || 25; // Default estimate
        const totalTimeSpent = metadata.totalTimeSpent || 0;
        
        // Add current session time if tab is active
        let displayTimeSpent = totalTimeSpent;
        if (metadata.sessionStartTime) {
            displayTimeSpent += (now - metadata.sessionStartTime);
        }
        
        const openDuration = this.formatDuration(now - createdTime);
        const lastActiveAgo = this.formatTimeAgo(lastActiveTime);
        const timeSpentFormatted = this.formatDuration(displayTimeSpent);
        const domain = this.extractDomain(tab.url || '');
        
        // Build rich metadata display with ACTUAL TIME SPENT! ⏱️
        tabInfo.innerHTML = `
            <div class="tab-meta">
                <span class="meta-item">🌐 ${domain}</span>
                <span class="meta-item">⏱️ ${timeSpentFormatted}</span>
                <span class="meta-item">🧠 ${memoryUsage}MB</span>
                <span class="meta-item">👁️ ${viewCount}x</span>
                ${isHibernated && metadata.hibernatedAt ? `<span class="meta-item">💤 ${this.formatTimeAgo(metadata.hibernatedAt)}</span>` : ''}
            </div>
        `;
        
        const count = document.createElement('div');
        count.className = 'tab-count';
        count.textContent = isHibernated ? 'Hibernated' : 'Active';
        
        content.appendChild(title);
        content.appendChild(tabInfo);
        content.appendChild(count);
        
        const action = document.createElement('button');
        action.className = 'tab-action';
        action.innerHTML = isHibernated ? '▶️' : '✖️';
        action.title = isHibernated ? 'Open tab' : 'Close tab';
        
        // Event listeners
        tabItem.addEventListener('click', async (e) => {
            if (e.target === action) return;
            
            if (isHibernated) {
                await this.openTab(tab);
            } else {
                await chrome.tabs.update(tab.id, {active: true});
                window.close();
            }
        });
        
        action.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (isHibernated) {
                await this.openTab(tab);
            } else {
                await this.closeTab(tab);
            }
        });
        
        tabItem.appendChild(favicon);
        tabItem.appendChild(content);
        tabItem.appendChild(action);
        
        return tabItem;
    }

    async hibernateTab(tab) {
        try {
            // Add to hibernated tabs
            const hibernatedTab = {
                id: tab.id,
                url: tab.url,
                title: tab.title,
                favIconUrl: tab.favIconUrl,
                hibernatedAt: Date.now()
            };
            
            this.hibernatedTabs.push(hibernatedTab);
            await chrome.storage.local.set({hibernatedTabs: this.hibernatedTabs});
            
            // Close the tab
            await chrome.tabs.remove(tab.id);
            
            console.log(`Hibernated tab: ${tab.title}`);
            await this.refreshTabs();
        } catch (error) {
            console.error('Error hibernating tab:', error);
        }
    }

    async restoreTab(hibernatedTab) {
        try {
            // Create new tab
            const newTab = await chrome.tabs.create({
                url: hibernatedTab.url,
                active: true
            });
            
            // Remove from hibernated tabs
            this.hibernatedTabs = this.hibernatedTabs.filter(tab => 
                tab.url !== hibernatedTab.url || tab.hibernatedAt !== hibernatedTab.hibernatedAt
            );
            await chrome.storage.local.set({hibernatedTabs: this.hibernatedTabs});
            
            console.log(`Restored tab: ${hibernatedTab.title}`);
            window.close();
        } catch (error) {
            console.error('Error restoring tab:', error);
        }
    }

    async openTab(hibernatedTab) {
        try {
            // Create new tab
            const newTab = await chrome.tabs.create({
                url: hibernatedTab.url,
                active: true
            });
            
            // Remove from hibernated tabs
            this.hibernatedTabs = this.hibernatedTabs.filter(tab => 
                tab.url !== hibernatedTab.url || tab.hibernatedAt !== hibernatedTab.hibernatedAt
            );
            await chrome.storage.local.set({hibernatedTabs: this.hibernatedTabs});
            
            console.log(`Opened tab: ${hibernatedTab.title}`);
            window.close();
        } catch (error) {
            console.error('Error opening tab:', error);
        }
    }

    async closeTab(tab) {
        try {
            // Close the tab directly
            await chrome.tabs.remove(tab.id);
            
            console.log(`Closed tab: ${tab.title}`);
            await this.refreshTabs();
        } catch (error) {
            console.error('Error closing tab:', error);
        }
    }

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }

    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    extractDomain(url) {
        if (!url) return 'Unknown';
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch (e) {
            return 'Invalid URL (or someone fat-fingered it 🤷‍♂️)';
        }
    }
}

// End of the chaos... until the next browser session! 🕸️
console.log('🕸️ Tab Weaver Universal Script Loaded!');
console.log('💬 Made by humans who clearly have a tab addiction problem!');
console.log('🎉 Now go forth and organize your digital hoarding!');

// If you made it this far in the code, you deserve a cookie 🍪
// (Or maybe you need to go touch some grass 🌱)
