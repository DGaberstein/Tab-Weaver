// Simple content script for The Tab Weaver
// Detects form data and page activity

class TabWeaverContentScript {
  constructor() {
    this.hasUnsavedData = false;
    this.formChangeTimeout = null;
    this.lastActivityTime = Date.now();
    this.initialize();
  }

  initialize() {
    // Listen for messages from background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true;
      });
    }
    
    // Monitor form changes
    this.setupFormMonitoring();
    
    // Monitor page activity
    this.setupActivityMonitoring();
    
    // Initial form data check
    this.checkFormData();
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'CHECK_FORM_DATA':
        this.checkFormData();
        sendResponse({ hasUnsavedData: this.hasUnsavedData });
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  setupFormMonitoring() {
    // Monitor input changes in all form elements
    document.addEventListener('input', (event) => {
      const target = event.target;
      const tagName = target.tagName ? target.tagName.toLowerCase() : '';
      
      if (['input', 'textarea', 'select'].includes(tagName)) {
        this.handleFormChange(target);
      }
    }, { passive: true });

    // Monitor form submissions
    document.addEventListener('submit', () => {
      this.hasUnsavedData = false;
      this.notifyBackgroundFormState();
    });

    // Monitor page unload to check for unsaved data
    window.addEventListener('beforeunload', (event) => {
      if (this.hasUnsavedData) {
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    });
  }

  setupActivityMonitoring() {
    const activityEvents = [
      'click', 'keydown', 'scroll', 'mousemove', 'touchstart'
    ];

    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, () => this.handleUserActivity(), { 
        passive: true,
        capture: true 
      });
    });

    // Monitor focus/blur events
    window.addEventListener('focus', () => this.handleWindowFocus());
    window.addEventListener('blur', () => this.handleWindowBlur());

    // Monitor visibility changes
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }

  handleFormChange(element) {
    // Clear existing timeout
    if (this.formChangeTimeout) {
      clearTimeout(this.formChangeTimeout);
    }

    // Set timeout to check form state after changes settle
    this.formChangeTimeout = setTimeout(() => {
      this.checkFormData();
    }, 500);
  }

  checkFormData() {
    const hasUnsavedData = this.detectUnsavedFormData();
    
    if (hasUnsavedData !== this.hasUnsavedData) {
      this.hasUnsavedData = hasUnsavedData;
      this.notifyBackgroundFormState();
    }
  }

  detectUnsavedFormData() {
    // Check all form inputs for modified data
    const inputs = document.querySelectorAll('input, textarea, select');
    
    for (let i = 0; i < inputs.length; i++) {
      const element = inputs[i];
      
      // Skip certain input types that don't contain user data
      if (element.tagName === 'INPUT') {
        const skipTypes = ['submit', 'button', 'reset', 'hidden', 'search'];
        if (skipTypes.includes(element.type)) continue;
      }

      // Check if the element has been modified from its default value
      if (this.isElementModified(element)) {
        return true;
      }
    }

    // Check for contenteditable elements
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    for (let i = 0; i < editableElements.length; i++) {
      if (editableElements[i].innerText && editableElements[i].innerText.trim().length > 0) {
        return true;
      }
    }

    return false;
  }

  isElementModified(element) {
    if (element.tagName === 'INPUT') {
      switch (element.type) {
        case 'checkbox':
        case 'radio':
          return element.checked !== element.defaultChecked;
        case 'file':
          return element.files && element.files.length > 0;
        default:
          return element.value !== element.defaultValue && element.value.trim() !== '';
      }
    } else if (element.tagName === 'TEXTAREA') {
      return element.value !== element.defaultValue && element.value.trim() !== '';
    } else if (element.tagName === 'SELECT') {
      return element.selectedIndex !== 0; // Simple check
    }
    
    return false;
  }

  handleUserActivity() {
    const now = Date.now();
    
    // Throttle activity reporting to avoid spam
    if (now - this.lastActivityTime > 5000) { // 5 seconds
      this.lastActivityTime = now;
      this.notifyBackgroundActivity(now);
    }
  }

  handleWindowFocus() {
    this.notifyBackgroundActivity(Date.now());
  }

  handleWindowBlur() {
    // Tab lost focus - could be hibernation candidate
  }

  handleVisibilityChange() {
    if (!document.hidden) {
      // Page became visible again
      this.notifyBackgroundActivity(Date.now());
    }
  }

  notifyBackgroundFormState() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const message = {
        type: 'FORM_DATA_DETECTED',
        hasUnsavedData: this.hasUnsavedData
      };

      chrome.runtime.sendMessage(message).catch(() => {
        // Extension context may be invalid, ignore
      });
    }
  }

  notifyBackgroundActivity(timestamp) {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const message = {
        type: 'PAGE_ACTIVITY',
        timestamp
      };

      chrome.runtime.sendMessage(message).catch(() => {
        // Extension context may be invalid, ignore
      });
    }
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TabWeaverContentScript());
} else {
  new TabWeaverContentScript();
}