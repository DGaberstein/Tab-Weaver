import React from 'react';
import { Zap, Pause, Play, ExternalLink, Volume2, VolumeX, Pin } from 'lucide-react';

const TabList = ({ tabs, onHibernate, onRestore, onSwitch }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getDomainFromUrl = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  if (tabs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <Zap size={48} />
        </div>
        <h3>No tabs found</h3>
        <p>Try adjusting your search or open some tabs to get started.</p>
      </div>
    );
  }

  return (
    <div className="tab-list">
      {tabs.map((tab) => (
        <div key={tab.id} className={`tab-item ${tab.hibernated ? 'hibernated' : ''} ${tab.active ? 'active' : ''}`}>
          <div className="tab-favicon">
            {tab.favIconUrl ? (
              <img src={tab.favIconUrl} alt="" width={16} height={16} />
            ) : (
              <div className="favicon-placeholder">📄</div>
            )}
          </div>

          <div className="tab-content" onClick={() => onSwitch(tab.id)}>
            <div className="tab-title">
              {tab.title || getDomainFromUrl(tab.url)}
              <div className="tab-indicators">
                {tab.pinned && <Pin size={12} className="indicator pinned" />}
                {tab.audible && <Volume2 size={12} className="indicator audible" />}
                {tab.hasUnsavedData && <span className="indicator unsaved" title="Unsaved changes">●</span>}
              </div>
            </div>
            
            <div className="tab-url">{getDomainFromUrl(tab.url)}</div>
            
            <div className="tab-stats">
              <span className="stat">
                Last active: {formatTime(tab.timeLastActive)}
              </span>
              {tab.hibernationCount > 0 && (
                <span className="stat">
                  Hibernated: {tab.hibernationCount}x
                </span>
              )}
            </div>
          </div>

          <div className="tab-actions">
            {tab.hibernated ? (
              <button
                className="action-button restore"
                onClick={() => onRestore(tab.id)}
                title="Restore tab"
              >
                <Play size={14} />
              </button>
            ) : (
              <button
                className="action-button hibernate"
                onClick={() => onHibernate(tab.id)}
                title="Hibernate tab"
                disabled={tab.active || tab.pinned}
              >
                <Pause size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TabList;