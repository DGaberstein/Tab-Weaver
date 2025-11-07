import React, { useState, useEffect } from 'react';
import { Zap, Layers, Search, Settings, Archive, BarChart3, Clock } from 'lucide-react';
import TabList from './TabList.js';
import WorkspaceManager from './WorkspaceManager.js';
import PerformanceDashboard from './PerformanceDashboard.js';
import CommandPalette from './CommandPalette.js';

const PopupApp = () => {
  const [activeView, setActiveView] = useState('tabs');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabs, setTabs] = useState({});
  const [workspaces, setWorkspaces] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    loadData();
    
    // Listen for keyboard shortcuts
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'Space') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sendMessageSafely = async (message, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await chrome.runtime.sendMessage(message);
        return response;
      } catch (error) {
        if (i === retries - 1) {
          console.error('Failed to send message after retries:', error);
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1))); // Exponential backoff
      }
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tab data from background script
      const tabResponse = await sendMessageSafely({ type: 'GET_TAB_DATA' });
      if (tabResponse && !tabResponse.error) {
        setTabs(tabResponse);
      } else {
        // Fallback to current tabs if background script unavailable
        const tabs = await chrome.tabs.query({});
        const tabData = {};
        tabs.forEach(tab => {
          tabData[tab.id] = {
            id: tab.id,
            url: tab.url || '',
            title: tab.title || 'New Tab',
            favIconUrl: tab.favIconUrl,
            windowId: tab.windowId,
            index: tab.index,
            active: tab.active,
            pinned: tab.pinned,
            audible: tab.audible || false,
            timeOpened: Date.now(),
            timeLastActive: tab.active ? Date.now() : Date.now() - 60000,
            hibernated: false,
            hibernationCount: 0,
            hasUnsavedData: false
          };
        });
        setTabs(tabData);
      }
      
      // Load workspaces (mock data for now)
      setWorkspaces([
        {
          id: 'default',
          name: 'Default Workspace',
          description: 'Your main workspace',
          icon: '🏠',
          collections: []
        }
      ]);
      
      // Load performance metrics  
      const metricsResponse = await sendMessageSafely({ type: 'GET_PERFORMANCE_METRICS' });
      if (metricsResponse && !metricsResponse.error) {
        setPerformanceMetrics(metricsResponse);
      } else {
        // Fallback performance metrics - will be calculated after tabs are set
        setTimeout(() => {
          setPerformanceMetrics({
            totalTabsManaged: Object.keys(tabs).length,
            hibernatedTabs: 0,
            memorySavedMB: 0,
            cpuSavedPercent: 0,
            lastCalculated: Date.now()
          });
        }, 100);
      }
      
    } catch (error) {
      console.error('Error loading popup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTabs = Object.values(tabs).filter(tab => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return tab.title.toLowerCase().includes(query) ||
           tab.url.toLowerCase().includes(query);
  });

  const handleHibernateTab = async (tabId) => {
    try {
      const response = await sendMessageSafely({ type: 'HIBERNATE_TAB', tabId });
      if (response && response.success) {
        await loadData(); // Refresh data
      } else {
        console.warn('Failed to hibernate tab via background script');
      }
    } catch (error) {
      console.error('Error hibernating tab:', error);
    }
  };

  const handleRestoreTab = async (tabId) => {
    try {
      const response = await sendMessageSafely({ type: 'RESTORE_TAB', tabId });
      if (response && response.success) {
        await loadData(); // Refresh data
      } else {
        console.warn('Failed to restore tab via background script');
      }
    } catch (error) {
      console.error('Error restoring tab:', error);
    }
  };

  const handleSwitchToTab = async (tabId) => {
    try {
      await chrome.tabs.update(tabId, { active: true });
      const tab = await chrome.tabs.get(tabId);
      await chrome.windows.update(tab.windowId, { focused: true });
      window.close(); // Close popup after switching
    } catch (error) {
      console.error('Error switching to tab:', error);
    }
  };

  const openOptionsPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dist/options.html') });
    window.close();
  };

  if (loading) {
    return (
      <div className="popup-container loading">
        <div className="loading-spinner">
          <Zap className="animate-spin" size={24} />
          <span>Loading Tab Weaver...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      {commandPaletteOpen && (
        <CommandPalette
          tabs={tabs}
          workspaces={workspaces}
          onClose={() => setCommandPaletteOpen(false)}
          onAction={(action) => {
            action();
            setCommandPaletteOpen(false);
          }}
        />
      )}

      <header className="popup-header">
        <div className="header-title">
          <Layers size={20} />
          <h1>Tab Weaver</h1>
        </div>
        
        <div className="header-actions">
          <button 
            className="icon-button"
            onClick={() => setCommandPaletteOpen(true)}
            title="Command Palette (Ctrl+Shift+Space)"
          >
            <Search size={16} />
          </button>
          <button 
            className="icon-button"
            onClick={openOptionsPage}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <nav className="popup-nav">
        <button
          className={`nav-button ${activeView === 'tabs' ? 'active' : ''}`}
          onClick={() => setActiveView('tabs')}
        >
          <Archive size={16} />
          Tabs ({Object.keys(tabs).length})
        </button>
        
        <button
          className={`nav-button ${activeView === 'workspaces' ? 'active' : ''}`}
          onClick={() => setActiveView('workspaces')}
        >
          <Layers size={16} />
          Workspaces ({workspaces.length})
        </button>
        
        <button
          className={`nav-button ${activeView === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveView('performance')}
        >
          <BarChart3 size={16} />
          Performance
        </button>
      </nav>

      {activeView === 'tabs' && (
        <div className="popup-content">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search tabs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <TabList
            tabs={filteredTabs}
            onHibernate={handleHibernateTab}
            onRestore={handleRestoreTab}
            onSwitch={handleSwitchToTab}
          />
        </div>
      )}

      {activeView === 'workspaces' && (
        <div className="popup-content">
          <WorkspaceManager
            workspaces={workspaces}
            onWorkspaceChange={loadData}
          />
        </div>
      )}

      {activeView === 'performance' && performanceMetrics && (
        <div className="popup-content">
          <PerformanceDashboard metrics={performanceMetrics} />
        </div>
      )}

      <footer className="popup-footer">
        <div className="footer-stats">
          <span className="stat">
            <Clock size={12} />
            {performanceMetrics?.hibernatedTabs || 0} hibernated
          </span>
          <span className="stat">
            <Zap size={12} />
            {performanceMetrics?.memorySavedMB || 0}MB saved
          </span>
        </div>
        <div className="welcome-message">
          Welcome to Tab Weaver! 🕸️ Click ? for help
        </div>
      </footer>
    </div>
  );
};

export default PopupApp;