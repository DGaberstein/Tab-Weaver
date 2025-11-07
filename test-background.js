// Simple test background script to verify Chrome APIs
console.log('Testing Chrome APIs availability...');

// Test basic runtime
if (typeof chrome !== 'undefined') {
  console.log('✓ Chrome object exists');
  
  if (chrome.runtime) {
    console.log('✓ chrome.runtime exists');
    
    // Test storage
    if (chrome.storage && chrome.storage.local) {
      console.log('✓ chrome.storage.local exists');
      chrome.storage.local.set({test: 'working'}).then(() => {
        console.log('✓ chrome.storage.local.set working');
      }).catch(err => {
        console.error('✗ chrome.storage.local.set failed:', err);
      });
    } else {
      console.error('✗ chrome.storage.local not available');
    }
    
    // Test message handling
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Message received:', message);
      sendResponse({success: true, message: 'Test background script working'});
      return true;
    });
    
    console.log('✓ Message listener registered');
    
  } else {
    console.error('✗ chrome.runtime not available');
  }
} else {
  console.error('✗ Chrome object not available');
}

console.log('Background script test completed');