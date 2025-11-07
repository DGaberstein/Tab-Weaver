import React from 'react';

const WorkspaceManager = ({ workspaces, onWorkspaceChange }) => {
  const handleCreateWorkspace = () => {
    // Create new workspace logic
    const newWorkspace = {
      id: `workspace-${Date.now()}`,
      name: 'New Workspace',
      description: 'A new workspace for organizing tabs',
      icon: '📁',
      collections: []
    };
    
    console.log('Creating new workspace:', newWorkspace);
    // Trigger workspace change callback
    onWorkspaceChange();
  };

  const handleWorkspaceClick = (workspace) => {
    console.log('Selected workspace:', workspace);
    // Trigger workspace change callback
    onWorkspaceChange();
  };

  return (
    <div className="workspace-manager">
      <div className="workspace-header">
        <h2>Workspaces</h2>
        <button 
          className="add-workspace-btn" 
          onClick={handleCreateWorkspace}
        >
          + New Workspace
        </button>
      </div>
      <div className="workspace-list">
        {workspaces.map(workspace => (
          <div key={workspace.id} className="workspace-item">
            <div className="workspace-header">
              <span className="workspace-icon">{workspace.icon}</span>
              <div className="workspace-info">
                <div className="workspace-name">{workspace.name}</div>
                <div className="workspace-description">{workspace.description}</div>
              </div>
              <div className="workspace-stats">
                {workspace.collections ? workspace.collections.length : 0} collections
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkspaceManager;