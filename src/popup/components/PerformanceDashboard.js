import React from 'react';

const PerformanceDashboard = ({ metrics }) => {
  return (
    <div className="performance-dashboard">
      <div className="performance-header">
        <h2>Performance Metrics</h2>
        <p>Real-time system optimization statistics</p>
      </div>
      <div className="performance-metrics">
        <div className="metric-card">
          <div className="metric-value">{metrics.totalTabsManaged}</div>
          <div className="metric-label">Total Tabs</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.hibernatedTabs}</div>
          <div className="metric-label">Hibernated</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.memorySavedMB}MB</div>
          <div className="metric-label">Memory Saved</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{Math.round(metrics.cpuSavedPercent)}%</div>
          <div className="metric-label">CPU Saved</div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;