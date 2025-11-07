import React from 'react';

const CommandPalette = ({ tabs, workspaces, onClose, onAction }) => {
  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-search">
          <input type="text" placeholder="Search tabs, workspaces, and actions..." />
        </div>
        <div className="command-results">
          <div className="command-item">
            <div className="command-content">
              <div className="command-title">Switch to Tab</div>
              <div className="command-description">Quickly switch to any open tab</div>
            </div>
          </div>
          <div className="command-item">
            <div className="command-content">
              <div className="command-title">Hibernate All Inactive</div>
              <div className="command-description">Hibernate all tabs except active ones</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;