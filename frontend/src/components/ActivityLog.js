import React from 'react';
import './ActivityLog.css';

export default function ActivityLog({ logs }) {
  return (
    <div className="activity-log">
      <h3>Activity Log</h3>
      
      {logs.length === 0 ? (
        <div className="empty-log">
          <p>No activity yet</p>
        </div>
      ) : (
        <div className="log-entries">
          {logs.map((log, index) => (
            <div key={log._id || index} className={`log-entry ${log.action}`}>
              <div className="log-icon">{getLogIcon(log.action)}</div>
              <div className="log-content">
                <div className="log-header">
                  <span className="log-action">{formatAction(log.action)}</span>
                  <span className="log-time">{formatTime(log.timestamp)}</span>
                </div>
                {log.details && (
                  <div className="log-details">{log.details}</div>
                )}
                {log.status && (
                  <span className={`log-status ${log.status}`}>
                    {log.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getLogIcon(action) {
  const icons = {
    ring: '🔔',
    flashlight_on: '💡',
    flashlight_off: '🌑',
    location_request: '📍',
    set_alarm: '⏰',
    status_update: '📊',
  };
  return icons[action] || '📝';
}

function formatAction(action) {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
