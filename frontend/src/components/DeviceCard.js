import React from 'react';
import './DeviceCard.css';

export default function DeviceCard({ device, isSelected, onClick }) {
  const isOnline = device.status === 'online';
  const timeSinceLastSeen = getTimeSince(new Date(device.lastSeen));

  return (
    <div 
      className={`device-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="device-header">
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`} />
        <span className="device-name">{device.deviceName}</span>
      </div>
      
      <div className="device-info">
        <div className="info-item">
          <span className="label">Battery:</span>
          <span className="value">
            {device.batteryLevel !== null ? `${device.batteryLevel}%` : 'N/A'}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Last seen:</span>
          <span className="value">{timeSinceLastSeen}</span>
        </div>
      </div>
    </div>
  );
}

function getTimeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
