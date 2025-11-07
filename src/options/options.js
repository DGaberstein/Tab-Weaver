import React from 'react';
import ReactDOM from 'react-dom/client';

const OptionsApp = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)',
      color: '#ffffff',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      padding: '40px',
      margin: '0'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          color: '#ffffff', 
          marginBottom: '10px',
          fontSize: '32px',
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>🕸️ Tab Weaver Settings</h1>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          marginBottom: '40px',
          fontSize: '16px'
        }}>Configure your tab management preferences, hibernation settings, and workspace options.</p>
        
        <div style={{ 
          marginBottom: '40px', 
          padding: '24px', 
          background: '#333333', 
          borderRadius: '8px', 
          border: '1px solid #444444',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ 
            color: '#4285f4', 
            marginBottom: '20px',
            fontSize: '20px',
            fontWeight: '600'
          }}>🔋 Hibernation Settings</h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              color: '#ffffff'
            }}>
              <input 
                type="checkbox" 
                defaultChecked 
                style={{ 
                  marginRight: '8px',
                  accentColor: '#4285f4'
                }}
              />
              Enable automatic tab hibernation
            </label>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#ffffff',
              fontWeight: '500'
            }}>
              Hibernation timeout:
            </label>
            <select style={{ 
              padding: '8px 12px', 
              border: '1px solid #444444', 
              borderRadius: '6px', 
              background: '#1a1a1a',
              color: '#ffffff',
              outline: 'none'
            }}>
              <option value="5">5 minutes</option>
              <option value="15" defaultValue>15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              color: '#ffffff', 
              marginBottom: '12px', 
              fontSize: '16px',
              fontWeight: '500'
            }}>Exclusions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                color: '#ffffff'
              }}>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  style={{ 
                    marginRight: '8px',
                    accentColor: '#4285f4'
                  }} 
                />
                Exclude pinned tabs
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                color: '#ffffff'
              }}>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  style={{ 
                    marginRight: '8px',
                    accentColor: '#4285f4'
                  }} 
                />
                Exclude tabs playing audio
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                color: '#ffffff'
              }}>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  style={{ 
                    marginRight: '8px',
                    accentColor: '#4285f4'
                  }} 
                />
                Exclude tabs with unsaved forms
              </label>
            </div>
          </div>
        </div>
        
        <div style={{ 
          marginBottom: '40px', 
          padding: '24px', 
          background: '#333333', 
          borderRadius: '8px', 
          border: '1px solid #1a73e8',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ 
            color: '#4285f4', 
            marginBottom: '16px',
            fontSize: '20px',
            fontWeight: '600'
          }}>📊 Performance Dashboard</h2>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            marginBottom: '16px' 
          }}>Monitor and optimize your browser's resource usage in real-time.</p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '16px' 
          }}>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px', 
              background: '#1a1a1a', 
              borderRadius: '6px',
              border: '1px solid #444444'
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#4285f4' 
              }}>24</div>
              <div style={{ 
                fontSize: '12px', 
                color: 'rgba(255, 255, 255, 0.7)' 
              }}>Total Tabs</div>
            </div>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px', 
              background: '#1a1a1a', 
              borderRadius: '6px',
              border: '1px solid #444444'
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#4285f4' 
              }}>12</div>
              <div style={{ 
                fontSize: '12px', 
                color: 'rgba(255, 255, 255, 0.7)' 
              }}>Hibernated</div>
            </div>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px', 
              background: '#1a1a1a', 
              borderRadius: '6px',
              border: '1px solid #444444'
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#4285f4' 
              }}>600MB</div>
              <div style={{ 
                fontSize: '12px', 
                color: 'rgba(255, 255, 255, 0.7)' 
              }}>Memory Saved</div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          marginBottom: '40px', 
          padding: '24px', 
          background: '#333333', 
          borderRadius: '8px', 
          border: '1px solid #34a853',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ 
            color: '#34a853', 
            marginBottom: '16px',
            fontSize: '20px',
            fontWeight: '600'
          }}>🔄 Sync & Backup</h2>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            marginBottom: '16px' 
          }}>Synchronize your workspaces and sessions across devices.</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ 
              padding: '10px 20px', 
              background: '#34a853', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}>
              Enable Sync
            </button>
            <button style={{ 
              padding: '10px 20px', 
              background: 'transparent', 
              color: '#34a853', 
              border: '1px solid #34a853', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}>
              Export Data
            </button>
          </div>
        </div>

        <div style={{ 
          marginBottom: '40px', 
          padding: '24px', 
          background: '#333333', 
          borderRadius: '8px', 
          border: '1px solid #fbbc04',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ 
            color: '#fbbc04', 
            marginBottom: '16px',
            fontSize: '20px',
            fontWeight: '600'
          }}>⌨️ Keyboard Shortcuts</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px', 
            fontSize: '14px' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <span style={{ color: '#ffffff' }}>Open Tab Weaver</span>
              <kbd style={{ 
                padding: '4px 8px', 
                background: '#1a1a1a', 
                border: '1px solid #444444', 
                borderRadius: '4px', 
                fontFamily: 'monospace',
                color: '#fbbc04',
                fontSize: '12px'
              }}>
                Ctrl+Shift+T
              </kbd>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <span style={{ color: '#ffffff' }}>Command Palette</span>
              <kbd style={{ 
                padding: '4px 8px', 
                background: '#1a1a1a', 
                border: '1px solid #444444', 
                borderRadius: '4px', 
                fontFamily: 'monospace',
                color: '#fbbc04',
                fontSize: '12px'
              }}>
                Ctrl+Shift+Space
              </kbd>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <span style={{ color: '#ffffff' }}>Hibernate Current Tab</span>
              <kbd style={{ 
                padding: '4px 8px', 
                background: '#1a1a1a', 
                border: '1px solid #444444', 
                borderRadius: '4px', 
                fontFamily: 'monospace',
                color: '#fbbc04',
                fontSize: '12px'
              }}>
                Ctrl+Shift+H
              </kbd>
            </div>
          </div>
        </div>
        
        <footer style={{ 
          textAlign: 'center', 
          color: 'rgba(255, 255, 255, 0.6)', 
          fontSize: '14px', 
          paddingTop: '40px', 
          borderTop: '1px solid #444444' 
        }}>
          <p>Tab Weaver v1.0.0</p>
          <p>Made with ❤️ by developers who have too many tabs open</p>
        </footer>
      </div>
    </div>
  );
};

// Render the options application
const root = ReactDOM.createRoot(document.getElementById('options-root'));
root.render(<OptionsApp />);